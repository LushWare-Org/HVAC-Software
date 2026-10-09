/**
 * Live chat over Socket.IO, namespace /messages.
 *
 * A socket must present a valid login token. It is placed only in its own rooms
 * (its user, its customer, the office inbox for office roles); clients cannot
 * join rooms by asking. Every event a conversation produces goes only to the
 * rooms of people allowed to see it (chat.policy.audienceRooms).
 */
import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { requireJwtSecret } from '@tscrm/auth-client';
import { ChatBus, type ChatEvent } from './chat.bus';
import { ChatService } from './chat.service';
import { audienceRooms, memberKeyFor, roomsForSocket, type Viewer } from './chat.policy';

interface ChatSocket extends Socket {
  data: { viewer?: Viewer; viewing?: string | null };
}

/** Login from the handshake. The test shortcut only exists when BYPASS_AUTH is on outside production. */
export function viewerFromHandshake(h: Socket['handshake']): Viewer | null {
  const token = (h.auth?.token as string | undefined) ?? (h.headers?.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      const d = jwt.verify(token, requireJwtSecret()) as Record<string, any>;
      const userId = d.sub ?? d.userId;
      const companyId = d.company_id ?? d.companyId;
      if (!userId || !companyId || !d.role) return null;
      return { userId, companyId, role: String(d.role).toLowerCase(), name: d.name ?? d.email ?? 'User', customerId: d.customer_id ?? d.customerId ?? null };
    } catch {
      return null;
    }
  }
  const bypass = process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production';
  if (!bypass) return null;
  const q = { ...(h.query ?? {}), ...(h.auth ?? {}) } as Record<string, any>;
  if (!q.companyId || !q.userId || !q.role) return null;
  return { userId: q.userId, companyId: q.companyId, role: String(q.role).toLowerCase(), name: q.userName ?? 'User', customerId: q.customerId ?? null };
}

@WebSocketGateway({
  namespace: '/messages',
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private off?: () => void;

  constructor(private readonly chat: ChatService, private readonly bus: ChatBus) {}

  onModuleInit() {
    this.off = this.bus.on((e) => this.relay(e));
  }

  onModuleDestroy() {
    this.off?.();
  }

  handleConnection(client: ChatSocket) {
    const viewer = viewerFromHandshake(client.handshake);
    if (!viewer || (viewer.role === 'customer' && !viewer.customerId)) {
      client.emit('chat:error', { message: 'Sign in again to use messages' });
      client.disconnect(true);
      return;
    }
    client.data.viewer = viewer;
    client.data.viewing = null;
    for (const room of roomsForSocket(viewer)) void client.join(room);
  }

  /** The conversation this screen is showing (or null). Drives "don't push what they're already reading". */
  @SubscribeMessage('chat:focus')
  async focus(@ConnectedSocket() client: ChatSocket, @MessageBody() body: { conversationId?: string | null }) {
    const v = client.data.viewer;
    if (!v) return { ok: false };
    if (!body?.conversationId) { client.data.viewing = null; return { ok: true }; }
    try {
      await this.chat.visible(v, body.conversationId);
      client.data.viewing = body.conversationId;
      return { ok: true };
    } catch {
      client.data.viewing = null;
      return { ok: false };
    }
  }

  @SubscribeMessage('chat:typing')
  async typing(@ConnectedSocket() client: ChatSocket, @MessageBody() body: { conversationId?: string; typing?: boolean }) {
    const v = client.data.viewer;
    if (!v || !body?.conversationId) return;
    try {
      const conv = await this.chat.visible(v, body.conversationId);
      client.to(audienceRooms(conv)).emit('chat:typing', {
        conversationId: conv.id, memberKey: memberKeyFor(v, conv), name: v.name, typing: !!body.typing,
      });
    } catch { /* not theirs: say nothing */ }
  }

  @SubscribeMessage('chat:send')
  async send(@ConnectedSocket() client: ChatSocket, @MessageBody() body: { conversationId?: string; body?: string; clientId?: string; jobId?: string }) {
    const v = client.data.viewer;
    if (!v || !body?.conversationId) return { ok: false, error: 'Missing conversation' };
    try {
      const message = await this.chat.send(v, body.conversationId, { body: body.body ?? '', clientId: body.clientId, jobId: body.jobId });
      return { ok: true, message };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  @SubscribeMessage('chat:read')
  async read(@ConnectedSocket() client: ChatSocket, @MessageBody() body: { conversationId?: string; seq?: number }) {
    const v = client.data.viewer;
    if (!v || !body?.conversationId) return { ok: false };
    try {
      return { ok: true, ...(await this.chat.markRead(v, body.conversationId, body.seq)) };
    } catch {
      return { ok: false };
    }
  }

  /** True when someone in these rooms has this conversation open right now (on any server). */
  async isViewing(rooms: string[], conversationId: string): Promise<boolean> {
    if (!this.server || !rooms.length) return false;
    const sockets = await this.server.in(rooms).fetchSockets();
    return sockets.some((s) => (s.data as ChatSocket['data'])?.viewing === conversationId);
  }

  private relay(e: ChatEvent) {
    if (!this.server) return;
    const rooms = audienceRooms(e.conv);
    if (!rooms.length) return;
    const to = this.server.to(rooms);
    switch (e.type) {
      case 'message':
        to.emit('chat:message', { conversationId: e.conv.id, kind: e.conv.kind, message: e.message });
        break;
      case 'message_updated':
        to.emit('chat:message_updated', { conversationId: e.conv.id, message: e.message });
        break;
      case 'read':
        to.emit('chat:read', { conversationId: e.conv.id, memberKey: e.memberKey, seq: e.seq });
        break;
      case 'conversation':
        to.emit('chat:conversation', { conversationId: e.conv.id });
        break;
      case 'delivery':
        to.emit('chat:delivery', { conversationId: e.conv.id, messageId: e.messageId, channel: e.channel, status: e.status });
        break;
    }
  }
}

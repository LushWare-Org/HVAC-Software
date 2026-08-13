/**
 * WebSocket Gateway for real-time messaging.
 *
 * Clients connect via Socket.IO and:
 *  - Join thread rooms (thread:<id>)
 *  - Send messages (server persists and broadcasts)
 *  - Receive new messages in real-time
 *  - Get typing indicators
 *
 * Auth: JWT token passed as query param or auth header.
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { MessagingService } from './messaging.service';

interface AuthSocket extends Socket {
  userId?: string;
  userName?: string;
  companyId?: string;
  userRole?: string;
  customerId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://tscrm-demo-admin.web.app',
      'https://tscrm-demo-customer.web.app',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(MessagingGateway.name);

  constructor(private readonly messagingService: MessagingService) {}

  // ── Connection lifecycle ────────────────────────────────────────────────

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.query?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Dev bypass: check for test headers
        const companyId =
          (client.handshake.headers['x-test-company-id'] as string) ??
          (client.handshake.query?.companyId as string);
        const userId =
          (client.handshake.headers['x-test-user-id'] as string) ??
          (client.handshake.query?.userId as string);
        const userName =
          (client.handshake.headers['x-test-user-name'] as string) ??
          (client.handshake.query?.userName as string) ?? 'User';
        const userRole =
          (client.handshake.headers['x-test-user-role'] as string) ??
          (client.handshake.query?.userRole as string) ?? 'TECHNICIAN';

        if (companyId && userId) {
          client.companyId = companyId;
          client.userId = userId;
          client.userName = userName;
          client.userRole = userRole;
          client.join(`user:${userId}`);
          this.joinCompanyRoomIfStaff(client);
          this.logger.log(`[dev] Client ${client.id} connected as ${userName} (${userRole})`);
          return;
        }

        this.logger.warn(`Client ${client.id} — no auth token`);
        client.disconnect(true);
        return;
      }

      const secret = process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production';
      const decoded = jwt.verify(token, secret) as any;

      client.userId = decoded.sub ?? decoded.userId;
      client.userName = decoded.name ?? decoded.email ?? 'User';
      client.companyId = decoded.company_id ?? decoded.companyId;
      client.userRole = decoded.role;
      client.customerId = decoded.customer_id ?? decoded.customerId;

      // Join a personal room for direct notifications
      client.join(`user:${client.userId}`);
      this.joinCompanyRoomIfStaff(client);

      this.logger.log(`Client ${client.id} authenticated as ${client.userName}`);
    } catch (err: any) {
      this.logger.warn(`Client ${client.id} auth failed: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthSocket) {
    this.logger.debug(`Client ${client.id} disconnected`);
  }

  // ── Join / leave thread rooms ───────────────────────────────────────────

  @SubscribeMessage('join_thread')
  handleJoinThread(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!data.threadId) return;
    const room = `thread:${data.threadId}`;
    client.join(room);
    this.logger.debug(`${client.userName} joined ${room}`);
    return { event: 'joined', threadId: data.threadId };
  }

  @SubscribeMessage('leave_thread')
  handleLeaveThread(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!data.threadId) return;
    client.leave(`thread:${data.threadId}`);
  }

  // ── Send message via WebSocket ──────────────────────────────────────────

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { threadId: string; body: string },
  ) {
    if (!client.companyId || !client.userId || !data.threadId || !data.body?.trim()) {
      return { error: 'Invalid message data' };
    }

    try {
      const updatedThread = await this.messagingService.sendMessage(
        client.companyId,
        data.threadId,
        client.userId,
        client.userName ?? 'User',
        { body: data.body },
        client.userRole,
        client.customerId,
      );

      // Get the last message (the one we just sent)
      const messages = updatedThread.messages ?? [];
      const newMessage = messages[messages.length - 1];

      // Broadcast to all clients in the thread room
      this.server.to(`thread:${data.threadId}`).emit('new_message', {
        threadId: data.threadId,
        message: newMessage,
      });

      // Also broadcast thread update for the threads list
      this.server.to(`thread:${data.threadId}`).emit('thread_updated', {
        threadId: data.threadId,
        lastMessageBody: updatedThread.lastMessageBody,
        lastMessageAt: updatedThread.lastMessageAt,
        unreadCount: updatedThread.unreadCount,
      });

      // Company-wide signal so staff clients NOT in this thread's room
      // refresh their threads list / unread badge without polling.
      this.broadcastToCompany(client.companyId, 'threads_changed', { threadId: data.threadId });

      return { success: true, message: newMessage };
    } catch (err: any) {
      this.logger.error(`Send message error: ${err.message}`);
      return { error: err.message ?? 'Failed to send message' };
    }
  }

  // ── Typing indicator ───────────────────────────────────────────────────

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { threadId: string; isTyping: boolean },
  ) {
    if (!data.threadId) return;
    client.to(`thread:${data.threadId}`).emit('user_typing', {
      threadId: data.threadId,
      userId: client.userId,
      userName: client.userName,
      isTyping: data.isTyping,
    });
  }

  // ── Mark thread read ──────────────────────────────────────────────────

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (!client.companyId || !data.threadId) return;
    try {
      await this.messagingService.markThreadRead(
        client.companyId,
        data.threadId,
        client.customerId,
      );
      return { success: true };
    } catch {
      return { error: 'Failed to mark read' };
    }
  }

  // ── Public helper: broadcast from REST endpoints ───────────────────────

  broadcastToThread(threadId: string, event: string, payload: any) {
    this.server.to(`thread:${threadId}`).emit(event, payload);
  }

  broadcastToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Company-wide staff broadcast. Lets the admin threads list + unread badge
   * update by push instead of tight polling — customers never join this room,
   * so nothing tenant-internal leaks to portal sockets.
   */
  broadcastToCompany(companyId: string, event: string, payload: any) {
    this.server.to(`company:${companyId}`).emit(event, payload);
  }

  /** Staff sockets join their company room; customer sockets never do. */
  private joinCompanyRoomIfStaff(client: AuthSocket) {
    const role = (client.userRole ?? '').toLowerCase();
    if (client.companyId && role !== 'customer' && !client.customerId) {
      client.join(`company:${client.companyId}`);
    }
  }
}

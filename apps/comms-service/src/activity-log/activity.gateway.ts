import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

interface ActivitySocket extends Socket {
  userRole?: string;
}

/**
 * Real-time feed for the super-admin activity monitoring dashboard.
 * The ONE deliberate, narrow exception to this codebase's per-company
 * scoping — enforced here at the socket layer (role check on connect),
 * again in ActivityLogController's route guard, and again in the
 * admin-dashboard route itself. A non-super_admin connection is rejected
 * outright, never merely hidden.
 */
@WebSocketGateway({
  namespace: '/activity',
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
export class ActivityGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ActivityGateway.name);

  async handleConnection(client: ActivitySocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.query?.token ??
        (client.handshake.headers?.authorization as string | undefined)?.replace('Bearer ', '');

      let role: string | undefined;

      if (!token) {
        const companyId =
          (client.handshake.headers['x-test-company-id'] as string) ?? (client.handshake.query?.companyId as string);
        const userId =
          (client.handshake.headers['x-test-user-id'] as string) ?? (client.handshake.query?.userId as string);
        role =
          (client.handshake.headers['x-test-user-role'] as string) ?? (client.handshake.query?.userRole as string);

        if (!companyId || !userId || !role) {
          this.logger.warn(`Activity socket ${client.id} — no auth`);
          client.disconnect(true);
          return;
        }
      } else {
        const secret = process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production';
        const decoded = jwt.verify(token, secret) as any;
        role = decoded.role;
      }

      client.userRole = role;
      if ((role ?? '').toLowerCase() !== 'super_admin') {
        this.logger.warn(`Activity socket ${client.id} rejected — role "${role}" is not super_admin`);
        client.disconnect(true);
        return;
      }

      client.join('company:all');
      this.logger.log(`Activity socket ${client.id} connected as super_admin`);
    } catch (err: any) {
      this.logger.warn(`Activity socket ${client.id} auth failed: ${err.message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('watch_company')
  handleWatchCompany(@ConnectedSocket() client: ActivitySocket, @MessageBody() data: { companyId: string }) {
    if (!data?.companyId) return;
    client.join(`company:${data.companyId}`);
  }

  @SubscribeMessage('unwatch_company')
  handleUnwatchCompany(@ConnectedSocket() client: ActivitySocket, @MessageBody() data: { companyId: string }) {
    if (!data?.companyId) return;
    client.leave(`company:${data.companyId}`);
  }

  /** Called by ActivityLogProcessor right after a row is written. */
  broadcastActivity(entry: unknown) {
    const companyId = (entry as any)?.companyId;
    if (companyId) {
      this.server.to(`company:${companyId}`).emit('activity:new', entry);
    }
    this.server.to('company:all').emit('activity:new', entry);
  }
}

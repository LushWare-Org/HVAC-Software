/**
 * Comms Service — E2E Tests
 *
 * Strategy:
 *  - NestJS app bootstrapped with overridden providers (mock Prisma, mock queues)
 *  - Auth mocked: AuthGuard reads `x-test-user` header (injected by mock)
 *  - BullMQ queues mocked with jest.fn() — no Redis required
 *  - Twilio, SendGrid, Firebase SDKs NOT called (providers mocked at module level)
 *
 * Coverage:
 *  - POST /notifications/sms — queue SMS
 *  - POST /notifications/email — queue email
 *  - POST /notifications/push — queue push
 *  - GET  /notifications — list with pagination
 *  - GET  /notifications/stats — delivery stats
 *  - POST /templates — create template
 *  - GET  /templates — list templates
 *  - GET  /templates/:id — get template
 *  - POST /templates/:id/render — render with context
 *  - POST /messaging/threads — create/find thread
 *  - GET  /messaging/threads — list threads
 *  - POST /automation/rules — create rule
 *  - GET  /automation/rules — list rules
 *  - POST /automation/events/job-status-changed — internal event
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueName } from '@tscrm/queue';
import { ConfigService } from '@nestjs/config';

// ── Mock BullMQ Worker (prevents "Worker requires a connection" on app.init) ──

jest.mock('bullmq', () => {
  const actual = jest.requireActual('bullmq') as Record<string, unknown>;
  class MockWorker {
    on() { return this; }
    close() { return Promise.resolve(); }
    pause() { return Promise.resolve(); }
    resume() { return Promise.resolve(); }
  }
  return { ...actual, Worker: MockWorker };
});

// ── Mock @tscrm/auth-client ───────────────────────────────────────────────

jest.mock('@tscrm/auth-client', () => {
  const { Module, createParamDecorator } = require('@nestjs/common');

  class MockAuthModule {}
  Module({})(MockAuthModule); // apply @Module({}) metadata so NestJS can use it as a module

  return {
    AuthModule: MockAuthModule,
    JwtAuthGuard: class {
      canActivate(ctx: any) {
        const req = ctx.switchToHttp().getRequest();
        const user = req.headers['x-test-user'];
        if (!user) {
          const { UnauthorizedException } = require('@nestjs/common');
          throw new UnauthorizedException();
        }
        req.user = JSON.parse(user);
        return true;
      }
    },
    CurrentUser: createParamDecorator((_data: unknown, ctx: any) => {
      const req = ctx.switchToHttp().getRequest();
      return req.user;
    }),
  };
});

// ── Mock Prisma ───────────────────────────────────────────────────────────

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockResolvedValue([]),
  },
  notificationTemplate: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  messageThread: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    update: jest.fn(),
  },
  automationRule: {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  deliveryLog: { create: jest.fn() },
};

// ── Mock BullMQ Queues ────────────────────────────────────────────────────

const mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

// ── Helpers ───────────────────────────────────────────────────────────────

const COMPANY_ID = 'co-e2e-001';
const staffUser = JSON.stringify({
  sub: 'user-001',
  name: 'Staff Member',
  companyId: COMPANY_ID,
  role: 'company_admin',
});

// ── Test Suite ────────────────────────────────────────────────────────────

describe('Comms Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(getQueueToken(QueueName.SEND_SMS))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken(QueueName.SEND_EMAIL))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken(QueueName.SEND_PUSH))
      .useValue(mockQueue)
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'internalApiKey') return 'test-internal-key';
          if (key === 'twilio.accountSid') return '';
          if (key === 'twilio.authToken') return '';
          if (key === 'sendgrid.apiKey') return '';
          if (key === 'firebase.projectId') return '';
          return '';
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock behaviors
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);
    mockPrisma.notificationTemplate.findMany.mockResolvedValue([]);
    mockPrisma.messageThread.findMany.mockResolvedValue([]);
    mockPrisma.messageThread.count.mockResolvedValue(0);
    mockPrisma.automationRule.findMany.mockResolvedValue([]);
    mockPrisma.notification.groupBy.mockResolvedValue([]);
    mockQueue.add.mockResolvedValue({ id: 'job-1' });
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  describe('POST /notifications/sms', () => {
    it('queues an SMS and returns 201', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        status: 'QUEUED',
        channel: 'SMS',
      });

      const res = await request(app.getHttpServer())
        .post('/notifications/sms')
        .set('x-test-user', staffUser)
        .send({
          recipientId: 'rec-001',
          recipientPhone: '+15551234567',
          body: 'Your appointment is confirmed.',
        });

      expect(res.status).toBe(201);
      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('send-sms', expect.any(Object), expect.any(Object));
    });

    it('returns 400 when recipientPhone is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/sms')
        .set('x-test-user', staffUser)
        .send({ recipientId: 'rec-001', body: 'Test' });

      expect(res.status).toBe(400);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/sms')
        .send({ recipientId: 'r', recipientPhone: '+1', body: 'x' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /notifications/email', () => {
    it('queues an email and returns 201', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-2',
        status: 'QUEUED',
        channel: 'EMAIL',
      });

      const res = await request(app.getHttpServer())
        .post('/notifications/email')
        .set('x-test-user', staffUser)
        .send({
          recipientId: 'rec-001',
          recipientEmail: 'customer@test.com',
          subject: 'Your invoice',
          htmlBody: '<p>Hi</p>',
        });

      expect(res.status).toBe(201);
      expect(mockQueue.add).toHaveBeenCalledWith('send-email', expect.any(Object), expect.any(Object));
    });
  });

  describe('POST /notifications/push', () => {
    it('queues a push notification and returns 201', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-3',
        status: 'QUEUED',
        channel: 'PUSH',
      });

      const res = await request(app.getHttpServer())
        .post('/notifications/push')
        .set('x-test-user', staffUser)
        .send({
          recipientId: 'rec-001',
          pushToken: 'fcm-token-abc',
          title: 'Job Update',
          body: 'Technician on the way.',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('GET /notifications', () => {
    it('returns paginated list', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([
        { id: 'n1', channel: 'SMS', status: 'DELIVERED' },
      ]);
      mockPrisma.notification.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/notifications')
        .set('x-test-user', staffUser);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items).toHaveLength(1);
    });
  });

  describe('GET /notifications/stats', () => {
    it('returns grouped delivery stats', async () => {
      mockPrisma.notification.groupBy.mockResolvedValue([
        { channel: 'SMS', status: 'DELIVERED', _count: { id: 50 } },
      ]);

      const res = await request(app.getHttpServer())
        .get('/notifications/stats')
        .set('x-test-user', staffUser);

      expect(res.status).toBe(200);
    });
  });

  // ── Templates ─────────────────────────────────────────────────────────────

  describe('POST /templates', () => {
    it('creates a template and returns 201', async () => {
      mockPrisma.notificationTemplate.create.mockResolvedValue({
        id: 'tmpl-1',
        name: 'Test SMS',
        channel: 'SMS',
        type: 'JOB_STATUS_UPDATE',
        body: 'Hi {{customerName}}',
      });

      const res = await request(app.getHttpServer())
        .post('/templates')
        .set('x-test-user', staffUser)
        .send({
          name: 'Test SMS',
          type: 'JOB_STATUS_UPDATE',
          channel: 'SMS',
          body: 'Hi {{customerName}}',
          variables: ['customerName'],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('tmpl-1');
    });

    it('returns 400 for invalid Handlebars syntax', async () => {
      const res = await request(app.getHttpServer())
        .post('/templates')
        .set('x-test-user', staffUser)
        .send({
          name: 'Bad',
          type: 'CUSTOM',
          channel: 'SMS',
          body: '{{#unclosed',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /templates', () => {
    it('returns template list', async () => {
      mockPrisma.notificationTemplate.findMany.mockResolvedValue([
        { id: 'tmpl-1', name: 'Test SMS' },
      ]);

      const res = await request(app.getHttpServer())
        .get('/templates')
        .set('x-test-user', staffUser);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /templates/:id/render', () => {
    it('renders a template with context', async () => {
      const tmpl = {
        id: 'tmpl-1',
        body: 'Hi {{customerName}}, your job is done.',
        subject: null,
        companyId: COMPANY_ID,
      };
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(tmpl);

      const res = await request(app.getHttpServer())
        .post('/templates/tmpl-1/render')
        .set('x-test-user', staffUser)
        .send({ context: { customerName: 'Alice' } });

      expect(res.status).toBe(201);
      expect(res.body.body).toBe('Hi Alice, your job is done.');
    });
  });

  // ── Messaging ─────────────────────────────────────────────────────────────

  describe('POST /messaging/threads', () => {
    it('creates a new thread when none exists', async () => {
      mockPrisma.messageThread.findFirst.mockResolvedValue(null);
      mockPrisma.messageThread.create.mockResolvedValue({
        id: 'thread-1',
        companyId: COMPANY_ID,
        customerId: 'cust-001',
        customerName: 'Bob Jones',
        messages: [],
        unreadCount: 0,
        status: 'ACTIVE',
      });

      const res = await request(app.getHttpServer())
        .post('/messaging/threads')
        .set('x-test-user', staffUser)
        .send({
          customerId: 'cust-001',
          customerName: 'Bob Jones',
          customerPhone: '+15551234567',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('thread-1');
    });

    it('returns existing active thread instead of creating duplicate', async () => {
      const existing = { id: 'thread-existing', customerId: 'cust-001', status: 'ACTIVE' };
      mockPrisma.messageThread.findFirst.mockResolvedValue(existing);

      const res = await request(app.getHttpServer())
        .post('/messaging/threads')
        .set('x-test-user', staffUser)
        .send({ customerId: 'cust-001', customerName: 'Bob' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('thread-existing');
      expect(mockPrisma.messageThread.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /messaging/threads', () => {
    it('returns paginated thread list', async () => {
      mockPrisma.messageThread.findMany.mockResolvedValue([
        { id: 'thread-1', customerName: 'Bob', unreadCount: 2 },
      ]);
      mockPrisma.messageThread.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/messaging/threads')
        .set('x-test-user', staffUser);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });
  });

  // ── Automation ────────────────────────────────────────────────────────────

  describe('POST /automation/rules', () => {
    it('creates automation rule and returns 201', async () => {
      mockPrisma.automationRule.create.mockResolvedValue({
        id: 'rule-1',
        companyId: COMPANY_ID,
        name: 'Job Done SMS',
        trigger: 'JOB_STATUS_CHANGED',
        conditions: '{"jobStatus":"COMPLETED"}',
        actions: '[{"channel":"SMS","templateId":"tmpl-1"}]',
        delayMinutes: 0,
        isActive: true,
      });

      const res = await request(app.getHttpServer())
        .post('/automation/rules')
        .set('x-test-user', staffUser)
        .send({
          name: 'Job Done SMS',
          trigger: 'JOB_STATUS_CHANGED',
          conditions: '{"jobStatus":"COMPLETED"}',
          actions: '[{"channel":"SMS","templateId":"tmpl-1"}]',
        });

      expect(res.status).toBe(201);
      expect(res.body.trigger).toBe('JOB_STATUS_CHANGED');
    });
  });

  describe('GET /automation/rules', () => {
    it('returns rules list', async () => {
      mockPrisma.automationRule.findMany.mockResolvedValue([
        { id: 'rule-1', name: 'Job Done SMS' },
      ]);

      const res = await request(app.getHttpServer())
        .get('/automation/rules')
        .set('x-test-user', staffUser);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /automation/events/job-status-changed', () => {
    it('processes event with valid internal API key', async () => {
      mockPrisma.automationRule.findMany.mockResolvedValue([]); // no matching rules

      const res = await request(app.getHttpServer())
        .post('/automation/events/job-status-changed')
        .set('x-internal-api-key', 'test-internal-key')
        .send({
          companyId: COMPANY_ID,
          jobId: 'job-001',
          jobStatus: 'COMPLETED',
          customerId: 'cust-001',
          customerName: 'Alice',
          customerPhone: '+15551234567',
        });

      expect(res.status).toBe(200);
      expect(res.body.processed).toBe(true);
    });

    it('rejects event with invalid API key', async () => {
      const res = await request(app.getHttpServer())
        .post('/automation/events/job-status-changed')
        .set('x-internal-api-key', 'wrong-key')
        .send({
          companyId: COMPANY_ID,
          jobId: 'job-001',
          jobStatus: 'COMPLETED',
          customerId: 'cust-001',
          customerName: 'Alice',
        });

      expect(res.status).toBe(401);
    });
  });
});

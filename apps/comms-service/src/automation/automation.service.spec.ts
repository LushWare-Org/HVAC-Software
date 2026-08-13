/**
 * AutomationService — Unit Tests
 *
 * Tests the rule engine:
 *  - Condition matching (simple equality)
 *  - Rule selection by trigger + isActive
 *  - Dispatching to correct channel (SMS / EMAIL / PUSH)
 *  - Delayed send via scheduledAt
 *  - Missing recipient fields → silently skip dispatch
 *  - Template render failure → logs error, does not throw
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TemplatesService } from '../templates/templates.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { AutomationTrigger } from '../prisma/generated';
import type { JobStatusChangedEvent } from './dto/automation.dto';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPrisma = {
  automationRule: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockNotifications = {
  sendSms: jest.fn(),
  sendEmail: jest.fn(),
  sendPush: jest.fn(),
};

const mockTemplates = {
  render: jest.fn(),
  findOne: jest.fn(),
};

const mockCompanySettings = {
  getSettings: jest.fn().mockResolvedValue({ name: 'Test Co' }),
};

const COMPANY_ID = 'co-001';

function makeRule(overrides: Partial<any> = {}): any {
  return {
    id: 'rule-001',
    companyId: COMPANY_ID,
    name: 'Job Completed SMS',
    trigger: AutomationTrigger.JOB_STATUS_CHANGED,
    conditions: JSON.stringify({ jobStatus: 'COMPLETED' }),
    actions: JSON.stringify([{ channel: 'SMS', templateId: 'tmpl-001' }]),
    delayMinutes: 0,
    isActive: true,
    ...overrides,
  };
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('AutomationService', () => {
  let service: AutomationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockNotifications.sendEmail.mockResolvedValue({});
    mockNotifications.sendSms.mockResolvedValue({});
    mockCompanySettings.getSettings.mockResolvedValue({ name: 'Test Co' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: TemplatesService, useValue: mockTemplates },
        { provide: CompanySettingsClient, useValue: mockCompanySettings },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
  });

  // ── processJobStatusChanged ─────────────────────────────────────────────

  describe('processJobStatusChanged', () => {
    const event: JobStatusChangedEvent = {
      companyId: COMPANY_ID,
      jobId: 'job-001',
      jobStatus: 'COMPLETED',
      customerId: 'cust-001',
      customerName: 'Alice Smith',
      customerPhone: '+15551234567',
      customerEmail: 'alice@test.com',
      jobAddress: '123 Main St',
      technicianName: 'Bob',
    };

    it('fires SMS when conditions match', async () => {
      mockPrisma.automationRule.findMany.mockResolvedValue([makeRule()]);
      mockTemplates.render.mockResolvedValue({
        body: 'Hi Alice, your job is complete.',
      });
      mockNotifications.sendSms.mockResolvedValue({});

      await service.processJobStatusChanged(event);

      expect(mockTemplates.render).toHaveBeenCalledWith(
        COMPANY_ID,
        'tmpl-001',
        expect.objectContaining({ customerName: 'Alice Smith', jobStatus: 'COMPLETED' }),
      );
      expect(mockNotifications.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: COMPANY_ID,
          recipientPhone: '+15551234567',
          body: 'Hi Alice, your job is complete.',
        }),
      );
    });

    it('sends a built-in status email with the hold reason when jobStatus is ON_HOLD', async () => {
      mockPrisma.automationRule.findMany.mockResolvedValue([]); // no automation rules configured
      mockNotifications.sendEmail.mockResolvedValue({});

      await service.processJobStatusChanged({
        ...event,
        jobStatus: 'ON_HOLD',
        statusNote: 'Waiting on a special-order part',
      });

      expect(mockNotifications.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'alice@test.com',
          subject: expect.stringContaining('on hold'),
          htmlBody: expect.stringContaining('Waiting on a special-order part'),
        }),
      );
    });

    it('does not fire when condition value does not match', async () => {
      // Rule fires on COMPLETED but event is IN_PROGRESS
      mockPrisma.automationRule.findMany.mockResolvedValue([makeRule()]);

      const inProgressEvent = { ...event, jobStatus: 'IN_PROGRESS' };
      await service.processJobStatusChanged(inProgressEvent);

      expect(mockNotifications.sendSms).not.toHaveBeenCalled();
    });

    it('skips SMS dispatch when customerPhone is missing', async () => {
      mockPrisma.automationRule.findMany.mockResolvedValue([makeRule()]);
      mockTemplates.render.mockResolvedValue({ body: 'Hi Alice.' });

      const noPhoneEvent = { ...event, customerPhone: undefined };
      await service.processJobStatusChanged(noPhoneEvent);

      expect(mockNotifications.sendSms).not.toHaveBeenCalled();
    });

    it('fires EMAIL when channel is EMAIL and email provided', async () => {
      const emailRule = makeRule({
        actions: JSON.stringify([{ channel: 'EMAIL', templateId: 'tmpl-email-001' }]),
      });
      mockPrisma.automationRule.findMany.mockResolvedValue([emailRule]);
      mockTemplates.render.mockResolvedValue({
        subject: 'Job complete!',
        body: '<p>Your job is done.</p>',
      });
      mockNotifications.sendEmail.mockResolvedValue({});

      await service.processJobStatusChanged(event);

      expect(mockNotifications.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'alice@test.com',
          subject: 'Job complete!',
        }),
      );
    });

    it('applies delayMinutes by setting scheduledAt in the future', async () => {
      const delayedRule = makeRule({ delayMinutes: 60 }); // 60 min delay
      mockPrisma.automationRule.findMany.mockResolvedValue([delayedRule]);
      mockTemplates.render.mockResolvedValue({ body: 'Reminder.' });
      mockNotifications.sendSms.mockResolvedValue({});

      const before = Date.now();
      await service.processJobStatusChanged(event);
      const after = Date.now();

      const sendCall = mockNotifications.sendSms.mock.calls[0][0];
      const scheduledAt: Date = sendCall.scheduledAt;

      expect(scheduledAt).toBeInstanceOf(Date);
      // scheduled time should be ~60 min in the future
      const delayMs = scheduledAt.getTime() - before;
      expect(delayMs).toBeGreaterThanOrEqual(59 * 60 * 1000);
      expect(delayMs).toBeLessThanOrEqual(61 * 60 * 1000);
    });

    it('handles template render failure gracefully (does not throw)', async () => {
      mockPrisma.automationRule.findMany.mockResolvedValue([makeRule()]);
      mockTemplates.render.mockRejectedValue(new Error('Template not found'));

      // Should NOT throw — error is swallowed and logged
      await expect(service.processJobStatusChanged(event)).resolves.toBeUndefined();
      expect(mockNotifications.sendSms).not.toHaveBeenCalled();
    });

    it('skips inactive rules', async () => {
      // findMany only returns active rules (service filters isActive: true)
      mockPrisma.automationRule.findMany.mockResolvedValue([]);

      await service.processJobStatusChanged(event);
      expect(mockTemplates.render).not.toHaveBeenCalled();
    });

    it('processes multiple rules and actions in sequence', async () => {
      const smsRule = makeRule({ id: 'rule-sms' });
      const emailRule = makeRule({
        id: 'rule-email',
        actions: JSON.stringify([{ channel: 'EMAIL', templateId: 'tmpl-002' }]),
      });
      mockPrisma.automationRule.findMany.mockResolvedValue([smsRule, emailRule]);
      mockTemplates.render.mockResolvedValue({ body: 'Message body.', subject: 'Subject' });
      mockNotifications.sendSms.mockResolvedValue({});
      mockNotifications.sendEmail.mockResolvedValue({});

      await service.processJobStatusChanged(event);

      expect(mockNotifications.sendSms).toHaveBeenCalledTimes(1);
      // 1 from the matching EMAIL rule + 1 from the built-in COMPLETED status email.
      expect(mockNotifications.sendEmail).toHaveBeenCalledTimes(2);
    });
  });

  // ── Rule CRUD ─────────────────────────────────────────────────────────────

  describe('CRUD', () => {
    it('createRule persists with correct trigger', async () => {
      mockPrisma.automationRule.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: 'rule-new' }),
      );

      const dto = {
        name: 'Invoice Sent Email',
        trigger: 'INVOICE_SENT' as any,
        conditions: '{"invoiceStatus":"SENT"}',
        actions: '[{"channel":"EMAIL","templateId":"tmpl-003"}]',
      };

      const result = await service.createRule(COMPANY_ID, dto);
      expect(result.trigger).toBe('INVOICE_SENT');
    });

    it('findRule throws NotFoundException for unknown id', async () => {
      mockPrisma.automationRule.findFirst.mockResolvedValue(null);
      await expect(service.findRule(COMPANY_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('removeRule deletes after findOne check', async () => {
      mockPrisma.automationRule.findFirst.mockResolvedValue(makeRule());
      mockPrisma.automationRule.delete.mockResolvedValue({});

      const result = await service.removeRule(COMPANY_ID, 'rule-001');
      expect(result.deleted).toBe(true);
      expect(mockPrisma.automationRule.delete).toHaveBeenCalledWith({
        where: { id: 'rule-001' },
      });
    });
  });
});

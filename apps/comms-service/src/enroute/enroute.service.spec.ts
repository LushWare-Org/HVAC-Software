import { Test } from '@nestjs/testing';
import { EnRouteNotificationService } from './enroute.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { EnRouteNotificationDto } from './dto/enroute.dto';

describe('EnRouteNotificationService', () => {
  let service: EnRouteNotificationService;
  const notifications = {
    sendEmail: jest.fn().mockResolvedValue({ id: 'n1' }),
    sendSms: jest.fn().mockResolvedValue({ id: 'n2' }),
  };
  const settingsClient = {
    getSettings: jest.fn().mockResolvedValue({
      id: 'co-1', name: 'Demo', logoUrl: null,
      currency: 'USD', timezone: 'America/Chicago', features: {},
    }),
  };

  const baseDto: EnRouteNotificationDto = {
    assignmentId: 'assign-1',
    jobId: 'job-1',
    jobTitle: 'AC Maintenance',
    serviceAddress: '12 Main St, Austin TX',
    customerName: 'Dana',
    customerEmail: 'dana@example.com',
    customerPhone: '+15125550100',
    techUserId: 'user-tech-1',
    techName: 'Miguel Torres',
    etaStart: '2026-07-03T19:40:00.000Z',
    etaEnd: '2026-07-03T20:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Avatar lookup goes to CRM over HTTP — stub it out.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ avatarUrl: 'http://cdn/avatars/co/u1.jpg' }),
    }) as any;

    const module = await Test.createTestingModule({
      providers: [
        EnRouteNotificationService,
        { provide: NotificationsService, useValue: notifications },
        { provide: CompanySettingsClient, useValue: settingsClient },
      ],
    }).compile();
    service = module.get(EnRouteNotificationService);
  });

  it('sends both email and SMS when both contacts exist', async () => {
    const res = await service.notify('co-1', { ...baseDto });
    expect(res).toEqual({ email: true, sms: true, deduped: false });
    expect(notifications.sendEmail).toHaveBeenCalledTimes(1);
    expect(notifications.sendSms).toHaveBeenCalledTimes(1);

    const emailArg = notifications.sendEmail.mock.calls[0][0];
    expect(emailArg.recipientEmail).toBe('dana@example.com');
    expect(emailArg.subject).toContain('Miguel Torres');
    expect(emailArg.htmlBody).toContain('http://cdn/avatars/co/u1.jpg');
    expect(emailArg.htmlBody).toContain('AC Maintenance');

    const smsArg = notifications.sendSms.mock.calls[0][0];
    expect(smsArg.body).toContain('Miguel Torres');
    expect(smsArg.body).toContain('expected between');
  });

  it('skips email when no customerEmail, still sends SMS', async () => {
    const res = await service.notify('co-1', { ...baseDto, assignmentId: 'assign-2', customerEmail: undefined });
    expect(res).toEqual({ email: false, sms: true, deduped: false });
    expect(notifications.sendEmail).not.toHaveBeenCalled();
  });

  it('skips SMS when no customerPhone, still sends email', async () => {
    const res = await service.notify('co-1', { ...baseDto, assignmentId: 'assign-3', customerPhone: undefined });
    expect(res).toEqual({ email: true, sms: false, deduped: false });
    expect(notifications.sendSms).not.toHaveBeenCalled();
  });

  it('dedupes a second notification for the same assignment', async () => {
    await service.notify('co-1', { ...baseDto, assignmentId: 'assign-4' });
    const res = await service.notify('co-1', { ...baseDto, assignmentId: 'assign-4' });
    expect(res.deduped).toBe(true);
    expect(notifications.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('uses an initials avatar in the email when the tech has no photo', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ avatarUrl: null }) });
    await service.notify('co-1', { ...baseDto, assignmentId: 'assign-5' });
    const emailArg = notifications.sendEmail.mock.calls[0][0];
    expect(emailArg.htmlBody).not.toContain('<img');
    expect(emailArg.htmlBody).toContain('MT'); // initials
  });

  it('sends timeless copy when no ETA is known', async () => {
    await service.notify('co-1', { ...baseDto, assignmentId: 'assign-6', etaStart: undefined, etaEnd: undefined });
    const emailArg = notifications.sendEmail.mock.calls[0][0];
    expect(emailArg.htmlBody).toContain('They will arrive shortly');
    const smsArg = notifications.sendSms.mock.calls[0][0];
    expect(smsArg.body).not.toContain('expected');
  });

  it('formatWindow renders a between-window', () => {
    const w = service.formatWindow('2026-07-03T19:40:00.000Z', '2026-07-03T20:00:00.000Z');
    expect(w).toMatch(/^between .+ and .+/);
  });

  it('formatWindow renders times in the given company timezone', () => {
    // 04:30Z is 10:00 AM in Asia/Colombo (UTC+5:30)
    const w = service.formatWindow('2026-07-06T04:30:00.000Z', undefined, 'Asia/Colombo');
    expect(w).toBe('around 10:00 AM');
  });

  it('notify uses the tenant timezone from settings for the window', async () => {
    settingsClient.getSettings.mockResolvedValueOnce({
      id: 'co-lk', name: 'KASE', logoUrl: null,
      currency: 'LKR', timezone: 'Asia/Colombo', features: {},
    });
    await service.notify('co-lk', {
      ...baseDto,
      assignmentId: 'assign-tz',
      etaStart: '2026-07-06T04:30:00.000Z',
      etaEnd: undefined,
    });
    const smsArg = notifications.sendSms.mock.calls[0][0];
    expect(smsArg.body).toContain('10:00 AM');
  });
});

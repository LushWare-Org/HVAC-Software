/**
 * The routing rule is the thing under test: whoever did NOT just act gets told.
 * Getting it backwards would mean telling a customer about their own request
 * and leaving staff unaware there is work waiting.
 */
import { Test } from '@nestjs/testing';
import { RescheduleNotificationService } from './reschedule-notification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { StaffDirectoryClient } from '../company-settings/staff-directory.client';
import { PrismaService } from '../prisma/prisma.service';

describe('RescheduleNotificationService', () => {
  let service: RescheduleNotificationService;

  const notifications = { sendEmail: jest.fn() };
  const settings = {
    getSettings: jest.fn().mockResolvedValue({
      id: 'co-1', name: 'Acme HVAC', currency: 'USD', timezone: 'America/Chicago', features: {},
    }),
  };
  const staff = { getSchedulingStaff: jest.fn() };
  const prisma = { notification: { create: jest.fn() } };

  const job = {
    id: 'job-1', customerId: 'cust-1', customerName: 'Alice',
    customerEmail: 'alice@test.com', title: 'AC Maintenance', jobNumber: 'JOB-1',
  };
  const request = {
    id: 'req-1', openedBy: 'ADMIN', mode: 'PROPOSE_SLOTS', status: 'AWAITING_RESPONSE',
    reasonCode: 'PARTS_DELAY', reason: 'awaiting a compressor',
    slots: [{ id: 's1', startAt: '2026-08-12T13:00:00.000Z', endAt: '2026-08-12T17:00:00.000Z', window: 'morning' }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    notifications.sendEmail.mockResolvedValue({ id: 'n1' });
    prisma.notification.create.mockResolvedValue({ id: 'in-app-1' });
    staff.getSchedulingStaff.mockResolvedValue([
      { id: 'u1', name: 'Dee', email: 'dee@co.com', role: 'dispatcher' },
      { id: 'u2', name: 'Ola', email: 'ola@co.com', role: 'office_manager' },
    ]);

    const module = await Test.createTestingModule({
      providers: [
        RescheduleNotificationService,
        { provide: NotificationsService, useValue: notifications },
        { provide: CompanySettingsClient, useValue: settings },
        { provide: StaffDirectoryClient, useValue: staff },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(RescheduleNotificationService);
  });

  it('a staff-opened request emails the customer and never bothers staff', async () => {
    const res = await service.notify('co-1', { event: 'OPENED', job, request } as any);
    expect(res.email).toBe(true);
    expect(notifications.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      recipientEmail: 'alice@test.com',
    }));
    expect(staff.getSchedulingStaff).not.toHaveBeenCalled();
  });

  it('a customer-opened request notifies every staff member in-app, no email', async () => {
    const res = await service.notify('co-1', {
      event: 'OPENED', job, request: { ...request, openedBy: 'CUSTOMER' },
    } as any);
    expect(notifications.sendEmail).not.toHaveBeenCalled();
    expect(res.inApp).toBe(2);
    const recipients = prisma.notification.create.mock.calls.map((c: any) => c[0].data.recipientId);
    expect(recipients.sort()).toEqual(['u1', 'u2']);
  });

  it('APPLIED always goes to the customer even though staff performed it', async () => {
    const res = await service.notify('co-1', {
      event: 'APPLIED',
      job,
      request: { ...request, openedBy: 'CUSTOMER', status: 'APPLIED', pickedSlotId: 's1' },
    } as any);
    expect(res.email).toBe(true);
    expect(notifications.sendEmail.mock.calls[0][0].subject.toLowerCase()).toContain('confirmed');
  });

  it('the applied email names the agreed slot', async () => {
    await service.notify('co-1', {
      event: 'APPLIED', job, request: { ...request, pickedSlotId: 's1' },
    } as any);
    expect(notifications.sendEmail.mock.calls[0][0].htmlBody).toContain('Confirmed for');
  });

  it('writes an in-app notification for the customer alongside their email', async () => {
    await service.notify('co-1', { event: 'APPLIED', job, request } as any);
    const created = prisma.notification.create.mock.calls[0][0].data;
    expect(created.recipientId).toBe('cust-1');
    expect(created.channel).toBe('IN_APP');
    expect(created.jobId).toBe('job-1');
    expect(created.type).toBe('reschedule');
  });

  it('skips email but still records in-app when the customer has no address', async () => {
    const res = await service.notify('co-1', {
      event: 'OPENED', job: { ...job, customerEmail: null }, request,
    } as any);
    expect(res.email).toBe(false);
    expect(notifications.sendEmail).not.toHaveBeenCalled();
    expect(res.inApp).toBe(1);
  });

  it('renders times in the tenant timezone from settings', async () => {
    await service.notify('co-1', { event: 'OPENED', job, request } as any);
    // 13:00Z is 8:00 AM in Chicago; rendering in UTC would say 1:00 PM.
    expect(notifications.sendEmail.mock.calls[0][0].htmlBody).toContain('8:00');
  });

  it('does not throw when email delivery fails', async () => {
    notifications.sendEmail.mockRejectedValueOnce(new Error('smtp down'));
    await expect(
      service.notify('co-1', { event: 'OPENED', job, request } as any),
    ).resolves.toEqual(expect.objectContaining({ email: false }));
  });

  it('does not throw when the in-app write fails', async () => {
    prisma.notification.create.mockRejectedValue(new Error('mongo down'));
    await expect(
      service.notify('co-1', { event: 'OPENED', job, request } as any),
    ).resolves.toEqual(expect.objectContaining({ inApp: 0 }));
  });

  it('sends nothing to staff when the directory lookup fails open', async () => {
    staff.getSchedulingStaff.mockResolvedValue([]);
    const res = await service.notify('co-1', {
      event: 'OPENED', job, request: { ...request, openedBy: 'CUSTOMER' },
    } as any);
    expect(res.inApp).toBe(0);
    expect(res.email).toBe(false);
  });

  it('a NUDGE follows the same routing as the round it belongs to', async () => {
    // Staff proposed; the customer is the one sitting on it, so nudge them.
    await service.notify('co-1', { event: 'NUDGE', job, request } as any);
    expect(notifications.sendEmail).toHaveBeenCalled();

    jest.clearAllMocks();
    notifications.sendEmail.mockResolvedValue({ id: 'n' });
    prisma.notification.create.mockResolvedValue({ id: 'x' });
    staff.getSchedulingStaff.mockResolvedValue([{ id: 'u1', name: 'Dee', email: 'd@c', role: 'dispatcher' }]);

    // Customer asked; staff are sitting on it, so nudge staff.
    await service.notify('co-1', {
      event: 'NUDGE', job, request: { ...request, openedBy: 'CUSTOMER' },
    } as any);
    expect(notifications.sendEmail).not.toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});

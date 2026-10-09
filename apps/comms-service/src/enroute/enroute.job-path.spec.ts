import { EnRouteNotificationService } from './enroute.service';

/** "On the way" from the technician app (job-service), not only from dispatch (scheduling-service). */
describe('en-route from the technician app', () => {
  const settings: any = { getSettings: jest.fn(async () => ({ name: 'Orrix', timezone: 'Asia/Colombo' })) };
  const row = {
    assignmentId: 'a-1', techUserId: 'u-rp', techName: 'RP Tech', techLat: null, techLng: null, lastSeen: null,
    title: 'AC service', serviceAddress: '12 Galle Rd', customerId: 'c-1', customerName: 'Ann', customerEmail: 'ann@x.com', customerPhone: null,
    lat: 6.9, lng: 79.85, scheduledStart: new Date('2026-10-09T05:00:00Z'), scheduledEnd: new Date('2026-10-09T06:00:00Z'), assignedToId: 'u-rp', assignedToName: 'RP Tech',
  };
  function make() {
    const notifications: any = { sendEmail: jest.fn(async () => ({})), sendSms: jest.fn(async () => ({})) };
    const prisma: any = { $queryRawUnsafe: jest.fn(async () => [row]) };
    const jobUpdates: any = { post: jest.fn(async () => true) };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ avatarUrl: 'https://cdn/rp.jpg' }) }) as any;
    return { svc: new EnRouteNotificationService(notifications, settings, prisma, jobUpdates), notifications, jobUpdates };
  }

  it('emails the customer with the technician and arrival time, and posts the in-app update with the photo', async () => {
    const { svc, notifications, jobUpdates } = make();
    const res = await svc.notifyFromJob('co', 'job-1');
    expect(res).toEqual(expect.objectContaining({ email: true, deduped: false }));
    expect(notifications.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ recipientEmail: 'ann@x.com' }));
    expect(jobUpdates.post).toHaveBeenCalledWith(expect.objectContaining({
      customerId: 'c-1', jobId: 'job-1', status: 'EN_ROUTE', technicianName: 'RP Tech', techPhotoUrl: 'https://cdn/rp.jpg',
      arrivalWindow: expect.stringContaining('between'),
    }));
  });

  it('sends once when both the technician app and dispatch report it', async () => {
    const { svc, notifications } = make();
    await svc.notifyFromJob('co', 'job-1');
    const second = await svc.notify('co', { assignmentId: 'a-1', jobId: 'job-1', jobTitle: 'AC service', techUserId: 'u-rp', techName: 'RP Tech', customerEmail: 'ann@x.com' } as any);
    expect(second.deduped).toBe(true);
    expect(notifications.sendEmail).toHaveBeenCalledTimes(1);
  });
});

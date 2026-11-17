import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InternalApiKeyGuard } from '@tscrm/auth-client';
import { SweepsController } from './sweeps.controller';

describe('SweepsController', () => {
  const care = { sweep: jest.fn().mockResolvedValue({ scanned: 4, sent: 2 }) };
  const notices = { sendDue: jest.fn().mockResolvedValue(3) };
  const nudges = { sweep: jest.fn().mockResolvedValue(1) };
  const controller = new SweepsController(care as never, notices as never, nudges as never);

  beforeEach(() => jest.clearAllMocks());

  it('runs the schedule-notice sweep and reports how many were sent', async () => {
    await expect(controller.run('notices')).resolves.toEqual({ sweep: 'notices', result: { sent: 3 } });
    expect(notices.sendDue).toHaveBeenCalledTimes(1);
    expect(care.sweep).not.toHaveBeenCalled();
  });

  it('runs the visit-reminder sweep', async () => {
    await expect(controller.run('reminders')).resolves.toEqual({ sweep: 'reminders', result: { scanned: 4, sent: 2 } });
    expect(care.sweep).toHaveBeenCalledTimes(1);
  });

  it('runs the reschedule-nudge sweep', async () => {
    await expect(controller.run('nudges')).resolves.toEqual({ sweep: 'nudges', result: { sent: 1 } });
    expect(nudges.sweep).toHaveBeenCalledTimes(1);
  });

  it('refuses an unknown sweep name without running anything', async () => {
    await expect(controller.run('everything')).rejects.toBeInstanceOf(NotFoundException);
    expect(care.sweep).not.toHaveBeenCalled();
    expect(notices.sendDue).not.toHaveBeenCalled();
    expect(nudges.sweep).not.toHaveBeenCalled();
  });

  it('lets a sweep failure surface so Cloud Scheduler records and retries it', async () => {
    notices.sendDue.mockRejectedValueOnce(new Error('db down'));
    await expect(controller.run('notices')).rejects.toThrow('db down');
  });

  describe('InternalApiKeyGuard on this route', () => {
    const ctx = (key?: string) => ({ switchToHttp: () => ({ getRequest: () => ({ headers: key ? { 'x-internal-api-key': key } : {} }) }) }) as never;
    const guard = new InternalApiKeyGuard();
    beforeEach(() => { process.env.INTERNAL_API_KEY = 'secret-key'; });

    it('accepts the right key', () => expect(guard.canActivate(ctx('secret-key'))).toBe(true));
    it('rejects a missing or wrong key', () => {
      expect(() => guard.canActivate(ctx())).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(ctx('nope'))).toThrow(UnauthorizedException);
    });
  });
});

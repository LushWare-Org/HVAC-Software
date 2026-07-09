/**
 * NotificationsService — SMS feature-gate tests
 *
 * Verifies the per-tenant `sms` feature flag: when off, sendSms skips
 * entirely (no Notification row, no queue job); email is unaffected.
 */
import { NotificationsService } from './notifications.service';

const prismaMock = {
  notification: { create: jest.fn() },
};
const emailServiceMock = { send: jest.fn() };
const smsQueueMock = { add: jest.fn() };
const emailQueueMock = { add: jest.fn() };
const pushQueueMock = { add: jest.fn() };
const settingsClientMock = { getSettings: jest.fn() };

function makeService(): NotificationsService {
  return new NotificationsService(
    prismaMock as never,
    emailServiceMock as never,
    settingsClientMock as never,
    smsQueueMock as never,
    emailQueueMock as never,
    pushQueueMock as never,
  );
}

const baseReq = {
  companyId: 'co-1',
  recipientName: 'Nimal',
  recipientPhone: '+94770000000',
  body: 'Your technician is on the way',
};

describe('NotificationsService SMS gate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('skips SMS entirely when sms feature is off', async () => {
    settingsClientMock.getSettings.mockResolvedValue({
      id: 'co-1', name: '', logoUrl: null,
      currency: 'LKR', timezone: 'Asia/Colombo', features: { sms: false },
    });
    const service = makeService();
    const result = await service.sendSms(baseReq as never);
    expect(result).toBeNull();
    expect(prismaMock.notification.create).not.toHaveBeenCalled();
    expect(smsQueueMock.add).not.toHaveBeenCalled();
  });

  it('sends SMS when features empty (default on)', async () => {
    settingsClientMock.getSettings.mockResolvedValue({
      id: 'co-1', name: '', logoUrl: null,
      currency: 'USD', timezone: 'America/New_York', features: {},
    });
    prismaMock.notification.create.mockResolvedValue({ id: 'n-1' });
    const service = makeService();
    const result = await service.sendSms(baseReq as never);
    expect(result).toEqual({ id: 'n-1' });
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1);
    expect(smsQueueMock.add).toHaveBeenCalledTimes(1);
  });

  it('sends SMS when settings fetch fails open', async () => {
    settingsClientMock.getSettings.mockResolvedValue({
      id: 'co-1', name: '', logoUrl: null,
      currency: 'USD', timezone: 'America/New_York', features: {},
    });
    prismaMock.notification.create.mockResolvedValue({ id: 'n-2' });
    const service = makeService();
    const result = await service.sendSms(baseReq as never);
    expect(result).toEqual({ id: 'n-2' });
  });
});

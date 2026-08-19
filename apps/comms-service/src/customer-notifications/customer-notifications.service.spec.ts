import { CustomerNotificationsService } from './customer-notifications.service';

describe('CustomerNotificationsService', () => {
  let service: CustomerNotificationsService;
  const notifications = { sendPush: jest.fn().mockResolvedValue({ id: 'n-1' }) };
  const prisma = { notification: { findFirst: jest.fn().mockResolvedValue(null) } };
  const crm = { getCustomerPushRecipient: jest.fn() };
  const subscriber = { onCustomerEvent: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.notification.findFirst.mockResolvedValue(null);
    crm.getCustomerPushRecipient.mockResolvedValue({
      recipientId: 'u-9', recipientName: 'Sam', pushToken: 'ExponentPushToken[abc]',
    });
    service = new CustomerNotificationsService(
      notifications as never, prisma as never, crm as never, subscriber as never,
    );
  });

  it("sends a push resolved from the customer's push token", async () => {
    const result = await service.pushToCustomer({
      companyId: 'co-1', customerId: 'cust-1',
      title: 'Your technician is on the way', body: 'Arriving soon',
      data: { type: 'job_status', jobId: 'job-1' }, jobId: 'job-1',
    });

    expect(result.sent).toBe(true);
    expect(notifications.sendPush).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'co-1', customerId: 'cust-1', recipientId: 'u-9',
      pushToken: 'ExponentPushToken[abc]',
      data: { type: 'job_status', jobId: 'job-1' },
    }));
  });

  it('skips silently when the customer has no push token', async () => {
    crm.getCustomerPushRecipient.mockResolvedValue(null);

    const result = await service.pushToCustomer({
      companyId: 'co-1', customerId: 'cust-1', title: 'T', body: 'B',
    });

    expect(result).toEqual({ sent: false, reason: 'no-token' });
    expect(notifications.sendPush).not.toHaveBeenCalled();
  });

  it('skips a duplicate when a notification already exists for the dedupeKey', async () => {
    prisma.notification.findFirst.mockResolvedValue({ id: 'existing' });

    const result = await service.pushToCustomer({
      companyId: 'co-1', customerId: 'cust-1', title: 'T', body: 'B',
      dedupeKey: 'job-reminder:job-1:2026-08-20',
    });

    expect(result).toEqual({ sent: false, reason: 'duplicate' });
    expect(notifications.sendPush).not.toHaveBeenCalled();
  });

  it('pushes on EN_ROUTE but stays silent on a customer-initiated job creation', async () => {
    await service.handleCustomerEvent({
      kind: 'job', customerId: 'cust-1', companyId: 'co-1',
      event: { jobId: 'job-1', change: 'STATUS', status: 'EN_ROUTE' },
    });
    expect(crm.getCustomerPushRecipient).toHaveBeenCalledWith('co-1', 'cust-1');

    jest.clearAllMocks();

    await service.handleCustomerEvent({
      kind: 'job', customerId: 'cust-1', companyId: 'co-1',
      event: { jobId: 'job-2', change: 'CREATED', status: 'PENDING' },
    });
    expect(crm.getCustomerPushRecipient).not.toHaveBeenCalled();
  });

  it('pushes on quote SENT but not on customer approve/decline', async () => {
    await service.handleCustomerEvent({
      kind: 'quote', customerId: 'cust-1', companyId: 'co-1',
      event: { documentId: 'q-1', change: 'SENT' },
    });
    expect(crm.getCustomerPushRecipient).toHaveBeenCalled();

    jest.clearAllMocks();

    await service.handleCustomerEvent({
      kind: 'quote', customerId: 'cust-1', companyId: 'co-1',
      event: { documentId: 'q-1', change: 'APPROVED' },
    });
    expect(crm.getCustomerPushRecipient).not.toHaveBeenCalled();
  });

  it('carries a deep-link data payload for invoices', async () => {
    await service.handleCustomerEvent({
      kind: 'invoice', customerId: 'cust-1', companyId: 'co-1',
      event: { documentId: 'inv-7', change: 'OVERDUE' },
    });

    expect(notifications.sendPush).toHaveBeenCalledWith(expect.objectContaining({
      data: { type: 'invoice', invoiceId: 'inv-7' },
    }));
  });

  it('registers itself as a listener on init', () => {
    service.onModuleInit();
    expect(subscriber.onCustomerEvent).toHaveBeenCalledTimes(1);
  });
});

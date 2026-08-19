import { FinanceEventsPublisher } from './finance-events.publisher';

const publishMock = jest.fn().mockResolvedValue(1);

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    publish: publishMock,
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

const config = { get: jest.fn().mockReturnValue(undefined) } as never;

describe('FinanceEventsPublisher', () => {
  let publisher: FinanceEventsPublisher;

  beforeEach(() => {
    jest.clearAllMocks();
    publishMock.mockResolvedValue(1);
    publisher = new FinanceEventsPublisher(config);
  });

  it('publishes quote events to the finance channel for that company', () => {
    publisher.publish('co-1', {
      type: 'QUOTE_CHANGED', documentId: 'q-1', customerId: 'cust-1', change: 'SENT',
    });

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [channel, raw] = publishMock.mock.calls[0];
    expect(channel).toBe('finance:co-1');
    const msg = JSON.parse(raw);
    expect(msg.companyId).toBe('co-1');
    expect(msg.payload).toEqual(
      expect.objectContaining({ type: 'QUOTE_CHANGED', documentId: 'q-1', customerId: 'cust-1', change: 'SENT' }),
    );
  });

  it('never throws when redis publish rejects', () => {
    publishMock.mockRejectedValueOnce(new Error('redis down'));
    expect(() =>
      publisher.publish('co-1', {
        type: 'INVOICE_CHANGED', documentId: 'inv-1', customerId: 'cust-1', change: 'PAID',
      }),
    ).not.toThrow();
  });
});

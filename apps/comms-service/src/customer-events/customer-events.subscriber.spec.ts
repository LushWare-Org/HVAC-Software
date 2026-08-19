import { CustomerEventsSubscriber } from './customer-events.subscriber';

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    psubscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

const config = { get: jest.fn().mockReturnValue(undefined) } as never;

describe('CustomerEventsSubscriber', () => {
  let subscriber: CustomerEventsSubscriber;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    // `server` is the '/chat' Namespace — it exposes .to(), not .of(). Mocking
    // a Server here (with .of()) would let a broken implementation pass.
    const gateway = { server: { to } } as never;
    subscriber = new CustomerEventsSubscriber(config, gateway);
  });

  it("emits a job event only to that customer's room", () => {
    subscriber.handleMessage(
      'assignment:co-1',
      JSON.stringify({
        type: 'JOB_CHANGED',
        companyId: 'co-1',
        payload: { jobId: 'job-1', customerId: 'cust-1', change: 'STATUS', status: 'EN_ROUTE' },
      }),
    );

    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith('customer:cust-1');
    expect(emit).toHaveBeenCalledWith('job_changed', expect.objectContaining({
      jobId: 'job-1', change: 'STATUS', status: 'EN_ROUTE',
    }));
  });

  it('drops an event with no customerId rather than broadcasting it', () => {
    subscriber.handleMessage(
      'assignment:co-1',
      JSON.stringify({ type: 'JOB_CHANGED', companyId: 'co-1', payload: { jobId: 'job-1', change: 'STATUS' } }),
    );

    expect(to).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('never leaks fields naming other parties into the payload', () => {
    subscriber.handleMessage(
      'assignment:co-1',
      JSON.stringify({
        type: 'JOB_CHANGED',
        companyId: 'co-1',
        payload: {
          jobId: 'job-1', customerId: 'cust-1', change: 'STATUS',
          assignedToName: 'Tech Bob', customerName: 'Other Person',
        },
      }),
    );

    const sent = emit.mock.calls[0][1];
    expect(sent.assignedToName).toBeUndefined();
    expect(sent.customerName).toBeUndefined();
  });

  it('routes finance events to quote_changed / invoice_changed', () => {
    subscriber.handleMessage(
      'finance:co-1',
      JSON.stringify({
        type: 'INVOICE_CHANGED',
        companyId: 'co-1',
        payload: { type: 'INVOICE_CHANGED', documentId: 'inv-1', customerId: 'cust-2', change: 'PAID' },
      }),
    );

    expect(to).toHaveBeenCalledWith('customer:cust-2');
    expect(emit).toHaveBeenCalledWith('invoice_changed', expect.objectContaining({ documentId: 'inv-1' }));

    jest.clearAllMocks();
    to.mockReturnValue({ emit });

    subscriber.handleMessage(
      'finance:co-1',
      JSON.stringify({
        type: 'QUOTE_CHANGED',
        companyId: 'co-1',
        payload: { type: 'QUOTE_CHANGED', documentId: 'q-1', customerId: 'cust-2', change: 'SENT' },
      }),
    );

    expect(emit).toHaveBeenCalledWith('quote_changed', expect.objectContaining({ documentId: 'q-1' }));
  });

  it('swallows malformed JSON without throwing', () => {
    expect(() => subscriber.handleMessage('assignment:co-1', 'not json')).not.toThrow();
    expect(emit).not.toHaveBeenCalled();
  });

  it('forwards parsed events to registered listeners', () => {
    const seen: unknown[] = [];
    subscriber.onCustomerEvent((evt) => seen.push(evt));

    subscriber.handleMessage(
      'assignment:co-1',
      JSON.stringify({
        type: 'JOB_CHANGED',
        companyId: 'co-1',
        payload: { jobId: 'job-1', customerId: 'cust-1', change: 'STATUS', status: 'COMPLETED' },
      }),
    );

    expect(seen).toEqual([
      expect.objectContaining({ kind: 'job', customerId: 'cust-1', companyId: 'co-1' }),
    ]);
  });

  it('keeps dispatching when one listener throws', () => {
    const seen: unknown[] = [];
    subscriber.onCustomerEvent(() => { throw new Error('listener boom'); });
    subscriber.onCustomerEvent((evt) => seen.push(evt));

    expect(() =>
      subscriber.handleMessage(
        'assignment:co-1',
        JSON.stringify({
          type: 'JOB_CHANGED',
          companyId: 'co-1',
          payload: { jobId: 'job-1', customerId: 'cust-1', change: 'STATUS', status: 'ON_SITE' },
        }),
      ),
    ).not.toThrow();

    expect(seen).toHaveLength(1);
  });
});

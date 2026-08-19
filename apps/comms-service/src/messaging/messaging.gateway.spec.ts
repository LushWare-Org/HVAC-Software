import { MessagingGateway } from './messaging.gateway';

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sock-1',
    join: jest.fn(),
    disconnect: jest.fn(),
    handshake: { auth: {}, query: {}, headers: {} },
    ...overrides,
  } as any;
}

describe('MessagingGateway — customer rooms', () => {
  let gateway: MessagingGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new MessagingGateway({} as never);
  });

  it('joins a customer to their private room and never to the company room', async () => {
    const client = makeClient({
      handshake: {
        auth: {}, headers: {},
        query: { companyId: 'co-1', userId: 'u-1', userRole: 'customer', customerId: 'cust-1' },
      },
    });

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('customer:cust-1');
    expect(client.join).not.toHaveBeenCalledWith('company:co-1');
  });

  it('still joins staff to the company room and to no customer room', async () => {
    const client = makeClient({
      handshake: {
        auth: {}, headers: {},
        query: { companyId: 'co-1', userId: 'u-2', userRole: 'dispatcher' },
      },
    });

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('company:co-1');
    expect(client.join).not.toHaveBeenCalledWith(expect.stringContaining('customer:'));
  });
});

describe('MessagingGateway — customer message fan-out', () => {
  it('emits message_new to the customer room, distinct from the thread event', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const gateway = new MessagingGateway({} as never);
    (gateway as any).server = { to };

    gateway.notifyCustomerOfMessage('cust-1', { threadId: 'th-1', messageId: 'm-1' });

    expect(to).toHaveBeenCalledWith('customer:cust-1');
    expect(emit).toHaveBeenCalledWith('message_new', { threadId: 'th-1', messageId: 'm-1' });
  });

  it('does nothing when there is no customer to notify', () => {
    const to = jest.fn();
    const gateway = new MessagingGateway({} as never);
    (gateway as any).server = { to };

    gateway.notifyCustomerOfMessage('', { threadId: 'th-1', messageId: 'm-1' });

    expect(to).not.toHaveBeenCalled();
  });
});

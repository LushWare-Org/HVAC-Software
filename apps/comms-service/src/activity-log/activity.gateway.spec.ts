import { ActivityGateway } from './activity.gateway';

function makeSocket(overrides: Partial<any> = {}) {
  return {
    handshake: { auth: {}, query: {}, headers: {} },
    join: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  };
}

describe('ActivityGateway', () => {
  it('rejects a connection with no auth at all', async () => {
    const gateway = new ActivityGateway();
    const client = makeSocket();
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects a dev-bypass connection whose role is not super_admin', async () => {
    const gateway = new ActivityGateway();
    const client = makeSocket({
      handshake: { auth: {}, query: { companyId: 'co-1', userId: 'u1', userRole: 'company_admin' }, headers: {} },
    });
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('accepts a dev-bypass connection whose role is super_admin and joins company:all', async () => {
    const gateway = new ActivityGateway();
    const client = makeSocket({
      handshake: { auth: {}, query: { companyId: 'co-1', userId: 'u1', userRole: 'super_admin' }, headers: {} },
    });
    await gateway.handleConnection(client as any);
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith('company:all');
  });

  it('broadcastActivity emits to both the company room and company:all', () => {
    const gateway = new ActivityGateway();
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    (gateway as any).server = { to };

    gateway.broadcastActivity({ companyId: 'co-1', action: 'job.created' } as any);

    expect(to).toHaveBeenCalledWith('company:co-1');
    expect(to).toHaveBeenCalledWith('company:all');
    expect(emit).toHaveBeenCalledWith('activity:new', expect.objectContaining({ action: 'job.created' }));
  });
});

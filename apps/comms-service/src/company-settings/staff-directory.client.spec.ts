import { StaffDirectoryClient } from './staff-directory.client';

describe('StaffDirectoryClient', () => {
  let client: StaffDirectoryClient;

  const body = {
    data: [
      { id: 'u1', name: 'Dee', email: 'dee@co.com', role: 'dispatcher' },
      { id: 'u2', name: 'Ola', email: 'ola@co.com', role: 'office_manager' },
      { id: 'u3', name: 'Tex', email: 'tex@co.com', role: 'technician' },
      { id: 'u4', name: 'Cass', email: 'cass@co.com', role: 'customer' },
    ],
  };

  beforeEach(() => {
    process.env.BYPASS_AUTH = 'true';
    client = new StaffDirectoryClient();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => body }) as any;
  });

  it('returns only scheduling-facing staff — never technicians or customers', async () => {
    const staff = await client.getSchedulingStaff('co-1');
    expect(staff.map((s) => s.id).sort()).toEqual(['u1', 'u2']);
  });

  it('caches within the TTL so a burst of events makes one call', async () => {
    await client.getSchedulingStaff('co-1');
    await client.getSchedulingStaff('co-1');
    expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it('caches per company, not globally', async () => {
    await client.getSchedulingStaff('co-1');
    await client.getSchedulingStaff('co-2');
    expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(2);
  });

  it('tolerates a bare array response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => body.data }) as any;
    const staff = await client.getSchedulingStaff('co-3');
    expect(staff.map((s) => s.id).sort()).toEqual(['u1', 'u2']);
  });

  it('fails open with an empty list when crm-service is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom')) as any;
    await expect(client.getSchedulingStaff('co-4')).resolves.toEqual([]);
  });

  it('fails open on a non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as any;
    await expect(client.getSchedulingStaff('co-5')).resolves.toEqual([]);
  });
});

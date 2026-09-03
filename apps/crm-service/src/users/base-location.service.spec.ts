import { BaseLocationService } from './base-location.service';

describe('BaseLocationService', () => {
  const prisma = { companyUser: { findMany: jest.fn() } } as any;
  let svc: BaseLocationService;

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
    svc = new BaseLocationService(prisma);
  });

  it('returns false without throwing when scheduling is unreachable', async () => {
    // Base location improves candidate ranking; it never gates an assignment. A
    // user update must not fail because scheduling happens to be restarting.
    (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(svc.push('co-1', 'u-1', 6.9, 79.8)).resolves.toBe(false);
  });

  it('skips the call entirely when either coordinate is missing', async () => {
    expect(await svc.push('co-1', 'u-1', null as any, 79.8)).toBe(false);
    expect(await svc.push('co-1', 'u-1', 6.9, undefined as any)).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends lat and lng in the body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await svc.push('co-1', 'u-1', 6.9271, 79.8612);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/technicians/by-user/u-1/base-location');
    expect(JSON.parse(init.body)).toEqual({ lat: 6.9271, lng: 79.8612 });
  });

  it('reports counts from a reconcile run', async () => {
    prisma.companyUser.findMany.mockResolvedValue([
      { id: 'u-1', companyId: 'co-1', latitude: 6.9, longitude: 79.8 },
      { id: 'u-2', companyId: 'co-1', latitude: 7.0, longitude: 80.0 },
    ]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await expect(svc.reconcileAll()).resolves.toEqual({ synced: 2, failed: 0 });
  });

  it('counts failures separately so drift is visible', async () => {
    prisma.companyUser.findMany.mockResolvedValue([
      { id: 'u-1', companyId: 'co-1', latitude: 6.9, longitude: 79.8 },
      { id: 'u-2', companyId: 'co-1', latitude: 7.0, longitude: 80.0 },
    ]);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });
    await expect(svc.reconcileAll()).resolves.toEqual({ synced: 1, failed: 1 });
  });
});

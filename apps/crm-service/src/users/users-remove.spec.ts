import { UsersService } from './users.service';

describe('UsersService.remove', () => {
  const prisma = { companyUser: { findFirst: jest.fn(), delete: jest.fn() } } as any;
  const baseLocation = { deactivate: jest.fn() } as any;
  let svc: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    svc = new UsersService(prisma, {} as any, baseLocation);
    jest.spyOn(svc, 'findOne').mockImplementation(async (_c: string, id: string) => ({ id, role: 'technician' }) as any);
    prisma.companyUser.delete.mockResolvedValue({ id: 'u-1' });
  });

  it('a deleted technician is also taken out of scheduling', async () => {
    await svc.remove('co-1', 'u-1');
    expect(baseLocation.deactivate).toHaveBeenCalledWith('co-1', 'u-1');
  });

  it('other roles are not touched in scheduling', async () => {
    jest.spyOn(svc, 'findOne').mockResolvedValue({ id: 'u-2', role: 'dispatcher' } as any);
    await svc.remove('co-1', 'u-2');
    expect(baseLocation.deactivate).not.toHaveBeenCalled();
  });
});

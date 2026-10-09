import { CustomersService } from './customers.service';

describe('deleting a customer', () => {
  it('keeps the record (inactive), closes its portal login, and lets go of that login', async () => {
    const prisma: any = {
      customer: {
        findFirst: jest.fn().mockResolvedValue({ id: 'c-1', companyId: 'co', auth0UserId: 'login-1', email: 'p@x.com' }),
        update: jest.fn(async ({ data }: any) => ({ id: 'c-1', ...data })),
      },
      companyUser: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const svc = new CustomersService(prisma, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    jest.spyOn(svc, 'findOne').mockResolvedValue({ id: 'c-1', auth0UserId: 'login-1', email: 'p@x.com' } as any);
    await svc.remove('co', 'c-1');
    expect(prisma.companyUser.updateMany).toHaveBeenCalledWith({ where: { id: 'login-1', companyId: 'co' }, data: { isActive: false } });
    expect(prisma.customer.update).toHaveBeenCalledWith({ where: { id: 'c-1' }, data: { isActive: false, auth0UserId: null } });
  });

  it('a deleted customer is never served to an old login', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const svc = new CustomersService({ customer: { findFirst } } as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    await expect(svc.findMe('co', 'login-1', 'c-1')).rejects.toThrow('Customer profile not found');
    expect(findFirst.mock.calls[0][0].where).toEqual({ companyId: 'co', id: 'c-1', isActive: true });
  });
});

describe('revenue on the customer list', () => {
  const make = (rows: any[] | Error) => {
    const prisma: any = {
      companyUser: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRawUnsafe: jest.fn(async () => { if (rows instanceof Error) throw rows; return rows; }),
    };
    return { prisma, svc: new CustomersService(prisma, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any) };
  };
  const list = [{ id: 'c1', companyId: 'co', auth0UserId: null }, { id: 'c2', companyId: 'co', auth0UserId: null }];

  it("shows what each customer has paid and still owes; customers with no invoices show zero", async () => {
    const { svc, prisma } = make([{ customerId: 'c1', paid: 450500, due: 41000, n: 3 }]);
    const out = await (svc as any).attachPortalStatus(list);
    expect(out[0]).toMatchObject({ totalRevenue: 450500, outstanding: 41000, invoiceCount: 3 });
    expect(out[1]).toMatchObject({ totalRevenue: 0, outstanding: 0, invoiceCount: 0 });
    // one query for the whole page, scoped to the company
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    expect(prisma.$queryRawUnsafe.mock.calls[0].slice(1)).toEqual(['co', ['c1', 'c2']]);
  });

  it('still lists customers when the finance data cannot be read', async () => {
    const { svc } = make(new Error('finance down'));
    const out = await (svc as any).attachPortalStatus(list);
    expect(out.map((c: any) => c.totalRevenue)).toEqual([0, 0]);
  });
});

describe('listing active and inactive customers', () => {
  it('"all" lifts the active-only default; otherwise only active unless told', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma: any = { customer: { findMany, count: jest.fn().mockResolvedValue(0) }, companyUser: { findMany: jest.fn() }, $queryRawUnsafe: jest.fn().mockResolvedValue([]) };
    const svc = new CustomersService(prisma, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    await svc.findAll('co', 1, 10, undefined, undefined, 'all');
    expect(findMany.mock.calls[0][0].where.isActive).toBeUndefined();
    await svc.findAll('co', 1, 10);
    expect(findMany.mock.calls[1][0].where.isActive).toBe(true);
    await svc.findAll('co', 1, 10, undefined, undefined, false);
    expect(findMany.mock.calls[2][0].where.isActive).toBe(false);
  });
});

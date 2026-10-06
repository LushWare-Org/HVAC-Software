import { CustomersService, searchWords } from './customers.service';

describe('customer search', () => {
  it('splits a search into words, capped at six', () => {
    expect(searchWords('  R&R   Brothers (pvt) LTD ')).toEqual(['R&R', 'Brothers', '(pvt)', 'LTD']);
    expect(searchWords('a b c d e f g h')).toHaveLength(6);
  });

  it('finds a full name split across first and last name: every word must match some field', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma: any = { customer: { findMany, count: jest.fn().mockResolvedValue(0) } };
    const svc = new CustomersService(prisma, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    await svc.findAll('co-1', 1, 8, 'R&R Brothers');
    const where = findMany.mock.calls[0][0].where;
    expect(where.companyId).toBe('co-1');
    expect(where.OR).toBeUndefined();
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0].OR).toEqual(expect.arrayContaining([{ firstName: { contains: 'R&R', mode: 'insensitive' } }]));
    expect(where.AND[1].OR).toEqual(expect.arrayContaining([{ lastName: { contains: 'Brothers', mode: 'insensitive' } }]));
  });
});

import { usualTechnician, USUAL_TECHNICIAN_TOOL } from './tools/usual-tech';

const http = (jobs: any[]) => ({ get: jest.fn(async () => ({ data: jobs })) }) as any;
const done = (assignedToId: string | null, assignedToName: string, status = 'COMPLETED') => ({ status, assignedToId, assignedToName });

describe('usualTechnician', () => {
  it('is whoever finished most of the customer\'s jobs, at least twice', async () => {
    const h = http([done('u-k', 'Kasun'), done('u-n', 'Nuwan'), done('u-k', 'Kasun', 'PAID'), done('u-n', 'Nuwan', 'CANCELLED'), done('u-n', 'Nuwan', 'SCHEDULED')]);
    expect(await usualTechnician(h, 'c-1')).toEqual({ userId: 'u-k', name: 'Kasun', jobs: 2 });
    expect(h.get).toHaveBeenCalledWith('jobs', '/jobs', { customerId: 'c-1', limit: 30 });
  });

  it('is nobody with too little history, or when the lookup fails', async () => {
    expect(await usualTechnician(http([done('u-k', 'Kasun')]), 'c-1')).toBeNull();
    expect(await usualTechnician({ get: async () => { throw new Error('down'); } } as any, 'c-1')).toBeNull();
    expect(await usualTechnician(http([]), undefined)).toBeNull();
  });

  it('is a lookup for every office role', async () => {
    expect(USUAL_TECHNICIAN_TOOL.roles).toContain('dispatcher');
    expect(await USUAL_TECHNICIAN_TOOL.run({ customerId: 'c-1' }, {} as any, http([done('u-k', 'Kasun'), done('u-k', 'Kasun')]))).toMatchObject({ usualTechnician: 'Kasun', finishedJobs: 2 });
  });
});

import { withJobProject } from './job-project';

const prisma = (rows: unknown[]) => ({ $queryRawUnsafe: jest.fn().mockResolvedValue(rows) });

describe('withJobProject', () => {
  it("a document for a project job takes the job's project and component", async () => {
    const p = prisma([{ projectId: 'p-mall', componentId: 'c-7' }]);
    const dto = await withJobProject(p as any, 'co', { jobId: 'j-1' });
    expect(dto).toEqual({ jobId: 'j-1', projectId: 'p-mall', componentId: 'c-7' });
    // Scoped to the company: another company's job is never read.
    expect(p.$queryRawUnsafe.mock.calls[0].slice(1)).toEqual(['j-1', 'co']);
  });

  it('keeps a project the caller chose, and leaves non-project jobs alone', async () => {
    const chosen = prisma([{ projectId: 'p-other', componentId: null }]);
    expect(await withJobProject(chosen as any, 'co', { jobId: 'j-1', projectId: 'p-mall' })).toEqual({ jobId: 'j-1', projectId: 'p-mall' });
    expect(chosen.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(await withJobProject(prisma([{ projectId: null, componentId: null }]) as any, 'co', { jobId: 'j-2' })).toEqual({ jobId: 'j-2' });
    expect(await withJobProject(prisma([]) as any, 'co', { customerId: 'c' } as { customerId: string; jobId?: string })).toEqual({ customerId: 'c' });
  });

  it('a failed lookup never blocks creating the document', async () => {
    const broken = { $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('db')) };
    expect(await withJobProject(broken as any, 'co', { jobId: 'j-1' })).toEqual({ jobId: 'j-1' });
  });
});

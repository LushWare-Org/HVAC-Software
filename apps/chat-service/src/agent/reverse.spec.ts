import { WRITE_TOOLS } from './tools/write-tools';
import type { AgentContext } from './types';

const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'e', timezone: 'UTC', token: 'jwt' };
const tool = (n: string) => WRITE_TOOLS.find((t) => t.name === n)!;
const job = { id: 'j-1', jobNumber: 'JOB-1', title: 'AC', status: 'SCHEDULED', scheduledStart: '2026-10-07T09:00:00.000Z', scheduledEnd: '2026-10-07T10:30:00.000Z', crewUserIds: [] };

describe('reversible actions', () => {
  it('reschedule remembers the old time and can move the job back', async () => {
    const http: any = { get: async () => job };
    const p = await tool('reschedule_job').preview!({ jobId: 'j-1', start: '2026-10-08T09:00:00.000Z' }, ctx, http);
    const back = tool('reschedule_job').reverse!(p.args as any, { done: true }, ctx);
    expect(back).toEqual({ tool: 'reschedule_job', args: { jobId: 'j-1', start: job.scheduledStart, end: job.scheduledEnd, expectStart: '2026-10-08T09:00:00.000Z' }, title: 'Move JOB-1 back to Wed 7 Oct, 9:00 am' });
  });

  it('moving back is refused if the job moved again, or the technician is on the way', async () => {
    const undoArgs = { jobId: 'j-1', start: job.scheduledStart, end: job.scheduledEnd, expectStart: '2026-10-08T09:00:00.000Z' };
    const movedAgain: any = { get: async () => ({ ...job, scheduledStart: '2026-10-09T09:00:00.000Z' }) };
    await expect(tool('reschedule_job').preview!(undoArgs, ctx, movedAgain)).rejects.toThrow('moved again since');
    const enRoute: any = { get: async () => ({ ...job, status: 'EN_ROUTE', scheduledStart: '2026-10-08T09:00:00.000Z' }) };
    await expect(tool('reschedule_job').preview!(undoArgs, ctx, enRoute)).rejects.toThrow('on the way');
  });

  it('a job that had no time cannot be moved back', async () => {
    const http: any = { get: async () => ({ ...job, scheduledStart: null, scheduledEnd: null }) };
    const p = await tool('reschedule_job').preview!({ jobId: 'j-1', start: '2026-10-08T09:00:00.000Z' }, ctx, http);
    expect(tool('reschedule_job').reverse!(p.args as any, {}, ctx)).toBeNull();
  });

  it('assigning cannot be undone yet', () => {
    expect(tool('assign_technician').reverse).toBeUndefined();
  });
});

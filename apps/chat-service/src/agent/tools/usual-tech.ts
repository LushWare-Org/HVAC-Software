import type { ServiceHttp } from '../service-http';
import type { AgentTool } from '../types';

const FINISHED = ['COMPLETED', 'INVOICED', 'PAID'];

/**
 * Learned from history: the technician who finished most of this customer's
 * recent jobs (at least two). null when there is no clear one, or it can't be read.
 */
export async function usualTechnician(http: Pick<ServiceHttp, 'get'>, customerId: unknown): Promise<{ userId: string; name: string; jobs: number } | null> {
  if (!customerId || typeof customerId !== 'string') return null;
  try {
    const res = await http.get('jobs', '/jobs', { customerId, limit: 30 });
    const jobs: any[] = Array.isArray(res) ? res : res?.data ?? [];
    const count = new Map<string, { name: string; jobs: number }>();
    for (const j of jobs) {
      if (!FINISHED.includes(j.status) || !j.assignedToId) continue;
      const c = count.get(j.assignedToId) ?? { name: j.assignedToName ?? 'their technician', jobs: 0 };
      c.jobs++;
      count.set(j.assignedToId, c);
    }
    const [best] = [...count].sort((a, b) => b[1].jobs - a[1].jobs);
    return best && best[1].jobs >= 2 ? { userId: best[0], ...best[1] } : null;
  } catch {
    return null;
  }
}

export const USUAL_TECHNICIAN_TOOL: AgentTool = {
  name: 'usual_technician',
  description: "Who usually looks after a customer, learned from who finished their recent jobs. Check it before picking a technician for them.",
  parameters: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] },
  kind: 'read',
  bots: ['admin'],
  roles: ['super_admin', 'company_admin', 'office_manager', 'dispatcher'],
  kelvinOnly: true,
  run: async (args, _ctx, http) => {
    const u = await usualTechnician(http, args.customerId);
    return u ? { usualTechnician: u.name, finishedJobs: u.jobs, note: 'Prefer them when they are free.' } : { usualTechnician: null, note: 'No clear usual technician yet.' };
  },
};

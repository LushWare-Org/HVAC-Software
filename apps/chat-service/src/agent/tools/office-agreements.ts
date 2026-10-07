import type { AgentTool } from '../types';
import { list } from './office-quotes';

const OFFICE = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const OPEN = new Set(['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE']);

export const AGREEMENT_TOOLS: AgentTool[] = [
  {
    name: 'find_agreements_due',
    description:
      'Service agreements with a visit due within N days (default 30). The system creates a waiting visit for due agreements on its own: ' +
      'when waitingVisit is present, schedule THAT job (assign_technician or reschedule_job) instead of creating a new one; ' +
      'otherwise book one with create_job and the agreementId.',
    parameters: { type: 'object', properties: { days: { type: 'number' } } },
    kind: 'read',
    bots: ['admin'],
    roles: OFFICE,
    kelvinOnly: true,
    run: async (args, _ctx, http) => {
      const now = args.now && !Number.isNaN(Date.parse(args.now)) ? new Date(args.now) : new Date();
      const until = now.getTime() + Math.min(Math.max(Number(args.days) || 30, 1), 365) * 86_400_000;
      const due = list(await http.get('crm', '/agreements', { status: 'ACTIVE', limit: 100 }))
        .filter((a) => a.status === 'ACTIVE' && a.nextServiceDate && Date.parse(a.nextServiceDate) <= until)
        .sort((a, b) => Date.parse(a.nextServiceDate) - Date.parse(b.nextServiceDate))
        .slice(0, 20);
      return Promise.all(due.map(async (a) => {
        const jobs = list(await http.get('jobs', '/jobs', { agreementId: a.id, limit: 20 }).catch(() => []));
        const waiting = jobs.find((j) => OPEN.has(j.status));
        return {
          agreementId: a.id, agreement: a.name, ...(a.serviceType && { service: a.serviceType }),
          customerId: a.customerId,
          customer: a.customer ? `${a.customer.firstName ?? ''} ${a.customer.lastName ?? ''}`.trim() : a.customerName ?? a.customerId,
          due: String(a.nextServiceDate).slice(0, 10),
          ...(waiting && { waitingVisit: { jobId: waiting.id, jobNumber: waiting.jobNumber, status: waiting.status, scheduled: !!waiting.scheduledStart } }),
        };
      }));
    },
  },
];

/**
 * Kelvin sends reminders about booked visits, to the customer, the technician or both, by
 * every way the office asks for: an in-app message (which also reaches a linked Telegram and
 * their phone), an email in the company's layout, and a push. job-service sends them, the
 * same way it does the automatic ones the evening before and a few hours ahead.
 */
import { CHANNELS_PARAM, channelsOf, type Channel } from './reach';
import { ToolRefusal, type AgentContext, type AgentTool } from '../types';
import type { ServiceHttp } from '../service-http';

const OFFICE = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const MAX_VISITS = 30;
const DAY_MS = 86_400_000;

const list = (res: any): any[] => (Array.isArray(res) ? res : res?.data ?? []);
const same = (a?: string | null, b?: string | null) => !!a && !!b && new Date(a).getTime() === new Date(b).getTime();
export const isConfirmedJob = (j: any) => same(j?.scheduledStart, j?.confirmedFor);

function clock(iso: string, tz: string) {
  return new Date(iso).toLocaleString('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** Which visits: the ones named, or the booked ones in a time range (optionally only unconfirmed). */
async function pickVisits(args: Record<string, any>, ctx: AgentContext, http: ServiceHttp, now = new Date()): Promise<any[]> {
  const ids: string[] = Array.isArray(args.jobIds) ? args.jobIds.map(String).slice(0, MAX_VISITS) : [];
  let jobs: any[];
  if (ids.length) {
    jobs = (await Promise.all(ids.map((id) => http.get('jobs', `/jobs/${id}`).catch(() => null)))).filter((j) => j?.id);
  } else {
    const span = args.when === 'today' ? 0 : args.when === 'tomorrow' ? 1 : null;
    const from = now;
    const to = new Date(now.getTime() + (span === null ? DAY_MS : span === 0 ? DAY_MS : 2 * DAY_MS));
    jobs = list(await http.get('jobs', '/jobs', { status: 'SCHEDULED', dateFrom: from.toISOString(), dateTo: to.toISOString(), limit: 100 }));
    if (args.when === 'tomorrow') {
      const tz = ctx.timezone || 'UTC';
      const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: tz });
      const tomorrow = day(new Date(now.getTime() + DAY_MS));
      jobs = jobs.filter((j) => j.scheduledStart && day(new Date(j.scheduledStart)) === tomorrow);
    }
  }
  return jobs
    .filter((j) => j.scheduledStart && new Date(j.scheduledStart).getTime() > now.getTime() && ['SCHEDULED', 'PENDING', 'ON_HOLD'].includes(j.status))
    .filter((j) => !args.onlyUnconfirmed || !isConfirmedJob(j))
    .sort((a, b) => Date.parse(a.scheduledStart) - Date.parse(b.scheduledStart))
    .slice(0, MAX_VISITS);
}

const audienceOf = (v: unknown): 'customer' | 'technician' | 'both' =>
  v === 'customer' || v === 'technician' ? v : 'both';

const WORD: Record<Channel, string> = { message: 'in-app message and Telegram', email: 'email', push: 'push' };

export const VISIT_REMINDER_TOOLS: AgentTool[] = [
  {
    name: 'remind_visits',
    description:
      'Send a reminder about booked visits to the customer, the technician, or both, by in-app message (which also reaches Telegram if linked, and their phone), email and push. ' +
      'Pick the visits with jobIds (from find_jobs), or with `when` (today, tomorrow, next24h) and optionally onlyUnconfirmed to leave out customers who already confirmed. ' +
      'Use it when the office asks to remind people, and when visits are not confirmed. The person confirms first.',
    parameters: {
      type: 'object',
      properties: {
        jobIds: { type: 'array', items: { type: 'string' }, description: 'Job ids to remind about.' },
        when: { type: 'string', enum: ['today', 'tomorrow', 'next24h'], description: 'Remind about every booked visit in this period.' },
        onlyUnconfirmed: { type: 'boolean', description: 'Skip visits the customer has already confirmed.' },
        audience: { type: 'string', enum: ['customer', 'technician', 'both'], description: 'Who to remind. Defaults to both.' },
        channels: CHANNELS_PARAM,
      },
    },
    kind: 'write',
    bots: ['admin'],
    roles: OFFICE,
    sends: (a) => {
      const chs = channelsOf(a.channels, ['message', 'email', 'push']);
      const who = audienceOf(a.audience) === 'both' ? 'customers and technicians' : audienceOf(a.audience) === 'customer' ? 'customers' : 'technicians';
      return `Reminder to ${who}: ${chs.map((c) => WORD[c]).join(', ')}`;
    },
    preview: async (args, ctx, http) => {
      if (!Array.isArray(args.jobIds) && !args.when) throw new ToolRefusal('Which visits? Name the jobs, or say today, tomorrow or the next 24 hours.');
      const jobs = await pickVisits(args, ctx, http);
      if (!jobs.length) throw new ToolRefusal('No booked visits match, so there is nobody to remind.');
      const tz = ctx.timezone || 'UTC';
      const audience = audienceOf(args.audience);
      const withTech = jobs.filter((j) => j.assignedToId).length;
      return {
        title: `Remind about ${jobs.length} visit${jobs.length === 1 ? '' : 's'}`,
        lines: [
          ...jobs.slice(0, 8).map((j) => `${j.jobNumber ?? j.id.slice(0, 8)}: ${j.customerName ?? 'Customer'}, ${clock(j.scheduledStart, tz)}${isConfirmedJob(j) ? ' (confirmed)' : ''}`),
          ...(jobs.length > 8 ? [`and ${jobs.length - 8} more`] : []),
          `Goes to ${audience === 'both' ? 'the customer and the technician' : audience === 'customer' ? 'the customer' : 'the technician'} of each${audience !== 'customer' && withTech < jobs.length ? ` (${jobs.length - withTech} have no technician yet)` : ''}.`,
        ],
        args: { jobIds: jobs.map((j) => j.id), audience, channels: channelsOf(args.channels, ['message', 'email', 'push']) },
      };
    },
    run: async (args, _ctx, http) => {
      const ids: string[] = (args.jobIds ?? []).map(String);
      const channels = channelsOf(args.channels, ['message', 'email', 'push']);
      const audience = audienceOf(args.audience);
      const tally: Record<string, number> = {};
      let ok = 0;
      const failed: string[] = [];
      for (const id of ids) {
        try {
          const r = await http.post('jobs', `/jobs/${id}/send-reminder`, { audience, channels });
          ok += 1;
          for (const who of ['customer', 'technician'] as const) {
            for (const [ch, res] of Object.entries(r?.[who] ?? {})) {
              const k = `${who} ${ch}: ${res}`;
              tally[k] = (tally[k] ?? 0) + 1;
            }
          }
        } catch (err: any) {
          failed.push(`${id.slice(0, 8)}: ${err?.response?.data?.message ?? err?.message ?? 'failed'}`);
        }
      }
      return { reminded: ok, failed, details: tally, note: 'Reminders go by every channel that person can be reached on; "no-email" or "no-device" means they have none.' };
    },
  },
];

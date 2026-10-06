import type { AgentContext, AgentTool } from '../types';
import type { ServiceHttp } from '../service-http';

const STAFF = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];

function label(iso: string, ctx: AgentContext, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('en-GB', { ...opts, timeZone: ctx.timezone || 'UTC' });
}

/**
 * Real open times from the scheduling service's slot finder: working hours,
 * existing bookings, travel between jobs and daily limits all counted.
 * Customers see times only; staff also see who is free and how far they drive.
 */
export const FIND_OPEN_TIMES: AgentTool = {
  name: 'find_open_times',
  description:
    'Find real open times for a visit. Use before offering or promising a time. ' +
    'For a customer, times are near their address; for staff, give a jobId to search near that job and for its length.',
  parameters: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'First day to search, YYYY-MM-DD in company time. Default today.' },
      days: { type: 'number', description: 'How many days to search, 1 to 14. Default 3.' },
      durationMins: { type: 'number', description: 'Visit length in minutes. Default 90, or the job\'s own length.' },
      jobId: { type: 'string', description: 'Staff only: search near this job, for its length.' },
    },
  },
  kind: 'read',
  bots: ['admin', 'customer'],
  roles: [...STAFF, 'customer'],
  run: async (args, ctx, http: ServiceHttp) => {
    const params: Record<string, unknown> = { from: args.date, days: Math.min(Math.max(Number(args.days) || 3, 1), 14), limit: 12 };
    let duration = Number(args.durationMins) || undefined;

    if (ctx.role === 'customer') {
      const me = await http.get('crm', '/customers/me');
      if (me?.latitude && me?.longitude) { params.lat = me.latitude; params.lng = me.longitude; }
    } else if (args.jobId) {
      const job = await http.get('jobs', `/jobs/${args.jobId}`);
      if (job?.serviceLatitude && job?.serviceLongitude) { params.lat = job.serviceLatitude; params.lng = job.serviceLongitude; }
      if (!duration && job?.scheduledStart && job?.scheduledEnd) {
        duration = Math.round((new Date(job.scheduledEnd).getTime() - new Date(job.scheduledStart).getTime()) / 60_000) || undefined;
      }
      duration ??= Number(job?.estimatedDurationMins) || undefined;
    }
    if (duration) params.durationMins = duration;

    const res = await http.get('scheduling', '/dispatch/slots', params);
    const slots: any[] = res?.slots ?? [];
    if (!slots.length) {
      return { open: [], note: `Nothing open in the ${res?.days ?? params.days} days searched. Offer to look further ahead, or to ask the office.` };
    }
    return {
      durationMins: res.durationMins,
      open: slots.map((s) => ({
        start: s.start,
        when: `${label(s.start, ctx, { weekday: 'short', day: 'numeric', month: 'short' })}, ${label(s.start, ctx, { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        ...(ctx.role === 'customer' ? {} : { technician: s.technicianName, technicianId: s.technicianId, driveKm: s.travelKm }),
      })),
      note: ctx.role === 'customer'
        ? 'These are open right now; the office confirms the final time after booking.'
        : 'Open now; book one with assign_technician or reschedule_job.',
    };
  },
};

/**
 * More that a customer can ask Kelvin, each on a card they confirm: a note for
 * the technician, their contact details, asking to cancel, and a review. They
 * call the same endpoints as the portal, as the customer, so the services'
 * "only your records" checks apply.
 */
import { ToolRefusal, type AgentTool } from '../types';
import { myJob } from './customer-tools';
import { when } from './write-tools';

const CUSTOMER = ['customer'];
const DONE = ['COMPLETED', 'INVOICED', 'PAID'];
const clean = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();
const first = (name: unknown) => clean(name).split(' ')[0];
const DETAILS: Array<[field: 'phone' | 'mobile' | 'address' | 'city', label: string, max: number]> = [
  ['phone', 'Phone', 40], ['mobile', 'Mobile', 40], ['address', 'Address', 300], ['city', 'City', 120],
];

export const CUSTOMER_KELVIN_TOOLS: AgentTool[] = [
  {
    name: 'note_for_technician',
    description: 'Add a short note for the technician to one of the customer\'s upcoming visits, e.g. a gate code or "dog in the yard".',
    parameters: { type: 'object', properties: { jobId: { type: 'string', description: 'Visit id or job number.' }, note: { type: 'string' } }, required: ['jobId', 'note'] },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const note = clean(args.note);
      if (!note) throw new ToolRefusal('What should the note say?');
      if (note.length > 300) throw new ToolRefusal('Keep the note under 300 characters.');
      const job = await myJob(http, ctx, args.jobId);
      if (!['PENDING', 'SCHEDULED', 'EN_ROUTE'].includes(job.status)) throw new ToolRefusal(`${job.jobNumber} has already happened, so a note can't be added.`);
      const tech = first(job.assignedToName);
      return {
        title: `Note for ${tech || 'the technician'} on ${job.jobNumber}`,
        lines: [`"${note}"`, `${tech || 'Your technician'} sees it with the visit details.`],
        args: { jobId: job.id, jobNumber: job.jobNumber, note },
      };
    },
    run: async (args, _ctx, http) => {
      await http.post('jobs', `/jobs/${args.jobId}/customer-note`, { note: args.note });
      return { done: true, summary: `Added a note to ${args.jobNumber}` };
    },
  },
  {
    name: 'update_my_details',
    description: 'Change the customer\'s phone, mobile, address or city. Their email is their sign-in and is changed from Profile instead.',
    parameters: {
      type: 'object',
      properties: { phone: { type: 'string' }, mobile: { type: 'string' }, address: { type: 'string' }, city: { type: 'string' }, email: { type: 'string', description: 'Not changeable here; say so.' } },
    },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    kelvinOnly: true,
    preview: async (args, _ctx, http) => {
      if (args.email) throw new ToolRefusal('Your email is your sign-in, so it is changed from Profile, under Security. I can change your phone or address.');
      const me = await http.get('crm', '/customers/me');
      const changes: Record<string, string> = {};
      const lines: string[] = [];
      for (const [field, label, max] of DETAILS) {
        if (args[field] === undefined) continue;
        const next = clean(args[field]);
        if (!next) throw new ToolRefusal(`${label} can't be empty.`);
        if (next.length > max) throw new ToolRefusal(`${label} is too long.`);
        if (next === clean(me?.[field])) continue;
        changes[field] = next;
        lines.push(`${label}: ${clean(me?.[field]) || 'not set'} → ${next}`);
      }
      if (!lines.length) throw new ToolRefusal('Those details are already on file. Nothing to change.');
      return { title: 'Update your details', lines, args: { changes } };
    },
    run: async (args, _ctx, http) => {
      await http.patch('crm', '/customers/me', args.changes);
      return { done: true, summary: 'Updated your details' };
    },
  },
  {
    name: 'ask_to_cancel',
    description: 'Ask the office to cancel one of the customer\'s visits. The office confirms it; nothing is cancelled straight away.',
    parameters: { type: 'object', properties: { jobId: { type: 'string', description: 'Visit id or job number.' }, reason: { type: 'string' } }, required: ['jobId'] },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const job = await myJob(http, ctx, args.jobId);
      if (['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'].includes(job.status)) throw new ToolRefusal(`${job.jobNumber} is already ${String(job.status).toLowerCase()}.`);
      if (job.status === 'EN_ROUTE' || job.status === 'ON_SITE') {
        throw new ToolRefusal(`Your technician is ${job.status === 'EN_ROUTE' ? 'already on the way' : 'already there'}. Please call the office now.`);
      }
      const reason = clean(args.reason).slice(0, 300);
      const at = job.scheduledStart ? when(job.scheduledStart, ctx) : 'no time yet';
      return {
        title: `Ask to cancel ${job.jobNumber}`,
        lines: [`${job.title}, ${at}`, ...(reason ? [`Reason: ${reason}`] : []), 'The office confirms the cancellation with you. Nothing is cancelled yet.'],
        args: { jobId: job.id, jobNumber: job.jobNumber, message: `Please cancel my visit ${job.jobNumber} (${job.title}, ${at}).${reason ? ` Reason: ${reason}` : ''}` },
      };
    },
    run: async (args, ctx, http) => {
      await http.post('comms', '/chat/office/messages', { body: args.message, jobId: args.jobId });
      return { done: true, summary: `Asked the office to cancel ${args.jobNumber}` };
    },
  },
  {
    name: 'leave_review',
    description: 'Leave a review: for a finished visit (with its technician), or for the company. Rating 1 to 5 and an optional comment, in the customer\'s words.',
    parameters: {
      type: 'object',
      properties: { rating: { type: 'number', description: '1 to 5' }, comment: { type: 'string' }, jobId: { type: 'string', description: 'Optional: the visit being reviewed.' } },
      required: ['rating'],
    },
    kind: 'write',
    bots: ['customer'],
    roles: CUSTOMER,
    kelvinOnly: true,
    preview: async (args, ctx, http) => {
      const rating = Number(args.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ToolRefusal('Give a rating from 1 to 5.');
      const comment = clean(args.comment).slice(0, 1000);
      const job = args.jobId ? await myJob(http, ctx, args.jobId) : null;
      if (job && !DONE.includes(job.status)) throw new ToolRefusal(`${job.jobNumber} hasn't happened yet. You can review it after the visit.`);
      const stars = `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating} of 5)`;
      return {
        title: job ? `Review ${job.jobNumber}` : 'Review the company',
        lines: [stars, ...(comment ? [`"${comment}"`] : []), ...(job?.assignedToName ? [`For ${job.assignedToName}`] : [])],
        args: job
          ? { type: 'JOB', rating, ...(comment && { comment }), jobId: job.id, ...(job.assignedToId && { technicianId: job.assignedToId }), ...(job.assignedToName && { technicianName: job.assignedToName }), source: 'assistant' }
          : { type: 'COMPANY', rating, ...(comment && { comment }), source: 'assistant' },
      };
    },
    run: async (args, _ctx, http) => {
      await http.post('crm', '/reviews', args);
      return { done: true, summary: 'Thanks for your review' };
    },
  },
];

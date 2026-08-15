import type { ActionTemplateMap } from './types';

/**
 * Narrates the outcome of a job status change so the super-admin feed reads
 * like the real-world scenario, not a state code — "Kasun Silva is on the
 * way to Saman Perera's job" rather than "status = EN_ROUTE". Falls back to
 * "Changed job status to X" when the response doesn't carry customer/tech
 * names (e.g. the job was fetched with a narrow select).
 */
function statusChangeDescription(status: string, title?: string, customerName?: string, assignedToName?: string): string {
  const job = title ? `job "${title}"` : 'a job';
  const whose = customerName ? `${customerName}’s ${job}` : job;
  const tech = assignedToName ?? 'The technician';

  if (!customerName && !title) {
    return `Changed job status to ${status}`;
  }

  switch (status) {
    case 'SCHEDULED':
      return `${capitalize(whose)} was scheduled${assignedToName ? ` — assigned to ${assignedToName}` : ''}`;
    case 'EN_ROUTE':
      return `${tech} is on the way to ${whose}`;
    case 'ON_SITE':
      return `${tech} arrived on site for ${whose}`;
    case 'COMPLETED':
      return `Completed ${whose}`;
    case 'INVOICED':
      return `Invoiced ${customerName ?? 'the customer'} for ${job}`;
    case 'PAID':
      return `Payment received for ${whose}`;
    case 'CANCELLED':
      return `Cancelled ${whose}`;
    case 'ON_HOLD':
      return `Put ${whose} on hold`;
    case 'PENDING':
      return `Moved ${whose} back to the dispatch queue`;
    default:
      return `Changed job status to ${status}`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const jobsTemplates: ActionTemplateMap = {
  'POST /jobs': (_req, res) => {
    const title = res?.title ?? 'Untitled';
    const parts = [`Created job "${title}"`];
    if (res?.customerName) parts.push(`for ${res.customerName}`);
    if (res?.assignedToName) parts.push(`— assigned to ${res.assignedToName}`);
    return { action: 'job.created', description: parts.join(' ') };
  },
  'PATCH /jobs/:id/status': (req, res) => ({
    action: 'job.status_changed',
    description: statusChangeDescription(req?.status, res?.title, res?.customerName, res?.assignedToName),
  }),
  'DELETE /jobs/:id': (_req, res) => ({
    action: 'job.deleted',
    description: res?.title ? `Deleted job "${res.title}"` : 'Deleted a job',
  }),
};

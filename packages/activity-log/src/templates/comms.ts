import type { ActionTemplateMap } from './types';

export const commsTemplates: ActionTemplateMap = {
  'POST /messaging/threads/:id/messages': (req) => ({
    action: 'message.sent',
    description: req?.channel === 'SMS' ? 'Sent an SMS to the customer' : 'Sent an email to the customer',
  }),
  'POST /notifications/en-route': (req, res) => {
    const customer = req?.customerName ?? 'the customer';
    const tech = req?.techName ?? 'the technician';
    const job = req?.jobTitle ? `"${req.jobTitle}"` : 'the job';
    if (res?.deduped) {
      return {
        action: 'technician.en_route_notified',
        description: `Already notified ${customer} that ${tech} is on the way to ${job} — skipped a duplicate alert`,
      };
    }
    const channels: string[] = [];
    if (res?.email) channels.push('email (with photo)');
    if (res?.sms) channels.push('SMS');
    const sentPart = channels.length ? `${channels.join(' and ')} sent` : 'no channel could be reached';
    return {
      action: 'technician.en_route_notified',
      description: `Notified ${customer} that ${tech} is on the way to ${job} — ${sentPart}`,
    };
  },
  'POST /notifications/job-assigned': (req) => ({
    action: 'technician.assignment_notified',
    description: req?.techName
      ? `Notified ${req.techName} they were assigned${req?.jobTitle ? ` to "${req.jobTitle}"` : ' a job'}`
      : 'Notified a technician of a new job assignment',
  }),
};

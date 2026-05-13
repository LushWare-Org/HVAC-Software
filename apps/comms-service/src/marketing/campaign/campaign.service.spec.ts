import { CampaignService } from './campaign.service';

const SMS_TEMPLATE = {
  id: 'tmpl-1', channel: 'SMS', smsBody: 'Hi {{customer.firstName}}, book now: {{trackedLink}}', subject: null, htmlBody: null,
};

const EMAIL_TEMPLATE = {
  id: 'tmpl-2', channel: 'EMAIL', htmlBody: '<p>Hi {{customer.firstName}}</p>', subject: 'Hello {{customer.firstName}}', smsBody: null,
};

const MEMBERS = [
  { id: 'c-1', companyId: 'co-1', firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', phone: '+15550001111', mobile: null, zipCode: '30301', state: 'GA' },
  { id: 'c-2', companyId: 'co-1', firstName: 'Bob', lastName: 'Jones', email: null, phone: null, mobile: null, zipCode: null, state: null },
];

function makeService(template = SMS_TEMPLATE, members = MEMBERS) {
  const db = {
    campaign: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'camp-1', companyId: 'co-1', status: 'DRAFT', channel: 'SMS', templateId: 'tmpl-1', audienceId: 'aud-1',
      }),
      create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'camp-1', ...args.data })),
      update: jest.fn().mockResolvedValue({}),
    },
    sendJob: {
      create: jest.fn().mockImplementation((_args: any) => Promise.resolve({ id: 'sj-' + Math.random() })),
    },
  };
  const audiences = { resolveMembers: jest.fn().mockResolvedValue(members) };
  const templates = { get: jest.fn().mockResolvedValue(template) };
  const queue = { add: jest.fn().mockResolvedValue({}) };

  const svc = new CampaignService(db as any, audiences as any, templates as any, queue as any);
  return { svc, db, audiences, templates, queue };
}

describe('CampaignService', () => {
  it('creates a campaign with DRAFT status when no scheduleAt', async () => {
    const { svc, db } = makeService();
    await svc.create('co-1', 'user-1', { name: 'May Promo', channel: 'SMS', templateId: 'tmpl-1', audienceId: 'aud-1' });
    const createCall = (db.campaign.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.status).toBe('DRAFT');
  });

  it('creates a campaign with SCHEDULED status when scheduleAt is provided', async () => {
    const { svc, db } = makeService();
    await svc.create('co-1', 'user-1', {
      name: 'Scheduled', channel: 'SMS', templateId: 'tmpl-1', audienceId: 'aud-1',
      scheduleAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    const createCall = (db.campaign.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.status).toBe('SCHEDULED');
  });

  it('launch queues sends only for members with a valid address', async () => {
    const { svc, queue } = makeService(SMS_TEMPLATE, MEMBERS);
    const result = await svc.launch('co-1', 'camp-1');
    // MEMBERS[0] has phone, MEMBERS[1] has no phone/mobile → skipped
    expect(result.queued).toBe(1);
    expect(result.skipped).toBe(1);
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it('renders merge tags in SMS body', async () => {
    const { svc, queue } = makeService(SMS_TEMPLATE, [MEMBERS[0]]);
    await svc.launch('co-1', 'camp-1');
    const payload = (queue.add as jest.Mock).mock.calls[0][1];
    expect(payload.renderedBody).toContain('Alice');
    expect(payload.renderedBody).not.toContain('{{customer.firstName}}');
  });

  it('renders merge tags in email subject and body', async () => {
    const { db, audiences, templates, queue } = makeService();
    db.campaign.findFirst.mockResolvedValue({
      id: 'camp-2', companyId: 'co-1', status: 'DRAFT', channel: 'EMAIL', templateId: 'tmpl-2', audienceId: 'aud-1',
    });
    templates.get.mockResolvedValue(EMAIL_TEMPLATE);
    audiences.resolveMembers.mockResolvedValue([MEMBERS[0]]);

    const svc = new CampaignService(db as any, audiences as any, templates as any, queue as any);
    await svc.launch('co-1', 'camp-2');

    const payload = (queue.add as jest.Mock).mock.calls[0][1];
    expect(payload.subject).toContain('Alice');
    expect(payload.renderedBody).toContain('Alice');
  });

  it('sets campaign status to SENT after launch', async () => {
    const { svc, db } = makeService();
    await svc.launch('co-1', 'camp-1');
    const updates = (db.campaign.update as jest.Mock).mock.calls.map((c: any) => c[0].data.status);
    expect(updates).toContain('SENT');
  });

  it('dispatchScheduledCampaigns launches due campaigns and skips future ones', async () => {
    const { db, audiences, templates, queue } = makeService();
    const past = new Date(Date.now() - 3600_000);
    const future = new Date(Date.now() + 3600_000);
    db.campaign.findMany = jest.fn().mockResolvedValue([
      { id: 'camp-due', companyId: 'co-1', status: 'SCHEDULED', scheduleAt: past, channel: 'SMS', templateId: 'tmpl-1', audienceId: 'aud-1' },
    ]);
    db.campaign.findFirst = jest.fn().mockImplementation((args: any) =>
      Promise.resolve({ id: args.where.id, companyId: 'co-1', status: 'SCHEDULED', channel: 'SMS', templateId: 'tmpl-1', audienceId: 'aud-1' })
    );

    const svc = new CampaignService(db as any, audiences as any, templates as any, queue as any);
    await svc.dispatchScheduledCampaigns();
    expect(queue.add).toHaveBeenCalled();
  });
});

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { AudienceService } from '../audience/audience.service';
import { TemplatesService } from '../templates/templates.service';
import { MarketingChannel } from '../prisma/generated';
import type { MarketingSendPayload } from '../send/marketing-send.worker';
import { signMarketingToken } from '../common/marketing-token.util';

const CLICK_BASE = process.env.MARKETING_CLICK_BASE_URL ?? 'http://localhost:3000';
const CUSTOMER_PORTAL_URL = process.env.CUSTOMER_PORTAL_URL ?? 'https://tscrm-demo-customer.web.app';

export interface CreateCampaignDto {
  name: string;
  channel: 'EMAIL' | 'SMS';
  templateId: string;
  audienceId: string;
  scheduleAt?: string; // ISO datetime; absent = immediate on launch
}

function renderMergeTags(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_, key) => vars[key] ?? '');
}

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly db: MarketingPrismaService,
    private readonly audiences: AudienceService,
    private readonly templates: TemplatesService,
    @InjectQueue(QueueName.MARKETING_SEND) private readonly sendQueue: Queue,
  ) {}

  async list(companyId: string) {
    return this.db.campaign.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(companyId: string, id: string) {
    const c = await this.db.campaign.findFirst({ where: { id, companyId } });
    if (!c) throw new NotFoundException(`Campaign ${id} not found`);
    return c;
  }

  async create(companyId: string, createdBy: string, dto: CreateCampaignDto) {
    return this.db.campaign.create({
      data: {
        companyId,
        name: dto.name,
        channel: dto.channel as MarketingChannel,
        templateId: dto.templateId,
        audienceId: dto.audienceId,
        scheduleAt: dto.scheduleAt ? new Date(dto.scheduleAt) : null,
        status: dto.scheduleAt ? 'SCHEDULED' : 'DRAFT',
        createdBy,
      },
    });
  }

  async launch(companyId: string, id: string): Promise<{ queued: number; skipped: number }> {
    const campaign = await this.get(companyId, id);

    if (!campaign.audienceId) throw new BadRequestException('Campaign has no audience');
    if (!campaign.templateId) throw new BadRequestException('Campaign has no template');
    if (campaign.status === 'SENT') throw new BadRequestException('Campaign already sent');

    const [template, members] = await Promise.all([
      this.templates.get(companyId, campaign.templateId),
      this.audiences.resolveMembers(companyId, campaign.audienceId),
    ]);

    await this.db.campaign.update({ where: { id }, data: { status: 'SENDING' } });

    let queued = 0;
    let skipped = 0;

    for (const member of members) {
      const address =
        campaign.channel === 'EMAIL'
          ? member.email
          : member.mobile ?? member.phone;

      if (!address) { skipped++; continue; }

      // Create the sendJob first so we can embed its ID in tracking tokens
      const sendJob = await this.db.sendJob.create({
        data: {
          campaignId: id,
          companyId,
          customerId: member.id,
          channel: campaign.channel as MarketingChannel,
          address,
          status: 'PENDING',
        },
      });

      // Build per-recipient tracked URLs
      const clickToken = signMarketingToken({ type: 'click', sendJobId: sendJob.id, destinationUrl: `${CUSTOMER_PORTAL_URL}/jobs` });
      const unsubToken = signMarketingToken({ type: 'unsub', companyId, customerId: member.id, channel: 'EMAIL', address, sendJobId: sendJob.id });
      const trackedLink = `${CLICK_BASE}/m/r/${clickToken}`;
      const unsubLink   = `${CLICK_BASE}/m/u/${unsubToken}`;
      const openPixel   = `<img src="${CLICK_BASE}/m/p/${sendJob.id}" width="1" height="1" style="display:none" alt="" />`;

      const vars: Record<string, string> = {
        'customer.firstName': member.firstName,
        'customer.lastName': member.lastName ?? '',
        'company.name': 'T&S Services',
        trackedLink,
        unsubLink,
      };

      let renderedBody = renderMergeTags(
        campaign.channel === 'SMS'
          ? (template.smsBody ?? '')
          : (template.htmlBody ?? ''),
        vars,
      );

      // Inject open-tracking pixel at the end of HTML emails
      if (campaign.channel === 'EMAIL' && renderedBody.includes('</body>')) {
        renderedBody = renderedBody.replace('</body>', `${openPixel}</body>`);
      } else if (campaign.channel === 'EMAIL') {
        renderedBody += openPixel;
      }

      const subject = template.subject ? renderMergeTags(template.subject, vars) : undefined;

      const payload: MarketingSendPayload = {
        sendJobId: sendJob.id,
        companyId,
        channel: campaign.channel as MarketingChannel,
        address,
        renderedBody,
        subject,
        zipCode: member.zipCode,
        stateCode: member.state,
      };

      await this.sendQueue.add('marketing-send', payload, {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      });

      queued++;
    }

    await this.db.campaign.update({ where: { id }, data: { status: 'SENT' } });
    this.logger.log(`Campaign ${id} dispatched: ${queued} queued, ${skipped} skipped (no address)`);
    return { queued, skipped };
  }

  // Called hourly by cron — picks up SCHEDULED campaigns whose scheduleAt has passed
  async dispatchScheduledCampaigns(): Promise<void> {
    const due = await this.db.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduleAt: { lte: new Date() },
      },
    });

    for (const c of due) {
      try {
        await this.launch(c.companyId, c.id);
      } catch (err) {
        this.logger.error(`Scheduled campaign ${c.id} launch failed: ${(err as Error).message}`);
      }
    }
  }
}

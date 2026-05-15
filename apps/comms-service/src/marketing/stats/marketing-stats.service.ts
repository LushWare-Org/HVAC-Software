import { Injectable } from '@nestjs/common';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';

export type StatsRange = '7d' | '30d' | '90d';

function rangeStart(range: StatsRange): Date {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 86_400_000);
}

@Injectable()
export class MarketingStatsService {
  constructor(private readonly db: MarketingPrismaService) {}

  async getKpis(companyId: string, range: StatsRange) {
    const since = rangeStart(range);

    const [sent, delivered, opened, clicked, reviews] = await Promise.all([
      this.db.sendJob.count({ where: { companyId, createdAt: { gte: since } } }),
      this.db.sendEvent.count({
        where: { sendJob: { companyId }, eventType: 'DELIVERED', eventAt: { gte: since } },
      }),
      this.db.sendEvent.count({
        where: { sendJob: { companyId }, eventType: 'OPENED', eventAt: { gte: since } },
      }),
      this.db.sendEvent.count({
        where: { sendJob: { companyId }, eventType: 'CLICKED', eventAt: { gte: since } },
      }),
      this.db.reviewRequest.count({
        where: { companyId, createdAt: { gte: since } },
      }),
    ]);

    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
    const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
    const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;

    return { sent, delivered, opened, clicked, reviewsSent: reviews, deliveryRate, openRate, clickRate };
  }

  async getCampaignStats(companyId: string, range: StatsRange) {
    const since = rangeStart(range);

    const campaigns = await this.db.campaign.findMany({
      where: { companyId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      include: {
        sendJobs: {
          select: {
            id: true,
            status: true,
            events: { select: { eventType: true } },
          },
        },
      },
    });

    return campaigns.map((c) => {
      const sent = c.sendJobs.length;
      const allEvents = c.sendJobs.flatMap((j) => j.events);
      const delivered = allEvents.filter((e) => e.eventType === 'DELIVERED').length;
      const opened = allEvents.filter((e) => e.eventType === 'OPENED').length;
      const clicked = allEvents.filter((e) => e.eventType === 'CLICKED').length;

      return {
        id: c.id,
        name: c.name,
        channel: c.channel,
        status: c.status,
        createdAt: c.createdAt,
        sent,
        delivered,
        opened,
        clicked,
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
      };
    });
  }

  async getAttributionStats(companyId: string, range: StatsRange) {
    const since = rangeStart(range);

    const [totalClicks, reviewClicks, reviewSends, winbackSends, automationSends] = await Promise.all([
      this.db.sendEvent.count({
        where: { sendJob: { companyId }, eventType: 'CLICKED', eventAt: { gte: since } },
      }),
      this.db.reviewRequest.count({ where: { companyId, createdAt: { gte: since }, status: 'CLICKED' } }),
      this.db.reviewRequest.count({ where: { companyId, createdAt: { gte: since } } }),
      this.db.sendJob.count({
        where: { companyId, createdAt: { gte: since }, automationTemplate: { startsWith: 'winback-' } },
      }),
      this.db.sendJob.count({
        where: {
          companyId, createdAt: { gte: since },
          automationTemplate: { in: ['hvac-tune-up-6mo', 'hvac-replacement-7yr', 'warranty-expiry-30d'] },
        },
      }),
    ]);

    const reviewClickRate = reviewSends > 0 ? Math.round((reviewClicks / reviewSends) * 100) : 0;

    return { totalClicks, reviewClicks, reviewSends, reviewClickRate, winbackSends, automationSends };
  }

  async getCampaignFunnel(companyId: string, campaignId: string) {
    const campaign = await this.db.campaign.findFirst({
      where: { id: campaignId, companyId },
      include: {
        sendJobs: {
          include: { events: { select: { eventType: true } } },
        },
      },
    });

    if (!campaign) return null;

    const jobs = campaign.sendJobs;
    const allEvents = jobs.flatMap((j) => j.events);

    return {
      sent: jobs.length,
      delivered: allEvents.filter((e) => e.eventType === 'DELIVERED').length,
      opened: allEvents.filter((e) => e.eventType === 'OPENED').length,
      clicked: allEvents.filter((e) => e.eventType === 'CLICKED').length,
      failed: jobs.filter((j) => j.status === 'FAILED').length,
      skipped: jobs.filter((j) => j.status === 'SKIPPED').length,
    };
  }
}

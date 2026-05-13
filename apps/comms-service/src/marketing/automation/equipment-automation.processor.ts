import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { EquipmentAutomationService } from './equipment-automation.service';
import { EmailService } from '../../email/email.service';
import { SuppressionService } from '../suppression/suppression.service';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { CrmClient } from './crm.client';
import { WinbackService } from '../winback/winback.service';
import { CampaignService } from '../campaign/campaign.service';

export interface EquipmentScanPayload {
  type: 'equipment-scan';
  companyId: string;
}

export interface AutomationEmailPayload {
  type: 'automation-email';
  sendJobId: string;
  companyId: string;
  to: string;
  subject: string;
  htmlBody: string;
}

@Processor(QueueName.EQUIPMENT_AUTOMATION)
export class EquipmentAutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(EquipmentAutomationProcessor.name);

  constructor(
    private readonly automationService: EquipmentAutomationService,
    private readonly emailService: EmailService,
    private readonly suppression: SuppressionService,
    private readonly db: MarketingPrismaService,
    private readonly crmClient: CrmClient,
    private readonly winbackService: WinbackService,
    private readonly campaignService: CampaignService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'automation-email') return this.processAutomationEmail(job.data as AutomationEmailPayload);
    if (job.name === 'daily-winback-scan') return this.processWinbackScan(job.data as { companyId: string });
    if (job.name === 'campaign-dispatch') return void (await this.campaignService.dispatchScheduledCampaigns());
    return this.processScan(job.data as EquipmentScanPayload);
  }

  // ── Daily scan for one company ──────────────────────────────────────────────

  private async processScan(data: EquipmentScanPayload): Promise<void> {
    // 'ALL' is used by the daily cron — scan every active company
    const companyIds =
      data.companyId === 'ALL'
        ? await this.crmClient.getActiveCompanyIds()
        : [data.companyId];

    let totalSent = 0;
    for (const companyId of companyIds) {
      const results = await this.automationService.scanCompany(companyId);
      totalSent += results.filter((r) => r.smsSent || r.emailQueued).length;
    }
    this.logger.log(`Equipment scan complete: companies=${companyIds.length} totalSent=${totalSent}`);
  }

  // ── Send the automation email (retried via BullMQ) ──────────────────────────

  private async processAutomationEmail(data: AutomationEmailPayload): Promise<void> {
    const suppressed = await this.suppression.isSuppressed(data.companyId, 'EMAIL', data.to);
    if (suppressed) {
      this.logger.log(`Automation email ${data.sendJobId} skipped — ${data.to} suppressed`);
      await this.db.sendJob.update({ where: { id: data.sendJobId }, data: { status: 'SKIPPED' } });
      return;
    }

    const result = await this.emailService.send({
      to: data.to,
      subject: data.subject,
      htmlBody: data.htmlBody,
    });

    if (!result.success) {
      await this.db.sendJob.update({ where: { id: data.sendJobId }, data: { status: 'FAILED', error: result.error } });
      throw new Error(`Automation email failed: ${result.error}`);
    }

    await this.db.sendJob.update({
      where: { id: data.sendJobId },
      data: { status: 'SENT', sentAt: new Date(), externalId: result.externalId },
    });
    this.logger.log(`Automation email delivered: ${data.sendJobId}`);
  }

  private async processWinbackScan(data: { companyId: string }): Promise<void> {
    const companyIds =
      data.companyId === 'ALL'
        ? await this.crmClient.getActiveCompanyIds()
        : [data.companyId];

    let totalTriggered = 0;
    for (const companyId of companyIds) {
      const results = await this.winbackService.scanCompany(companyId);
      totalTriggered += results.filter((r) => !r.skipped).length;
    }
    this.logger.log(`Win-back scan complete: companies=${companyIds.length} triggered=${totalTriggered}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Equipment automation job ${job.name}/${job.id} failed: ${err.message}`);
  }
}

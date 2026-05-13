import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { SuppressionService } from '../suppression/suppression.service';
import { SmsService } from '../../sms/sms.service';
import { CrmClient, WinbackCandidate } from '../automation/crm.client';
import { ChurnGateService } from '../review/churn-gate.service';
import { signMarketingToken } from '../common/marketing-token.util';
import { step1Sms } from './winback-templates';

// Churn score threshold to trigger win-back
const CHURN_THRESHOLD = 0.7;
// Days inactive before the customer qualifies
const INACTIVE_DAYS = 180;
// Delay between steps (ms)
const STEP2_DELAY_MS = 3 * 24 * 60 * 60 * 1000;   // day 3
const STEP3_DELAY_MS = 7 * 24 * 60 * 60 * 1000;   // day 7
// Re-send cooldown — don't send win-back to same customer within this window
const COOLDOWN_DAYS = 90;

const CLICK_BASE = process.env.MARKETING_CLICK_BASE_URL ?? 'http://localhost:3000';

export interface WinbackScanResult {
  companyId: string;
  customerId: string;
  churnScore: number;
  step1SmsSent: boolean;
  step2Queued: boolean;
  step3Queued: boolean;
  skipped: boolean;
  reason?: string;
}

@Injectable()
export class WinbackService {
  private readonly logger = new Logger(WinbackService.name);

  constructor(
    private readonly db: MarketingPrismaService,
    private readonly suppression: SuppressionService,
    private readonly sms: SmsService,
    private readonly crmClient: CrmClient,
    private readonly churnGate: ChurnGateService,
    @InjectQueue(QueueName.MARKETING_SEND) private readonly sendQueue: Queue,
  ) {}

  async scanCompany(companyId: string): Promise<WinbackScanResult[]> {
    const candidates = await this.crmClient.getWinbackCandidates(companyId, INACTIVE_DAYS);
    this.logger.log(`Win-back scan: ${candidates.length} inactive candidates for company ${companyId}`);

    const results: WinbackScanResult[] = [];
    for (const candidate of candidates) {
      const result = await this.evaluateCandidate(candidate);
      if (result) results.push(result);
    }

    const triggered = results.filter((r) => !r.skipped).length;
    this.logger.log(`Win-back scan complete: company=${companyId} triggered=${triggered}/${candidates.length}`);
    return results;
  }

  async evaluateCandidate(candidate: WinbackCandidate): Promise<WinbackScanResult | null> {
    // Cooldown check — skip if we already ran a win-back for this customer recently
    const recentlySent = await this.wasRecentlySent(candidate.companyId, candidate.id, COOLDOWN_DAYS);
    if (recentlySent) return null;

    // Compute churn inputs from available data
    const now = Date.now();
    const lastBooking = candidate.bookings[0];
    const daysSinceLastService = lastBooking
      ? Math.floor((now - new Date(lastBooking.preferredDate).getTime()) / 86_400_000)
      : INACTIVE_DAYS;
    const avgMonthlySpend = this.computeAvgSpend(candidate.agreements);
    const customerTenureDays = Math.floor((now - new Date(candidate.updatedAt).getTime()) / 86_400_000);

    const { score, passed } = await this.churnGate.scoreAndGate({
      days_since_last_service: daysSinceLastService,
      service_count_last_year: 0,
      avg_monthly_spend: avgMonthlySpend,
      customer_tenure_days: customerTenureDays,
    });

    // Win-back needs HIGH churn score (opposite of review request gate)
    const churnScore = score >= 0 ? score : 0.8; // default high if service down
    if (churnScore < CHURN_THRESHOLD) {
      return null; // not churned enough to bother
    }

    return this.dispatch(candidate, churnScore);
  }

  private async dispatch(candidate: WinbackCandidate, churnScore: number): Promise<WinbackScanResult> {
    const { companyId } = candidate;
    const customerName = `${candidate.firstName} ${candidate.lastName}`;
    const phone = candidate.mobile ?? candidate.phone;
    const result: WinbackScanResult = {
      companyId,
      customerId: candidate.id,
      churnScore,
      step1SmsSent: false,
      step2Queued: false,
      step3Queued: false,
      skipped: false,
    };

    // Step 1 — SMS immediately
    if (phone) {
      const suppressed = await this.suppression.isSuppressed(companyId, 'SMS', phone);
      if (!suppressed) {
        const token = signMarketingToken({ type: 'review-click', companyId, customerId: candidate.id, jobId: 'winback' });
        const trackedLink = `${CLICK_BASE}/m/r/${token}?dest=${encodeURIComponent(CLICK_BASE + '/book')}`;

        try {
          await this.sms.send(phone, step1Sms({ customerName, companyName: 'T&S Services', trackedLink, unsubLink: '' }));
          await this.recordSend(companyId, candidate.id, phone, 'SMS', 'winback-step1');
          result.step1SmsSent = true;
        } catch (err) {
          this.logger.error(`Win-back step1 SMS failed for ${candidate.id}: ${(err as Error).message}`);
        }
      }
    }

    // Step 2 — Email (day 3)
    if (candidate.email) {
      const suppressed = await this.suppression.isSuppressed(companyId, 'EMAIL', candidate.email);
      if (!suppressed) {
        const emailJob = await this.recordSend(companyId, candidate.id, candidate.email, 'EMAIL', 'winback-step2');
        await this.sendQueue.add(
          'winback-email',
          {
            type: 'winback-email',
            sendJobId: emailJob.id,
            companyId,
            customerId: candidate.id,
            customerName,
            to: candidate.email,
            step: 2,
          },
          { delay: STEP2_DELAY_MS, attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
        );
        result.step2Queued = true;
      }
    }

    // Step 3 — Final SMS (day 7)
    if (phone) {
      const suppressed = await this.suppression.isSuppressed(companyId, 'SMS', phone);
      if (!suppressed) {
        const smsJob = await this.recordSend(companyId, candidate.id, phone, 'SMS', 'winback-step3');
        await this.sendQueue.add(
          'winback-sms',
          {
            type: 'winback-sms',
            sendJobId: smsJob.id,
            companyId,
            customerId: candidate.id,
            customerName,
            phone,
            step: 3,
          },
          { delay: STEP3_DELAY_MS, attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
        );
        result.step3Queued = true;
      }
    }

    if (!result.step1SmsSent && !result.step2Queued && !result.step3Queued) {
      result.skipped = true;
      result.reason = 'all_channels_suppressed';
    }

    return result;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async wasRecentlySent(companyId: string, customerId: string, withinDays: number): Promise<boolean> {
    const since = new Date(Date.now() - withinDays * 86_400_000);
    const count = await this.db.sendJob.count({
      where: {
        companyId,
        customerId,
        automationTemplate: { startsWith: 'winback-' },
        createdAt: { gte: since },
      },
    });
    return count > 0;
  }

  private async recordSend(companyId: string, customerId: string, address: string, channel: 'SMS' | 'EMAIL', template: string) {
    return this.db.sendJob.create({
      data: { companyId, customerId, channel, address, automationTemplate: template },
    });
  }

  private computeAvgSpend(agreements: Array<{ value: number | null; endDate: string | null }>): number {
    const active = agreements.filter((a) => !a.endDate || new Date(a.endDate) > new Date());
    if (active.length === 0) return 0;
    const total = active.reduce((sum, a) => sum + (a.value ?? 0), 0);
    return total / active.length;
  }
}

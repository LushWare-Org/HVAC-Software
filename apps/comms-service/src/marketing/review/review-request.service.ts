import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName } from '@tscrm/queue';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { SuppressionService } from '../suppression/suppression.service';
import { ChurnGateService } from './churn-gate.service';
import { signMarketingToken } from '../common/marketing-token.util';
import { SmsService } from '../../sms/sms.service';
import { EmailService } from '../../email/email.service';
import { TriggerReviewRequestDto, ReviewRequestResponseDto } from './review-request.dto';

const CLICK_BASE = process.env.MARKETING_CLICK_BASE_URL ?? 'http://localhost:3000';
const EMAIL_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // day-3

@Injectable()
export class ReviewRequestService {
  private readonly logger = new Logger(ReviewRequestService.name);

  constructor(
    private readonly db: MarketingPrismaService,
    private readonly suppression: SuppressionService,
    private readonly churnGate: ChurnGateService,
    private readonly sms: SmsService,
    private readonly email: EmailService,
    @InjectQueue(QueueName.MARKETING_SEND) private readonly sendQueue: Queue,
  ) {}

  async trigger(dto: TriggerReviewRequestDto): Promise<ReviewRequestResponseDto> {
    // 1. Idempotency — one review request per job
    const existing = await this.db.reviewRequest.findUnique({
      where: { companyId_jobId: { companyId: dto.companyId, jobId: dto.jobId } },
    });
    if (existing) throw new ConflictException(`Review request already exists for job ${dto.jobId}`);

    // 2. Smart Gate
    let gateScore: number | null = null;
    let gatePassed = true;
    if (dto.daysSinceLastService !== undefined) {
      const gate = await this.churnGate.scoreAndGate({
        days_since_last_service: dto.daysSinceLastService ?? 0,
        service_count_last_year: dto.serviceCountLastYear ?? 1,
        avg_monthly_spend: dto.avgMonthlySpend ?? 0,
        customer_tenure_days: dto.customerTenureDays ?? 0,
      });
      gateScore = gate.score >= 0 ? gate.score : null;
      gatePassed = gate.passed;
    }

    // 3. Create record
    const record = await this.db.reviewRequest.create({
      data: {
        companyId: dto.companyId,
        customerId: dto.customerId,
        jobId: dto.jobId,
        gateScore,
        status: gatePassed ? 'PENDING' : 'EXPIRED',
      },
    });

    if (!gatePassed) {
      this.logger.log(`Review gate blocked for job ${dto.jobId} (churn=${gateScore?.toFixed(2)})`);
      return { id: record.id, status: 'EXPIRED', gateScore, gatePassed: false, smsSent: false, emailQueued: false };
    }

    let smsSent = false;
    let emailQueued = false;

    // 4. SMS — immediate (day-1), only if phone provided and not suppressed
    if (dto.customerPhone) {
      const suppressed = await this.suppression.isSuppressed(dto.companyId, 'SMS', dto.customerPhone);
      if (!suppressed) {
        const token = signMarketingToken({ type: 'review-click', companyId: dto.companyId, customerId: dto.customerId, jobId: dto.jobId });
        const reviewLink = dto.reviewLink ?? `${CLICK_BASE}/review`;
        const trackedLink = `${CLICK_BASE}/m/r/${token}?dest=${encodeURIComponent(reviewLink)}`;
        const body = `Hi ${dto.customerName}, thanks for choosing us! We'd love your review: ${trackedLink} Reply STOP to opt out.`;

        try {
          await this.sms.send(dto.customerPhone, body);
          await this.db.reviewRequest.update({ where: { id: record.id }, data: { smsAt: new Date() } });
          smsSent = true;
        } catch (err) {
          this.logger.error(`SMS failed for review ${record.id}: ${(err as Error).message}`);
        }
      }
    }

    // 5. Email — delayed (day-3) via BullMQ
    if (dto.customerEmail) {
      const suppressed = await this.suppression.isSuppressed(dto.companyId, 'EMAIL', dto.customerEmail);
      if (!suppressed) {
        await this.sendQueue.add(
          'review-email',
          {
            type: 'review-email',
            reviewRequestId: record.id,
            companyId: dto.companyId,
            customerId: dto.customerId,
            jobId: dto.jobId,
            customerName: dto.customerName,
            customerEmail: dto.customerEmail,
            reviewLink: dto.reviewLink,
          },
          { delay: EMAIL_DELAY_MS, attempts: 3, backoff: { type: 'exponential', delay: 60_000 } },
        );
        emailQueued = true;
      }
    }

    return { id: record.id, status: 'PENDING', gateScore, gatePassed: true, smsSent, emailQueued };
  }

  async getStatus(companyId: string, jobId: string) {
    return this.db.reviewRequest.findUnique({
      where: { companyId_jobId: { companyId, jobId } },
    });
  }

  async listForCustomer(companyId: string, customerId: string) {
    return this.db.reviewRequest.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

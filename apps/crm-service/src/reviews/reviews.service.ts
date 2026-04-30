/**
 * ReviewsService — customer-authored reviews of jobs, technicians, and the
 * company as a whole. Backed by a single Review table discriminated by the
 * `type` column (JOB | COMPANY).
 *
 * Rating aggregation:
 *   When a JOB review with a technicianId is created (or the customer amends
 *   their rating), we push the new average to the scheduling-service so its
 *   smart-assignment scoring (rating × 25%) reflects real feedback. The push
 *   is fire-and-forget; an outage in scheduling never blocks review creation.
 */

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ReviewType = {
  JOB: 'JOB',
  COMPANY: 'COMPANY',
} as const;

type ReviewType = (typeof ReviewType)[keyof typeof ReviewType];

interface CreateReviewData {
  type?:           ReviewType;
  customerId?:     string;
  customerName?:   string;
  jobId?:          string;
  technicianId?:   string;
  technicianName?: string;
  rating:          number;
  comment?:        string;
  platform?:       string;
  source?:         string;
}

interface ReviewFilters {
  type?:         ReviewType;
  customerId?:   string;
  technicianId?: string;
  jobId?:        string;
  published?:    boolean;
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  // Base URL for the scheduling Go service. In Docker compose it resolves
  // to the container hostname; in dev we fall back to localhost.
  private readonly schedulingUrl =
    process.env.SCHEDULING_SERVICE_URL ?? 'http://localhost:3003';

  constructor(private readonly prisma: PrismaService) {}

  // ── Queries ──────────────────────────────────────────────────────────────

  async findAll(companyId: string, filters: ReviewFilters = {}) {
    return this.prisma.review.findMany({
      where: {
        companyId,
        ...(filters.type          ? { type: filters.type }                 : {}),
        ...(filters.customerId    ? { customerId: filters.customerId }     : {}),
        ...(filters.technicianId  ? { technicianId: filters.technicianId } : {}),
        ...(filters.jobId         ? { jobId: filters.jobId }               : {}),
        ...(filters.published !== undefined ? { isPublished: filters.published } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  findByCustomer(companyId: string, customerId: string) {
    return this.findAll(companyId, { customerId });
  }

  findByTechnician(companyId: string, technicianId: string) {
    return this.findAll(companyId, { technicianId, published: true });
  }

  findByJob(companyId: string, jobId: string) {
    return this.findAll(companyId, { jobId });
  }

  findCompanyReviews(companyId: string) {
    return this.findAll(companyId, { type: ReviewType.COMPANY, published: true });
  }

  async findOne(companyId: string, id: string) {
    const review = await this.prisma.review.findFirst({ where: { id, companyId } });
    if (!review) throw new NotFoundException(`Review ${id} not found`);
    return review;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getTechnicianStats(companyId: string, technicianId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { companyId, technicianId, isPublished: true },
      _avg:   { rating: true },
      _count: { _all: true },
    });
    return {
      technicianId,
      avgRating:    Number((agg._avg.rating ?? 0).toFixed(2)),
      totalRatings: agg._count._all,
    };
  }

  async getCompanyStats(companyId: string) {
    const [company, jobs] = await Promise.all([
      this.prisma.review.aggregate({
        where: { companyId, type: ReviewType.COMPANY, isPublished: true },
        _avg:   { rating: true },
        _count: { _all: true },
      }),
      this.prisma.review.aggregate({
        where: { companyId, type: ReviewType.JOB, isPublished: true },
        _avg:   { rating: true },
        _count: { _all: true },
      }),
    ]);
    return {
      companyReviews: {
        avgRating:    Number((company._avg.rating ?? 0).toFixed(2)),
        totalRatings: company._count._all,
      },
      jobReviews: {
        avgRating:    Number((jobs._avg.rating ?? 0).toFixed(2)),
        totalRatings: jobs._count._all,
      },
    };
  }

  // ── Create ───────────────────────────────────────────────────────────────

  async create(companyId: string, data: CreateReviewData) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    // Derive type if not supplied: presence of jobId → JOB, else COMPANY
    const type =
      data.type ?? (data.jobId ? ReviewType.JOB : ReviewType.COMPANY);

    // Customer can review the same job only once — enforce here
    if (type === ReviewType.JOB && data.jobId && data.customerId) {
      const existing = await this.prisma.review.findFirst({
        where: { companyId, jobId: data.jobId, customerId: data.customerId },
      });
      if (existing) {
        // Update in place so rating reflects latest feedback
        const updated = await this.prisma.review.update({
          where: { id: existing.id },
          data: {
            rating:         data.rating,
            comment:        data.comment ?? existing.comment,
            technicianId:   data.technicianId ?? existing.technicianId,
            updatedAt:      new Date(),
          },
        });
        if (updated.technicianId) {
          this.syncTechnicianRating(companyId, updated.technicianId).catch(() => {});
        }
        return updated;
      }
    }

    const review = await this.prisma.review.create({
      data: {
        companyId,
        type,
        customerId:     data.customerId ?? null,
        customerName:   data.customerName ?? null,
        jobId:          data.jobId ?? null,
        technicianId:   data.technicianId ?? null,
        technicianName: data.technicianName ?? null,
        rating:         data.rating,
        comment:        data.comment ?? null,
        platform:       data.platform ?? data.source ?? 'internal',
        isPublished:    true,
      },
    });

    // Fire-and-forget rating sync to scheduling service
    if (type === ReviewType.JOB && review.technicianId) {
      this.syncTechnicianRating(companyId, review.technicianId).catch(() => {});
    }

    return review;
  }

  // ── Rating sync to scheduling service ─────────────────────────────────────

  /**
   * Recomputes the technician's published-review average and pushes it to the
   * scheduling service so smart-assign picks up the new rating immediately.
   * Silent failure — the scoring algorithm tolerates stale rating.
   */
  private async syncTechnicianRating(companyId: string, technicianId: string) {
    const stats = await this.getTechnicianStats(companyId, technicianId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(
        `${this.schedulingUrl}/technicians/${technicianId}/rating-sync`,
        {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            rating:       stats.avgRating,
            totalRatings: stats.totalRatings,
          }),
          signal: controller.signal,
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.logger.log(
        `Synced tech ${technicianId} rating=${stats.avgRating} (n=${stats.totalRatings})`,
      );
    } catch (err: any) {
      this.logger.warn(
        `Rating sync failed for ${technicianId}: ${err.message ?? err}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

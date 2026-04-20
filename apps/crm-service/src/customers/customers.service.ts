import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChurnClient, type ChurnPredictionInput, type FailurePredictionInput } from '../ai/churn.client';
import { UpsellAgentService } from '../upsell/upsell-agent.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginatedResponse } from '@tscrm/types';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private prisma: PrismaService,
    private churnClient: ChurnClient,
    private upsellAgent: UpsellAgentService,
  ) {}

  private provisionalPortalSignupFilter = {
    AND: [
      { source: 'portal' },
      { engagementStatus: 'INACTIVE' as const },
      { tags: { has: 'portal-signup' } },
    ],
  };

  async create(companyId: string, dto: CreateCustomerDto) {
    // Check for duplicate email within same company
    if (dto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { companyId, email: dto.email, isActive: true },
      });
      if (existing) {
        throw new ConflictException(
          `Customer with email ${dto.email} already exists`,
        );
      }
    }

    return this.prisma.customer.create({
      data: { ...dto, companyId },
      include: { contacts: true },
    });
  }

  async findAll(
    companyId: string,
    page = 1,
    limit = 20,
    search?: string,
    type?: string,
    isActive?: boolean,
  ): Promise<PaginatedResponse<unknown>> {
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
      isActive: isActive !== undefined ? isActive : true,
      NOT: this.provisionalPortalSignupFilter,
      ...(type && { type: type as any }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const data = await this.prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }],
      include: { _count: { select: { contacts: true } } },
    });
    const total = await this.prisma.customer.count({ where });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        contacts: true,
        addresses: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] },
        equipment: { orderBy: { createdAt: 'desc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { leads: true, agreements: true, bookings: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return customer;
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(companyId, id); // ensures it exists + belongs to company

    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    void this.upsellAgent.processCustomerProfileUpdate(companyId, id);
    return customer;
  }

  async remove(companyId: string, id: string) {
    const customer = await this.findOne(companyId, id);

    // Deactivate linked auth account if this was a portal-registered customer
    if (customer.auth0UserId) {
      await this.prisma.companyUser.updateMany({
        where: { id: customer.auth0UserId, companyId },
        data: { isActive: false },
      });
    }

    // Soft delete — preserve history
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(companyId: string) {
    const total = await this.prisma.customer.count({
      where: { companyId, isActive: true, NOT: this.provisionalPortalSignupFilter },
    });
    const residential = await this.prisma.customer.count({
      where: {
        companyId,
        isActive: true,
        type: 'RESIDENTIAL',
        NOT: this.provisionalPortalSignupFilter,
      },
    });
    const commercial = await this.prisma.customer.count({
      where: {
        companyId,
        isActive: true,
        type: 'COMMERCIAL',
        NOT: this.provisionalPortalSignupFilter,
      },
    });
    const withAgreements = await this.prisma.customer.count({
      where: {
        companyId,
        isActive: true,
        NOT: this.provisionalPortalSignupFilter,
        agreements: { some: { status: 'ACTIVE' } },
      },
    });

    return { total, residential, commercial, withAgreements };
  }

  async getStatusSummary(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CONVERTED'] } },
          orderBy: { preferredDate: 'desc' },
          take: 24,
          select: { preferredDate: true, status: true },
        },
        agreements: {
          where: { status: 'ACTIVE' },
          select: { value: true, endDate: true },
        },
        equipment: {
          orderBy: [{ installDate: 'asc' }, { createdAt: 'asc' }],
          select: { installDate: true, createdAt: true, type: true },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: { rating: true },
        },
        _count: {
          select: { bookings: true, agreements: true, equipment: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    const now = new Date();
    const daysSinceLastService = this.computeDaysSinceLastService(customer.bookings, customer.createdAt, now);
    const serviceCountLastYear = this.computeServiceCountLastYear(customer.bookings, now);
    const avgMonthlySpend = this.computeAverageMonthlySpend(customer.agreements);
    const customerTenureDays = this.computeDaysBetween(customer.createdAt, now);
    const equipmentAgeDays = this.computeEquipmentAgeDays(customer.equipment, now);
    const failureHistory = customer.reviews.filter((review) => review.rating <= 2).length;

    const churnInput: ChurnPredictionInput = {
      days_since_last_service: daysSinceLastService,
      service_count_last_year: serviceCountLastYear,
      avg_monthly_spend: avgMonthlySpend,
      customer_tenure_days: customerTenureDays,
    };
    const failureInput: FailurePredictionInput = {
      equipment_age_days: equipmentAgeDays,
      days_since_last_service: daysSinceLastService,
      service_count_last_year: serviceCountLastYear,
      usage_intensity: Math.max(1, serviceCountLastYear + customer._count.equipment),
      failure_history: failureHistory,
    };

    let prediction = this.computeFallbackPrediction(churnInput, failureInput);
    let predictionSource: 'model' | 'fallback' = 'fallback';

    try {
      prediction = await this.churnClient.predictRevenue({ churn: churnInput, failure: failureInput });
      predictionSource = 'model';
    } catch (error) {
      this.logger.warn(`Status summary model unavailable for customer ${customer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const currentStatus = this.describeCurrentStatus(customer, daysSinceLastService);
    const churnLevel = this.riskLevel(prediction.churn_probability);
    const failureLevel = this.riskLevel(prediction.failure_probability);
    const proposedNextStep = this.describeNextStep(
      prediction.recommended_action,
      prediction.churn_probability,
      prediction.failure_probability,
      daysSinceLastService,
      customer.automaticFollowupEnabled,
    );
    const upsellRecommendation =
      await this.getLatestUpsellRecommendation(companyId, id) ??
      this.computeInlineUpsellRecommendation({
        equipmentAgeDays,
        failureHistory,
        daysSinceLastService,
        avgMonthlySpend,
        churnProbability: prediction.churn_probability,
        failureProbability: prediction.failure_probability,
      });
    const retentionPrediction = this.computeRetentionPrediction({
      customerId: customer.id,
      avgMonthlySpend,
      failureHistory,
      churnProbability: prediction.churn_probability,
      upsellConfidence: upsellRecommendation.confidence,
      automaticFollowupEnabled: customer.automaticFollowupEnabled,
      hasMobile: Boolean(customer.mobile),
      hasPhone: Boolean(customer.phone),
      hasEmail: Boolean(customer.email),
    });
    const reasoning = this.buildStatusReasoning({
      upsellRecommendation,
      retentionPrediction,
      churnProbability: prediction.churn_probability,
      churnLevel,
      failureProbability: prediction.failure_probability,
      failureLevel,
      proposedNextStep,
      predictionSource,
      recommendedAction: prediction.recommended_action,
      signals: {
        daysSinceLastService,
        serviceCountLastYear,
        avgMonthlySpend,
        equipmentAgeDays,
        equipmentCount: customer._count.equipment,
        activeAgreementCount: customer.agreements.length,
        failureHistory,
      },
    });

    return {
      customerId: customer.id,
      currentStatus,
      upsellRecommendation,
      retentionPrediction,
      churnPrediction: {
        probability: prediction.churn_probability,
        level: churnLevel,
        summary: `${churnLevel} churn risk`,
      },
      failurePrediction: {
        probability: prediction.failure_probability,
        level: failureLevel,
        summary: `${failureLevel} equipment failure risk`,
      },
      revenueRisk: prediction.revenue_risk,
      proposedNextStep,
      predictionSource,
      reasoning,
      signals: {
        daysSinceLastService,
        serviceCountLastYear,
        avgMonthlySpend,
        equipmentCount: customer._count.equipment,
        activeAgreementCount: customer.agreements.length,
      },
    };
  }

  // Called by customer portal: find Customer linked to the portal user's account
  async findMe(companyId: string, userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { companyId, auth0UserId: userId },
      include: {
        contacts: true,
        addresses: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        equipment: { orderBy: { createdAt: 'desc' } },
        _count: { select: { leads: true, agreements: true, bookings: true } },
      },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return customer;
  }

  async updateMe(companyId: string, userId: string, dto: Partial<{ firstName: string; lastName: string; email: string; phone: string; mobile: string; address: string; city: string; state: string; zipCode: string; notes: string }>) {
    const customer = await this.findMe(companyId, userId);
    return this.prisma.customer.update({ where: { id: customer.id }, data: dto });
  }

  private computeDaysSinceLastService(bookings: Array<{ preferredDate: Date }>, fallbackDate: Date, now: Date): number {
    return this.computeDaysBetween(bookings[0]?.preferredDate ?? fallbackDate, now);
  }

  private computeServiceCountLastYear(bookings: Array<{ preferredDate: Date }>, now: Date): number {
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    return bookings.filter((booking) => booking.preferredDate >= oneYearAgo).length;
  }

  private computeAverageMonthlySpend(agreements: Array<{ value: unknown }>): number {
    const annualValue = agreements.reduce((sum, agreement) => sum + Number(agreement.value ?? 0), 0);
    return annualValue > 0 ? Number((annualValue / 12).toFixed(2)) : 0;
  }

  private computeEquipmentAgeDays(equipment: Array<{ installDate: Date | null; createdAt: Date }>, now: Date): number {
    if (equipment.length === 0) return 0;
    const oldestKnownDate = equipment[0].installDate ?? equipment[0].createdAt;
    return this.computeDaysBetween(oldestKnownDate, now);
  }

  private computeDaysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  }

  private computeFallbackPrediction(churn: ChurnPredictionInput, failure: FailurePredictionInput) {
    const churnProbability = Math.min(
      0.95,
      (churn.days_since_last_service > 180 ? 0.45 : churn.days_since_last_service > 90 ? 0.25 : 0.08) +
        (churn.service_count_last_year === 0 ? 0.25 : 0) +
        (churn.customer_tenure_days < 90 ? 0.08 : 0),
    );
    const failureProbability = Math.min(
      0.95,
      (failure.equipment_age_days > 3650 ? 0.45 : failure.equipment_age_days > 1825 ? 0.25 : 0.08) +
        (failure.days_since_last_service > 180 ? 0.2 : 0) +
        Math.min(0.2, failure.failure_history * 0.08),
    );

    return {
      churn_probability: Number(churnProbability.toFixed(3)),
      failure_probability: Number(failureProbability.toFixed(3)),
      revenue_risk: Number(((churnProbability * churn.avg_monthly_spend * 12) + (failureProbability * 200)).toFixed(2)),
      recommended_action: this.recommendFallbackAction(churnProbability, failureProbability),
    };
  }

  private recommendFallbackAction(churnProbability: number, failureProbability: number): string {
    if (churnProbability > 0.7 && failureProbability > 0.7) return 'URGENT_INTERVENTION';
    if (churnProbability > 0.7) return 'RETENTION';
    if (failureProbability > 0.7) return 'MAINTENANCE';
    if (churnProbability > 0.45) return 'REENGAGEMENT';
    return 'NONE';
  }

  private riskLevel(probability: number): 'Low' | 'Medium' | 'High' {
    if (probability >= 0.7) return 'High';
    if (probability >= 0.4) return 'Medium';
    return 'Low';
  }

  private describeCurrentStatus(customer: { isActive: boolean; engagementStatus: string; automaticFollowupEnabled: boolean }, daysSinceLastService: number): string {
    if (!customer.isActive) return 'Inactive customer record';
    if (customer.engagementStatus === 'INACTIVE') return 'Inactive engagement';
    if (daysSinceLastService > 180) return `No confirmed service for ${daysSinceLastService} days`;
    if (daysSinceLastService > 90) return `Service is overdue by ${daysSinceLastService} days`;
    if (!customer.automaticFollowupEnabled) return 'Active, automatic follow-up paused';
    return `Active, last confirmed service ${daysSinceLastService} days ago`;
  }

  private describeNextStep(action: string, churnProbability: number, failureProbability: number, daysSinceLastService: number, automaticFollowupEnabled: boolean): string {
    if (!automaticFollowupEnabled) return 'Review manually because automatic follow-up is paused.';
    if (action === 'URGENT_INTERVENTION') return 'Call today, schedule maintenance, and assign a retention owner.';
    if (action === 'RETENTION') return 'Send a retention offer and book a check-in call.';
    if (action === 'MAINTENANCE') return 'Schedule preventive maintenance before the next breakdown risk window.';
    if (action === 'REENGAGEMENT' || daysSinceLastService > 90) return 'Send a re-engagement message and offer a service slot.';
    if (churnProbability >= 0.4 || failureProbability >= 0.4) return 'Monitor this week and prepare a targeted follow-up.';
    return 'No immediate action. Keep standard follow-up cadence.';
  }

  private async getLatestUpsellRecommendation(companyId: string, customerId: string) {
    if (!(await this.prisma.tableExists('upsell_recommendations'))) {
      return null;
    }

    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      recommendedOffer: string;
      confidence: number;
      status: string;
      priorityScore: number | null;
      triggerSource: string | null;
      createdAt: Date;
    }>>(
      `
        SELECT
          id,
          recommended_offer AS "recommendedOffer",
          confidence,
          status,
          priority_score AS "priorityScore",
          trigger_source AS "triggerSource",
          created_at AS "createdAt"
        FROM ${this.prisma.tableRef('upsell_recommendations')}
        WHERE company_id = $1
          AND customer_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
      companyId,
      customerId,
    );

    return rows[0] ?? null;
  }

  private computeInlineUpsellRecommendation(signals: {
    equipmentAgeDays: number;
    failureHistory: number;
    daysSinceLastService: number;
    avgMonthlySpend: number;
    churnProbability: number;
    failureProbability: number;
  }) {
    const equipmentAgeYears = signals.equipmentAgeDays / 365;
    const scores: Record<string, number> = {
      maintenance_plan: 0.25,
      replacement: 0.2,
      service: 0.2,
    };

    if (equipmentAgeYears > 8) {
      scores.replacement += 0.45;
    }

    if (signals.failureHistory > 2) {
      scores.maintenance_plan += 0.45;
    }

    if (signals.daysSinceLastService > 180) {
      scores.service += 0.4;
    }

    if (signals.failureProbability >= 0.5) {
      scores.maintenance_plan += 0.15;
      if (equipmentAgeYears > 8) {
        scores.replacement += 0.1;
      }
    }

    if (signals.churnProbability >= 0.5) {
      scores.maintenance_plan += 0.1;
      scores.service += 0.1;
    }

    if (signals.avgMonthlySpend >= 250) {
      scores.maintenance_plan += 0.08;
    }

    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const normalizedScores = Object.fromEntries(
      Object.entries(scores).map(([offer, score]) => [offer, Number((score / total).toFixed(4))]),
    );
    const [recommendedOffer, confidence] = Object.entries(normalizedScores)
      .sort(([, left], [, right]) => right - left)[0];
    const priorityScore = Math.min(
      1,
      (confidence * 0.7)
        + (signals.churnProbability * 0.15)
        + (signals.failureProbability * 0.15),
    );

    return {
      id: 'inline',
      recommendedOffer,
      confidence,
      status: 'generated',
      priorityScore: Number(priorityScore.toFixed(4)),
      triggerSource: 'status_summary',
      createdAt: new Date(),
    };
  }

  private computeRetentionPrediction(signals: {
    customerId: string;
    avgMonthlySpend: number;
    failureHistory: number;
    churnProbability: number;
    upsellConfidence: number;
    automaticFollowupEnabled: boolean;
    hasMobile: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
  }) {
    const pConvert = this.clampProbability(signals.upsellConfidence);
    const ltv = Number((signals.avgMonthlySpend * 12).toFixed(2));
    const churnProbability = this.clampProbability(signals.churnProbability);
    const score = Number((pConvert * ltv * (1 - churnProbability)).toFixed(2));
    const recommendedChannel = this.recommendedRetentionChannel(signals);

    let action = 'no_action';
    if (pConvert > 0.75 && ltv > 1500) {
      action = 'premium_contract_offer';
    } else if (churnProbability > 0.7) {
      action = 'discount_retention_offer';
    } else if (signals.failureHistory >= 3) {
      action = 'maintenance_plan_offer';
    }

    return {
      customerId: signals.customerId,
      pConvert: Number(pConvert.toFixed(4)),
      ltv,
      churnProbability: Number(churnProbability.toFixed(4)),
      score,
      action,
      offer: this.retentionOffer(action),
      recommendedChannel,
      priority: score > 1500 ? 'high' : score >= 500 ? 'medium' : 'low',
      triggerImmediately: signals.failureHistory >= 3,
      reason: this.describeRetentionReason(action, signals.failureHistory, pConvert, signals.automaticFollowupEnabled),
    };
  }

  private recommendedRetentionChannel(signals: { hasMobile: boolean; hasPhone: boolean; hasEmail: boolean }) {
    if (signals.hasMobile) return 'whatsapp';
    if (signals.hasEmail) return 'email';
    if (signals.hasPhone) return 'call';
    return 'email';
  }

  private retentionOffer(action: string) {
    if (action === 'premium_contract_offer') return { type: 'premium', discount: 0 };
    if (action === 'discount_retention_offer') return { type: 'discounted', discount: 20 };
    if (action === 'maintenance_plan_offer') return { type: 'standard', discount: 10 };
    return { type: 'none', discount: 0 };
  }

  private describeRetentionReason(action: string, failureHistory: number, pConvert: number, automaticFollowupEnabled: boolean) {
    if (!automaticFollowupEnabled) return 'Manual review because automatic follow-up is paused';
    if (action === 'premium_contract_offer') return 'High conversion probability and high predicted lifetime value';
    if (action === 'discount_retention_offer') return 'High churn probability';
    if (action === 'maintenance_plan_offer' && pConvert > 0.75) return 'High repair frequency and high conversion probability';
    if (action === 'maintenance_plan_offer' || failureHistory >= 3) return 'High repair frequency';
    return 'Customer does not meet retention targeting thresholds';
  }

  private buildStatusReasoning(input: {
    upsellRecommendation: {
      recommendedOffer: string;
      confidence: number;
      priorityScore?: number | null;
      status: string;
      triggerSource?: string | null;
    };
    retentionPrediction: {
      pConvert: number;
      ltv: number;
      churnProbability: number;
      score: number;
      action: string;
      priority: string;
      recommendedChannel: string;
      triggerImmediately: boolean;
      reason: string;
    };
    churnProbability: number;
    churnLevel: 'Low' | 'Medium' | 'High';
    failureProbability: number;
    failureLevel: 'Low' | 'Medium' | 'High';
    proposedNextStep: string;
    predictionSource: 'model' | 'fallback';
    recommendedAction: string;
    signals: {
      daysSinceLastService: number;
      serviceCountLastYear: number;
      avgMonthlySpend: number;
      equipmentAgeDays: number;
      equipmentCount: number;
      activeAgreementCount: number;
      failureHistory: number;
    };
  }) {
    const sourceLabel = input.predictionSource === 'model' ? 'ML service' : 'fallback rule model';
    const priorityScore = input.upsellRecommendation.priorityScore ?? input.upsellRecommendation.confidence;
    const equipmentAgeYears = Number((input.signals.equipmentAgeDays / 365).toFixed(1));

    return {
      upsellRecommendation: {
        ruleBased: [
          `Scores consider service recency (${input.signals.daysSinceLastService} days), equipment risk (${input.failureLevel}), churn risk (${input.churnLevel}), and monthly spend (${input.signals.avgMonthlySpend}).`,
          `Stored recommendations are used first; otherwise the inline rule engine weights maintenance plan, replacement, and service options.`,
        ].join(' '),
        mlResult: `Recommended ${input.upsellRecommendation.recommendedOffer} with ${this.formatProbability(input.upsellRecommendation.confidence)} confidence and ${this.formatProbability(priorityScore)} priority from ${input.upsellRecommendation.status}.`,
        aiExplanation: `The recommendation favors ${input.upsellRecommendation.recommendedOffer} because the customer's recent service pattern, failure risk, churn risk, and value signals make that offer the most relevant next commercial action.`,
      },
      retentionSuggestion: {
        ruleBased: `Retention action follows thresholds: premium contract when conversion is above 75% and annual value is above $1,500, retention discount when churn is above 70%, and maintenance plan when repeat failure history is high.`,
        mlResult: `${sourceLabel} inputs produced ${this.formatProbability(input.retentionPrediction.pConvert)} conversion probability, $${input.retentionPrediction.ltv.toLocaleString()} predicted annual value, ${this.formatProbability(input.retentionPrediction.churnProbability)} churn probability, and score ${input.retentionPrediction.score}.`,
        aiExplanation: `${input.retentionPrediction.reason}. The suggested action is ${input.retentionPrediction.action} at ${input.retentionPrediction.priority} priority via ${input.retentionPrediction.recommendedChannel}${input.retentionPrediction.triggerImmediately ? ', so it should be triggered immediately' : ''}.`,
      },
      failureAndChurnPrediction: {
        ruleBased: `Fallback rules increase churn for long inactivity, no service in the last year, and new-customer uncertainty; failure risk rises with older equipment, long gaps since service, and poor review history.`,
        mlResult: `${sourceLabel} returned ${input.churnLevel} churn risk (${this.formatProbability(input.churnProbability)}) and ${input.failureLevel} failure risk (${this.formatProbability(input.failureProbability)}). Equipment age is ${equipmentAgeYears} years across ${input.signals.equipmentCount} record(s).`,
        aiExplanation: `The combined risk view means this customer is ${input.churnLevel.toLowerCase()} for churn and ${input.failureLevel.toLowerCase()} for equipment failure, so the system balances relationship recovery with preventive service timing.`,
      },
      proposedNextStep: {
        ruleBased: `Next-step rules prioritize paused follow-up review, urgent intervention, retention offer, maintenance scheduling, re-engagement after 90 days, then monitoring or normal cadence.`,
        mlResult: `${sourceLabel} recommended action ${input.recommendedAction}; the selected next step is: ${input.proposedNextStep}`,
        aiExplanation: `This step is the operational translation of the prediction results, chosen to reduce revenue loss, prevent avoidable equipment issues, and keep outreach aligned with the customer's current risk level.`,
      },
    };
  }

  private formatProbability(value: number) {
    return `${Math.round(this.clampProbability(value) * 100)}%`;
  }

  private clampProbability(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value));
  }

  // ── Equipment CRUD ────────────────────────────────────────────────────────────

  async getEquipment(companyId: string, customerId: string) {
    await this.findOne(companyId, customerId); // verify customer belongs to company
    return this.prisma.equipment.findMany({
      where: { customerId, companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEquipmentItem(
    companyId: string,
    customerId: string,
    dto: { type: string; brand?: string; model?: string; serialNo?: string; installDate?: string; warrantyEnd?: string; notes?: string },
  ) {
    await this.findOne(companyId, customerId);
    const equipment = await this.prisma.equipment.create({
      data: {
        companyId,
        customerId,
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        serialNo: dto.serialNo,
        installDate: dto.installDate ? new Date(dto.installDate) : undefined,
        warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : undefined,
        notes: dto.notes,
      },
    });

    void this.upsellAgent.processCustomerProfileUpdate(companyId, customerId);
    return equipment;
  }

  async updateEquipmentItem(
    companyId: string,
    customerId: string,
    eqId: string,
    dto: { type?: string; brand?: string; model?: string; serialNo?: string; installDate?: string; warrantyEnd?: string; notes?: string },
  ) {
    await this.findOne(companyId, customerId);
    const eq = await this.prisma.equipment.findFirst({ where: { id: eqId, customerId, companyId } });
    if (!eq) throw new NotFoundException(`Equipment ${eqId} not found`);
    const equipment = await this.prisma.equipment.update({
      where: { id: eqId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.serialNo !== undefined && { serialNo: dto.serialNo }),
        ...(dto.installDate !== undefined && { installDate: dto.installDate ? new Date(dto.installDate) : null }),
        ...(dto.warrantyEnd !== undefined && { warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : null }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    void this.upsellAgent.processCustomerProfileUpdate(companyId, customerId);
    return equipment;
  }

  async deleteEquipmentItem(companyId: string, customerId: string, eqId: string) {
    await this.findOne(companyId, customerId);
    const eq = await this.prisma.equipment.findFirst({ where: { id: eqId, customerId, companyId } });
    if (!eq) throw new NotFoundException(`Equipment ${eqId} not found`);
    const deleted = await this.prisma.equipment.delete({ where: { id: eqId } });
    void this.upsellAgent.processCustomerProfileUpdate(companyId, customerId);
    return deleted;
  }
}

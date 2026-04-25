import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface ActionResult {
  summary: string;
  details: Record<string, unknown>;
  affectedCount?: number;
  estimatedRevenue?: number;
}

// Maximum allowed values per action — enforced before any execution
const SAFETY_LIMITS: Record<string, { maxDiscount?: number; maxIncreasePercent?: number; maxTargetCount?: number }> = {
  discount_20:         { maxDiscount: 20,  maxTargetCount: 500 },
  geo_target_discount: { maxDiscount: 15,  maxTargetCount: 200 },
  same_day_offer:      { maxDiscount: 10,  maxTargetCount: 100 },
  increase_price:      { maxIncreasePercent: 25 },
};

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);

  async run(
    companyId: string,
    action: string,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    this.validateSafety(action, params);

    switch (action) {
      case 'discount_20':
        return this.runDiscountCampaign(companyId, params);
      case 'call':
        return this.createCallTasks(companyId, params);
      case 'increase_price':
        return this.updatePricing(companyId, params);
      case 'geo_target_discount':
        return this.runGeoTargetCampaign(companyId, params);
      case 'same_day_offer':
        return this.sendSameDayOffer(companyId, params);
      default:
        return { summary: `No executor registered for action "${action}".`, details: { action } };
    }
  }

  // ── Safety gate ──────────────────────────────────────────────────────────────

  private validateSafety(action: string, params: Record<string, unknown>): void {
    const limits = SAFETY_LIMITS[action];
    if (!limits) return;

    const discount = params.discount as number | undefined;
    if (discount !== undefined && limits.maxDiscount !== undefined && discount > limits.maxDiscount) {
      throw new BadRequestException(
        `Discount ${discount}% exceeds the ${limits.maxDiscount}% safety limit for "${action}".`,
      );
    }

    const increasePercent = params.increasePercent as number | undefined;
    if (increasePercent !== undefined && limits.maxIncreasePercent !== undefined && increasePercent > limits.maxIncreasePercent) {
      throw new BadRequestException(
        `Price increase ${increasePercent}% exceeds the ${limits.maxIncreasePercent}% safety limit.`,
      );
    }

    const targetCount = params.targetCount as number | undefined;
    if (targetCount !== undefined && limits.maxTargetCount !== undefined && targetCount > limits.maxTargetCount) {
      throw new BadRequestException(
        `Target count ${targetCount} exceeds the ${limits.maxTargetCount} customer safety limit.`,
      );
    }
  }

  // ── Action handlers ──────────────────────────────────────────────────────────

  private async runDiscountCampaign(
    companyId: string,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    const discountPercent = (params.discount as number) ?? 20;
    const segment         = (params.segment  as string) ?? 'inactive_30_days';

    const targeted   = this.mockSelectCustomers(companyId, segment, 45);
    const notified   = this.mockSendBatch(targeted, 'sms+email', { discount: discountPercent });
    const campaignId = `camp_${Date.now()}`;

    this.logger.log(`[${companyId}] discount campaign ${campaignId}: ${notified} customers notified`);

    return {
      summary: `${discountPercent}% discount campaign launched — ${notified} customers notified via SMS & email.`,
      details: {
        campaignId,
        discountPercent,
        targetSegment:    segment,
        customersNotified: notified,
        channels:         ['sms', 'email'],
        expiresAt:        new Date(Date.now() + 48 * 3_600_000).toISOString(),
      },
      affectedCount:    notified,
      estimatedRevenue: 4200,
    };
  }

  private async createCallTasks(
    companyId: string,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    const priority = (params.priority as string) ?? 'high';

    const customers = this.mockSelectCustomers(companyId, 'churn_risk_high_ltv', 3);
    const taskIds   = customers.map((_, i) => `task_${Date.now()}_${i}`);

    this.logger.log(`[${companyId}] ${taskIds.length} retention call tasks created`);

    return {
      summary: `${taskIds.length} retention call tasks created and queued for the sales team (due within 24 h).`,
      details: {
        tasksCreated:      taskIds.length,
        priority,
        dueWithin:        '24 hours',
        taskIds,
        estimatedRecovery: '$3,150',
      },
      affectedCount:    taskIds.length,
      estimatedRevenue: 3150,
    };
  }

  private async updatePricing(
    companyId: string,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    const increasePercent = (params.increasePercent  as number) ?? 12;
    const category        = (params.serviceCategory  as string) ?? 'all';

    const updated = this.mockUpdatePricingCatalog(companyId, category, increasePercent);

    this.logger.log(`[${companyId}] pricing +${increasePercent}% applied to ${updated} services`);

    return {
      summary: `Dynamic pricing applied: +${increasePercent}% across ${updated} services during high-demand window.`,
      details: {
        increasePercent,
        serviceCategory:       category,
        servicesUpdated:       updated,
        effectiveFrom:         new Date().toISOString(),
        revertAt:              new Date(Date.now() + 7 * 86_400_000).toISOString(),
        utilizationAtTrigger:  '91%',
      },
      affectedCount:    updated,
      estimatedRevenue: 1800,
    };
  }

  private async runGeoTargetCampaign(
    companyId: string,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    const discountPercent = (params.discount  as number) ?? 10;
    const radiusKm        = (params.radiusKm  as number) ?? 15;

    const prospects = this.mockSelectCustomers(companyId, 'pending_quotes_geo', 8);
    const notified  = this.mockSendBatch(prospects, 'sms+email', { discount: discountPercent });

    this.logger.log(`[${companyId}] geo campaign: ${notified} prospects within ${radiusKm} km`);

    return {
      summary: `Geo-targeted follow-up sent to ${notified} pending-quote holders within ${radiusKm} km of tomorrow's routes.`,
      details: {
        prospectsTargeted:     notified,
        discountPercent,
        radiusKm,
        estimatedConversions:  '4–5 deals',
        channels:              ['email', 'sms'],
      },
      affectedCount:    notified,
      estimatedRevenue: 2600,
    };
  }

  private async sendSameDayOffer(
    companyId: string,
    params: Record<string, unknown>,
  ): Promise<ActionResult> {
    const discountPercent = (params.discount as number) ?? 10;

    const prospects = this.mockSelectCustomers(companyId, 'route_nearby_prospects', 5);
    const notified  = this.mockSendBatch(prospects, 'sms+push', { discount: discountPercent });

    this.logger.log(`[${companyId}] same-day offers sent to ${notified} nearby prospects`);

    return {
      summary: `Same-day booking offers sent to ${notified} nearby prospects — ${Math.ceil(notified * 0.5)} slots expected to fill.`,
      details: {
        prospectsNotified: notified,
        discountPercent,
        slotsAvailable:   3,
        offersExpiry:     new Date(Date.now() + 6 * 3_600_000).toISOString(),
        channels:         ['sms', 'push'],
      },
      affectedCount:    notified,
      estimatedRevenue: 950,
    };
  }

  // ── Mock helpers — swap for real CRM / Comms HTTP calls in production ────────

  private mockSelectCustomers(companyId: string, segment: string, count: number): string[] {
    const prefix = companyId.slice(0, 6);
    return Array.from({ length: count }, (_, i) => `cust_${prefix}_${segment}_${i}`);
  }

  private mockSendBatch(
    customerIds: string[],
    channel: string,
    payload: Record<string, unknown>,
  ): number {
    const delivered = Math.floor(customerIds.length * 0.9);
    this.logger.debug(
      `mock send [${channel}] to ${delivered}/${customerIds.length} | payload: ${JSON.stringify(payload)}`,
    );
    return delivered;
  }

  private mockUpdatePricingCatalog(
    _companyId: string,
    _category: string,
    _increasePercent: number,
  ): number {
    return 12;
  }
}

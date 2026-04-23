import { Injectable, Logger } from '@nestjs/common';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  impact: number;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  trend: 'up' | 'down' | 'neutral';
  priorityScore: number;
}

export interface ExecuteActionResult {
  success: boolean;
  action: string;
  executedAt: string;
  message: string;
}

// Mock recommendations derived from the revenue agent's decision space.
// In production, this calls the Python revenue agent via HTTP or shared queue.
const RAW_RECOMMENDATIONS: Omit<Recommendation, 'priorityScore'>[] = [
  {
    id: 'rec_001',
    title: 'Low Demand Alert',
    description:
      'Expected demand is 30% below capacity tomorrow. Technician utilization at 42%. Revenue at risk: ~$3,800.',
    action: 'discount_20',
    actionLabel: 'Run 20% Discount Campaign',
    impact: 4200,
    confidence: 0.82,
    priority: 'high',
    reason: 'Low demand + low utilization',
    trend: 'down',
  },
  {
    id: 'rec_002',
    title: 'Customer Retention Risk',
    description:
      '3 high-value customers showing churn signals. Average LTV: $8,400. Proactive outreach can recover ~$3,150.',
    action: 'call',
    actionLabel: 'Schedule Retention Calls',
    impact: 3150,
    confidence: 0.71,
    priority: 'high',
    reason: 'High churn risk + high-LTV customers',
    trend: 'down',
  },
  {
    id: 'rec_003',
    title: 'Pending Quotes at Risk',
    description:
      '8 quotes pending approval worth $14,600. Conversion rate 55% — a targeted follow-up could close 4–5 deals.',
    action: 'geo_target_discount',
    actionLabel: 'Run Targeted Follow-Up Campaign',
    impact: 2600,
    confidence: 0.69,
    priority: 'medium',
    reason: 'High pending quote volume + moderate conversion risk',
    trend: 'up',
  },
  {
    id: 'rec_004',
    title: 'High Utilization — Raise Prices',
    description:
      'Technician utilization reached 91%. Demand exceeds capacity by 18%. Optimal price is 12% above current.',
    action: 'increase_price',
    actionLabel: 'Apply Dynamic Pricing (+12%)',
    impact: 1800,
    confidence: 0.76,
    priority: 'medium',
    reason: 'High utilization + demand surplus',
    trend: 'up',
  },
  {
    id: 'rec_005',
    title: 'Same-Day Booking Opportunity',
    description:
      "5 prospects clustered near tomorrow's job routes. A same-day offer could fill 2–3 slots efficiently.",
    action: 'same_day_offer',
    actionLabel: 'Send Same-Day Special Offer',
    impact: 950,
    confidence: 0.65,
    priority: 'low',
    reason: 'Route efficiency + geographic proximity',
    trend: 'neutral',
  },
];

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  getRecommendations(_companyId: string): Recommendation[] {
    const scored = RAW_RECOMMENDATIONS.map((r) => ({
      ...r,
      priorityScore: Math.round(r.impact * r.confidence),
    }));

    return scored
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5);
  }

  executeAction(
    companyId: string,
    action: string,
    params: Record<string, unknown>,
  ): ExecuteActionResult {
    this.logger.log(
      `[${companyId}] Executing action: ${action} | params: ${JSON.stringify(params)}`,
    );

    return {
      success: true,
      action,
      executedAt: new Date().toISOString(),
      message: `Action "${action}" queued for execution.`,
    };
  }
}

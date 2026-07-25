import { Injectable, Logger } from '@nestjs/common';
import { ActionExecutorService } from './action-executor.service';
import { ExecutionLoggerService } from './execution-logger.service';
import { RecommendationEngineService } from './recommendation-engine.service';

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
  logId?: string;
  result?: {
    summary: string;
    details: Record<string, unknown>;
    affectedCount?: number;
    estimatedRevenue?: number;
  };
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly executor: ActionExecutorService,
    private readonly execLog: ExecutionLoggerService,
    private readonly engine: RecommendationEngineService,
  ) {}

  getRecommendations(companyId: string, forecastDays?: number): Promise<Recommendation[]> {
    return this.engine.generate(companyId, forecastDays);
  }

  async executeAction(
    companyId: string,
    action: string,
    params: Record<string, unknown>,
  ): Promise<ExecuteActionResult> {
    this.logger.log(
      `[${companyId}] executing: ${action} | params: ${JSON.stringify(params)}`,
    );

    try {
      const result = await this.executor.run(companyId, action, params);
      const log    = this.execLog.record(companyId, action, params, 'executed', result);

      return {
        success:    true,
        action,
        executedAt: log.timestamp,
        message:    `Action "${action}" executed successfully.`,
        logId:      log.id,
        result,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.execLog.record(companyId, action, params, 'failed', undefined, error);
      throw err;
    }
  }

  getExecutionLogs(companyId: string, limit?: number) {
    return this.execLog.getByCompany(companyId, limit);
  }
}

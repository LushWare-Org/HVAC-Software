import { Injectable, Logger } from '@nestjs/common';
import type { ActionResult } from './action-executor.service';

export interface ExecutionLog {
  id:                string;
  companyId:         string;
  action:            string;
  params:            Record<string, unknown>;
  status:            'executed' | 'failed';
  timestamp:         string;
  result_summary?:   string;
  affected_count?:   number;
  estimated_revenue?: number;
  error?:            string;
}

@Injectable()
export class ExecutionLoggerService {
  private readonly logger = new Logger(ExecutionLoggerService.name);

  // In-memory store. In production replace the push/filter calls with:
  //   db.execution_logs.insertOne(log)  /  db.execution_logs.find({ companyId })
  private readonly store: ExecutionLog[] = [];

  record(
    companyId: string,
    action:    string,
    params:    Record<string, unknown>,
    status:    'executed' | 'failed',
    result?:   Partial<ActionResult>,
    error?:    string,
  ): ExecutionLog {
    const log: ExecutionLog = {
      id:                `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      companyId,
      action,
      params,
      status,
      timestamp:         new Date().toISOString(),
      result_summary:    result?.summary,
      affected_count:    result?.affectedCount,
      estimated_revenue: result?.estimatedRevenue,
      error,
    };

    this.store.push(log);
    this.logger.log(`[${companyId}] exec log ${log.id}: ${action} → ${status}`);
    return log;
  }

  getByCompany(companyId: string, limit = 50): ExecutionLog[] {
    return this.store
      .filter((l) => l.companyId === companyId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

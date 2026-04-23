import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

// Python analytics service URL — set REVENUE_AGENT_URL env var in production
const PYTHON_URL = (process.env.REVENUE_AGENT_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');

export interface AgentSummary {
  revenue_accuracy: number;
  revenue_mean_error: number;
  demand_accuracy: number;
  utilization_accuracy: number;
  action_success_rate: number;
  pricing_impact: number;
  sample_size: number;
}

export interface AgentTrendPoint {
  date: string;
  revenue_accuracy: number;
  demand_accuracy: number;
  utilization_accuracy: number;
  action_success_rate: number;
  pricing_impact: number;
  sample_size: number;
}

export interface AgentLog {
  timestamp: string;
  action?: string;
  predicted_revenue?: number;
  actual_revenue?: number;
  baseline_revenue?: number;
  expected_demand?: number;
  actual_demand?: number;
  utilization_predicted?: number;
  utilization_actual?: number;
  [key: string]: unknown;
}

const EMPTY_SUMMARY: AgentSummary = {
  revenue_accuracy: 0,
  revenue_mean_error: 0,
  demand_accuracy: 0,
  utilization_accuracy: 0,
  action_success_rate: 0,
  pricing_impact: 0,
  sample_size: 0,
};

@Injectable()
export class RevenueAgentService {
  private readonly logger = new Logger(RevenueAgentService.name);

  // Proxy a GET to the Python service; resolve to defaultValue on any failure.
  private fetch<T>(path: string, defaultValue: T): Promise<T> {
    const url = `${PYTHON_URL}${path}`;
    const client = url.startsWith('https') ? https : http;

    return new Promise((resolve) => {
      const req = client.get(url, { timeout: 3000 }, (res) => {
        if (res.statusCode !== 200) {
          this.logger.debug(`Python agent ${path} → ${res.statusCode}`);
          res.resume();
          resolve(defaultValue);
          return;
        }

        let raw = '';
        res.on('data', (chunk: string) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw) as T);
          } catch {
            resolve(defaultValue);
          }
        });
      });

      req.on('error', () => {
        this.logger.debug(`Python agent unreachable at ${PYTHON_URL}`);
        resolve(defaultValue);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(defaultValue);
      });
    });
  }

  getSummary(): Promise<AgentSummary> {
    return this.fetch<AgentSummary>('/analytics/summary', EMPTY_SUMMARY);
  }

  getTrends(limit: number): Promise<AgentTrendPoint[]> {
    return this.fetch<AgentTrendPoint[]>(`/analytics/trends?limit=${limit}`, []);
  }

  getLogs(limit: number): Promise<AgentLog[]> {
    return this.fetch<AgentLog[]>(`/analytics/logs?limit=${limit}`, []);
  }
}

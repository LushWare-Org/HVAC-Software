import { ChurnGateService } from './churn-gate.service';

describe('ChurnGateService', () => {
  let service: ChurnGateService;

  beforeEach(() => {
    service = new ChurnGateService();
  });

  it('passes gate for a recently-serviced, established customer', async () => {
    const result = await service.scoreAndGate({
      days_since_last_service: 30,
      service_count_last_year: 2,
      avg_monthly_spend: 150,
      customer_tenure_days: 365,
    });
    expect(result.score).toBeCloseTo(0.08);
    expect(result.passed).toBe(true);
  });

  it('blocks gate for a long-inactive customer with no service last year', async () => {
    const result = await service.scoreAndGate({
      days_since_last_service: 200,
      service_count_last_year: 0,
      avg_monthly_spend: 50,
      customer_tenure_days: 400,
    });
    expect(result.score).toBeCloseTo(0.7);
    expect(result.passed).toBe(false);
  });

  it('passes gate just under the threshold', async () => {
    // 90 < days <= 180 (0.25) + service_count_last_year === 0 (0.25) + tenure < 90 (0.08) = 0.58
    const result = await service.scoreAndGate({
      days_since_last_service: 100,
      service_count_last_year: 0,
      avg_monthly_spend: 100,
      customer_tenure_days: 60,
    });
    expect(result.score).toBeCloseTo(0.58);
    expect(result.passed).toBe(true);
  });

  it('blocks gate for the highest-risk combination (long inactive, no service, new tenure)', async () => {
    const result = await service.scoreAndGate({
      days_since_last_service: 400,
      service_count_last_year: 0,
      avg_monthly_spend: 0,
      customer_tenure_days: 10,
    });
    expect(result.score).toBeCloseTo(0.78);
    expect(result.passed).toBe(false);
  });
});

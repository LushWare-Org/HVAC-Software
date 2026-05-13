import { ChurnGateService } from './churn-gate.service';

describe('ChurnGateService', () => {
  let service: ChurnGateService;

  beforeEach(() => {
    service = new ChurnGateService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const input = { days_since_last_service: 30, service_count_last_year: 2, avg_monthly_spend: 150, customer_tenure_days: 365 };

  it('passes gate when churn probability <= 0.6', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ churn_probability: 0.3 }), { status: 200 }),
    );
    const result = await service.scoreAndGate(input);
    expect(result.score).toBeCloseTo(0.3);
    expect(result.passed).toBe(true);
  });

  it('blocks gate when churn probability > 0.6', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ churn_probability: 0.75 }), { status: 200 }),
    );
    const result = await service.scoreAndGate(input);
    expect(result.score).toBeCloseTo(0.75);
    expect(result.passed).toBe(false);
  });

  it('passes gate at exactly the threshold (0.6 = pass)', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ churn_probability: 0.6 }), { status: 200 }),
    );
    const result = await service.scoreAndGate(input);
    expect(result.passed).toBe(true);
  });

  it('fails open when churn-service is unavailable', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await service.scoreAndGate(input);
    expect(result.score).toBe(-1);
    expect(result.passed).toBe(true);
  });

  it('fails open when churn-service returns non-200', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('error', { status: 503 }));
    const result = await service.scoreAndGate(input);
    expect(result.passed).toBe(true);
  });
});

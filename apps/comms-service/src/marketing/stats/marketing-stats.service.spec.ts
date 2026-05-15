import { MarketingStatsService } from './marketing-stats.service';

function makeDb(overrides: Record<string, any> = {}) {
  return {
    sendJob: { count: jest.fn().mockResolvedValue(100) },
    sendEvent: { count: jest.fn().mockResolvedValue(80) },
    reviewRequest: { count: jest.fn().mockResolvedValue(5) },
    campaign: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    ...overrides,
  };
}

describe('MarketingStatsService', () => {
  it('returns KPI rates computed from counts', async () => {
    const db = makeDb({
      sendJob: { count: jest.fn().mockResolvedValue(100) },
      sendEvent: {
        count: jest.fn()
          .mockResolvedValueOnce(90)   // delivered
          .mockResolvedValueOnce(45)   // opened
          .mockResolvedValueOnce(10),  // clicked
      },
      reviewRequest: { count: jest.fn().mockResolvedValue(3) },
    });
    const svc = new MarketingStatsService(db as any);
    const result = await svc.getKpis('co-1', '30d');
    expect(result.sent).toBe(100);
    expect(result.deliveryRate).toBe(90);
    expect(result.openRate).toBe(50); // 45/90
    expect(result.clickRate).toBe(22); // 10/45 ≈ 22%
    expect(result.reviewsSent).toBe(3);
  });

  it('returns zero rates when sent is 0', async () => {
    const db = makeDb({
      sendJob: { count: jest.fn().mockResolvedValue(0) },
      sendEvent: { count: jest.fn().mockResolvedValue(0) },
      reviewRequest: { count: jest.fn().mockResolvedValue(0) },
    });
    const svc = new MarketingStatsService(db as any);
    const result = await svc.getKpis('co-1', '7d');
    expect(result.deliveryRate).toBe(0);
    expect(result.openRate).toBe(0);
    expect(result.clickRate).toBe(0);
  });

  it('getCampaignStats aggregates events per campaign', async () => {
    const db = makeDb({
      campaign: {
        findMany: jest.fn().mockResolvedValue([{
          id: 'c-1', name: 'May Blast', channel: 'SMS', status: 'SENT', createdAt: new Date(),
          sendJobs: [
            { id: 'sj-1', status: 'SENT', events: [{ eventType: 'DELIVERED' }, { eventType: 'CLICKED' }] },
            { id: 'sj-2', status: 'FAILED', events: [{ eventType: 'BOUNCED' }] },
          ],
        }]),
      },
    });
    const svc = new MarketingStatsService(db as any);
    const [campaign] = await svc.getCampaignStats('co-1', '30d');
    expect(campaign.sent).toBe(2);
    expect(campaign.delivered).toBe(1);
    expect(campaign.clicked).toBe(1);
  });

  it('getCampaignFunnel returns null for unknown campaign', async () => {
    const svc = new MarketingStatsService(makeDb() as any);
    const result = await svc.getCampaignFunnel('co-1', 'nonexistent');
    expect(result).toBeNull();
  });
});

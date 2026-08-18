import { CompanySettingsClient } from './company-settings.client';

describe('CompanySettingsClient', () => {
  let client: CompanySettingsClient;
  const fetchMock = jest.fn();
  const realFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as never;
    client = new CompanySettingsClient();
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  const okBody = {
    id: 'co-1',
    name: 'KASE',
    logoUrl: null,
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    features: { sms: false },
  };

  it('fetches and returns settings', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => okBody });
    const s = await client.getSettings('co-1');
    expect(s.currency).toBe('LKR');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches per company for subsequent calls', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => okBody });
    await client.getSettings('co-1');
    await client.getSettings('co-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails open to defaults on HTTP error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const s = await client.getSettings('co-1');
    expect(s.currency).toBe('USD');
    expect(s.features).toEqual({});
  });

  it('fails open to defaults on network error', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const s = await client.getSettings('co-1');
    expect(s.timezone).toBe('America/New_York');
  });

  it('does not cache failures', async () => {
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await client.getSettings('co-1');
    fetchMock.mockResolvedValue({ ok: true, json: async () => okBody });
    const s = await client.getSettings('co-1');
    expect(s.currency).toBe('LKR');
  });

  describe('getDefaultPaymentTermsDays', () => {
    it("returns the default preset's days", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => [
          { isDefault: false, days: 15 },
          { isDefault: true, days: 45 },
        ],
      });
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(45);
    });

    it('falls back to 30 when no preset is marked default', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => [{ isDefault: false, days: 15 }] });
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(30);
    });

    it('falls back to 30 on HTTP error', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 });
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(30);
    });

    it('falls back to 30 on network error', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
      const days = await client.getDefaultPaymentTermsDays('co-1');
      expect(days).toBe(30);
    });
  });
});

import { CrmClient } from './crm.client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CrmClient.getDefaultCurrency', () => {
  let client: CrmClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CrmClient();
  });

  it('returns the tenant currency from crm-service settings', async () => {
    mockedAxios.get.mockResolvedValue({ data: { currency: 'LKR' } });
    const result = await client.getDefaultCurrency('co-1');
    expect(result).toBe('LKR');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/company/settings'),
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('falls back to USD when the crm-service call fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network down'));
    const result = await client.getDefaultCurrency('co-1');
    expect(result).toBe('USD');
  });

  it('falls back to USD when the response has no currency field', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} });
    const result = await client.getDefaultCurrency('co-1');
    expect(result).toBe('USD');
  });
});

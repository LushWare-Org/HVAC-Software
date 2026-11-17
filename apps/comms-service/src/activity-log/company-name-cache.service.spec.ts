import { CompanyNameCacheService } from './company-name-cache.service';

describe('CompanyNameCacheService', () => {
  it('fetches a company name once and caches it for subsequent calls', async () => {
    const fetcher = jest.fn().mockResolvedValue('Acme HVAC');
    const cache = new CompanyNameCacheService(fetcher);

    const first = await cache.resolve('co-1');
    const second = await cache.resolve('co-1');

    expect(first).toBe('Acme HVAC');
    expect(second).toBe('Acme HVAC');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('falls back to the raw id when the fetch fails', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('down'));
    const cache = new CompanyNameCacheService(fetcher);

    const result = await cache.resolve('co-2');

    expect(result).toBe('co-2');
  });

  it('returns "Unknown" for a null companyId without calling the fetcher', async () => {
    const fetcher = jest.fn();
    const cache = new CompanyNameCacheService(fetcher);

    const result = await cache.resolve(null);

    expect(result).toBe('Unknown');
    expect(fetcher).not.toHaveBeenCalled();
  });
});

import { DocumentTemplateClient } from './document-template.client';

const originalFetch = global.fetch;

describe('DocumentTemplateClient', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the resolved template on a successful call', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 't1', documentType: 'INVOICE', mode: 'BUILDER' }),
    }) as any;
    const client = new DocumentTemplateClient();
    const result = await client.resolve('co-1', 'INVOICE', 't1');
    expect(result?.id).toBe('t1');
  });

  it('returns null (not throw) when the upstream call fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any;
    const client = new DocumentTemplateClient();
    const result = await client.resolve('co-1', 'INVOICE');
    expect(result).toBeNull();
  });

  it('returns null when crm-service has no template for this company/type', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => null }) as any;
    const client = new DocumentTemplateClient();
    const result = await client.resolve('co-1', 'INVOICE');
    expect(result).toBeNull();
  });

  it('caches a resolved template for the same companyId+documentType+templateId', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 't1', documentType: 'INVOICE' }),
    });
    global.fetch = fetchMock as any;
    const client = new DocumentTemplateClient();
    await client.resolve('co-1', 'INVOICE', 't1');
    await client.resolve('co-1', 'INVOICE', 't1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

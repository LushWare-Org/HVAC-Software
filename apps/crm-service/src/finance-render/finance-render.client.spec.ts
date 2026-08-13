import { FinanceRenderClient } from './finance-render.client';
import axios from 'axios';

jest.mock('axios');

describe('FinanceRenderClient', () => {
  it('posts the agreement context and returns the PDF buffer', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: Buffer.from('pdf-bytes') });
    const client = new FinanceRenderClient();
    const result = await client.renderAgreement({
      companyId: 'co-1', companyName: 'Acme', companyAddress: '1 St',
      context: { name: 'X', customerName: 'Y', customerEmail: 'y@x.com', startDate: '2026-01-01' },
    });
    expect(result).toEqual(Buffer.from('pdf-bytes'));
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/internal/documents/render'),
      expect.objectContaining({ companyId: 'co-1' }),
      expect.objectContaining({ responseType: 'arraybuffer' }),
    );
  });
});

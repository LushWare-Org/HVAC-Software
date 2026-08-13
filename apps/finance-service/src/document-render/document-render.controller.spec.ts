import { DocumentRenderController } from './document-render.controller';

function makePdfService() {
  return {
    generateAgreementPdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
    renderQuoteHtml: jest.fn().mockReturnValue('<html>quote</html>'),
    renderInvoiceHtml: jest.fn().mockReturnValue('<html>invoice</html>'),
    renderAgreementHtml: jest.fn().mockReturnValue('<html>agreement</html>'),
  };
}
function makeTemplateClient() {
  return { resolve: jest.fn().mockResolvedValue(null) };
}

describe('DocumentRenderController', () => {
  it('renderAgreement resolves the template then generates a PDF', async () => {
    const pdf = makePdfService();
    const templates = makeTemplateClient();
    const controller = new DocumentRenderController(pdf as any, templates as any);
    const res: any = { set: jest.fn(), end: jest.fn() };
    await controller.renderAgreement(
      { companyId: 'co-1', templateId: 't1', context: { name: 'X', customerName: 'Y', customerEmail: 'y@x.com', startDate: '2026-01-01' }, companyName: 'Acme', companyAddress: '1 St' },
      res,
    );
    expect(templates.resolve).toHaveBeenCalledWith('co-1', 'AGREEMENT', 't1');
    expect(pdf.generateAgreementPdf).toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith(Buffer.from('pdf-bytes'));
  });

  it('preview returns HTML for the requested documentType using draft template fields directly (no DB lookup)', () => {
    const pdf = makePdfService();
    const templates = makeTemplateClient();
    const controller = new DocumentRenderController(pdf as any, templates as any);
    const result = controller.preview({ documentType: 'QUOTE', template: { mode: 'BUILDER', accentColor: '#111' } } as any);
    expect(templates.resolve).not.toHaveBeenCalled();
    expect(result).toEqual({ html: '<html>quote</html>' });
  });
});

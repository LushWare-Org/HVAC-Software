import { PdfService } from './pdf.service';
import type { DocumentTemplateConfig } from '../document-templates/document-template.client';
import { DEFAULT_ROWS } from './slots';

const baseQuote: any = {
  quoteNumber: 'Q-1', status: 'DRAFT', customerName: 'Amara', customerEmail: 'a@x.com',
  title: 'HVAC service', description: '', createdAt: new Date(), validUntil: null, jobId: null,
  lineItems: [], subtotal: 0, discountAmount: 0, discountType: null, discountValue: null,
  taxRate: 0, taxAmount: 0, total: 0, approvedAt: null, approvedByName: null, approvedByEmail: null,
  notes: null, terms: null,
};

describe('PdfService — template-aware rendering', () => {
  const service = new PdfService();

  it('with no template, renders the existing hardcoded hero (backward compatible)', () => {
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Acme HVAC');
    expect(html).not.toContain('letterhead-bg');
  });

  it('a template with a companyName/companyAddress override wins over the tenant settings values', () => {
    const template: DocumentTemplateConfig = {
      id: 't4', documentType: 'QUOTE', mode: 'BUILDER',
      companyName: 'Orrix Engineering (Pvt) Ltd', companyAddress: '12 Galle Rd, Colombo',
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toContain('Orrix Engineering (Pvt) Ltd');
    expect(html).toContain('12 Galle Rd, Colombo');
    expect(html).not.toContain('Acme HVAC');
  });

  it('falls back to the tenant settings name/address when the template has no override', () => {
    const template: DocumentTemplateConfig = { id: 't5', documentType: 'QUOTE', mode: 'BUILDER' };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toContain('Acme HVAC');
  });

  it('builder mode template injects logo, accent color, and footer text', () => {
    const template: DocumentTemplateConfig = {
      id: 't1', documentType: 'QUOTE', mode: 'BUILDER',
      logoUrl: 'https://cdn.example.com/logo.png', logoPosition: 'LEFT', accentColor: '#ff0000',
      headerText: 'Est. 1998', footerText: 'Thank you for your business', bankDetails: 'Acc #12345',
      showPageNumbers: true,
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toContain('https://cdn.example.com/logo.png');
    expect(html).toContain('#ff0000');
    expect(html).toContain('Est. 1998');
    expect(html).toContain('Thank you for your business');
    expect(html).toContain('Acc #12345');
  });

  it('accent color repaints only the header background, leaving label/text colors untouched', () => {
    const template: DocumentTemplateConfig = { id: 't3', documentType: 'QUOTE', mode: 'BUILDER', accentColor: '#ff0000' };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toMatch(/\.hero\s*\{[^}]*background:\s*#ff0000/);
    // The bug: accent color must NOT also repaint the eyebrow/doc-label/summary-label
    // text — doing so makes light accent colors blend invisibly into the same-colored
    // background (reported via screenshot: header looked "washed out").
    expect(html).not.toMatch(/\.eyebrow,\s*\.doc-label,\s*\.summary-label\s*\{[^}]*#ff0000/);
  });

  it('with no custom rows, renders the default arrangement (backward compatible)', () => {
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Acme HVAC');
    expect(html).toContain('Q-1');
  });

  it('a custom hero-canvas block position/size/style renders as free-form absolute placement', () => {
    const template: DocumentTemplateConfig = {
      id: 't8', documentType: 'QUOTE', mode: 'BUILDER',
      rows: [
        { id: 'r1', section: 'hero', blocks: [{ id: 'b1', slot: 'quote/companyName', widthPct: 100, x: 240, y: 88, widthPx: 300, style: { color: '#ff0000', fontSize: 30 } }] },
      ],
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toMatch(/data-slot="quote\/companyName"[^>]*style="position:\s*absolute;\s*left:\s*240px;\s*top:\s*88px;\s*width:\s*300px;\s*font-size:\s*30px;\s*color:\s*#ff0000;"/);
    expect(html).toContain('Acme HVAC');
  });

  it('a block style override beats the partial\'s own explicit CSS color/font (the actual reported bug)', () => {
    // .brand-name in the stylesheet has its own explicit `color: #ffffff` — setting a
    // block style on the wrapping .tpl-block alone would be invisible (inheritance never
    // overrides an explicit rule on the child). This is the scoped !important stylesheet
    // that fixes it.
    const template: DocumentTemplateConfig = {
      id: 't10', documentType: 'QUOTE', mode: 'BUILDER',
      rows: [{ id: 'r1', section: 'hero', blocks: [{ id: 'b-companyName', slot: 'quote/companyName', widthPct: 100, x: 0, y: 0, widthPx: 300, style: { color: '#ff0000' } }] }],
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toMatch(/<style>\[data-block-id="b-companyName"\] > \* \{[^}]*color:\s*#ff0000\s*!important;[^}]*\}<\/style>/);
  });

  it('a custom body-row block arrangement still renders with widthPct-based flow layout', () => {
    const template: DocumentTemplateConfig = {
      id: 't9', documentType: 'QUOTE', mode: 'BUILDER',
      rows: [
        ...DEFAULT_ROWS.QUOTE.filter(r => r.section === 'hero'),
        { id: 'r2', section: 'body', blocks: [{ id: 'b2', slot: 'quote/notesCard', widthPct: 40 }] },
      ],
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toMatch(/data-slot="quote\/notesCard"[^>]*style="width:40%;/);
  });

  it('a row containing the line-items table still renders every row for a large line-item count (no truncation)', () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      description: `Item ${i}`, category: 'LABOUR', quantity: 1, unitPriceFmt: '$10.00', lineTotalFmt: '$10.00', taxable: true, sortOrder: i,
    }));
    const bigQuote = { ...baseQuote, lineItems: manyItems };
    const html = service.renderQuoteHtml(bigQuote as any, 'Acme HVAC', '123 Main St');
    for (let i = 0; i < 25; i++) expect(html).toContain(`Item ${i}`);
  });

  it('bank details render in a dedicated payment section, not the footer strip', () => {
    const template: DocumentTemplateConfig = { id: 't6', documentType: 'QUOTE', mode: 'BUILDER', bankDetails: 'Acc #12345' };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toContain('Acc #12345');
    expect(html).not.toContain('footer-bank');
    expect(html).toMatch(/class="[^"]*payment-details-card[^"]*"[^>]*>[\s\S]{0,300}Acc #12345/);
  });

  it('letterhead mode crops the uploaded image to just the header band, not the whole page', () => {
    const template: DocumentTemplateConfig = {
      id: 't2', documentType: 'QUOTE', mode: 'LETTERHEAD',
      letterheadImageUrl: 'https://cdn.example.com/letterhead.png',
      letterheadTopMarginPx: 150, letterheadBottomMarginPx: 90,
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    // The image must live on a fixed-height header band (height 150px) — CSS backgrounds
    // clip to their element's box, so this is what actually confines the artwork to the
    // top of the page instead of it stretching across the whole document.
    expect(html).toMatch(/height:\s*150px;[^"]*background-image:\s*url\('https:\/\/cdn\.example\.com\/letterhead\.png'\)/);
    expect(html).toContain('90px');
    // The old bug: the image must NOT be set as the whole-page .sheet background.
    expect(html).not.toMatch(/\.sheet\s*\{[^}]*background-image/);
    // Only the header band gets the image — the bottom safe zone stays a blank spacer.
    expect(html).not.toMatch(/background-position:\s*bottom/);
  });
});

describe('PdfService — agreement rendering', () => {
  const service = new PdfService();
  const context = {
    name: 'Annual AC Maintenance', description: 'Two visits per year',
    customerName: 'Kamal Perera', customerEmail: 'kamal@example.com',
    startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
    serviceType: 'AC Maintenance', serviceInterval: 'BI_ANNUAL',
    visitsIncluded: 2, visitsUsed: 1,
    billingAmount: 250, billingCycle: 'ANNUAL', nextBillingDate: new Date('2027-01-01'),
    signedByName: null, signedAt: null,
  };

  it('renders parties, schedule, and pricing', () => {
    const html = service.renderAgreementHtml(context as any, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Annual AC Maintenance');
    expect(html).toContain('Kamal Perera');
    expect(html).toContain('AC Maintenance');
  });

  it('shows blank signature lines when unsigned', () => {
    const html = service.renderAgreementHtml(context as any, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Customer Representative');
  });

  it('prints the signed name/date when signed', () => {
    const signed = { ...context, signedByName: 'Kamal Perera', signedAt: new Date('2026-01-02') };
    const html = service.renderAgreementHtml(signed as any, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Kamal Perera');
  });
});

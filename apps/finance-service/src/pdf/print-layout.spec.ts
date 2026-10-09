import { pdfOptions, withPrintLayout } from './print-layout';

const html = '<html><head><style>.page{}</style></head><body><div class="page"></div></body></html>';

describe('withPrintLayout', () => {
  it('adds print rules before </head>, on A4 unless the template asks for Letter', () => {
    const a4 = withPrintLayout(html);
    expect(a4).toContain('@page { size: A4;');
    expect(a4.indexOf('@page')).toBeLessThan(a4.indexOf('</head>'));
    expect(withPrintLayout(html, 'LETTER')).toContain('@page { size: Letter;');
    expect(withPrintLayout(html, 'nonsense' as any)).toContain('@page { size: A4;');
  });

  it('page 1 keeps its full-bleed header; later pages get a top margin', () => {
    const out = withPrintLayout(html);
    expect(out).toMatch(/@page :first \{ margin-top: 0; \}/);
    expect(out).toMatch(/@page \{ size: A4; margin: \d+mm 0 \d+mm 0; \}/);
  });

  it('keeps totals, notes, payment details and the footer whole, and table rows unsplit', () => {
    const out = withPrintLayout(html);
    for (const sel of ['.totals-card', '.note-card', '.payment-section', '.footer', 'tbody tr']) expect(out).toContain(sel);
    expect(out).toContain('break-inside: avoid');
    expect(out).toContain('thead { display: table-header-group; }');
  });

  it('prints as a clean page: no card frame, shadow or grey background', () => {
    expect(withPrintLayout(html)).toMatch(/\.sheet \{[^}]*box-shadow: none[^}]*border-radius: 0/);
  });

  it('leaves a document without a head untouched apart from the rules', () => {
    expect(withPrintLayout('<body>x</body>')).toMatch(/^<style>[\s\S]*<\/style><body>x<\/body>$/);
  });
});

describe('pdfOptions', () => {
  it('uses the page size and margins from the print rules, with page numbers in the bottom margin', () => {
    const o = pdfOptions({ showPageNumbers: true });
    expect(o).toMatchObject({ printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true });
    expect(o).not.toHaveProperty('margin');
    expect(o).not.toHaveProperty('format');
    expect(o.footerTemplate).toContain('pageNumber');
    expect(pdfOptions({}).displayHeaderFooter).toBe(false);
  });

  it('the page-number footer names the document, so a loose page can be matched to it', () => {
    expect(pdfOptions({ showPageNumbers: true, docLabel: 'INV-2026-0042' }).footerTemplate).toContain('INV-2026-0042 · Page <span class="pageNumber">');
    // Document numbers come from data: never inject markup.
    expect(pdfOptions({ showPageNumbers: true, docLabel: '<b>x</b>' }).footerTemplate).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

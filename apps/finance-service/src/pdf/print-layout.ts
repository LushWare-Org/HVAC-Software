/**
 * How documents behave on paper. The templates are designed as an on-screen
 * card (grey page, rounded sheet, shadow); printed across pages that card
 * broke mid-page, page 2 started flush at the top edge, and the totals, notes
 * and footer split or drifted. These rules apply only when printing to PDF, so
 * the on-screen preview stays as designed.
 */
import type { PDFOptions } from 'puppeteer-core';

export type PageSize = 'A4' | 'LETTER';

const PAGE: Record<PageSize, string> = { A4: 'A4', LETTER: 'Letter' };

/** Blocks that should move to the next page whole rather than split. */
const KEEP_WHOLE = [
  'tbody tr', '.info-card', '.summary-card', '.totals-card', '.totals-wrap', '.pay-card', '.payment-section',
  '.note-card', '.footer', '.alert', '.approval-block', '.sig-grid', '.tpl-block:not(:has(table))',
].join(', ');

function printCss(size: PageSize): string {
  return `
    @page { size: ${PAGE[size]}; margin: 14mm 0 16mm 0; }
    @page :first { margin-top: 0; }
    @media print {
      html, body { background: #ffffff !important; }
      .page { max-width: none !important; margin: 0 !important; padding: 0 !important; }
      .sheet { box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
      thead { display: table-header-group; }
      ${KEEP_WHOLE} { break-inside: avoid; page-break-inside: avoid; }
      .section-title, .section-subtitle, .section-heading { break-after: avoid; page-break-after: avoid; }
    }`;
}

/** The document with its print rules; A4 unless the template asks for Letter. */
export function withPrintLayout(html: string, pageSize?: PageSize | null): string {
  const size: PageSize = pageSize && pageSize in PAGE ? pageSize : 'A4';
  const style = `<style>${printCss(size)}</style>`;
  const at = html.indexOf('</head>');
  return at >= 0 ? html.slice(0, at) + style + html.slice(at) : style + html;
}

/** Printer settings: page size and margins come from the print rules above. */
const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** docLabel: the document's number ("INV-2026-0042"), shown next to the page number. */
export function pdfOptions(opts: { showPageNumbers?: boolean; docLabel?: string | null }): PDFOptions {
  const label = opts.docLabel ? `${escapeHtml(opts.docLabel)} · ` : '';
  return {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: !!opts.showPageNumbers,
    headerTemplate: '<span></span>',
    footerTemplate: opts.showPageNumbers
      ? `<div style="width:100%;font-size:9px;text-align:center;color:#94a3b8;font-family:Arial,sans-serif;">${label}Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`
      : '<span></span>',
  };
}

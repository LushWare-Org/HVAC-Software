/**
 * PdfService
 * Renders Handlebars templates → HTML → PDF via Puppeteer.
 * Uses @sparticuz/chromium so the binary works inside Lambda / Docker without
 * installing a system-level Chrome.
 *
 * All money values are pre-formatted (e.g. "$1,234.56") before being passed
 * to the template so the HBS template stays logic-free.
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import type { Quote, QuoteLineItem, Invoice, InvoiceLineItem, Payment } from '../prisma/generated';
import type { Browser } from 'puppeteer-core';
import { formatMoneySrv, formatDateSrv } from './format';
import type { DocumentTemplateConfig } from '../document-templates/document-template.client';
import { DEFAULT_ROWS, HERO_CANVAS_HEIGHT, type TemplateRow, type TemplateBlock } from './slots';

// ── Money/date formatting lives in ./format (currency + timezone aware) ─────
export interface PdfRenderOpts { currency: string; timezone: string }
const DEFAULT_RENDER_OPTS: PdfRenderOpts = { currency: 'USD', timezone: 'America/New_York' };

const pct = (val: number | { toString(): string } | null | undefined): string => {
  const n = typeof val === 'number' ? val : parseFloat((val ?? 0).toString());
  return (n * 100).toFixed(2).replace(/\.?0+$/, '');
};


// ── Handlebars helpers for the slot layout system ───────────────────────────
// Each document's Builder-mode body is a rows→blocks loop (see slots.ts); these
// helpers let the generic layout template pick the right partial per block and
// apply that block's per-field style (font/color for text slots, background/
// border/padding for box slots) without any logic living in the .hbs itself.
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('blockStyle', (style: Record<string, unknown> | undefined) => {
  if (!style) return '';
  const parts: string[] = [];
  if (style.fontFamily) parts.push(`font-family: ${style.fontFamily};`);
  if (style.fontSize) parts.push(`font-size: ${style.fontSize}px;`);
  if (style.fontWeight) parts.push(`font-weight: ${style.fontWeight};`);
  if (style.color) parts.push(`color: ${style.color};`);
  if (style.align) parts.push(`text-align: ${style.align};`);
  if (style.background) parts.push(`background: ${style.background};`);
  if (style.borderColor) parts.push(`border-color: ${style.borderColor};`);
  if (typeof style.borderRadiusPx === 'number') parts.push(`border-radius: ${style.borderRadiusPx}px;`);
  if (typeof style.paddingPx === 'number') parts.push(`padding: ${style.paddingPx}px;`);
  return new Handlebars.SafeString(parts.join(' '));
});
// A block's style is set on its `.tpl-block` wrapper, but the partial's actual content
// element (e.g. `.brand-name`, `.doc-card`) has its own explicit color/font/background
// in the stylesheet — inheritance never overrides an explicit rule on the child, so the
// wrapper's inline style alone is invisible for exactly the properties admins want to
// change. This renders a tiny scoped stylesheet targeting that block's direct content
// children with !important, which reliably wins regardless of the partial's own CSS.
Handlebars.registerHelper('blockStyleOverride', (blockId: string, style: Record<string, unknown> | undefined) => {
  if (!style) return '';
  const parts: string[] = [];
  if (style.fontFamily) parts.push(`font-family: ${style.fontFamily} !important;`);
  if (style.fontSize) parts.push(`font-size: ${style.fontSize}px !important;`);
  if (style.fontWeight) parts.push(`font-weight: ${style.fontWeight} !important;`);
  if (style.color) parts.push(`color: ${style.color} !important;`);
  if (style.align) parts.push(`text-align: ${style.align} !important;`);
  if (style.background) parts.push(`background: ${style.background} !important;`);
  if (style.borderColor) parts.push(`border-color: ${style.borderColor} !important;`);
  if (typeof style.borderRadiusPx === 'number') parts.push(`border-radius: ${style.borderRadiusPx}px !important;`);
  if (typeof style.paddingPx === 'number') parts.push(`padding: ${style.paddingPx}px !important;`);
  if (parts.length === 0) return '';
  return new Handlebars.SafeString(`<style>[data-block-id="${blockId}"] > * { ${parts.join(' ')} }</style>`);
});
// Hero-section blocks are free-positioned anywhere on the header canvas (literally
// draggable to any x/y) since they're all fixed-size — unlike body-section blocks
// (table, notes, …) whose height depends on real document data, so those stay
// row/flow-based via `blockStyle` + width-percentage instead.
Handlebars.registerHelper('heroBlockStyle', (block: TemplateBlock) => {
  const parts = [`position: absolute;`, `left: ${block.x ?? 0}px;`, `top: ${block.y ?? 0}px;`, `width: ${block.widthPx ?? 300}px;`];
  const styleStr = Handlebars.helpers.blockStyle(block.style);
  return new Handlebars.SafeString(`${parts.join(' ')} ${styleStr}`);
});

// ── Template cache ───────────────────────────────────────────────────────────
const templateCache = new Map<string, HandlebarsTemplateDelegate>();
const partialsRegistered = new Set<string>();

/** Registers every slot partial for a document type, once, from apps/finance-service/src/pdf/templates/partials/<docType>/<name>.hbs. */
function registerPartialsOnce(docType: 'invoice' | 'quote' | 'agreement' | 'payment-receipt', names: string[]): void {
  if (partialsRegistered.has(docType)) return;
  const dir = path.join(__dirname, 'templates', 'partials', docType);
  for (const name of names) {
    const src = fs.readFileSync(path.join(dir, `${name}.hbs`), 'utf-8');
    Handlebars.registerPartial(`${docType}/${name}`, src);
  }
  partialsRegistered.add(docType);
}

const INVOICE_SLOT_NAMES = ['logo', 'docBadge', 'tagline', 'companyName', 'companyAddress', 'headerText', 'billTo', 'balanceDueCard', 'infoGrid', 'lineItemsTable', 'totalsCard', 'paymentHistory', 'notesCard', 'termsCard', 'bankDetailsCard', 'footerText', 'pageFooterMeta'];
const QUOTE_SLOT_NAMES = ['logo', 'docBadge', 'tagline', 'companyName', 'companyAddress', 'headerText', 'scopeOfWorkCard', 'quotedTotalCard', 'infoGrid', 'lineItemsTable', 'totalsCard', 'approvalBlock', 'notesCard', 'termsCard', 'bankDetailsCard', 'footerText', 'pageFooterMeta'];
const AGREEMENT_SLOT_NAMES = ['logo', 'docBadge', 'tagline', 'companyName', 'companyAddress', 'headerText', 'partiesSection', 'scheduleSection', 'pricingSection', 'notesSection', 'bankDetailsSection', 'signatureBlock', 'footerText'];
const PAYMENT_RECEIPT_SLOT_NAMES = ['logo', 'docBadge', 'tagline', 'companyName', 'companyAddress', 'headerText', 'paidByCard', 'amountPaidCard', 'infoGrid', 'paymentSummaryCard', 'notesCard', 'footerText', 'pageFooterMeta'];

function loadTemplate(name: string): HandlebarsTemplateDelegate {
  if (templateCache.has(name)) return templateCache.get(name)!;
  const tplPath = path.join(__dirname, 'templates', `${name}.hbs`);
  const source = fs.readFileSync(tplPath, 'utf-8');
  const compiled = Handlebars.compile(source);
  templateCache.set(name, compiled);
  return compiled;
}

// ── Types ────────────────────────────────────────────────────────────────────
type QuoteWithItems = Quote & { lineItems: QuoteLineItem[] };
type InvoiceWithRelations = Invoice & {
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  quote?: { quoteNumber: string } | null;
};

export interface PaymentReceiptContext {
  receiptNumber: string;
  amount: number | { toString(): string };
  paymentMethod: string;
  paidAt: Date;
  notes?: string | null;
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  invoiceTotal: number | { toString(): string };
  balanceDue: number | { toString(): string };
}

export interface AgreementPdfContext {
  name: string;
  description?: string | null;
  customerName: string;
  customerEmail: string;
  startDate: Date;
  endDate?: Date | null;
  serviceType?: string | null;
  serviceInterval?: string | null;
  visitsIncluded?: number | null;
  visitsUsed?: number;
  billingAmount?: number | { toString(): string } | null;
  billingCycle?: string | null;
  nextBillingDate?: Date | null;
  signedByName?: string | null;
  signedAt?: Date | null;
}

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);

  // ── Browser pool ───────────────────────────────────────────────────────────
  // Previously this service launched a fresh Chromium per request and closed
  // it immediately (~1-3s cold-start each — the dominant cost of a PDF
  // request). Now we keep a singleton Browser instance for the lifetime of
  // the Nest module and use a fresh Page per request.
  //
  // Concurrency is bounded by `MAX_CONCURRENT_PDFS` so a burst of API calls
  // can't open hundreds of tabs at once and OOM the container.
  //
  // The browser is launched lazily on first use; if it crashes (closes
  // unexpectedly), the next request relaunches it.
  private browserPromise: Promise<Browser> | null = null;
  private inflight = 0;
  private readonly waiters: Array<() => void> = [];
  private static readonly MAX_CONCURRENT_PDFS = Number(process.env.PDF_MAX_CONCURRENT) > 0
    ? Number(process.env.PDF_MAX_CONCURRENT)
    : 4;

  async onModuleDestroy() {
    if (this.browserPromise) {
      try {
        const b = await this.browserPromise;
        await b.close();
      } catch {
        // ignore — we're shutting down anyway
      }
      this.browserPromise = null;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async generateQuotePdf(
    quote: QuoteWithItems, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): Promise<Buffer> {
    const html = this.renderQuoteHtml(quote, companyName, companyAddress, opts, template);
    return this.htmlToPdf(html, { showPageNumbers: template?.showPageNumbers ?? false });
  }

  async generateInvoicePdf(
    invoice: InvoiceWithRelations,
    companyName: string,
    companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS,
    template?: DocumentTemplateConfig | null,
  ): Promise<Buffer> {
    const html = this.renderInvoiceHtml(invoice, companyName, companyAddress, opts, template);
    return this.htmlToPdf(html, { showPageNumbers: template?.showPageNumbers ?? false });
  }

  async generateAgreementPdf(
    context: AgreementPdfContext, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): Promise<Buffer> {
    const html = this.renderAgreementHtml(context, companyName, companyAddress, opts, template);
    return this.htmlToPdf(html, { showPageNumbers: template?.showPageNumbers ?? false });
  }

  async generatePaymentReceiptPdf(
    context: PaymentReceiptContext, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): Promise<Buffer> {
    const html = this.renderPaymentReceiptHtml(context, companyName, companyAddress, opts, template);
    return this.htmlToPdf(html, { showPageNumbers: template?.showPageNumbers ?? false });
  }

  // ── HTML renderers ─────────────────────────────────────────────────────────

  renderQuoteHtml(
    quote: QuoteWithItems,
    companyName: string,
    companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS,
    template?: DocumentTemplateConfig | null,
  ): string {
    registerPartialsOnce('quote', QUOTE_SLOT_NAMES);
    const usd = (v: number | { toString(): string } | null | undefined) => formatMoneySrv(v, opts.currency);
    const dateStr = (d: Date | null | undefined) => formatDateSrv(d, opts.timezone);
    const tpl = loadTemplate('quote');
    const context = {
      companyName: template?.companyName || companyName,
      companyAddress: template?.companyAddress || companyAddress,
      template: this.templateContext(template),
      rows: this.resolveRows('QUOTE', template),
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      title: quote.title,
      description: quote.description ?? '',
      quoteDate: dateStr(quote.createdAt),
      validUntil: dateStr(quote.validUntil),
      jobId: quote.jobId ?? '',
      lineItems: quote.lineItems
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((li) => ({
          description: li.description,
          category: li.category,
          quantity: parseFloat(li.quantity.toString()),
          unitPriceFmt: usd(li.unitPrice),
          lineTotalFmt: usd(li.lineTotal),
          taxable: li.taxable,
        })),
      subtotalFmt: usd(quote.subtotal),
      hasDiscount: parseFloat((quote.discountAmount ?? 0).toString()) > 0,
      discountLabel: quote.discountType === 'PERCENTAGE'
        ? `(${parseFloat((quote.discountValue ?? 0).toString())}%)`
        : '',
      discountAmountFmt: usd(quote.discountAmount),
      taxRatePct: pct(quote.taxRate),
      taxAmountFmt: usd(quote.taxAmount),
      totalFmt: usd(quote.total),
      approvedAt: quote.approvedAt,
      approvedAtFmt: dateStr(quote.approvedAt),
      approvedByName: quote.approvedByName ?? '',
      approvedByEmail: quote.approvedByEmail ?? '',
      notes: quote.notes ?? '',
      terms: quote.terms ?? '',
      generatedAt: dateStr(new Date()),
    };
    return tpl(context);
  }

  renderInvoiceHtml(
    invoice: InvoiceWithRelations,
    companyName: string,
    companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS,
    template?: DocumentTemplateConfig | null,
  ): string {
    registerPartialsOnce('invoice', INVOICE_SLOT_NAMES);
    const usd = (v: number | { toString(): string } | null | undefined) => formatMoneySrv(v, opts.currency);
    const dateStr = (d: Date | null | undefined) => formatDateSrv(d, opts.timezone);
    const tpl = loadTemplate('invoice');
    const balanceDue = parseFloat(invoice.balanceDue.toString());
    const amountPaid = parseFloat(invoice.amountPaid.toString());
    const context = {
      companyName: template?.companyName || companyName,
      companyAddress: template?.companyAddress || companyAddress,
      template: this.templateContext(template),
      rows: this.resolveRows('INVOICE', template),
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      isOverdue: invoice.status === 'OVERDUE',
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      invoiceDate: dateStr(invoice.createdAt),
      dueDate: dateStr(invoice.dueDate),
      quoteNumber: invoice.quote?.quoteNumber ?? '',
      lineItems: invoice.lineItems
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((li) => ({
          description: li.description,
          category: li.category,
          quantity: parseFloat(li.quantity.toString()),
          unitPriceFmt: usd(li.unitPrice),
          lineTotalFmt: usd(li.lineTotal),
          taxable: li.taxable,
        })),
      subtotalFmt: usd(invoice.subtotal),
      hasDiscount: parseFloat(invoice.discountAmount.toString()) > 0,
      discountAmountFmt: usd(invoice.discountAmount),
      taxRatePct: pct(invoice.taxRate),
      taxAmountFmt: usd(invoice.taxAmount),
      totalFmt: usd(invoice.total),
      amountPaid: amountPaid > 0 ? amountPaid : null,
      amountPaidFmt: usd(invoice.amountPaid),
      balanceDue: balanceDue > 0 ? balanceDue : null,
      balanceDueFmt: usd(invoice.balanceDue),
      stripePaymentUrl: invoice.stripePaymentUrl ?? '',
      payments: invoice.payments.map((p) => ({
        paidAtFmt: dateStr(p.paidAt),
        paymentMethod: p.paymentMethod,
        amountFmt: usd(p.amount),
        status: p.status,
      })),
      notes: invoice.notes ?? '',
      terms: invoice.terms ?? '',
      generatedAt: dateStr(new Date()),
    };
    return tpl(context);
  }

  renderAgreementHtml(
    context: AgreementPdfContext, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): string {
    registerPartialsOnce('agreement', AGREEMENT_SLOT_NAMES);
    const usd = (v: number | { toString(): string } | null | undefined) => formatMoneySrv(v, opts.currency);
    const dateStr = (d: Date | null | undefined) => formatDateSrv(d, opts.timezone);
    const tpl = loadTemplate('agreement');
    return tpl({
      companyName: template?.companyName || companyName,
      companyAddress: template?.companyAddress || companyAddress,
      template: this.templateContext(template),
      rows: this.resolveRows('AGREEMENT', template),
      name: context.name,
      description: context.description ?? '',
      customerName: context.customerName,
      customerEmail: context.customerEmail,
      startDateFmt: dateStr(context.startDate),
      endDateFmt: context.endDate ? dateStr(context.endDate) : 'Ongoing',
      serviceType: context.serviceType ?? '—',
      serviceInterval: context.serviceInterval ?? '—',
      visitsIncluded: context.visitsIncluded ?? null,
      visitsUsed: context.visitsUsed ?? 0,
      billingAmountFmt: context.billingAmount ? usd(context.billingAmount) : '—',
      billingCycle: context.billingCycle ?? '—',
      nextBillingDateFmt: context.nextBillingDate ? dateStr(context.nextBillingDate) : null,
      signedByName: context.signedByName ?? null,
      signedAtFmt: context.signedAt ? dateStr(context.signedAt) : '',
      generatedAt: dateStr(new Date()),
    });
  }

  renderPaymentReceiptHtml(
    context: PaymentReceiptContext, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): string {
    registerPartialsOnce('payment-receipt', PAYMENT_RECEIPT_SLOT_NAMES);
    const usd = (v: number | { toString(): string } | null | undefined) => formatMoneySrv(v, opts.currency);
    const dateStr = (d: Date | null | undefined) => formatDateSrv(d, opts.timezone);
    const tpl = loadTemplate('payment-receipt');
    const balanceDue = parseFloat(context.balanceDue.toString());
    return tpl({
      companyName: template?.companyName || companyName,
      companyAddress: template?.companyAddress || companyAddress,
      template: this.templateContext(template),
      rows: this.resolveRows('PAYMENT_RECEIPT', template),
      receiptNumber: context.receiptNumber,
      amountFmt: usd(context.amount),
      paymentMethod: context.paymentMethod,
      paidAtFmt: dateStr(context.paidAt),
      notes: context.notes ?? '',
      customerName: context.customerName,
      customerEmail: context.customerEmail,
      invoiceNumber: context.invoiceNumber,
      invoiceTotalFmt: usd(context.invoiceTotal),
      balanceDue: balanceDue > 0 ? balanceDue : null,
      balanceDueFmt: usd(context.balanceDue),
      generatedAt: dateStr(new Date()),
    });
  }

  /** Normalizes a resolved template into exactly what the .hbs files need — never null, so `{{#if template.x}}` always works. */
  private templateContext(template?: DocumentTemplateConfig | null) {
    if (!template) return { isLetterhead: false };
    return {
      isLetterhead: template.mode === 'LETTERHEAD',
      logoUrl: template.logoUrl ?? null,
      headerText: template.headerText ?? null,
      footerText: template.footerText ?? null,
      bankDetails: template.bankDetails ?? null,
      accentColor: template.accentColor ?? null,
      letterheadImageUrl: template.letterheadImageUrl ?? null,
      letterheadTopMarginPx: template.letterheadTopMarginPx ?? 140,
      letterheadBottomMarginPx: template.letterheadBottomMarginPx ?? 100,
    };
  }

  /** A template with no custom rows renders with the document type's built-in default arrangement. */
  private resolveRows(documentType: 'INVOICE' | 'QUOTE' | 'AGREEMENT' | 'PAYMENT_RECEIPT', template?: DocumentTemplateConfig | null): TemplateRow[] {
    return template?.rows && template.rows.length > 0 ? template.rows : DEFAULT_ROWS[documentType];
  }

  // ── Puppeteer (browser singleton + bounded concurrency) ────────────────────

  /** Resolve the Chrome/Chromium binary path on the current platform. */
  private async resolveChromiumPath(): Promise<string> {
    if (process.env.CHROMIUM_PATH) {
      return process.env.CHROMIUM_PATH;
    }
    if (process.platform === 'win32') {
      // Windows — use os.homedir() which always resolves correctly
      const osMod = await import('os');
      const fsMod = await import('fs');
      const home = osMod.homedir().replace(/\\/g, '/');
      const winPaths = [
        `${home}/AppData/Local/Google/Chrome/Application/chrome.exe`,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      ];
      const found = winPaths.find((p) => fsMod.existsSync(p));
      if (!found) {
        throw new Error(
          'No Chrome found on Windows. Install Google Chrome or set CHROMIUM_PATH in .env.',
        );
      }
      return found;
    }
    if (process.platform === 'darwin') {
      const macPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
      ];
      const fsMod = await import('fs');
      const found = macPaths.find((p) => fsMod.existsSync(p));
      if (!found) {
        throw new Error(
          'No Chrome/Chromium found on macOS. Install Google Chrome or set CHROMIUM_PATH.',
        );
      }
      return found;
    }
    // Linux / Lambda / Docker — try the serverless-optimised binary first.
    try {
      const chromium = await import('@sparticuz/chromium');
      return await chromium.default.executablePath();
    } catch {
      return '/usr/bin/google-chrome-stable';
    }
  }

  /**
   * Get the singleton Browser, launching it on first use. If a previous
   * launch failed or the browser disconnected, the next call relaunches.
   */
  private async getBrowser(): Promise<Browser> {
    if (this.browserPromise) {
      try {
        const browser = await this.browserPromise;
        if (browser.connected !== false) return browser;
      } catch {
        // fall through to relaunch
      }
      this.browserPromise = null;
    }

    this.browserPromise = (async () => {
      const puppeteer = await import('puppeteer-core');
      const chromiumPath = await this.resolveChromiumPath();
      const isWindows = process.platform === 'win32';
      const isLinux = process.platform === 'linux';
      const browser = await puppeteer.default.launch({
        executablePath: chromiumPath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          // Linux/Lambda only — these flags crash Chrome on Windows and macOS
          ...(isLinux ? ['--no-zygote', '--single-process'] : []),
          // Windows-specific stability flags
          ...(isWindows ? ['--disable-extensions', '--disable-background-networking'] : []),
        ],
      });
      browser.on('disconnected', () => {
        this.logger.warn('Chromium disconnected — next PDF request will relaunch');
        this.browserPromise = null;
      });
      this.logger.log('Chromium launched (singleton, will be reused for all PDFs)');
      return browser;
    })();

    return this.browserPromise;
  }

  /** Acquire a slot in the concurrency-limited PDF pool. */
  private async acquireSlot(): Promise<void> {
    if (this.inflight < PdfService.MAX_CONCURRENT_PDFS) {
      this.inflight += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.inflight += 1;
  }

  /** Release a slot, waking the next waiter if any. */
  private releaseSlot(): void {
    this.inflight -= 1;
    const next = this.waiters.shift();
    if (next) next();
  }

  private async htmlToPdf(html: string, opts: { showPageNumbers?: boolean } = {}): Promise<Buffer> {
    await this.acquireSlot();
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      try {
        // 'domcontentloaded' is reliable for fully-inlined HTML templates and
        // avoids 30s timeouts caused by networkidle0 waiting for external
        // resources.
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
        // 'domcontentloaded' doesn't wait for external <img> requests (logo/letterhead
        // URLs) to finish — without this, page.pdf() can snapshot before those images
        // arrive, silently dropping them from the output.
        await page.evaluate(async () => {
          const win = globalThis as any;
          const images: any[] = Array.from(win.document.images).filter((img: any) => !img.complete);
          await Promise.all(images.map((img: any) => new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })));
        });
        const pdfBuffer = await page.pdf({
          format: 'Letter',
          printBackground: true,
          margin: opts.showPageNumbers
            ? { top: '0', right: '0', bottom: '24px', left: '0' }
            : { top: '0', right: '0', bottom: '0', left: '0' },
          displayHeaderFooter: !!opts.showPageNumbers,
          headerTemplate: '<span></span>',
          footerTemplate: opts.showPageNumbers
            ? '<div style="width:100%;font-size:9px;text-align:center;color:#94a3b8;font-family:Arial,sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
            : '<span></span>',
        });
        return Buffer.from(pdfBuffer);
      } finally {
        // Close only the page, not the browser — the singleton lives on.
        await page.close().catch(() => { /* ignore double-close */ });
      }
    } finally {
      this.releaseSlot();
    }
  }
}

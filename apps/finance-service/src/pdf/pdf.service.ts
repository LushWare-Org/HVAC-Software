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

// These helpers emit their output with {{{ }}}, so nothing they return is
// escaped by Handlebars. Every string they interpolate is tenant-editable
// template config, and blockStyleOverride writes into a <style> element, where
// a value like `x}</style><script>` ends the stylesheet and starts a script.
// So each value is rebuilt from an allowlist rather than trusted: a font name
// is letters, digits, spaces, commas, quotes and hyphens; a colour is hex,
// rgb()/hsl(), or a bare word; an alignment or weight is a keyword or number.
// Anything else is dropped from the output rather than passed through.
const CSS_FONT   = /^[A-Za-z0-9 ,'"\-]{1,80}$/;
const CSS_COLOR  = /^(#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla)\([0-9.,%\s]{1,40}\)|[a-zA-Z]{1,30})$/;
const CSS_WEIGHT = /^(normal|bold|bolder|lighter|[1-9]00)$/;
const CSS_ALIGN  = /^(left|right|center|justify|start|end)$/;
const CSS_IDENT  = /^[A-Za-z0-9_\-]{1,64}$/;

function cssVal(value: unknown, pattern: RegExp): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return pattern.test(v) ? v : null;
}
function cssNum(value: unknown, max = 500): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
    ? Math.round(value) : null;
}

/** Style declarations for a block, each value validated, in a fixed order. */
function safeStyleParts(style: Record<string, unknown>, important = false): string[] {
  const imp = important ? ' !important' : '';
  const parts: string[] = [];
  const font = cssVal(style.fontFamily, CSS_FONT);       if (font)   parts.push(`font-family: ${font}${imp};`);
  const size = cssNum(style.fontSize, 200);              if (size)   parts.push(`font-size: ${size}px${imp};`);
  const wght = cssVal(style.fontWeight, CSS_WEIGHT)
    ?? (cssNum(style.fontWeight, 900)?.toString() ?? null); if (wght)  parts.push(`font-weight: ${wght}${imp};`);
  const col  = cssVal(style.color, CSS_COLOR);           if (col)    parts.push(`color: ${col}${imp};`);
  const al   = cssVal(style.align, CSS_ALIGN);           if (al)     parts.push(`text-align: ${al}${imp};`);
  const bg   = cssVal(style.background, CSS_COLOR);      if (bg)     parts.push(`background: ${bg}${imp};`);
  const bc   = cssVal(style.borderColor, CSS_COLOR);     if (bc)     parts.push(`border-color: ${bc}${imp};`);
  const br   = cssNum(style.borderRadiusPx);             if (br !== null) parts.push(`border-radius: ${br}px${imp};`);
  const pd   = cssNum(style.paddingPx);                  if (pd !== null) parts.push(`padding: ${pd}px${imp};`);
  return parts;
}

Handlebars.registerHelper('blockStyle', (style: Record<string, unknown> | undefined) => {
  if (!style) return '';
  return new Handlebars.SafeString(safeStyleParts(style).join(' '));
});
// A block's style is set on its `.tpl-block` wrapper, but the partial's actual content
// element (e.g. `.brand-name`, `.doc-card`) has its own explicit color/font/background
// in the stylesheet — inheritance never overrides an explicit rule on the child, so the
// wrapper's inline style alone is invisible for exactly the properties admins want to
// change. This renders a tiny scoped stylesheet targeting that block's direct content
// children with !important, which reliably wins regardless of the partial's own CSS.
Handlebars.registerHelper('blockStyleOverride', (blockId: unknown, style: Record<string, unknown> | undefined) => {
  if (!style) return '';
  // The id lands inside a CSS attribute selector inside a <style> tag. Only a
  // plain identifier is allowed through; anything else cannot be scoped safely.
  const id = cssVal(blockId, CSS_IDENT);
  if (!id) return '';
  const parts = safeStyleParts(style, true);
  if (parts.length === 0) return '';
  return new Handlebars.SafeString(`<style>[data-block-id="${id}"] > * { ${parts.join(' ')} }</style>`);
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

  /**
   * Whether the renderer may fetch this URL. Public http(s) only.
   *
   * Everything a tenant can legitimately reference from a document is a
   * public image (logo, letterhead). Everything an attacker would reference
   * from inside Chromium on Cloud Run is not: the metadata server at
   * 169.254.169.254, loopback, private ranges, file://. Deny by default.
   */
  static isSafeResourceUrl(raw: string): boolean {
    let url: URL;
    try { url = new URL(raw); } catch { return false; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost')) return false;
    if (host === 'metadata.google.internal' || host.endsWith('.internal')) return false;

    // IPv6 literals are refused outright. The URL parser rewrites v4-mapped
    // forms into hex (::ffff:169.254.169.254 becomes ::ffff:a9fe:a9fe), which
    // slipped past a dotted-quad check, and no legitimate logo is served from a
    // bare IPv6 address.
    if (host.includes(':')) return false;

    // A single-label name like "metadata" is resolved through the host's search
    // domain on GCE and lands on metadata.google.internal. Real image hosts are
    // fully qualified, so anything without a dot is refused.
    if (!host.includes('.')) return false;

    // Numeric IPv4: reject anything that is not globally routable.
    const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (v4) {
      const [a, b] = [Number(v4[1]), Number(v4[2])];
      if (a === 10 || a === 127 || a === 0) return false;
      if (a === 169 && b === 254) return false;           // link-local, incl. metadata
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 100 && b >= 64 && b <= 127) return false;  // CGNAT
      if (a >= 224) return false;                          // multicast / reserved
      return true;
    }
    return true;
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
        // The rendered HTML carries tenant-authored values: template styling,
        // company details, customer names, line-item text. Chromium runs here
        // with the Cloud Run metadata server one HTTP request away, so any
        // script that reaches the page can read the service account token and
        // post it out. Two controls, either of which is sufficient on its own:
        //
        //  1. No page JavaScript. Every template is static markup and CSS; the
        //     only script we need is our own page.evaluate below, which runs
        //     over the DevTools protocol and is unaffected by this setting.
        //  2. No requests to anything but public http(s) hosts. Kills the
        //     metadata endpoint, link-local, loopback and RFC1918 ranges, and
        //     file:// — while still letting logo and letterhead images load.
        await page.setJavaScriptEnabled(false);
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          if (PdfService.isSafeResourceUrl(req.url())) req.continue();
          else req.abort('blockedbyclient');
        });

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

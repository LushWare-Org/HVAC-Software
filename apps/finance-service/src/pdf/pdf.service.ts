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

// ── Money formatter ──────────────────────────────────────────────────────────
const usd = (val: number | { toString(): string } | null | undefined): string => {
  const n = typeof val === 'number' ? val : parseFloat((val ?? 0).toString());
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};

const pct = (val: number | { toString(): string } | null | undefined): string => {
  const n = typeof val === 'number' ? val : parseFloat((val ?? 0).toString());
  return (n * 100).toFixed(2).replace(/\.?0+$/, '');
};

const dateStr = (d: Date | null | undefined): string => {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
};

// ── Template cache ───────────────────────────────────────────────────────────
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

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

  async generateQuotePdf(quote: QuoteWithItems, companyName: string, companyAddress: string): Promise<Buffer> {
    const html = this.renderQuoteHtml(quote, companyName, companyAddress);
    return this.htmlToPdf(html);
  }

  async generateInvoicePdf(
    invoice: InvoiceWithRelations,
    companyName: string,
    companyAddress: string,
  ): Promise<Buffer> {
    const html = this.renderInvoiceHtml(invoice, companyName, companyAddress);
    return this.htmlToPdf(html);
  }

  // ── HTML renderers ─────────────────────────────────────────────────────────

  renderQuoteHtml(quote: QuoteWithItems, companyName: string, companyAddress: string): string {
    const tpl = loadTemplate('quote');
    const context = {
      companyName,
      companyAddress,
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

  renderInvoiceHtml(invoice: InvoiceWithRelations, companyName: string, companyAddress: string): string {
    const tpl = loadTemplate('invoice');
    const balanceDue = parseFloat(invoice.balanceDue.toString());
    const amountPaid = parseFloat(invoice.amountPaid.toString());
    const context = {
      companyName,
      companyAddress,
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

  // ── Puppeteer (browser singleton + bounded concurrency) ────────────────────

  /** Resolve the Chrome/Chromium binary path on the current platform. */
  private async resolveChromiumPath(): Promise<string> {
    if (process.env.CHROMIUM_PATH) {
      return process.env.CHROMIUM_PATH;
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
      const browser = await puppeteer.default.launch({
        executablePath: chromiumPath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          ...(process.platform !== 'darwin' ? ['--no-zygote', '--single-process'] : []),
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

  private async htmlToPdf(html: string): Promise<Buffer> {
    await this.acquireSlot();
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      try {
        // 'domcontentloaded' is reliable for fully-inlined HTML templates and
        // avoids 30s timeouts caused by networkidle0 waiting for external
        // resources.
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const pdfBuffer = await page.pdf({
          format: 'Letter',
          printBackground: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
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

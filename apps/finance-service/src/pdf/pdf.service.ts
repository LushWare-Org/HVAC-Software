/**
 * PdfService
 * Renders Handlebars templates → HTML → PDF via Puppeteer.
 * Uses @sparticuz/chromium so the binary works inside Lambda / Docker without
 * installing a system-level Chrome.
 *
 * All money values are pre-formatted (e.g. "$1,234.56") before being passed
 * to the template so the HBS template stays logic-free.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import type { Quote, QuoteLineItem, Invoice, InvoiceLineItem, Payment } from '../prisma/generated';

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
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

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

  // ── Puppeteer ──────────────────────────────────────────────────────────────

  private async htmlToPdf(html: string): Promise<Buffer> {
    // Dynamic import so the module is loaded on first use (cold-start speed).
    // In Lambda / Docker the chromium binary is bundled via @sparticuz/chromium.
    const puppeteer = await import('puppeteer-core');
    let chromiumPath: string;

    try {
      // @sparticuz/chromium provides a serverless-optimised static binary.
      const chromium = await import('@sparticuz/chromium');
      chromiumPath = await chromium.default.executablePath();
    } catch {
      // Fallback: local Chrome / Chromium for dev machines
      chromiumPath =
        process.env.CHROMIUM_PATH ??
        '/usr/bin/google-chrome-stable';
    }

    const browser = await puppeteer.default.launch({
      executablePath: chromiumPath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}

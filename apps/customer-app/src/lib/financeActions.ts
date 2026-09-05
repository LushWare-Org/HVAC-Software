import type { Invoice, Quote } from '@/types/api'

/**
 * Which finance actions a customer may take, mirroring what finance-service
 * accepts. Quotes are decidable only while they are still open — the service
 * rejects a decision on a CONVERTED or EXPIRED quote, and it treats a repeated
 * decision as idempotent rather than an update, so re-offering the button after
 * a decision would imply the customer can change their mind when they cannot.
 */

/** finance-service allows approve/decline from these quote statuses only. */
const DECIDABLE_QUOTE_STATUSES = ['DRAFT', 'SENT', 'VIEWED']

/** An invoice still awaiting money. */
const OPEN_INVOICE_STATUSES = ['SENT', 'PARTIALLY_PAID', 'OVERDUE']

export function canDecideQuote(quote: Pick<Quote, 'status'>): boolean {
  return DECIDABLE_QUOTE_STATUSES.includes(quote.status)
}

export function isQuoteDecided(quote: Pick<Quote, 'status'>): boolean {
  return quote.status === 'ACCEPTED' || quote.status === 'DECLINED'
}

export function isInvoiceOpen(invoice: Pick<Invoice, 'status'>): boolean {
  return OPEN_INVOICE_STATUSES.includes(invoice.status)
}

/**
 * An invoice may be acknowledged or disputed while it is open and no decision
 * has been recorded yet. This is separate from paying it — payment is not in
 * the mobile app yet.
 */
export function canDecideInvoice(
  invoice: Pick<Invoice, 'status' | 'approvedAt' | 'declinedAt'>,
): boolean {
  if (!isInvoiceOpen(invoice)) return false
  return !invoice.approvedAt && !invoice.declinedAt
}

/** Outstanding balance, preferring the server's own figure when present. */
export function outstandingAmount(invoice: Invoice): number {
  const num = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
    return Number.isFinite(n) ? n : 0
  }
  if (invoice.balanceDue !== undefined && invoice.balanceDue !== null) {
    return num(invoice.balanceDue)
  }
  return Math.max(0, num(invoice.total) - num(invoice.amountPaid))
}

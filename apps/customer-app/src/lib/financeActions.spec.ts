import {
  canDecideInvoice, canDecideQuote, isInvoiceOpen, isQuoteDecided, outstandingAmount,
} from './financeActions'

const quote = (patch: Record<string, unknown> = {}) =>
  ({ status: 'SENT', ...patch }) as never

const invoice = (patch: Record<string, unknown> = {}) =>
  ({
    id: 'inv-1', invoiceNumber: 'INV-1', status: 'SENT',
    total: 100, amountPaid: 0, approvedAt: null, declinedAt: null,
    ...patch,
  }) as never

describe('canDecideQuote', () => {
  it('allows a decision on an open quote', () => {
    expect(canDecideQuote(quote({ status: 'SENT' }))).toBe(true)
    expect(canDecideQuote(quote({ status: 'VIEWED' }))).toBe(true)
    expect(canDecideQuote(quote({ status: 'DRAFT' }))).toBe(true)
  })

  it('refuses once already decided — a decision is not reversible here', () => {
    expect(canDecideQuote(quote({ status: 'ACCEPTED' }))).toBe(false)
    expect(canDecideQuote(quote({ status: 'DECLINED' }))).toBe(false)
  })

  it('refuses on converted or expired quotes, which the service rejects', () => {
    expect(canDecideQuote(quote({ status: 'CONVERTED' }))).toBe(false)
    expect(canDecideQuote(quote({ status: 'EXPIRED' }))).toBe(false)
  })
})

describe('isQuoteDecided', () => {
  it('reports accepted and declined as decided', () => {
    expect(isQuoteDecided(quote({ status: 'ACCEPTED' }))).toBe(true)
    expect(isQuoteDecided(quote({ status: 'DECLINED' }))).toBe(true)
    expect(isQuoteDecided(quote({ status: 'SENT' }))).toBe(false)
  })
})

describe('isInvoiceOpen', () => {
  it('counts sent, partially paid and overdue as open', () => {
    expect(isInvoiceOpen(invoice({ status: 'SENT' }))).toBe(true)
    expect(isInvoiceOpen(invoice({ status: 'PARTIALLY_PAID' }))).toBe(true)
    expect(isInvoiceOpen(invoice({ status: 'OVERDUE' }))).toBe(true)
  })

  it('excludes paid, void and draft', () => {
    expect(isInvoiceOpen(invoice({ status: 'PAID' }))).toBe(false)
    expect(isInvoiceOpen(invoice({ status: 'VOID' }))).toBe(false)
    expect(isInvoiceOpen(invoice({ status: 'DRAFT' }))).toBe(false)
  })
})

describe('canDecideInvoice', () => {
  it('allows acknowledging an open, undecided invoice', () => {
    expect(canDecideInvoice(invoice())).toBe(true)
  })

  it('refuses once approved or declined', () => {
    expect(canDecideInvoice(invoice({ approvedAt: '2026-08-01T00:00:00Z' }))).toBe(false)
    expect(canDecideInvoice(invoice({ declinedAt: '2026-08-01T00:00:00Z' }))).toBe(false)
  })

  it('refuses on a paid or void invoice', () => {
    expect(canDecideInvoice(invoice({ status: 'PAID' }))).toBe(false)
    expect(canDecideInvoice(invoice({ status: 'VOID' }))).toBe(false)
  })
})

describe('outstandingAmount', () => {
  it('prefers the server balanceDue when present', () => {
    expect(outstandingAmount(invoice({ total: 500, amountPaid: 100, balanceDue: 400 }))).toBe(400)
  })

  it('derives it when balanceDue is absent', () => {
    expect(outstandingAmount(invoice({ total: 500, amountPaid: 200 }))).toBe(300)
  })

  it('handles Decimal-as-string values from the API', () => {
    expect(outstandingAmount(invoice({ total: '500.00', amountPaid: '125.50' }))).toBeCloseTo(374.5)
  })

  it('never reports a negative balance', () => {
    expect(outstandingAmount(invoice({ total: 100, amountPaid: 150 }))).toBe(0)
  })
})

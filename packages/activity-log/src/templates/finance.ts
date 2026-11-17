import type { ActionTemplateMap } from './types';

export const financeTemplates: ActionTemplateMap = {
  'POST /quotes': (req, res) => ({
    action: 'quote.created',
    description: `Created a quote for ${req?.customerName ?? res?.customerName ?? 'a customer'}`,
  }),
  'PATCH /quotes/:id/send': (_req, res) => ({
    action: 'quote.sent',
    description: `Sent a quote to ${res?.customerName ?? 'the customer'}`,
  }),
  'POST /quotes/:id/approve': (_req, res) => ({
    action: 'quote.approved',
    description: `${res?.customerName ?? 'The customer'} approved a quote`,
  }),
  'POST /quotes/:id/decline': (_req, res) => ({
    action: 'quote.declined',
    description: `${res?.customerName ?? 'The customer'} declined a quote`,
  }),
  'POST /quotes/:id/convert': (_req, res) => ({
    action: 'quote.converted',
    description: `Converted an approved quote into a job${res?.customerName ? ` for ${res.customerName}` : ''}`,
  }),
  'POST /invoices': (req, res) => ({
    action: 'invoice.created',
    description: `Created an invoice for ${req?.customerName ?? res?.customerName ?? 'a customer'}`,
  }),
  'PATCH /invoices/:id/send': (_req, res) => ({
    action: 'invoice.sent',
    description: `Sent an invoice to ${res?.customerName ?? 'the customer'}`,
  }),
  'POST /invoices/:id/payments': (req) => {
    const amount = req?.amount != null ? `$${req.amount}` : 'a payment';
    const method = typeof req?.method === 'string' ? ` ${req.method.toLowerCase()}` : '';
    return {
      action: 'invoice.payment_recorded',
      description: `Recorded a ${amount}${method} payment on an invoice`,
    };
  },
  'PATCH /invoices/:id/void': (_req, res) => ({
    action: 'invoice.voided',
    description: `Voided an invoice${res?.customerName ? ` for ${res.customerName}` : ''}`,
  }),
};

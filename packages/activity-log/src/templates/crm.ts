import type { ActionTemplateMap } from './types';

export const crmTemplates: ActionTemplateMap = {
  'POST /customers': (req) => ({
    action: 'customer.created',
    description: req?.name ? `Created customer "${req.name}"` : 'Created a new customer',
  }),
  'POST /leads': (req) => ({
    action: 'lead.created',
    description: req?.name ? `Created lead "${req.name}"` : 'Created a new lead',
  }),
  'POST /agreements': (_req, res) => ({
    action: 'agreement.created',
    description: `Created agreement ${res?.id ?? ''}`.trim(),
  }),
  'POST /agreements/:id/confirm': () => ({
    action: 'agreement.confirmed',
    description: 'Confirmed an agreement',
  }),
  'POST /auth/login': (req) => ({
    action: 'auth.login',
    description: req?.email ? `${req.email} logged in` : 'A user logged in',
  }),
  'POST /auth/register': (req) => ({
    action: 'auth.register',
    description: req?.email ? `${req.email} signed up` : 'A new customer signed up',
  }),
};

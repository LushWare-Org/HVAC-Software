import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const CUSTOMER_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_my_jobs',
      description: 'Get the customer\'s service jobs/appointments. Optionally filter by status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'],
            description: 'Filter by job status. Omit to get all jobs.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_invoices',
      description: 'Get the customer\'s invoices. Optionally filter by status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'],
            description: 'Filter by invoice status. Omit to get all invoices.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_equipment',
      description: 'Get all HVAC or plumbing equipment registered to the customer.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_my_next_appointment',
      description: 'Get the customer\'s next upcoming scheduled appointment.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

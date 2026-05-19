import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const ADMIN_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_revenue_summary',
      description: 'Get revenue totals for a time period.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'year'],
            description: 'The time period to summarise.',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_job_stats',
      description: 'Get job counts broken down by status, optionally for a date range.',
      parameters: {
        type: 'object',
        properties: {
          range: {
            type: 'string',
            enum: ['today', 'week', 'month'],
            description: 'Date range to filter jobs.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_stats',
      description: 'Get customer KPIs: total active customers, outstanding invoices count and value, lead conversion rate.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_technicians',
      description: 'Get top performing technicians by jobs completed and rating.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of technicians to return (default 5).',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_overdue_invoices',
      description: 'Get all overdue invoices with customer names and amounts owed.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_new_customers',
      description: 'Get new customers added in a recent period.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month'],
            description: 'Period to look back.',
          },
        },
        required: ['period'],
      },
    },
  },
];

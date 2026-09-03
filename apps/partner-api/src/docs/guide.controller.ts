import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { PartnerPublic } from '../auth/public.decorator';
import { ALL_EVENT_TYPES } from '../webhooks/webhooks.service';
import { renderGuide } from './guide.html';

@Controller()
export class GuideController {
  @Get('guide')
  @PartnerPublic()
  @ApiExcludeEndpoint()
  @Header('content-type', 'text/html; charset=utf-8')
  @Header('cache-control', 'public, max-age=300')
  guide(): string {
    return renderGuide();
  }

  @Get('capabilities')
  @PartnerPublic()
  @ApiExcludeEndpoint()
  capabilities() {
    const rateLimit = Number(process.env.PARTNER_RATE_LIMIT_PER_MIN ?? 60);

    return {
      name: 'HVACtor Partner API',
      version: 'v1',
      description:
        'Integration surface for external agents (AI voice, chat, dialer): identify one ' +
        'inbound caller, book work, discuss and send invoices and quotes, and take payment.',

      documentation: {
        guide: '/guide',
        openapiUi: '/docs',
        openapiSpec: '/docs-json',
        capabilities: '/capabilities',
        health: '/health',
      },

      authentication: {
        scheme: 'api-key',
        header: 'x-api-key',
        environments: ['LIVE', 'SANDBOX'],
        keyPrefixes: { LIVE: 'pk_live_', SANDBOX: 'pk_test_' },
        note:
          'A key is bound to one company, one environment and an explicit scope list. ' +
          'Sandbox keys run the real code paths and the real validation; only the outward ' +
          'side effect (SMS, email, Stripe session) is simulated.',
      },

      rateLimit: {
        default: rateLimit,
        unit: 'requests/minute/key',
        perKeyOverride: true,
        headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        exceeded: { status: 429, header: 'Retry-After' },
      },

      /** Business-rule ceilings, separate from the request limit. */
      quotas: [
        {
          rule: 'new_caller_bookings_per_phone',
          limit: Number(process.env.PARTNER_NEW_CALLER_DAILY_LIMIT ?? 1),
          window: '24h',
          status: 400,
        },
        {
          rule: 'payment_link_hold_on_agent_created_customer',
          limit: 0,
          window: `${process.env.PARTNER_NEW_CUSTOMER_PAYMENT_HOLD_HOURS ?? 24}h`,
          status: 400,
        },
      ],

      endpoints: [
        { method: 'GET', path: '/v1/whoami', scope: null, summary: 'Confirm the key and inspect its grants' },
        { method: 'GET', path: '/v1/callers/lookup', scope: 'customer:lookup', summary: 'Identify a caller by phone number' },
        { method: 'POST', path: '/v1/callers/match', scope: 'customer:match', summary: 'Confirm one customer by name and address' },
        { method: 'GET', path: '/v1/availability', scope: 'availability:read', summary: 'Bookable slots with remaining capacity' },
        { method: 'POST', path: '/v1/bookings', scope: 'booking:create', summary: 'Create a PENDING appointment' },
        { method: 'PATCH', path: '/v1/bookings/{id}/reschedule', scope: 'booking:reschedule', summary: 'Move an appointment' },
        { method: 'PATCH', path: '/v1/bookings/{id}/cancel', scope: 'booking:cancel', summary: 'Cancel an appointment' },
        { method: 'GET', path: '/v1/customers/{customerId}/invoices', scope: 'invoice:read', summary: 'Invoice statuses and balances' },
        { method: 'GET', path: '/v1/customers/{customerId}/quotes', scope: 'quote:read', summary: 'Quote statuses and totals' },
        { method: 'POST', path: '/v1/documents/send', scope: 'document:send', summary: 'Send an invoice or quote to the customer on file' },
        { method: 'POST', path: '/v1/bookings/{id}/confirmation', scope: 'confirmation:send', summary: 'Send an appointment confirmation' },
        { method: 'POST', path: '/v1/payments/link', scope: 'payment_link:create', summary: 'Stripe-hosted payment link for one unpaid invoice' },
        { method: 'GET', path: '/v1/webhooks/events', scope: 'webhook:manage', summary: 'Subscribable event types' },
        { method: 'POST', path: '/v1/webhooks', scope: 'webhook:manage', summary: 'Register an endpoint (secret returned once)' },
        { method: 'GET', path: '/v1/webhooks', scope: 'webhook:manage', summary: 'List endpoints and their health' },
        { method: 'GET', path: '/v1/webhooks/{id}/deliveries', scope: 'webhook:manage', summary: 'Delivery attempt log' },
        { method: 'DELETE', path: '/v1/webhooks/{id}', scope: 'webhook:manage', summary: 'Remove an endpoint' },
      ],

      /** Only scopes that gate a live endpoint. */
      scopes: [
        'customer:lookup',
        'customer:match',
        'availability:read',
        'booking:create',
        'booking:reschedule',
        'booking:cancel',
        'invoice:read',
        'quote:read',
        'document:send',
        'confirmation:send',
        'payment_link:create',
        'webhook:manage',
      ],

      events: ALL_EVENT_TYPES,

      webhooks: {
        signature: {
          algorithm: 'HMAC-SHA256',
          signedPayload: '<x-tscrm-timestamp>.<raw request body>',
          header: 'x-tscrm-signature',
          encoding: 'hex',
        },
        headers: [
          'x-tscrm-event',
          'x-tscrm-timestamp',
          'x-tscrm-signature',
          'x-tscrm-delivery-attempt',
        ],
        timeoutMs: Number(process.env.PARTNER_WEBHOOK_TIMEOUT_MS ?? 8000),
        maxAttempts: 4,
        backoffMs: [1000, 4000, 9000],
        delivery: 'at-least-once; de-duplicate on the envelope id',
        ordering: 'not guaranteed; use occurredAt',
        suspendAfterConsecutiveFailures: 20,
        urlPolicy: 'https only, publicly routable host',
      },

      /** Stated explicitly so an integration is never designed around them. */
      notSupported: [
        'customer list, search or export',
        'technician identity, GPS position, live dispatch board or ETA',
        'free-form outbound SMS or email to arbitrary recipients',
        'card numbers, payment tokens or stored payment methods',
        'creating or editing invoices, quotes or prices',
        'per-unit equipment detail records (count only)',
        'partner-triggered notifications to company staff',
      ],
    };
  }
}

export const PARTNER_SCOPES = {
  // --- Step 2: reading -------------------------------------------------
  CUSTOMER_LOOKUP: 'customer:lookup',
  CUSTOMER_MATCH: 'customer:match',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_CREATE: 'customer:create',
  SERVICE_AREA_CHECK: 'service_area:check',
  EQUIPMENT_READ: 'equipment:read',
  INVOICE_READ: 'invoice:read',
  QUOTE_READ: 'quote:read',

  // --- Step 3: booking -------------------------------------------------
  AVAILABILITY_READ: 'availability:read',
  BOOKING_CREATE: 'booking:create',
  BOOKING_RESCHEDULE: 'booking:reschedule',
  BOOKING_CANCEL: 'booking:cancel',

  // --- Step 4: sending -------------------------------------------------
  DOCUMENT_SEND: 'document:send',
  CONFIRMATION_SEND: 'confirmation:send',

  // --- Step 5: paying --------------------------------------------------
  PAYMENT_LINK_CREATE: 'payment_link:create',

  // --- Step 6: events --------------------------------------------------
  WEBHOOK_MANAGE: 'webhook:manage',
} as const;

export type PartnerScope = (typeof PARTNER_SCOPES)[keyof typeof PARTNER_SCOPES];

export const ALL_PARTNER_SCOPES: string[] = Object.values(PARTNER_SCOPES);

/**
 * A granted scope matches a required scope exactly, or via a resource
 * wildcard ("invoice:*"), or the global wildcard ("*").
 */
export function scopeSatisfies(granted: string, required: string): boolean {
  if (granted === '*' || granted === required) {
    return true;
  }
  if (!granted.endsWith(':*')) {
    return false;
  }
  const resource = granted.slice(0, -2);
  return required.startsWith(`${resource}:`);
}

export function hasScope(granted: string[], required: string): boolean {
  return granted.some((g) => scopeSatisfies(g, required));
}

/** Rejects scope strings that aren't in the catalogue (or a valid wildcard). */
export function isKnownScope(scope: string): boolean {
  if (scope === '*') {
    return true;
  }
  if (scope.endsWith(':*')) {
    const resource = scope.slice(0, -2);
    return ALL_PARTNER_SCOPES.some((s) => s.startsWith(`${resource}:`));
  }
  return ALL_PARTNER_SCOPES.includes(scope);
}

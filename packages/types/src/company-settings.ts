/** Per-tenant settings exposed by GET /crm/company/settings. */
export interface CompanySettings {
  id: string;
  name: string;
  logoUrl: string | null;
  /** ISO 4217, e.g. "USD" | "LKR". */
  currency: string;
  /** IANA zone, e.g. "Asia/Colombo". */
  timezone: string;
  /** Capability flags. Missing key = enabled. */
  features: Record<string, unknown>;
}

export const DEFAULT_COMPANY_SETTINGS: Omit<CompanySettings, 'id' | 'name' | 'logoUrl'> = {
  currency: 'USD',
  timezone: 'America/New_York',
  features: {},
};

/**
 * Missing key = enabled; only an explicit boolean false disables.
 * Fails open on malformed input so a bad row never dark-ships a feature off.
 */
export function isFeatureEnabled(features: unknown, key: string): boolean {
  if (features === null || typeof features !== 'object') return true;
  return (features as Record<string, unknown>)[key] !== false;
}

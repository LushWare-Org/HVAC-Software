/** Tenant's selectable currencies + which one is the default. GET/PATCH /crm/company/currencies. */
export interface CurrencySettings {
  /** ISO 4217 codes this tenant can pick from anywhere a currency is selected. */
  enabled: string[];
  /** Must be a member of `enabled`. */
  default: string;
}

/** A tenant-managed, named tax rate. GET/POST/PATCH/DELETE /crm/company/tax-rates. */
export interface TaxRatePreset {
  id: string;
  companyId: string;
  name: string;
  /** Decimal fraction, e.g. 0.15 for 15%. */
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A tenant-managed, named payment-terms option. GET/POST/PATCH/DELETE /crm/company/payment-terms. */
export interface PaymentTermsPreset {
  id: string;
  companyId: string;
  name: string;
  /** Days from issue date until due, e.g. 0 = "Due on Receipt", 30 = "Net 30". */
  days: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Static ISO 4217 reference list for the tenant currency picker (Settings > Finance).
 * Deliberately not exhaustive of all ~180 ISO codes — covers the currencies this
 * product's tenants actually operate in, plus the most common global majors.
 * Add entries here if a tenant needs a code that isn't listed.
 */
export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
}

export const ISO_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
]

export function currencyInfo(code: string): CurrencyInfo {
  return ISO_CURRENCIES.find(c => c.code === code) ?? { code, name: code, symbol: code }
}

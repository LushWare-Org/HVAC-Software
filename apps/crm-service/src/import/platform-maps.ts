export type Platform = 'jobber' | 'hcp' | 'generic' | 'equipment'

export interface ColumnMap {
  csvHeader: string
  targetField: string
  transform?: (v: string) => string
}

export const TARGET_FIELDS = {
  customer: [
    { field: 'fullName',   label: 'Full Name (auto-split)',  required: false },
    { field: 'firstName',  label: 'First Name',   required: true },
    { field: 'lastName',   label: 'Last Name',    required: true },
    { field: 'email',      label: 'Email',        required: false },
    { field: 'phone',      label: 'Phone',        required: false },
    { field: 'mobile',     label: 'Mobile',       required: false },
    { field: 'address',    label: 'Address',      required: false },
    { field: 'city',       label: 'City',         required: false },
    { field: 'state',      label: 'State',        required: false },
    { field: 'zipCode',    label: 'Zip Code',     required: false },
    { field: 'type',       label: 'Type (RESIDENTIAL/COMMERCIAL)', required: false },
    { field: 'notes',      label: 'Notes',        required: false },
  ],
  equipment: [
    { field: 'customerEmail', label: 'Customer Email (to link)', required: true },
    { field: 'type',          label: 'Equipment Type',           required: true },
    { field: 'brand',         label: 'Brand',                    required: false },
    { field: 'model',         label: 'Model',                    required: false },
    { field: 'serialNo',      label: 'Serial Number',            required: false },
    { field: 'installDate',   label: 'Install Date (YYYY-MM-DD)',required: false },
    { field: 'warrantyEnd',   label: 'Warranty End (YYYY-MM-DD)',required: false },
    { field: 'notes',         label: 'Notes',                    required: false },
  ],
}

export const JOBBER_CUSTOMER_MAP: ColumnMap[] = [
  { csvHeader: 'Client Name',      targetField: 'fullName' },
  { csvHeader: 'Client Email',     targetField: 'email' },
  { csvHeader: 'Client Phone',     targetField: 'phone' },
  { csvHeader: 'Property Address', targetField: 'address' },
  { csvHeader: 'Property City',    targetField: 'city' },
  { csvHeader: 'Property State',   targetField: 'state' },
  { csvHeader: 'Property Zip',     targetField: 'zipCode' },
  { csvHeader: 'Client Type',      targetField: 'type', transform: v => v.toLowerCase().includes('commercial') ? 'COMMERCIAL' : 'RESIDENTIAL' },
  { csvHeader: 'Notes',            targetField: 'notes' },
]

export const HCP_CUSTOMER_MAP: ColumnMap[] = [
  { csvHeader: 'Customer Name',    targetField: 'fullName' },
  { csvHeader: 'Customer Email',   targetField: 'email' },
  { csvHeader: 'Customer Phone',   targetField: 'phone' },
  { csvHeader: 'Service Address',  targetField: 'address' },
  { csvHeader: 'City',             targetField: 'city' },
  { csvHeader: 'State',            targetField: 'state' },
  { csvHeader: 'Zip Code',         targetField: 'zipCode' },
  { csvHeader: 'Customer Type',    targetField: 'type', transform: v => v.toLowerCase().includes('commercial') ? 'COMMERCIAL' : 'RESIDENTIAL' },
]

export const EQUIPMENT_MAP: ColumnMap[] = [
  { csvHeader: 'Customer Email', targetField: 'customerEmail' },
  { csvHeader: 'Type',           targetField: 'type' },
  { csvHeader: 'Brand',          targetField: 'brand' },
  { csvHeader: 'Model',          targetField: 'model' },
  { csvHeader: 'Serial Number',  targetField: 'serialNo' },
  { csvHeader: 'Install Date',   targetField: 'installDate' },
  { csvHeader: 'Warranty End',   targetField: 'warrantyEnd' },
  { csvHeader: 'Notes',          targetField: 'notes' },
]

export function detectPlatform(headers: string[]): Platform {
  const h = new Set(headers)
  if (h.has('Customer Email') && h.has('Type') && h.has('Brand')) return 'equipment'
  if (h.has('Client Name') && h.has('Client Email')) return 'jobber'
  if (h.has('Customer Name') && h.has('Customer Email')) return 'hcp'
  return 'generic'
}

export function getPlatformMap(platform: Platform): ColumnMap[] {
  switch (platform) {
    case 'jobber':    return JOBBER_CUSTOMER_MAP
    case 'hcp':       return HCP_CUSTOMER_MAP
    case 'equipment': return EQUIPMENT_MAP
    default:          return []
  }
}

// Normalize a string for fuzzy header matching: lowercase, strip spaces/underscores/hyphens
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s_\-#*()]+/g, '')
}

// All the aliases we recognise for each target field (normalized)
const GENERIC_ALIASES: Record<string, string[]> = {
  fullName:   ['fullname', 'full name', 'name', 'clientname', 'client name', 'customername', 'customer name'],
  firstName:  ['firstname', 'first', 'fname', 'givenname', 'forename'],
  lastName:   ['lastname', 'last', 'lname', 'surname', 'familyname'],
  email:      ['email', 'emailaddress', 'email address', 'e-mail', 'mail'],
  phone:      ['phone', 'phonenumber', 'phone number', 'telephone', 'tel', 'homephone'],
  mobile:     ['mobile', 'mobilenumber', 'mobile number', 'cell', 'cellphone', 'mobilephone'],
  address:    ['address', 'streetaddress', 'street address', 'street', 'addr', 'address1'],
  city:       ['city', 'town', 'municipality'],
  state:      ['state', 'province', 'region', 'stateprovince'],
  zipCode:    ['zipcode', 'zip', 'postalcode', 'postal code', 'postcode'],
  type:       ['type', 'customertype', 'client type', 'clienttype', 'accounttype'],
  notes:      ['notes', 'note', 'comments', 'comment', 'description', 'memo'],
}

// Build reverse alias map once
const ALIAS_TO_FIELD: Record<string, string> = {}
for (const [field, aliases] of Object.entries(GENERIC_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_FIELD[norm(alias)] = field
  }
}

/**
 * Auto-map generic CSV headers to target fields.
 * Tries exact-label match first, then alias table, then normalized header comparison.
 * Returns only headers that could be matched — unrecognised headers are left unmapped (ignored).
 */
export function autoMapGenericHeaders(headers: string[], platform: 'customer' | 'equipment' = 'customer'): ColumnMap[] {
  const fields = TARGET_FIELDS[platform]
  const result: ColumnMap[] = []
  const usedTargets = new Set<string>()

  for (const header of headers) {
    const n = norm(header)

    // 1. Check alias table
    const byAlias = ALIAS_TO_FIELD[n]
    if (byAlias && !usedTargets.has(byAlias) && fields.some(f => f.field === byAlias)) {
      result.push({ csvHeader: header, targetField: byAlias })
      usedTargets.add(byAlias)
      continue
    }

    // 2. Check normalized field label (e.g. "Zip Code" → "zipcode")
    const byLabel = fields.find(f => norm(f.label) === n || norm(f.field) === n)
    if (byLabel && !usedTargets.has(byLabel.field)) {
      result.push({ csvHeader: header, targetField: byLabel.field })
      usedTargets.add(byLabel.field)
    }
  }

  return result
}

export const EQUIPMENT_TEMPLATE_CSV = `Customer Email,Type,Brand,Model,Serial Number,Install Date,Warranty End,Notes
john.smith@example.com,Heat Pump,Lennox,XP25,SN-12345,2020-03-15,2027-03-15,Master bedroom unit
john.smith@example.com,Air Handler,Carrier,FV4C,SN-67890,2020-03-15,2027-03-15,
jane.doe@example.com,AC Unit,Trane,XR15,SN-11111,2018-06-01,2025-06-01,Needs filter check
`

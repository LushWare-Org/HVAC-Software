/**
 * api.ts â€” Shared TypeScript types mirroring the backend Prisma models + DTOs
 *
 * These are the shapes returned by the API (snake_case from JSON).
 * Status enums use UPPER_CASE as they come from the backend; the frontend
 * STATUS maps in each page normalise them to display labels & CSS classes.
 */

// â”€â”€â”€ Common â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// â”€â”€â”€ Auth/User (dev bypass) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface DevUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string
}

// â”€â”€â”€ CRM Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type CustomerType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'

export interface Customer {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  type: CustomerType
  isActive: boolean
  automaticFollowupEnabled?: boolean
  notes?: string
  tags: string[]
  engagementStatus?: CustomerEngagementStatus
  source?: string
  createdAt: string
  updatedAt: string
  // computed in list endpoint
  totalJobs?: number
  totalRevenue?: number
  lastServiceDate?: string
  // nested relations
  addresses?: Address[]
  equipment?: EquipmentRecord[]
}

export interface CustomerStatusSummary {
  customerId: string
  currentStatus: string
  upsellRecommendation?: {
    id: string
    recommendedOffer: string
    confidence: number
    status: string
    priorityScore?: number | null
    triggerSource?: string | null
    createdAt: string
  } | null
  churnPrediction: {
    probability: number
    level: 'Low' | 'Medium' | 'High'
    summary: string
  }
  failurePrediction: {
    probability: number
    level: 'Low' | 'Medium' | 'High'
    summary: string
  }
  revenueRisk: number
  proposedNextStep: string
  predictionSource: 'model' | 'fallback'
  signals: {
    daysSinceLastService: number
    serviceCountLastYear: number
    avgMonthlySpend: number
    equipmentCount: number
    activeAgreementCount: number
  }
}

// Convenience: full name helper
export function customerName(c: Customer): string {
  return `${c.firstName} ${c.lastName}`.trim()
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST'

export type CustomerEngagementStatus = 'ACTIVE' | 'QUOTE_SENT' | 'INVOICE_SENT' | 'JOB_BOOKED' | 'COMPLETED' | 'INACTIVE'

export interface Lead {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  whatsappNo?: string
  type?: string
  source?: string
  serviceInterest?: string
  estimatedValue?: number
  status: LeadStatus
  assignedToId?: string
  assignedToName?: string
  notes?: string
  customerId?: string
  convertedAt?: string
  createdAt: string
  updatedAt: string
  // joined from linked customer record (for portal signups)
  customer?: { id: string; firstName: string; lastName: string; city?: string; state?: string; address?: string }
}

export function leadName(l: Lead): string {
  return `${l.firstName} ${l.lastName}`.trim()
}

// â”€â”€â”€ Addresses & Equipment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface Address {
  id: string
  companyId: string
  customerId?: string
  leadId?: string
  type: string
  line1: string
  line2?: string
  city?: string
  state?: string
  postcode?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface EquipmentRecord {
  id: string
  companyId: string
  customerId: string
  type: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// â”€â”€â”€ Job Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type JobStatus = 'PENDING' | 'SCHEDULED' | 'EN_ROUTE' | 'ON_SITE' | 'IN_PROGRESS' | 'COMPLETED' | 'INVOICED' | 'PAID' | 'CANCELLED' | 'ON_HOLD'
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY' | 'URGENT'

export interface Job {
  id: string
  companyId: string
  title: string
  description?: string
  status: JobStatus
  priority: JobPriority
  customerId?: string
  customerName?: string
  serviceAddress?: string
  customerAddress?: string  // alias for backwards compat
  serviceLatitude?: string
  serviceLongitude?: string
  assignedToId?: string
  assignedToName?: string
  jobTypeId?: string
  jobTypeName?: string
  scheduledStart?: string
  scheduledEnd?: string
  completedAt?: string
  estimatedAmount?: number
  finalAmount?: number
  tags: string[]
  createdAt: string
  updatedAt: string
  statusHistory?: { id: string; fromStatus?: string; toStatus: string; changedById?: string; notes?: string; createdAt: string }[]
}

export interface JobTemplate {
  id: string
  companyId: string
  jobTypeId: string
  name: string
  description?: string
  estimatedDurationMins: number
  version: number
  isActive: boolean
  requiredParts?: { inventoryItemId: string; name: string; qty: number }[]
  createdAt: string
  updatedAt: string
}

export interface JobStats {
  pending: number
  scheduled: number
  inProgress: number
  completed: number
  invoiced: number
  cancelled: number
  totalToday: number
  completedToday: number
  revenue: number
}

// â”€â”€â”€ Finance Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID'
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED'
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'

export interface Invoice {
  id: string
  companyId: string
  invoiceNumber: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  jobId?: string
  jobTitle?: string
  status: InvoiceStatus
  total: string        // Prisma Decimal serialised as string
  balanceDue: string
  amountPaid: string
  issuedAt?: string
  dueAt?: string
  paidAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Quote {
  id: string
  companyId: string
  quoteNumber: string
  title: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  jobId?: string
  jobTitle?: string
  status: QuoteStatus
  total: string        // Prisma Decimal serialised as string
  taxRate?: number
  expiresAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  companyId: string
  category: string
  vendor?: string
  amount: string       // Prisma Decimal
  status: ExpenseStatus
  jobId?: string
  invoiceId?: string
  date: string
  description?: string
  receiptUrl?: string
  createdAt: string
  updatedAt: string
}

// â”€â”€â”€ Scheduling Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Appointment {
  id: string
  companyId: string
  jobId?: string
  customerId?: string
  customerName?: string
  technicianId?: string
  technicianName?: string
  serviceType?: string
  status: AppointmentStatus
  scheduledStart: string
  scheduledEnd?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Technician {
  id: string
  companyId: string
  userId: string
  name: string
  phone?: string
  avatarUrl?: string
  skills: string[]
  maxDailyJobs: number
  isActive: boolean
  rating: number
  totalRatings: number
  lastSeenAt?: string
  currentLocation?: { lat: number; lng: number }
  speedKmh?: number
  headingDeg?: number
  batteryPct?: number
  locationUpdatedAt?: string
  createdAt: string
  updatedAt: string
}

// â”€â”€â”€ Scheduling Service (Go) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type AssignmentStatus = 'SUGGESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'CANCELLED'

export interface DispatchAssignment {
  id: string
  companyId: string
  jobId: string
  workOrderId?: string
  technicianId: string
  technicianName?: string
  status: AssignmentStatus
  score?: number
  distanceKm?: number
  assignedBy?: string       // null = auto-assigned
  assignedAt: string
  enRouteAt?: string
  onSiteAt?: string
  completedAt?: string
  scheduledStart?: string
  scheduledEnd?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AssignJobRequest {
  jobId: string
  jobLatitude: number
  jobLongitude: number
  requiredSkills?: string[]
  scheduledStart?: string
  scheduledEnd?: string
}

export interface ManualAssignRequest {
  jobId: string
  technicianId: string
  jobLatitude: number
  jobLongitude: number
  scheduledStart?: string
  scheduledEnd?: string
  notes?: string
}

export interface ScoredTechnician {
  technician: Technician
  score: number
  distanceKm: number
  activeJobs: number
  distanceScore: number
  workloadScore: number
  ratingScore: number
}

export interface AssignResponse {
  autoAssigned: boolean
  assignment?: DispatchAssignment
  suggestions?: ScoredTechnician[]
}

// â”€â”€â”€ Communications Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
export type MessageChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
export type ThreadStatus = 'ACTIVE' | 'RESOLVED' | 'SPAM'

/** A single message inside a thread (direction always present here) */
export interface ThreadMessage {
  id: string
  threadId?: string
  companyId?: string
  senderId?: string
  senderName?: string
  body: string
  subject?: string
  direction: 'INBOUND' | 'OUTBOUND'
  status?: MessageStatus
  sentAt?: string
  createdAt: string
}

/** Thread summary returned by GET /messaging/threads */
export interface MessageThread {
  id: string
  companyId: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  // Staff/internal thread fields
  participantIds?: string[]
  participantNames?: string[]
  subject?: string
  jobId?: string
  channel?: MessageChannel
  status: ThreadStatus
  lastMessageAt?: string
  unreadCount?: number
  lastMessageBody?: string
  createdAt: string
  updatedAt: string
}

/** Thread detail with messages â€” GET /messaging/threads/:id */
export interface MessageThreadDetail extends MessageThread {
  messages: ThreadMessage[]
}

/** Legacy flat Message â€” kept for backwards compat / notifications */
export interface Message {
  id: string
  companyId: string
  channel: MessageChannel
  to: string
  subject?: string
  body: string
  status: MessageStatus
  direction?: 'INBOUND' | 'OUTBOUND'
  customerId?: string
  customerName?: string
  createdAt: string
  sentAt?: string
}

export interface Notification {
  id: string
  companyId: string
  userId?: string
  title: string
  body: string
  isRead: boolean
  type?: string
  referenceId?: string
  referenceType?: string
  createdAt: string
  channel?: MessageChannel
  status?: MessageStatus | 'QUEUED' | 'BOUNCED'
  recipientName?: string
  sentRecipientCount?: number
  sentRoles?: string[]
}

// â”€â”€â”€ Analytics Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface KpiCard {
  label: string
  value: number
  formattedValue: string
  trend?: number
  trendLabel?: string
  unit?: string
}

export interface DashboardKpis {
  revenue: KpiCard
  jobsCompleted: KpiCard
  activeCustomers: KpiCard
  avgRating: KpiCard
  outstandingInvoices: KpiCard
  leadConversionRate: KpiCard
  periodLabel: string
}

export interface RevenueSeries {
  period: string
  revenue: number
  jobCount?: number
  invoiceCount?: number
}

export interface JobsByStatus {
  status: string
  count: number
}

export interface TechLeaderboard {
  technicianId: string
  technicianName: string
  jobsCompleted: number
  totalRevenue: number
  avgRating: number
  completionRate: number
}

export interface CustomerAcquisition {
  period: string
  newCustomers: number
  returningCustomers: number
}

export interface RevenueByCategory {
  category: string
  total: number
  percentage: number
}

// â”€â”€â”€ Inventory Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type ItemCategory = 'PART' | 'MATERIAL' | 'TOOL' | 'CONSUMABLE'
export type LocationType = 'WAREHOUSE' | 'VAN'
export type MovementType = 'INTAKE' | 'TRANSFER' | 'CONSUME' | 'ADJUST' | 'RETURN'
export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'

export interface InventoryItem {
  id: string
  companyId: string
  priceBookItemId?: string
  sku: string
  name: string
  description?: string
  category: ItemCategory
  unit: string
  reorderPoint: number
  reorderQty: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  stockLevels?: StockLevel[]
}

export interface StockLocation {
  id: string
  companyId: string
  type: LocationType
  name: string
  technicianId?: string
  isActive: boolean
}

export interface StockLevel {
  id: string
  inventoryItemId: string
  inventoryItem?: InventoryItem
  locationId: string
  location?: StockLocation
  quantity: number | string
  reservedQty: number | string
}

export interface StockMovement {
  id: string
  companyId: string
  inventoryItemId: string
  inventoryItem?: { name: string; sku: string }
  fromLocationId?: string
  fromLocation?: { name: string; type: LocationType }
  toLocationId?: string
  toLocation?: { name: string; type: LocationType }
  quantity: number | string
  movementType: MovementType
  referenceId?: string
  referenceType?: string
  notes?: string
  performedBy: string
  performedByName?: string
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  companyId: string
  poNumber: string
  supplierName: string
  status: PurchaseOrderStatus
  items: { inventoryItemId: string; qty: number; unitCost: number }[]
  totalCost: number | string
  notes?: string
  orderedAt?: string
  receivedAt?: string
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface LowStockAlert {
  inventoryItemId: string
  itemName: string
  sku: string
  category: ItemCategory
  currentQty: number
  reorderPoint: number
  reorderQty: number
  deficit: number
}

export interface CompanyProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country: string
  website?: string
  logoUrl?: string
  automaticFollowupEnabled: boolean
  isActive: boolean
  trialEndsAt?: string
  createdAt: string
  updatedAt: string
}

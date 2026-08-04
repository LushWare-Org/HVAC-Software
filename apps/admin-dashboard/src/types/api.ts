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
  // portal account status (merged from CompanyUser via auth0UserId)
  auth0UserId?: string
  mustResetPassword?: boolean
  lastLoginAt?: string
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
    reason: string
  } | null
  retentionPrediction?: {
    customerId: string
    pConvert: number
    ltv: number
    churnProbability: number
    score: number
    action: string
    offer: {
      type: string
      discount: number
    }
    recommendedChannel: 'whatsapp' | 'email' | 'call'
    priority: 'low' | 'medium' | 'high'
    triggerImmediately: boolean
    reason: string
  } | null
  revenueRecommendation?: {
    id: string
    category:
      | 'payment_collection'
      | 'quote_recovery'
      | 'agreement_renewal'
      | 'maintenance_plan'
      | 're_engagement'
      | 'no_opportunity'
    action: string | null
    priority: 'low' | 'medium' | 'high'
    channel: 'whatsapp' | 'email' | 'call' | null
    reason: string
    message: string | null
    expectedRevenueImpact: number | null
    confidence: number | null
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
  reasoning?: {
    upsellRecommendation: {
      ruleBased: string
      calculation: string
      interpretation: string
    }
    retentionSuggestion: {
      ruleBased: string
      calculation: string
      interpretation: string
    }
    failureAndChurnPrediction: {
      ruleBased: string
      calculation: string
      interpretation: string
    }
    proposedNextStep: {
      ruleBased: string
      calculation: string
      interpretation: string
    }
  }
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

export interface LeadStatusSummary {
  leadId: string
  currentStatus: string
  conversionPrediction: {
    probability: number
    level: 'Low' | 'Medium' | 'High'
    summary: string
  }
  riskPrediction: {
    probability: number
    level: 'Low' | 'Medium' | 'High'
    summary: string
  }
  recommendedAction: {
    action: string
    priority: 'low' | 'medium' | 'high'
    channel: 'whatsapp' | 'email' | 'call'
    reason: string
    triggerImmediately: boolean
  }
  valueRecommendation: {
    recommendedOffer: string
    confidence: number
    priorityScore: number
    status: string
  }
  proposedNextStep: string
  predictionSource: 'model' | 'fallback'
  reasoning: {
    leadConversion: {
      ruleBased: string
      mlResult: string
      aiExplanation: string
    }
    riskPrediction: {
      ruleBased: string
      mlResult: string
      aiExplanation: string
    }
    recommendation: {
      ruleBased: string
      mlResult: string
      aiExplanation: string
    }
    proposedNextStep: {
      ruleBased: string
      mlResult: string
      aiExplanation: string
    }
  }
  signals: {
    ageDays: number
    estimatedValue: number
    hasEmail: boolean
    hasPhone: boolean
    hasWhatsapp: boolean
    sourceQuality: 'high' | 'medium' | 'low'
  }
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
  jobNumber?: string
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
  estimatedDurationMins?: number
  completedAt?: string
  estimatedAmount?: number
  finalAmount?: number
  tags: string[]
  agreementId?: string
  isAgreementJob?: boolean
  projectId?: string
  houseId?: string
  equipmentId?: string
  cancellationReason?: string
  hasPartShortage?: boolean
  partShortageNote?: string
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

export interface Payment {
  id: string
  invoiceId: string
  amount: string        // Prisma Decimal serialised as string
  paymentMethod: string // CARD | ACH | CASH | CHECK | OTHER
  status: string        // PENDING | SUCCEEDED | FAILED | REFUNDED
  receiptNumber?: string
  paidAt?: string
  notes?: string
  createdAt: string
}

export interface Invoice {
  id: string
  companyId: string
  invoiceNumber: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  jobId?: string
  jobTitle?: string
  projectId?: string
  houseId?: string
  quoteId?: string
  quote?: { quoteNumber: string }
  status: InvoiceStatus
  total: string        // Prisma Decimal serialised as string
  balanceDue: string
  amountPaid: string
  dueDate?: string
  paidAt?: string
  notes?: string
  quickbooksId?: string
  payments?: Payment[]
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
  projectId?: string
  houseId?: string
  status: QuoteStatus
  total: string        // Prisma Decimal serialised as string
  taxRate?: number
  validUntil?: string
  notes?: string
  invoices?: { id: string; invoiceNumber: string; status: string }[]
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
/**
 * SMS / email / push delivery record (Notification).
 *
 * Direction is always present on records the backend returns — comms-service
 * Prisma schema declares `direction MessageDirection` as required. Outbound
 * records use `OUTBOUND`; inbound webhook deliveries (e.g. Twilio reply) use
 * `INBOUND`. Don't reintroduce a `direction?` optional unless an endpoint
 * provably omits it.
 */
export interface Message {
  id: string
  companyId: string
  channel: MessageChannel
  to: string
  subject?: string
  body: string
  status: MessageStatus
  direction: 'INBOUND' | 'OUTBOUND'
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
  onTimeRate?: number
  performanceScore?: number
  avgJobDurationMins?: number
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

export interface RevenueAgentSummary {
  revenue_accuracy: number
  revenue_mean_error: number
  demand_accuracy: number
  utilization_accuracy: number
  action_success_rate: number
  pricing_impact: number
  sample_size: number
}

export interface RevenueAgentTrendPoint {
  date: string
  revenue_accuracy: number
  demand_accuracy: number
  utilization_accuracy: number
  action_success_rate: number
  pricing_impact: number
  sample_size: number
}

export interface Recommendation {
  id: string
  title: string
  description: string
  action: string
  actionLabel: string
  impact: number
  confidence: number
  priority: 'high' | 'medium' | 'low'
  reason: string
  trend: 'up' | 'down' | 'neutral'
  priorityScore: number
}

export interface ExecuteActionRequest {
  action: string
  params?: Record<string, unknown>
}

export interface ExecuteActionResponse {
  success: boolean
  action: string
  executedAt: string
  message: string
  logId?: string
  result?: {
    summary: string
    details: Record<string, unknown>
    affectedCount?: number
    estimatedRevenue?: number
  }
}

export interface ExecutionLog {
  id: string
  companyId: string
  action: string
  params: Record<string, unknown>
  status: 'executed' | 'failed'
  timestamp: string
  result_summary?: string
  affected_count?: number
  estimated_revenue?: number
  error?: string
}

export interface RevenueAgentLog {
  timestamp: string
  action: string
  predicted_revenue?: number
  actual_revenue?: number
  baseline_revenue?: number
  expected_demand?: number
  actual_demand?: number
  utilization_predicted?: number
  utilization_actual?: number
  utilization?: number
  optimal_price?: number
  applied_price?: number
  customer_id?: string | null
  job_id?: string | null
  capacity_status?: string | null
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
  unitCost?: number
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

// ─── Bandit Observability Dashboard ─────────────────────────────────────────

export type BanditAgent = 'revenue' | 'retention' | 'upsell' | 'followup'

export interface BanditSummary {
  avg_reward: number
  exploration_rate: number
  top_action: string | null
  revenue_uplift: number
  sample_size: number
}

export interface BanditRewardPoint {
  date: string
  avg_reward: number
  count: number
}

export interface BanditActionRow {
  action: string
  count: number
  pct: number
}

export interface BanditExplorationTrendPoint {
  date: string
  exploration_rate: number
  count: number
}

export interface BanditExplorationData {
  overall_rate: number
  explored: number
  exploited: number
  total: number
  trend: BanditExplorationTrendPoint[]
}

export interface BanditUpliftTrendPoint {
  date: string
  avg_uplift: number
  total_uplift: number
  count: number
}

export interface BanditRevenueImpact {
  avg_uplift: number
  total_uplift: number
  sample_size: number
  trend: BanditUpliftTrendPoint[]
}

export interface BanditContextRow {
  state_key: (string | number)[]
  action: string
  avg_reward: number
  count: number
}

export interface BanditRegretTrendPoint {
  date: string
  daily_regret: number
  count: number
  avg_daily_regret: number
}

export interface BanditRegret {
  total_regret: number
  avg_regret: number
  sample_size: number
  regret_by_agent: Record<string, number>
  trend: BanditRegretTrendPoint[]
}

// ─── Company Profile ──────────────────────────────────────────────────────────

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

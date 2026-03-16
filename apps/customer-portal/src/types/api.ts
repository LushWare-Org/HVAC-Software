// ============================================================
// Customer Portal — API Type Definitions
// Mirrors backend DTOs for CRM, Job, Finance services
// ============================================================

// ---- Pagination ----
export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// ---- CRM: Customer Profile ----
export interface CustomerProfile {
  id: string
  companyId: string
  type: 'RESIDENTIAL' | 'COMMERCIAL'
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  notes?: string
  source?: string
  tags: string[]
  isActive: boolean
  engagementStatus: string
  auth0UserId?: string
  createdAt: string
  updatedAt: string
  contacts: CustomerContact[]
  addresses: CustomerAddress[]
  equipment: CustomerEquipment[]
  _count: { leads: number; agreements: number; bookings: number }
}

export interface CustomerContact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role?: string
  isPrimary: boolean
}

export interface CustomerAddress {
  id: string
  type: string
  line1: string
  line2?: string
  city?: string
  state?: string
  postcode?: string
  isPrimary: boolean
}

export interface CustomerEquipment {
  id: string
  type: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
}

// ---- CRM: Bookings ----
export interface Booking {
  id: string
  companyId: string
  customerId?: string
  serviceType: string
  description?: string
  preferredDate: string
  alternateDate?: string
  status: 'PENDING' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED'
  jobId?: string
  notes?: string
  guestName?: string
  guestEmail?: string
  createdAt: string
  updatedAt: string
}

// ---- Jobs ----
export type JobStatus =
  | 'PENDING' | 'SCHEDULED' | 'EN_ROUTE' | 'ON_SITE'
  | 'COMPLETED' | 'INVOICED' | 'PAID' | 'CANCELLED' | 'ON_HOLD'

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'

export interface Job {
  id: string
  companyId: string
  jobNumber: string
  title: string
  description?: string
  status: JobStatus
  priority: JobPriority
  customerId?: string
  customerName?: string
  serviceAddress?: string
  assignedToId?: string
  assignedToName?: string
  scheduledStart?: string
  scheduledEnd?: string
  estimatedDuration?: number
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  jobType?: { id: string; name: string; tradeType: string }
  statusHistory?: JobStatusHistory[]
}

export interface JobStatusHistory {
  id: string
  toStatus: JobStatus
  note?: string
  changedByName: string
  createdAt: string
}

export interface DispatchAssignment {
  id: string
  companyId: string
  jobId: string
  technicianId: string
  technicianName?: string
  assignedByName?: string
  status: string
  assignedBy?: string
  assignedAt: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface Technician {
  id: string
  name: string
  phone?: string
  skills?: string[]
  isActive: boolean
}

export interface JobStats {
  total: number
  pending: number
  scheduled: number
  enRoute: number
  onSite: number
  completed: number
  invoiced: number
  cancelled: number
  todayScheduled: number
}

// ---- Finance: Invoices ----
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID'
export type PaymentMethod = 'CASH' | 'CHECK' | 'CARD' | 'BANK_TRANSFER' | 'STRIPE' | 'ACH'

export interface Invoice {
  id: string
  companyId: string
  invoiceNumber: string
  customerId?: string
  customerName?: string
  jobId?: string
  status: InvoiceStatus
  issueDate: string
  dueDate?: string
  subtotal: string | number
  taxRate: string | number
  taxAmount: string | number
  total: string | number
  amountPaid: string | number
  notes?: string
  createdAt: string
  updatedAt: string
  lineItems?: InvoiceLineItem[]
  payments?: InvoicePayment[]
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: string | number
  total: string | number
}

export interface InvoicePayment {
  id: string
  amount: string | number
  method: PaymentMethod
  paidAt: string
  notes?: string
}

export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CONVERTED'

export interface Quote {
  id: string
  companyId: string
  quoteNumber: string
  title: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  jobId?: string
  status: QuoteStatus
  subtotal: string | number
  discountAmount: string | number
  taxRate: string | number
  taxAmount: string | number
  total: string | number
  notes?: string
  sentAt?: string
  viewedAt?: string
  approvedAt?: string
  acceptedAt?: string
  validUntil?: string
  terms?: string
  createdAt: string
  updatedAt: string
  lineItems?: QuoteLineItem[]
}

export interface QuoteLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: string | number
  lineTotal: string | number
}

export interface InvoiceMetrics {
  totalRevenue: number
  outstandingBalance: number
  overdueAmount: number
  byMethod: Record<string, number>
}

// ---- Finance: Stripe ----
export interface PaymentIntent {
  clientSecret: string
  paymentIntentId: string
  paymentUrl?: string
}

// ---- Analytics ----
export interface CustomerDashboardData {
  totalJobs: number
  completedJobs: number
  upcomingJobs: number
  pendingInvoices: number
  totalSpent: number
  outstandingBalance: number
  nextAppointment?: Job
  recentJobs: Job[]
  pendingInvoiceItems: Invoice[]
}

export type MessageChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
export type ThreadStatus = 'ACTIVE' | 'RESOLVED' | 'SPAM'

export interface ThreadMessage {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  createdAt: string
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
}

export interface MessageThread {
  id: string
  companyId: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  channel?: MessageChannel
  status: ThreadStatus
  lastMessageAt?: string
  unreadCount?: number
  lastMessageBody?: string
  createdAt: string
  updatedAt: string
  messages?: ThreadMessage[]
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
}

// ============================================================
// Technician App — API Type Definitions
// Mirrors backend DTOs for all 6 microservices
// ============================================================

// ---- Pagination ----
export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// ---- Auth ----
export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'OFFICE_MANAGER'
  | 'DISPATCHER'
  | 'TECHNICIAN'
  | 'CUSTOMER'

export interface TechUser {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string
  phone?: string
}

export interface LoginResponse {
  access_token: string
  user: TechUser
}

// ---- CRM: Customer ----
export interface Customer {
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
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  contacts?: CustomerContact[]
  addresses?: CustomerAddress[]
  equipment?: CustomerEquipment[]
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

// ---- Jobs ----
export type JobStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INVOICED'
  | 'PAID'
  | 'CANCELLED'
  | 'ON_HOLD'

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
  serviceLatitude?: number
  serviceLongitude?: number
  assignedToId?: string
  assignedToName?: string
  scheduledStart?: string
  scheduledEnd?: string
  estimatedDuration?: number
  notes?: string
  internalNotes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  jobType?: JobType
  statusHistory?: JobStatusHistory[]
  workOrders?: WorkOrder[]
  customFieldValues?: CustomFieldValue[]
}

export interface JobType {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  tradeType?: string
  sortOrder?: number
  isActive: boolean
}

export interface JobStatusHistory {
  id: string
  fromStatus?: JobStatus
  toStatus: JobStatus
  note?: string
  changedBy?: string
  changedByName?: string
  createdAt: string
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

// ---- Work Orders ----
export type WorkOrderStatus = 'PENDING' | 'ON_SITE' | 'COMPLETED'

export interface WorkOrder {
  id: string
  jobId: string
  technicianId?: string
  technicianName?: string
  status: WorkOrderStatus
  checkedInAt?: string
  checkedOutAt?: string
  notes?: string
  tasks: TaskCompletion[]
  lineItems: LineItem[]
  createdAt: string
  updatedAt: string
}

export interface TaskCompletion {
  id: string
  taskName: string
  description?: string
  taskOrder: number
  isRequired: boolean
  photoRequired?: boolean
  safetyNote?: string
  estimatedMins?: number
  isCompleted: boolean
  completedAt?: string
  notes?: string
  photoUrl?: string
}

export interface LineItem {
  id: string
  priceBookItemId?: string
  description: string
  category: LineItemCategory
  quantity: number
  unitPrice: number | string
  taxable: boolean
  total: number | string
}

export type LineItemCategory =
  | 'LABOUR'
  | 'PART'
  | 'MATERIAL'
  | 'EQUIPMENT_RENTAL'
  | 'SUBCONTRACTOR'
  | 'OTHER'

// ---- Price Book ----
export interface PriceBookItem {
  id: string
  category: LineItemCategory
  code?: string
  name: string
  description?: string
  unit?: string
  unitPrice: number | string
  taxable: boolean
  jobTypeId?: string
  isActive: boolean
}

// ---- Trade Templates & Custom Fields ----
export interface TradeTemplate {
  id: string
  jobTypeId: string
  name: string
  description?: string
  estimatedDurationMins?: number
  requiredParts?: { inventoryItemId: string; name: string; qty: number }[]
  tasks: TemplateTask[]
  customFields: CustomFieldDef[]
}

export interface TemplateTask {
  id: string
  taskName: string
  description?: string
  taskOrder: number
  isRequired: boolean
  photoRequired?: boolean
  safetyNote?: string
  estimatedMins?: number
}

export interface CustomFieldDef {
  id: string
  jobTypeId: string
  fieldKey: string
  label: string
  fieldType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'DATE' | 'TEXTAREA'
  options?: string // JSON string of options for SELECT/MULTI_SELECT
  isRequired: boolean
  helpText?: string
  sortOrder: number
  isActive: boolean
}

export interface CustomFieldValue {
  fieldDefId: string
  fieldKey: string
  label: string
  fieldType: string
  value: unknown
}

// ---- Scheduling: Technician Profile ----
export interface TechnicianProfile {
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
  createdAt: string
  updatedAt: string
}

// ---- Scheduling: Dispatch Assignments ----
export type AssignmentStatus =
  | 'SUGGESTED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'COMPLETED'
  | 'CANCELLED'

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
  assignedBy?: string
  assignedByName?: string
  assignedAt?: string
  enRouteAt?: string
  onSiteAt?: string
  completedAt?: string
  scheduledStart?: string
  scheduledEnd?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ---- Finance: Expenses ----
export type ExpenseCategory =
  | 'PARTS'
  | 'FUEL'
  | 'TOOLS'
  | 'SUBCONTRACTOR'
  | 'PERMITS'
  | 'OTHER'

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Expense {
  id: string
  companyId: string
  jobId?: string
  technicianId?: string
  category?: ExpenseCategory
  description: string
  amount: number | string
  vendor?: string
  receiptUrl?: string
  expenseDate?: string
  isReimbursable: boolean
  status: ExpenseStatus
  createdBy?: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseDto {
  jobId?: string
  technicianId?: string
  category?: ExpenseCategory
  description: string
  amount: number
  vendor?: string
  receiptUrl?: string
  expenseDate?: string
  isReimbursable?: boolean
}

// ---- Comms: Notifications ----
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

// ---- Comms: Messaging ----
export type ThreadStatus = 'ACTIVE' | 'RESOLVED' | 'SPAM'

export interface ThreadMessage {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderId?: string
  senderName?: string
  createdAt: string
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
}

export interface MessageThread {
  id: string
  companyId: string
  // Customer thread fields
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  // Staff/internal thread fields
  participantIds?: string[]
  participantNames?: string[]
  subject?: string
  // Common fields
  jobId?: string
  channel?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
  status: ThreadStatus
  lastMessageAt?: string
  unreadCount?: number
  lastMessageBody?: string
  createdAt: string
  updatedAt: string
  messages?: ThreadMessage[]
}

// ---- GPS ----
export interface GpsPayload {
  lat: number
  lng: number
  accuracyM?: number
  speedKmh?: number
  headingDeg?: number
  batteryPct?: number
}

// ---- Analytics ----
export interface TechnicianMetrics {
  technician: { id: string; name: string; rating: number }
  jobsCompleted: number
  completionRate: number
  totalRevenue: number
  avgJobTime: number
  avgCustomerRating: number
  skillUtilization?: Record<string, number>
  performanceTrend?: Array<{ date: string; jobsCompleted: number; revenue: number }>
}

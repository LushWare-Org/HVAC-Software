export interface CustomerUser {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  /** Present for portal customers; absent for staff roles. */
  customerId?: string
  mustResetPassword?: boolean
}

export interface LoginResponse {
  access_token: string
  user: CustomerUser
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface Job {
  id: string
  jobNumber?: string
  title: string
  description?: string | null
  status: string
  priority?: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
  /** WINDOW = the customer asked for an arrival window and no exact time is set yet. */
  timeMode?: 'EXACT' | 'WINDOW' | null
  windowStart?: string | null
  windowEnd?: string | null
  /** The start time the customer confirmed; it counts only while it equals scheduledStart. */
  confirmedFor?: string | null
  confirmedAt?: string | null
  completedAt?: string | null
  assignedToId?: string | null
  assignedToName?: string | null
  /** Set while a reschedule request is awaiting a dispatcher. */
  rescheduleState?: string | null
  serviceAddress?: string | null
  serviceLatitude?: number | null
  serviceLongitude?: number | null
  notes?: string | null
  estimatedValue?: string | number | null
  quoteId?: string | null
  invoiceId?: string | null
  customerId?: string
  currency?: string
  createdAt?: string
  statusHistory?: JobStatusHistoryEntry[]
}

export interface JobStatusHistoryEntry {
  id?: string
  toStatus: string
  fromStatus?: string | null
  changedByName?: string | null
  note?: string | null
  createdAt?: string
}

export interface BookServiceInput {
  title: string
  description?: string
  serviceAddress: string
  serviceLatitude?: number
  serviceLongitude?: number
  preferredStart?: string
  /** Set with timeMode WINDOW: the whole arrival window the customer picked. */
  preferredEnd?: string
  timeMode?: 'EXACT' | 'WINDOW'
  equipmentId?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  subtotal?: string | number
  taxAmount?: string | number
  total: string | number
  amountPaid?: string | number
  balanceDue?: string | number
  dueDate?: string
  paidAt?: string | null
  notes?: string | null
  approvedAt?: string | null
  declinedAt?: string | null
  declineReason?: string | null
  quoteId?: string | null
  customerId?: string
  currency?: string
  createdAt?: string
  lineItems?: LineItem[]
  payments?: InvoicePayment[]
}

export interface LineItem {
  id?: string
  description: string
  category?: string
  quantity: string | number
  unitPrice: string | number
  lineTotal?: string | number
}

export interface Quote {
  id: string
  quoteNumber: string
  title?: string
  description?: string | null
  status: string
  subtotal?: string | number
  discountAmount?: string | number
  taxAmount?: string | number
  total: string | number
  validUntil?: string | null
  notes?: string | null
  terms?: string | null
  approvedAt?: string | null
  customerId?: string
  currency?: string
  createdAt?: string
  lineItems?: LineItem[]
}

export interface InvoicePayment {
  id: string
  amount: string | number
  paymentMethod?: string
  receiptNumber?: string | null
  paidAt?: string | null
  createdAt?: string
  currency?: string
}

export type MessageChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
export type ThreadStatus = 'ACTIVE' | 'RESOLVED' | 'SPAM'

export interface ThreadMessage {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  createdAt: string
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  senderId?: string
  senderName?: string
}

export interface MessageThread {
  id: string
  companyId: string
  customerId?: string
  customerName?: string
  channel?: MessageChannel
  status: ThreadStatus
  subject?: string | null
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

export interface MyAgreementAmendment {
  id: string
  changedFields: Record<string, { from: unknown; to: unknown }>
  customerConfirmedAt?: string | null
  createdAt: string
}

export type AgreementStatus =
  | 'DRAFT' | 'SENT' | 'ACTIVE' | 'PENDING_RENEWAL' | 'RENEWED' | 'EXPIRED' | 'CANCELLED'

export interface MyAgreement {
  id: string
  name: string
  projectId?: string | null
  houseId?: string | null
  componentId?: string | null
  description?: string | null
  status: AgreementStatus
  startDate: string
  endDate?: string | null
  value?: string | number | null
  billingCycle?: string | null
  billingAmount?: string | number | null
  nextBillingDate?: string | null
  serviceType?: string | null
  serviceInterval?: string | null
  serviceIntervalDays?: number | null
  visitsIncluded?: number | null
  visitsUsed: number
  lastServiceDate?: string | null
  nextServiceDate?: string | null
  customerConfirmedAt?: string | null
  signedByName?: string | null
  documentUrl?: string | null
  /** Present on /agreements/mine — lets the app confirm in place, no email link needed. */
  confirmToken?: string | null
  amendments?: MyAgreementAmendment[]
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

export interface MyProject {
  id: string
  name: string
  description?: string | null
  category?: string | null
  status: ProjectStatus
  startDate?: string | null
  targetEndDate?: string | null
  siteAddress?: string | null
}

export interface MyProjectJob {
  id: string
  title: string
  status: string
  scheduledStart?: string | null
  rescheduleState?: string | null
}

export interface MyProjectQuote {
  id: string
  quoteNumber?: string
  status: string
  total: number
  createdAt: string
}

export interface MyProjectMoney {
  invoiced: number
  paid: number
  outstanding: number
}

export interface MyComponent {
  id: string
  projectId: string
  projectName: string
  componentTypeKey: string
  label: string
  tags: string[]
}

export interface MyComponentEquipment {
  id: string
  type: string
  brand?: string | null
  model?: string | null
  serialNo?: string | null
  installDate?: string | null
  warrantyEnd?: string | null
}

export type MyIssueStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'

export interface MyIssueReport {
  id: string
  componentId: string
  equipmentId?: string | null
  errorCode?: string | null
  description?: string | null
  status: MyIssueStatus
  createdAt: string
}

export interface MyComponentServiceEntry {
  id: string
  title: string
  status: string
  scheduledStart?: string
  rescheduleState?: string | null
}

export interface AddMyEquipmentInput {
  type?: string
  brand?: string
  model?: string
  serialNo?: string
  installDate?: string
  warrantyEnd?: string
  notes?: string
}

export type PostType = 'TIP' | 'VIDEO' | 'OFFER'

export interface ContractorPost {
  id: string
  type: PostType
  title: string
  body?: string
  videoUrl?: string
  heroImageUrl?: string
  isPinned: boolean
  isPublished: boolean
  publishedAt?: string
  createdAt: string
}

// ─── Chat (comms /chat) ──────────────────────────────────────────────────────
export type ChatKind = 'CUSTOMER_OFFICE' | 'CUSTOMER_TECH' | 'TECH_OFFICE' | 'STAFF_DIRECT' | 'STAFF_GROUP'

export interface ChatConversation {
  id: string
  kind: ChatKind
  /** How it reads for me: the customer's name, the technician's, a colleague's, or the group's. */
  title: string
  subtitle: string
  customerId: string | null
  /** The other staff member (technician↔office, direct and customer↔technician chats). */
  peerUserId: string | null
  /** My seat in it: my user id, or "office" in shared inboxes. A message is mine when senderMemberKey equals this. */
  myMemberKey: string
  unread: number
  lastSeq: number
  lastMessageAt: string | null
  lastMessagePreview: string | null
  lastSenderName: string | null
  muted: boolean
  archived: boolean
  createdAt: string
}

export interface ChatAttachment { url: string; name?: string; type?: string; size?: number }

export interface ChatMessage {
  id: string
  conversationId: string
  seq: number
  senderKind: 'STAFF' | 'CUSTOMER' | 'SYSTEM' | 'KELVIN'
  senderMemberKey: string
  senderUserId: string | null
  senderName: string
  senderRole: string | null
  body: string
  attachments: ChatAttachment[] | null
  jobId: string | null
  jobNumber: string | null
  clientId: string | null
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  /** Only on messages this screen is still sending. */
  pending?: boolean
  failed?: boolean
}

export interface ChatMemberInfo { memberKey: string; kind: 'STAFF' | 'CUSTOMER' | 'OFFICE'; name: string; role: string | null; lastReadSeq: number; isMe: boolean }

export interface ChatDetail extends ChatConversation {
  members: ChatMemberInfo[]
  messages: ChatMessage[]
  hasMore: boolean
}

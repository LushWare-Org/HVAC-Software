// ============================================================
// @tscrm/types — Shared TypeScript types across all services
// ============================================================

// ---- RBAC Roles ----
export enum Role {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  OFFICE_MANAGER = 'office_manager',
  DISPATCHER = 'dispatcher',
  TECHNICIAN = 'technician',
  CUSTOMER = 'customer',
}

// ---- Auth0 JWT Payload (after validation) ----
export interface JwtPayload {
  sub: string;           // Auth0 user ID
  email: string;
  company_id: string;    // injected via Auth0 Actions
  role: Role;            // injected via Auth0 Actions
  name?: string;
  picture?: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
}

// ---- Authenticated user attached to request ----
export interface AuthUser {
  userId: string;        // Auth0 sub
  email: string;
  companyId: string;
  role: Role;
  name?: string;
}

// ---- Multi-tenant base interface (all DB entities extend this) ----
export interface TenantEntity {
  id: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Job Status (shared between job-service and other services) ----
export enum JobStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  EN_ROUTE = 'en_route',
  ON_SITE = 'on_site',
  COMPLETED = 'completed',
  INVOICED = 'invoiced',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

// ---- Job Priority ----
export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  EMERGENCY = 'emergency',
}

// ---- Trade Types ----
export enum TradeType {
  HVAC = 'hvac',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  GENERAL = 'general',
}

// ---- Lead Status ----
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL_SENT = 'proposal_sent',
  WON = 'won',
  LOST = 'lost',
}

// ---- Invoice Status ----
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  VOID = 'void',
}

// ---- Quote Status ----
export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

// ---- Pagination ----
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ---- API Response wrapper ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ---- BullMQ Job payloads (used by queue package) ----
export interface SendSmsPayload {
  to: string;
  message: string;
  companyId: string;
  jobId?: string;
  customerId?: string;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string | number | boolean>;
  companyId: string;
}

export interface SendPushPayload {
  expoPushTokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  companyId: string;
}

export interface GeneratePdfPayload {
  templateName: string;
  data: Record<string, unknown>;
  outputKey: string;   // S3 key where PDF will be stored
  companyId: string;
  entityId: string;    // quote/invoice/contract ID
}

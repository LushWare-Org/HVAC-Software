// ============================================================
// @tscrm/types — Shared TypeScript types across all services
// ============================================================

// Re-export pagination guards so every service can import from one place.
export * from './pagination';

// Per-tenant settings (currency, timezone, feature flags).
export * from './company-settings';

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
  customer_id?: string;  // set for CUSTOMER role — links to crm.customers.id
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
}

// ---- Authenticated user attached to request ----
export interface AuthUser {
  userId: string;        // Auth0 sub / local user id
  email: string;
  companyId: string;
  role: Role;
  name?: string;
  customerId?: string;   // Set for CUSTOMER role — links to crm.customers.id
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
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  EN_ROUTE = 'EN_ROUTE',
  ON_SITE = 'ON_SITE',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

// ---- Job Priority ----
export enum JobPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
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
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  WON = 'WON',
  LOST = 'LOST',
}

// ---- Invoice Status ----
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

// ---- Quote Status ----
export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
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

export type FollowupAction = 'RETENTION' | 'REENGAGEMENT' | 'LEAD_FOLLOWUP' | 'UPSELL';

export interface FollowupJobPayload {
  companyId: string;
  entityType: 'customer' | 'lead';
  entityId: string;
  customerId?: string;
  leadId?: string;
  recipientId: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  action: FollowupAction;
  churnProb?: number;
  reason: string;
  triggeredAt: string;
}

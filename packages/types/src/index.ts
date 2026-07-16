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

export type FollowupAction = 'RETENTION' | 'REENGAGEMENT' | 'LEAD_FOLLOWUP' | 'QUOTE_FOLLOWUP' | 'UPSELL';

export type FollowupChannel = 'SMS' | 'EMAIL'; // WhatsApp not wired in comms-service yet

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
  // Rule-based + LLM decision layer (all optional — backward compatible with older producers/workers)
  recommendedMessage?: string;
  recommendedSubject?: string;
  recommendedChannel?: FollowupChannel;
  scheduledFor?: string; // ISO timestamp
  llmConfidence?: number;
}

// ---- Rule-based + LLM follow-up decision engine ----

export type FollowupRuleReasonCode = 'COLD_LEAD' | 'QUOTE_PENDING' | 'CUSTOMER_INACTIVE' | 'AGREEMENT_EXPIRED';

export interface FollowupRuleFacts {
  entityType: 'customer' | 'lead';
  entityId: string;
  companyId: string;
  leadStatus?: string;
  daysSinceLeadCreated?: number;
  quoteStatus?: string;              // latest non-DRAFT quote status, if any
  quoteValue?: number;
  daysSinceQuoteSent?: number;
  daysSinceLastService?: number;
  engagementStatus?: string;
  agreementStatus?: string;          // ServiceAgreement.status
  agreementEndDate?: string | null;
  previousFollowupAttempts: number;  // from followup_attempts, last 90 days
  automaticFollowupEnabled: boolean;
  hasContactChannel: boolean;
  recipientPhone?: string;
  recipientEmail?: string;
}

export interface FollowupRuleResult {
  needsFollowup: boolean;
  action: Exclude<FollowupAction, 'UPSELL'> | null;
  reasonCode: FollowupRuleReasonCode | null;
  reason: string | null;
  matchedRule: string | null; // for audit trail
}

export interface FollowupCustomerProfile {
  customerName: string;
  customerSegment: 'premium' | 'standard' | 'budget' | 'lead';
  leadStatus?: string;
  quoteStatus?: string;
  quoteValue?: number;
  equipmentAge?: number;             // years, if known
  daysSinceLastService?: number;
  maintenanceAgreementStatus?: string;
  previousFollowupAttempts: number;
  preferredCommunication: FollowupChannel;
  recentServiceHistory: string[];    // short human strings
  notes?: string;
  reasonCode: FollowupRuleReasonCode;
  reason: string;
}

export interface FollowupLlmRecommendation {
  channel: FollowupChannel;
  priority: 'Low' | 'Medium' | 'High';
  followupWithin: string;
  reason: string;
  message: string;
  confidence: number;
}

export interface FollowupDecisionAudit {
  ruleResult: FollowupRuleResult;
  llmRecommendation: FollowupLlmRecommendation | null;
  llmModel: string | null;
  validation: { passed: boolean; failedChecks: string[] };
  finalAction: FollowupAction;
  finalChannel: FollowupChannel | null;
  decidedAt: string;
}

// ---- Rule-based + LLM retention decision engine ----
// Replaces the ML-model-backed retention pipeline (conversion/LTV/churn model
// artifacts) with: business rules decide WHETHER retention is required, an LLM
// decides the HOW (strategy/offer/priority/channel/message), and a validation
// layer has final say before anything is surfaced to the CRM. Kept as a
// separate type family from Followup* because retention offers have a
// distinct output contract (offer/discount, commercial priority/score) that
// the admin dashboard already renders — see apps/admin-dashboard/src/types/api.ts.

export type RetentionAction =
  | 'premium_contract_offer'
  | 'discount_retention_offer'
  | 'maintenance_plan_offer'
  | 'no_action';

export type RetentionChannel = 'whatsapp' | 'email' | 'call';

export type RetentionPriority = 'low' | 'medium' | 'high';

export type RetentionCustomerSegment = 'premium' | 'standard' | 'budget';

export type RetentionRuleReasonCode =
  | 'AGREEMENT_EXPIRED'
  | 'CUSTOMER_INACTIVE'
  | 'FREQUENT_REPAIRS'
  | 'CUSTOMER_COMPLAINTS'
  | 'HIGH_VALUE_CUSTOMER'
  | 'NONE';

/** Raw facts the rule engine evaluates. Never passed to the LLM directly. */
export interface RetentionRuleFacts {
  customerId: string;
  companyId: string;
  customerSegment: RetentionCustomerSegment;
  agreementStatus?: string;             // ServiceAgreement.status
  agreementEndDate?: string | null;
  daysSinceLastService: number;
  repairCount12Months: number;          // service visits in the trailing 12 months
  complaintCount: number;                // reviews with rating <= 2 ("low ratings or complaints")
  averageAnnualSpend: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  automaticFollowupEnabled: boolean;     // false = customer opted out
  previousRetentionAttempts: number;
  hasContactChannel: boolean;
}

/**
 * The rule engine ONLY determines whether retention action is required, and why.
 * It never picks the offer, channel, or message — that's the LLM's job.
 */
export interface RetentionRuleResult {
  retentionRequired: boolean;
  highPriority: boolean;                 // e.g. complaint-driven dissatisfaction
  reasonCode: RetentionRuleReasonCode;
  reason: string | null;
  matchedRule: string | null;            // for audit trail
}

/** Structured profile handed to the LLM. No raw Prisma rows ever cross this boundary. */
export interface RetentionCustomerProfile {
  customerName: string;
  customerSegment: RetentionCustomerSegment;
  annualSpend: number;
  equipmentAge?: number;                 // years, if known
  maintenanceAgreementStatus?: string;
  daysSinceLastService: number;
  repairCount: number;
  complaintCount: number;
  preferredCommunication: RetentionChannel;
  previousRetentionAttempts: number;
  activeContracts: number;
  notes?: string;
  reasonCode: RetentionRuleReasonCode;
  reason: string;
}

export interface RetentionLlmRecommendation {
  strategy: string;               // free-text label, e.g. "Premium contract upgrade"
  action: RetentionAction;        // constrained to the company's allowed offer catalog
  priority: 'Low' | 'Medium' | 'High';
  channel: RetentionChannel;
  reason: string;
  message: string;
  confidence: number;
}

export interface RetentionDecisionAudit {
  ruleResult: RetentionRuleResult;
  llmRecommendation: RetentionLlmRecommendation | null;
  llmModel: string | null;
  validation: { passed: boolean; failedChecks: string[] };
  finalAction: RetentionAction;
  finalChannel: RetentionChannel | null;
  decidedAt: string;
}

// ---- Rule-based + LLM upsell decision engine ----
// Replaces the ML-model-backed upsell recommender (churn-service /recommend-offer,
// trained offline on historical sales data we don't have enough of yet) with:
// business rules decide WHETHER an upsell opportunity exists, an LLM decides the
// HOW (offer/bundle/priority/channel/message), and a validation layer has final
// say before anything is surfaced to the CRM. Mirrors the Retention* family
// (see retention-decision.service.ts) so the two agents stay easy to reason
// about side by side; kept as a separate type family because upsell offers
// have a distinct output contract (category/bundle, no discount policy) that
// the admin dashboard already renders — see apps/admin-dashboard/src/types/api.ts.

export type UpsellCategory =
  | 'replacement'
  | 'maintenance_plan'
  | 'preventive_service'
  | 'premium_upgrade'
  | 'extended_warranty'
  | 'no_upsell';

export type UpsellChannel = 'whatsapp' | 'email' | 'call';

export type UpsellPriority = 'low' | 'medium' | 'high';

export type UpsellCustomerSegment = 'premium' | 'standard' | 'budget';

export type UpsellRuleReasonCode =
  | 'AGING_EQUIPMENT'
  | 'FREQUENT_REPAIRS'
  | 'OVERDUE_SERVICE'
  | 'HIGH_VALUE_CUSTOMER'
  | 'WARRANTY_EXTENSION'
  | 'NONE';

/** Raw facts the rule engine evaluates. Never passed to the LLM directly. */
export interface UpsellRuleFacts {
  customerId: string;
  companyId: string;
  equipmentAgeYears: number;               // age of the oldest installed equipment
  repairCount12Months: number;             // service visits in the trailing 12 months
  daysSinceLastService: number;
  customerSegment: UpsellCustomerSegment;
  averageAnnualSpend: number;
  hasNewEquipment: boolean;                // equipment installed within the "new" window
  warrantyActive: boolean;                 // newest equipment's warranty has not expired
  automaticFollowupEnabled: boolean;       // false = customer opted out of marketing
  previousUpsellAttempts: number;
  hasContactChannel: boolean;
}

/**
 * The rule engine ONLY determines whether an upsell opportunity exists, its
 * category, and why. It never picks the specific offer, bundle, channel, or
 * message — that's the LLM's job.
 */
export interface UpsellRuleResult {
  upsellRequired: boolean;
  category: UpsellCategory;
  highPriority: boolean;
  reasonCode: UpsellRuleReasonCode;
  reason: string | null;
  matchedRule: string | null;              // for audit trail
}

/** Structured profile handed to the LLM. No raw Prisma rows ever cross this boundary. */
export interface UpsellCustomerProfile {
  customerName: string;
  customerSegment: UpsellCustomerSegment;
  equipment: Array<{ type: string; ageYears: number | null; warrantyStatus: 'active' | 'expired' | 'unknown' }>;
  maintenanceAgreementStatus?: string;
  repairCount: number;
  daysSinceLastService: number;
  annualSpend: number;
  previousUpsellAttempts: number;
  preferredCommunication: UpsellChannel;
  recentQuotes?: string;
  notes?: string;
  category: UpsellCategory;
  reasonCode: UpsellRuleReasonCode;
  reason: string;
}

export interface UpsellLlmRecommendation {
  offer: string;                  // free-text product/service label, e.g. "Premium Maintenance Plan"
  bundle: string | null;          // free-text bundle/promotion label, or null if none
  priority: 'Low' | 'Medium' | 'High';
  channel: UpsellChannel;
  reason: string;
  message: string;
  confidence: number;
}

export interface UpsellDecisionAudit {
  ruleResult: UpsellRuleResult;
  llmRecommendation: UpsellLlmRecommendation | null;
  llmModel: string | null;
  validation: { passed: boolean; failedChecks: string[] };
  finalCategory: UpsellCategory;
  finalChannel: UpsellChannel | null;
  decidedAt: string;
}

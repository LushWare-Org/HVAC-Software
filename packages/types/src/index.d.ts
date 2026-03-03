export declare enum Role {
    SUPER_ADMIN = "super_admin",
    COMPANY_ADMIN = "company_admin",
    OFFICE_MANAGER = "office_manager",
    DISPATCHER = "dispatcher",
    TECHNICIAN = "technician",
    CUSTOMER = "customer"
}
export interface JwtPayload {
    sub: string;
    email: string;
    company_id: string;
    role: Role;
    name?: string;
    picture?: string;
    iss: string;
    aud: string | string[];
    iat: number;
    exp: number;
}
export interface AuthUser {
    userId: string;
    email: string;
    companyId: string;
    role: Role;
    name?: string;
}
export interface TenantEntity {
    id: string;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum JobStatus {
    PENDING = "pending",
    SCHEDULED = "scheduled",
    EN_ROUTE = "en_route",
    ON_SITE = "on_site",
    COMPLETED = "completed",
    INVOICED = "invoiced",
    PAID = "paid",
    CANCELLED = "cancelled",
    ON_HOLD = "on_hold"
}
export declare enum JobPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    EMERGENCY = "emergency"
}
export declare enum TradeType {
    HVAC = "hvac",
    PLUMBING = "plumbing",
    ELECTRICAL = "electrical",
    GENERAL = "general"
}
export declare enum LeadStatus {
    NEW = "new",
    CONTACTED = "contacted",
    QUALIFIED = "qualified",
    PROPOSAL_SENT = "proposal_sent",
    WON = "won",
    LOST = "lost"
}
export declare enum InvoiceStatus {
    DRAFT = "draft",
    SENT = "sent",
    PARTIALLY_PAID = "partially_paid",
    PAID = "paid",
    OVERDUE = "overdue",
    VOID = "void"
}
export declare enum QuoteStatus {
    DRAFT = "draft",
    SENT = "sent",
    VIEWED = "viewed",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    EXPIRED = "expired"
}
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
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
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
    outputKey: string;
    companyId: string;
    entityId: string;
}
//# sourceMappingURL=index.d.ts.map
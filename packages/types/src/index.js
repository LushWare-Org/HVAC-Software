"use strict";
// ============================================================
// @tscrm/types — Shared TypeScript types across all services
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteStatus = exports.InvoiceStatus = exports.LeadStatus = exports.TradeType = exports.JobPriority = exports.JobStatus = exports.Role = void 0;
// ---- RBAC Roles ----
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["COMPANY_ADMIN"] = "company_admin";
    Role["OFFICE_MANAGER"] = "office_manager";
    Role["DISPATCHER"] = "dispatcher";
    Role["TECHNICIAN"] = "technician";
    Role["CUSTOMER"] = "customer";
})(Role || (exports.Role = Role = {}));
// ---- Job Status (shared between job-service and other services) ----
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "pending";
    JobStatus["SCHEDULED"] = "scheduled";
    JobStatus["EN_ROUTE"] = "en_route";
    JobStatus["ON_SITE"] = "on_site";
    JobStatus["COMPLETED"] = "completed";
    JobStatus["INVOICED"] = "invoiced";
    JobStatus["PAID"] = "paid";
    JobStatus["CANCELLED"] = "cancelled";
    JobStatus["ON_HOLD"] = "on_hold";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
// ---- Job Priority ----
var JobPriority;
(function (JobPriority) {
    JobPriority["LOW"] = "low";
    JobPriority["NORMAL"] = "normal";
    JobPriority["HIGH"] = "high";
    JobPriority["EMERGENCY"] = "emergency";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
// ---- Trade Types ----
var TradeType;
(function (TradeType) {
    TradeType["HVAC"] = "hvac";
    TradeType["PLUMBING"] = "plumbing";
    TradeType["ELECTRICAL"] = "electrical";
    TradeType["GENERAL"] = "general";
})(TradeType || (exports.TradeType = TradeType = {}));
// ---- Lead Status ----
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["CONTACTED"] = "contacted";
    LeadStatus["QUALIFIED"] = "qualified";
    LeadStatus["PROPOSAL_SENT"] = "proposal_sent";
    LeadStatus["WON"] = "won";
    LeadStatus["LOST"] = "lost";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
// ---- Invoice Status ----
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["SENT"] = "sent";
    InvoiceStatus["PARTIALLY_PAID"] = "partially_paid";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["VOID"] = "void";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
// ---- Quote Status ----
var QuoteStatus;
(function (QuoteStatus) {
    QuoteStatus["DRAFT"] = "draft";
    QuoteStatus["SENT"] = "sent";
    QuoteStatus["VIEWED"] = "viewed";
    QuoteStatus["ACCEPTED"] = "accepted";
    QuoteStatus["DECLINED"] = "declined";
    QuoteStatus["EXPIRED"] = "expired";
})(QuoteStatus || (exports.QuoteStatus = QuoteStatus = {}));
//# sourceMappingURL=index.js.map
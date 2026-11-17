# Admin Dashboard — Client Improvement Backlog

> **Source:** Client feedback, June 2026  
> **Status tracking:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Cross-Cutting Items (apply to every module)

These two improvements are requested globally across all modules.

| ID | Item | Notes | Status |
|----|------|-------|--------|
| G1 | KPI cards / stat items are clickable and open a filtered detail view | e.g. "Total Active Customers" → opens Customers page pre-filtered | `[x]` |
| G2 | AI recommendations are better described with a clear expected outcome | RecommendationsPanel already exists — needs richer copy per action type + outcome projection | `[x]` |

---

## Dashboard

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| D1 | Show client's company logo and name in header | `logoUrl` exists on Company type; not rendered on Dashboard | `[x]` |
| D2 | Each KPI card clickable → detail view | See G1 | `[x]` |
| D3 | Recommendations: better description + expected outcome | See G2 | `[x]` |
| D4 | Revenue graph: add revenue-by-technician breakdown | `useRevenueSeries` exists; need per-tech series from analytics-service | `[x]` |

---

## Customers & CRM

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| C1 | Clickable KPI cards | See G1 | `[x]` |
| C2 | Better recommendations | See G2 | `[ ]` |
| C3 | Customer Risk Summary tooltip on each customer row | `customerStatusSummary` hook exists; churn score available | `[x]` |
| C4 | Remove WhatsApp from customer detail page | Present in `CustomerDetailsSidebar.tsx` comms section | `[x]` |
| C5 | Searchable tags on customer records | `tags String[]` already in CRM schema; not exposed in UI | `[x]` |
| C6 | Customer sort options: location, equipment type, install date, job count, recency, warranty, outstanding balance, tag | Only basic sort currently; needs multi-sort UI + backend params | `[x]` |

---

## Jobs

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| J1 | Clickable KPI cards | See G1 | `[x]` |
| J2 | Better recommendations | See G2 | `[ ]` |
| J3 | Low-demand alert: flexible time window (e.g. next month) | Currently fixed window; needs date-range picker for the alert query | `[x]` |
| J4 | Cancelled jobs require a reason code | `cancellationReason` added to schema + DTO + service; "Cancel Job" footer button opens 7-reason picker modal; reason shown in Overview tab | `[x]` |
| J5 | Overdue jobs: flag backorder / missing part as a reason | `hasPartShortage` + `partShortageNote` added to schema; toggle in Overview tab; amber ⚠ PARTS badge on job row | `[x]` |

---

## Dispatch Board

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| DB1 | Clickable KPI cards | See G1 | `[x]` |
| DB2 | Better recommendations | See G2 | `[ ]` |
| DB3 | "Mark En Route" → auto-email to customer with tech name + address | job-service now calls comms-service on EN_ROUTE; built-in email (no rule needed) | `[x]` |

---

## Finance

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| F1 | Clickable KPI cards | See G1 | `[x]` |
| F2 | Better recommendations | See G2 | `[ ]` |
| F3 | QuickBooks integration | Not implemented; needs OAuth + sync for invoices/expenses | `[x]` |

---

## Communications

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| CM1 | Clickable KPI cards | See G1 | `[x]` |
| CM2 | Better recommendations | See G2 | `[ ]` |
| CM3 | Configure dedicated phone numbers per campaign / platform | Twilio numbers stored globally; needs per-campaign number routing | `[ ]` |
| CM4 | AI Call integration (Avoca or similar) | Not implemented; needs webhook + call-log ingestion | `[ ]` |

---

## Marketing

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| MK1 | Clickable KPI cards | See G1 | `[x]` |
| MK2 | Better recommendations | See G2 | `[ ]` |
| MK3 | Templates support both email AND SMS (channel selector on template) | Templates have no channel field — currently email only via SendGrid | `[x]` |
| MK4 | Campaigns: channel selector (email or SMS) | Campaign creation modal has no channel field | `[x]` |
| MK5 | Integrate with Google Ads, GMB, LSA, Angi | External ad platform APIs; needs lead ingestion + spend sync | `[ ]` |
| MK6 | Campaign performance graphs with costs | Attribution stats exist (`useAttributionStats`); needs chart + cost data | `[x]` |

---

## Analytics

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| AN1 | Clickable KPI cards | See G1 | `[x]` |
| AN2 | Better recommendations | See G2 | `[ ]` |

---

## Inventory / Stockroom (currently "Admin Platform")

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| IN1 | Rename nav label to "Inventory" or "Stockroom" | Currently labelled ambiguously | `[x]` |
| IN2 | Clickable KPI cards | See G1 | `[x]` |
| IN3 | Better recommendations | See G2 | `[ ]` |
| IN4 | Drill-down by location (warehouse vs per-tech van) | Location filter exists in backend; UI only shows aggregate | `[x]` |
| IN5 | Show item value (qty × unit cost) | Unit cost field exists; value column not shown | `[x]` |

---

## Data Import → Integrations Hub

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| DI1 | Rename section to "Integrations" | Currently "Data Import" | `[x]` |
| DI2 | Clickable KPI cards | See G1 | `[x]` |
| DI3 | Better recommendations | See G2 | `[ ]` |
| DI4 | Add ServiceTitan, FieldPulse, Workiz as import sources | Currently: Jobber, Housecall Pro, generic CSV | `[ ]` |
| DI5 | Make this the central hub for all integrations (QuickBooks, Google Ads, Avoca, etc.) | Currently import-only; needs integration registry concept | `[ ]` |

---

## Team Management

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| TM1 | Clickable KPI cards | See G1 | `[x]` |
| TM2 | Better recommendations | See G2 | `[ ]` |
| TM3 | Login activity log per user | `UserLoginEvent` model + migration added; login history shown in Edit Member modal | `[x]` |

---

## Settings

| ID | Item | Current State | Status |
|----|------|---------------|--------|
| S1 | List all AI agents with their settings/toggles | Added "AI Agents" tab to Settings page showing all 4 agents with enable/disable toggles | `[x]` |
| S2 | Clarify how "Job Templates" are used (rename or add explanation) | Templates tab exists but description is thin | `[x]` |

---

## Implementation Order (suggested)

**Phase 1 — Low-effort / high-visibility (no schema changes)**
- D1: Company logo + name on Dashboard
- C4: Remove WhatsApp from customer detail
- C5: Tags UI (schema already has `tags String[]`)
- IN1: Rename "Inventory" in nav
- DI1: Rename "Integrations" in nav
- IN5: Show item value column
- MK6: Campaign performance charts (data already available)
- G2: Enrich recommendation copy (frontend-only)

**Phase 2 — Medium effort (UI + minor backend)**
- G1: Clickable KPI cards (all modules)
- C3: Risk summary tooltip
- C6: Customer multi-sort
- D4: Revenue by technician chart
- J3: Low-demand alert flexible window
- DB3: En Route SMS with tech photo + ETA
- TM3: Login activity log
- S1: AI agents settings panel

**Phase 3 — Significant effort (schema migrations + integrations)**
- J4: Cancellation reason code (schema + migration)
- J5: Backorder/missing part flag on overdue jobs
- F3: QuickBooks integration
- CM3: Per-campaign phone numbers
- CM4: Avoca AI call integration
- MK3 + MK4: SMS templates + channel selector on campaigns
- MK5: Google Ads / GMB / LSA / Angi lead ingestion
- DI4: ServiceTitan, FieldPulse, Workiz importers
- DI5: Integrations hub

---

## Change Log

| Date | ID | What was done |
|------|----|---------------|
| — | — | Backlog created from client feedback |
| 2026-06-21 | G1 | All KPI cards across Dashboard, Jobs, Customers, Finance, Marketing, Inventory, Analytics are now clickable — navigate to relevant filtered view |
| 2026-06-21 | C3 | CustomerHoverSummary tooltip already implemented (confirmed existing) |
| 2026-06-21 | C6 | Multi-sort dropdown added to Customers page (location, equipment count, type, recency, name) + backend sort params wired |
| 2026-06-21 | D4 | Revenue by Technician bar chart added to Analytics page above the leaderboard table |
| 2026-06-21 | J3 | 7d/14d/30d forecast window selector added to Jobs page; analytics-service recommendations adjust Low Demand Alert description per window |
| 2026-06-21 | DB3 | EN_ROUTE status change in job-service now fires HTTP POST to comms-service; comms-service sends built-in email to customer with tech name and service address |
| 2026-06-21 | TM3 | UserLoginEvent model + migration created; auth service records login events; users controller exposes /users/:id/login-history; Team page Edit Member modal shows login history on demand |
| 2026-06-21 | S1 | "AI Agents" tab added to Settings page — shows all 4 agents (Followup, Retention, Upsell, Churn) with model info, description, and enable/disable toggle tied to automaticFollowupEnabled |
| 2026-06-25 | J4 | Cancellation reason picker: "Cancel Job" button in JobDetailModal footer opens a 7-reason pill modal; reason stored in `cancellationReason` column; shown in Overview tab for cancelled jobs |
| 2026-06-25 | J5 | Parts shortage flag: `hasPartShortage` toggle in Overview tab with optional note field; amber ⚠ PARTS badge on job rows in Jobs table; `PARTS SHORT` badge in modal header |
| 2026-06-25 | MK3/MK4 | Verified: channel selector (EMAIL/SMS) already fully implemented on both Templates and Campaigns; SMS body editor + phone mockup preview already present |
| 2026-06-25 | C4 | Removed WhatsApp field from LeadDetailsSidebar.tsx comms section (was redundant with mobile/phone fields) |
| 2026-06-25 | CM1 | Added 4 KPI cards (Total Threads, Unread, Active, Resolved) to Communications page above tabs; computed from allThreads thread data |
| 2026-06-25 | S2 | Added "How Job Templates work" info banner to JobTemplatesTab in Settings — explains template→job-type→auto-populate flow |
| 2026-06-25 | DI2 | Added 4 KPI cards (Records Imported, Skipped, Failed, Batches Done) to Import/Integrations page; computed from import batch history; hidden when no batches exist |
| 2026-06-25 | IN4 | Added "All Locations / Warehouse only / Tech Vans only" dropdown filter to Inventory Stock Items tab; filters items by stockLevel location type; active column highlighted in blue |
| 2026-06-25 | D1 | Verified already implemented: Dashboard renders company logo (avatar fallback) + name + city/state via useCompany hook |
| 2026-06-25 | C5 | Verified already implemented: Customers list has tag filter multi-select (useCustomerTags); CustomerDetailsSidebar has tag chip editor with suggestions |
| 2026-06-25 | IN1 | Verified already implemented: Sidebar nav label is "Inventory" |
| 2026-06-25 | DI1 | Verified already implemented: Sidebar nav label is "Integrations" |
| 2026-06-25 | IN5 | Verified already implemented: Inventory table shows "Stock Value" column (qty × unit cost, green) |
| 2026-06-25 | TM1 | Verified already implemented: Team KPI cards are clickable and filter member list by role |
| 2026-06-25 | MK6 | Added Recharts grouped BarChart (Sent/Delivered/Opened/Clicked per campaign) above the campaign stats table on Marketing Overview; note: cost tracking requires backend budget field not yet in schema |
| 2026-06-25 | G2/D3/J2/C2/DB2/F2/CM2/MK2/AN2/IN3/DI3/TM2 | Verified RecommendationsPanel already had getExpectedOutcome() with per-action copy + green "Expected outcome" box on every card; fixed same_day_offer (was falling to generic default) and geo_target_discount copy (now matches actual "Pending Quotes" follow-up use case) |
| 2026-06-25 | C6 | Added installDate (asc/desc), warranty expiry (asc/desc), tag (asc/desc) to sort dropdown; backend uses $queryRaw two-query pattern (sorted IDs → findMany reorder) for full cross-page correctness; jobCount + outstanding balance skipped (cross-service, would need denorm) |
| 2026-06-25 | MK6 | Added Est. Cost column to campaign performance table: SMS $0.0079/msg, Email $0.001/msg (Twilio + SendGrid standard rates); labelled "est." to be transparent; tooltip on header explains the rates |
| 2026-06-25 | G2/D3/J2/C2/DB2/F2/CM2/MK2/AN2/IN3/DI3/TM2 | Verified RecommendationsPanel already had getExpectedOutcome() with per-action copy + green "Expected outcome" box on every card; fixed same_day_offer (was falling to generic default) and geo_target_discount copy (now matches actual "Pending Quotes" follow-up use case) |
| 2026-06-25 | F3 | QuickBooks backend was already fully built (OAuth, token refresh, invoice/payment sync, customer mapping). Added UI: Settings > Integrations tab with QB connection card (connect/disconnect/status/realm ID/expiry); Finance > invoice table QB column showing synced badge or manual sync button when QB is connected; added GET /quickbooks/auth-url endpoint for SPA OAuth initiation |

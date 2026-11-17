# Competitor Analysis — T&S CRM vs. Field Service Platforms

Source: `Competitor_Feature_List.md` (FieldPulse, ServiceTitan, Jobber, Housecall Pro,
FieldEdge, Workiz, BuildOps), compared against T&S CRM's actual built capabilities
(see `docs/SYSTEM_OVERVIEW.md`).

## 1. Where we already match or exceed the market

| Area | Competitors | T&S CRM |
|---|---|---|
| Dispatch board | All 7 have one | `DispatchBoard`/`BoardPlan`/`BoardLive` — real-time WebSocket board (Go `scheduling-service`) |
| GPS + smart assignment | GPS tracking is universal; only ServiceTitan/BuildOps score assignment | Phase-1 AI scoring (40% distance / 35% workload / 25% rating) + `RequiredSkills` matching, auto-assign or top-3 suggestions |
| CRM + service history | Universal | Full CRM: customers, leads, contacts, equipment, agreements |
| Service agreements | FieldPulse, ServiceTitan, FieldEdge, BuildOps | `ServiceAgreement` model, confirm flow, renewal tracking |
| Quotes → Invoices → Payments | Universal | Quotes with line items, approve/decline/convert, Stripe payments, manual payment recording, PDF generation |
| Customer self-service portal | FieldPulse, ServiceTitan, Jobber, all others but FieldEdge/Workiz | Full `customer-portal` app: jobs, quotes, invoices, agreements, book-service, messages, devices, equipment, profile |
| Inventory + purchase orders | ServiceTitan, FieldPulse (higher tier), FieldEdge, BuildOps | `inventory-service`: items, warehouse + per-tech van locations, stock movements, POs, low-stock alerts |
| Mobile technician app | Universal | Expo/React Native, offline-first, jobs/photos/payments/invoicing |
| QuickBooks sync | FieldEdge (deep 2-way), BuildOps, Workiz | QuickBooks + Stripe integration present (`useQBStatus`/`useQBSyncInvoice`) |
| Marketing automation | Housecall Pro (AI-written), Workiz (lead-source integrations) | Built-in marketing module: campaigns, audiences, templates, review requests, winback flows, compliance/suppression |
| Custom workflows/automation | FieldPulse (ClearPath), Workiz, ServiceTitan (Command Center) | `AutomationRule` engine in `comms-service` (equipment automation, review-request gating, etc.) |
| "AI insights" | ServiceTitan Atlas, Jobber Copilot, Housecall Coach AI | Rule-engine + LLM + validation-layer agents for retention/upsell/revenue/followup — every recommendation traces to an explicit rule reason code, not a black box; plus a separate churn-risk ML model (`churn-service`, XGBoost) |
| Multi-tenant scale | ServiceTitan Business Units/Enterprise Hub | Full multi-tenant architecture (`company_id` on every row), tenant-level currency/timezone/feature flags |

## 2. Genuine differentiators nobody on this list has

- **Projects module** — dedicated long-running commercial engagements (housing schemes,
  hotel retrofits) with reusable component templates, per-project crew rosters, and
  component-level customer/billing separation. BuildOps is the only competitor with
  anything comparable (their "Projects module" for construction PM), and ours is newer
  and specifically tuned to component-based multi-unit properties.
- **IoT equipment monitoring** — offline-device detection and equipment health tracking
  wired into the CRM (`iot:offline:*` tags, equipment scan/consumables tracking). None
  of the seven platforms list IoT/equipment telemetry as a feature.
- **Super Admin cross-tenant activity monitoring** — real-time, narrative audit trail of
  every meaningful action across every service and tenant. This is operational tooling
  (built for our own trial monitoring), not a customer-facing feature, but it's a real
  operational edge none of these vendors document publicly.

## 3. Real gaps — features competitors have that we don't

| Feature | Who has it | Notes |
|---|---|---|
| **AI voice receptionist / call answering** | FieldPulse (Operator AI), ServiceTitan (AI Virtual/Voice Agent, Contact Center Pro), Housecall Pro (CSR AI), Workiz (Genius Answering), Jobber (AI Receptionist add-on) | Universal among the AI-forward competitors — we have zero voice/phone capability. Largest visible gap. |
| **Route optimization (multi-stop)** | FieldPulse, ServiceTitan, Jobber, FieldEdge | We optimize *assignment* (which tech gets the job), not a technician's multi-stop route for the day. |
| **On-site e-signature capture (quotes/invoices)** | FieldPulse, ServiceTitan, Jobber (via Client Hub), BuildOps | We have agreement e-confirm, but no explicit e-sig capture flow on quotes/work orders in the technician app. |
| **Financing at checkout** (Wisetack/Synchrony-style) | FieldPulse, ServiceTitan, Jobber, Housecall Pro | No embedded consumer financing option. |
| **Public developer API + marketplace** | ServiceTitan (70+ app marketplace), Jobber (GraphQL + OAuth), Workiz, FieldPulse | Our services expose internal REST APIs; there's no documented public/partner API with key issuance, OAuth, or an app marketplace. |
| **Good/Better/Best tiered estimates** | FieldPulse, ServiceTitan | Our quotes are single-tier; no built-in multi-option proposal UI. |
| **Built-in phone system** (call tracking/recording) | Workiz | Not part of our platform. |
| **Instant/same-day payout** (Instapay, Tap to Pay) | Housecall Pro, ServiceTitan, Jobber (instant payout) | We use standard Stripe settlement timing; no same-day payout product. |
| **Job costing (labor+material vs. revenue per job)** | BuildOps, ServiceTitan | Analytics tracks revenue; a dedicated job-costing view (margin per job) isn't a built feature yet. |
| **Franchise management product** | ServiceTitan | Not applicable to our current single-tenant-per-company model. |
| **Zapier/Make integration** | FieldPulse, Jobber, Housecall Pro, Workiz | No no-code integration layer. |
| **Custom fields on arbitrary entities** | FieldPulse, ServiceTitan, Jobber, Workiz, BuildOps | Our flexibility comes through Project Component Templates and typed DTOs, not a generic custom-field engine attachable to any record. |

## 4. Takeaways

- **Core FSM parity is solid.** Dispatch, CRM, quoting/invoicing, payments, inventory,
  mobile, customer portal, and marketing automation are all present and comparable to
  the mid-market players (Jobber, Housecall Pro, Workiz, FieldEdge).
- **The AI story is different, not absent.** We don't have voice AI, but our
  recommendation engine (rule engine → LLM → validation layer, with an explicit reason
  code on every decision) is more auditable than the "black box" AI copilots ServiceTitan/
  Jobber/Housecall Pro ship — worth leading with in positioning rather than chasing
  voice-AI parity first.
- **Two clear, ownable differentiators**: the Projects module (component-based
  commercial property management) and IoT equipment monitoring — neither is common
  even among the enterprise players (ServiceTitan, BuildOps).
- **Highest-leverage gaps to close next**, roughly in order of how many competitors
  already ship them: (1) AI voice/call handling, (2) route optimization, (3) a public
  API + integration marketplace, (4) on-site e-signature capture, (5) financing at
  checkout.

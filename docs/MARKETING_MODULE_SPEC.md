# Marketing Module — Design Spec

> Status: **Draft / brainstorming** — pre-implementation
> Owner: Product
> Target: US launch (investor-backed), competitive parity with Housecall Pro & Jobber, with a clear differentiator that no incumbent ships today.
> Date: 2026-05-10

---

## 1. Executive summary

Trade businesses (HVAC, Plumbing, Electrical) in the US do not lose customers because of bad work — they lose them because they go silent between service calls. The job is one-shot; the customer relationship is recurring. Every incumbent FSM platform (Housecall Pro, Jobber, ServiceTitan, FieldEdge, ServiceFusion) has therefore added a **marketing module** as a top-tier upsell, and for two of them (HCP, Jobber) it is the single highest-margin add-on in their pricing tables.

This document specifies a **Marketing Module** for the T&S CRM that:

1. Reaches **competitive parity** with Housecall Pro and Jobber on table-stakes features (campaigns, review requests, referrals, automations, attribution).
2. Ships a **clear differentiator** built on the existing T&S advantages — a unified Postgres data plane across CRM/Jobs/Finance/Inventory, a Python ML tier already running churn/upsell/retention bandits, and a per-tenant comms-service with BullMQ + SendGrid + Twilio + FCM. Incumbents bolt marketing on top of disconnected silos; we can ship **AI-driven, equipment-aware, lifecycle-triggered marketing** out of the box.
3. Reuses existing infrastructure (extends `comms-service`, no new vendor, no per-tenant licensing) so it is gross-margin accretive from day one.

The module ships in three phases. **Phase 1 (US launch / MVP)** delivers email + SMS campaigns, automated review requests, and segmentation built from existing CRM data — enough for the demo to never lose on a checklist. **Phase 2** adds referral programs, journey/automation builder, and an attribution dashboard. **Phase 3** is the differentiator: AI-driven audiences, equipment-lifecycle campaigns, churn-risk-aware win-back, and ad-platform sync.

---

## 2. Why a marketing module — strategic rationale

### 2.1 Investor / US launch context

- **Pricing power.** Jobber sells the Marketing Suite at **$79/mo per tenant** as an add-on (Reviews $39, Campaigns $29, Referrals $29 individually). Housecall Pro bundles it into mid/upper tiers and additionally sells postcards at $0.89–$1.09/card. A marketing module is therefore not a feature — it is a revenue line. For a US launch with an investor narrative, ARPU expansion via add-ons is the single most credible path to SaaS-style margins on top of an FSM base.
- **Demo objection-handling.** Every prospect-comparison RFP from US trade businesses asks: "Do you have campaigns? Review requests? Referrals?" Without a marketing module, the answer is "no" and the deal dies on a checklist before the demo even starts.
- **Stickiness / retention.** Customers who use marketing features churn at roughly half the rate of those who don't (HCP and Jobber both publish this in investor decks). Marketing is the deepest moat against migration to a competitor — campaigns, audience history, automation graphs, and review widgets all become switching costs.
- **Data flywheel.** Every campaign sent feeds back signals (open, click, booking-attributed-to-source) that improve the existing churn / upsell / retention bandits in `agent/`. Marketing is therefore not just a feature — it is the **labelled data source** the ML tier currently lacks.

### 2.2 What the FSM customer (a US trade business) actually wants

Behind the buzzwords, owners of US HVAC/plumbing/electrical SMBs want four things from a marketing module, in this order:

1. **More booked jobs from existing customers** — reactivation, maintenance reminders, seasonal promos.
2. **More 5-star Google reviews**, on autopilot, the day after a job. (The single biggest driver of local SEO, which is the single biggest driver of new leads in this trade.)
3. **More referrals** — because trade businesses live and die by word-of-mouth.
4. **Proof that any of it works** — attribution from "$X spent / Y messages sent" to "Z jobs booked, $W revenue."

Everything else (landing pages, postcards, ad-platform sync, AI generation) is upside. Phase 1 must do #1 and #2 excellently; Phase 2 must do #3 and #4.

---

## 3. Competitive landscape

### 3.1 Housecall Pro — Marketing Center

- **Channels:** Email, SMS, postcards (direct mail via integrated vendor, $0.89–$1.09/card).
- **Reviews:** Automated Google review requests post-invoice; embeddable website reviews widget.
- **Campaigns:** One-off and triggered campaigns. **Feb 2026 release** added (a) "stop-when" exit logic that ends a campaign as soon as the customer takes the desired action (job scheduled, review submitted), and (b) expanded triggers — *estimate sent*, *job paid*, etc., with flexible timing.
- **AI:** Late 2025 / early 2026 they shipped a "user-driven AI" pass that generates campaign copy and review-reply suggestions.
- **Weakness:** Email automation is shallow vs Mailchimp/ActiveCampaign — limited triggers, basic A/B testing, deliverability not optimized. Add-on costs are a top user complaint.

### 3.2 Jobber — Marketing Suite

- **Channels:** Email + SMS only (no postcards as of mid-2026).
- **Components:** Reviews, Campaigns, Referrals — sold individually or as a $79/mo bundle.
- **Reviews:** Auto-text + email after invoice paid with a direct Google review link, only to "preferred" (high-NPS) clients.
- **Campaigns:** "Generate from a prompt" AI for email + SMS; one-off or triggered by client criteria.
- **Referrals:** Give-X-get-X with automatic discount tracking and a background automation that asks clients to refer after job completion.
- **Marketing dashboard:** Single view of campaign performance + referral revenue.
- **Weakness:** No postcards. Limited segmentation (criteria-based, not predictive). Attribution is shallow — no UTM/source rollup beyond their own channels.

### 3.3 ServiceTitan, FieldEdge, ServiceFusion (enterprise / mid-market)

- **ServiceTitan Marketing Pro:** Industry-leading attribution (call tracking → booking → revenue), direct mail, email, "audience targeting" by equipment + service history. Priced at enterprise tiers ($$$); requires onboarding services.
- **FieldEdge / ServiceFusion:** Thin marketing — basically just email blasts and review widgets. They lose the marketing checklist to HCP and Jobber.
- **Standalone tools US trades stack on top:** NiceJob (reviews), Podium (review SMS + webchat), Broadly, Mailchimp, Constant Contact. Every one of these is a sign that the FSM platform's marketing module wasn't enough.

### 3.4 Where T&S can win

| Capability | HCP | Jobber | ServiceTitan | T&S opportunity |
|---|---|---|---|---|
| Email + SMS campaigns | ✅ | ✅ | ✅ | Match — reuse comms-service. |
| Postcards / direct mail | ✅ | ❌ | ✅ | Phase 2 via Lob. |
| Auto review requests | ✅ | ✅ (high-NPS only) | ✅ | Match + smarter NPS gate using churn-service signal. |
| Referrals | ✅ | ✅ | ✅ | Match (Phase 2). |
| Visual journey/automation builder | partial | partial | ✅ | **Differentiator** — match ST at SMB price. |
| Attribution: source → job → $ | shallow | shallow | ✅ | **Differentiator** — we already join CRM↔Jobs↔Finance in Postgres. |
| **Equipment-lifecycle campaigns** | ❌ | ❌ | partial | **Strong differentiator.** We have `equipment` table per customer (age, brand, last service, warranty). Trigger HVAC tune-up at 6 months, water-heater replacement pitch at 8-yr install age, etc. No SMB tool ships this. |
| **Churn-risk win-back** | ❌ | ❌ | ❌ | **Strong differentiator.** Existing `churn-service` (FastAPI + XGBoost) already scores customers; expose risk score as a campaign trigger. |
| **AI segmentation from natural language** | early | early | ❌ | Match + extend — "show me HVAC customers in Phoenix whose unit is >7 years old, last serviced over 9 months ago, never had a maintenance plan" → audience. Built on existing schema. |
| Pricing | bundle / tier-locked | $79/mo add-on | enterprise | Bundle into Pro tier or offer at a sharper add-on price. |

---

## 4. Module purpose & goals

### 4.1 Purpose (one-paragraph)

The Marketing Module turns the T&S CRM from a system-of-record into a system-of-growth for the trade business: it uses the unified customer, job, equipment, and finance data already in the platform to plan, send, automate, and measure outbound marketing — email, SMS, review requests, referrals, and (later) postcards and ads — without forcing the trade owner to copy data into a second tool, learn another login, or pay a second vendor.

### 4.2 Goals (12-month)

| Goal | Metric | Target |
|---|---|---|
| Demo-checklist parity | Features matched vs HCP+Jobber | 100% of v1 list |
| Adoption | % of paying tenants with ≥1 campaign sent in 30d | ≥ 60% |
| Revenue attributable | Jobs booked with `marketingSourceId != null` per tenant per month | ≥ 8 |
| Reviews lift | New Google reviews / month per active tenant | ≥ 12 |
| ARPU expansion | Marketing add-on attach rate | ≥ 35% |
| Stickiness | Net retention of marketing-adopters vs non-adopters | ≥ +20pp |

### 4.3 Non-goals (explicit)

- Building a full email service provider (we use SendGrid; we do not run our own SMTP).
- Replacing Google Ads / Meta Ads dashboards — we sync, we do not host.
- Generic B2C marketing (loyalty programs unrelated to trade work, e-commerce, etc.).
- Marketing for our own platform's growth — that's a separate growth function (see §15.2).

---

## 5. Personas & user journeys

### 5.1 Personas

- **Owner / company_admin** (primary): Decides what to send, approves spend, watches the ROI dashboard.
- **Office manager** (secondary): Builds and schedules campaigns day-to-day, manages templates and audiences.
- **Dispatcher / CSR** (rare): Triggers ad-hoc one-to-one sends (rare — most should be automated).
- **Technician** (passive): Their job-completion event is the most powerful marketing trigger in the system.
- **Customer** (recipient): Receives messages on email/SMS; clicks a review link; books from a campaign.

### 5.2 Key user journeys

1. **"Send a heatwave promo to AC customers in Phoenix"** — owner opens Campaigns, picks template, audience builder ("trade = HVAC AND state = AZ AND last_service > 90 days"), schedules, sends. Sees opens / clicks / bookings in 24 hours.
2. **"Get more reviews automatically"** — owner enables "Review Requests" once. Every paid invoice triggers SMS+email 1 day later with a Google review link, gated by NPS or churn risk.
3. **"Maintenance plan upsell after install"** — automation: trigger=`job.completed AND job.type=INSTALL` → wait 14 days → email "Protect your new system" with a one-click maintenance-plan checkout.
4. **"Win back lapsed customers"** — automation: trigger=`churn_risk > 0.7 AND days_since_last_job > 180` → SMS "We miss you — $50 off your next tune-up" → if clicked, create Lead + assign to owner.
5. **"How did marketing do this month?"** — owner opens Marketing Dashboard, sees 1,243 sent, 312 opened, 41 clicked, 11 jobs booked, $14,820 revenue attributed, 9 new Google reviews.

---

## 6. Feature scope

### 6.1 Phase 1 — MVP at US launch (parity table-stakes)

1. **Campaigns — Email + SMS**
   - One-off and recurring sends.
   - WYSIWYG email editor (MJML-based, mobile responsive) + plain-text SMS editor with character counter and merge tags.
   - Merge tags: `{{customer.firstName}}`, `{{job.lastServiceDate}}`, `{{equipment.brand}}`, `{{company.phone}}`, `{{unsubscribeUrl}}`, etc.
   - Send-time controls: immediate, scheduled, recurring (cron-like), respect customer time zone.
   - **Stop-when conditions** (parity with HCP Feb 2026): exit campaign when customer books, replies, unsubscribes, or hits any goal event.
   - Per-tenant suppression list, global compliance unsubscribe footer (CAN-SPAM), STOP/HELP keyword handling on SMS (TCPA).
2. **Audiences / Segmentation**
   - Saved segments built from CRM filters: customer tags, lifecycle stage, equipment metadata, last-job date, lifetime value, geography (zip / state / radius), trade type.
   - Live count preview as filters change.
   - Static lists (CSV import, dedupe against existing customers).
3. **Templates library**
   - Pre-built trade-specific templates (HVAC tune-up, plumbing emergency, electrical safety inspection, etc.) seeded per company on signup.
   - Custom template save/share within tenant.
4. **Review requests (the killer feature for US trades)**
   - Auto-trigger after `invoice.paid` (configurable: also `job.completed`).
   - Sequence: SMS day 1, email day 3 if not clicked.
   - Direct deep-link to Google Business Profile review form (per-location config); fallback to Yelp / Facebook if configured.
   - **Smart gate (differentiator):** ask only customers with churn-service NPS proxy ≥ threshold OR explicit positive feedback on a 1-tap "How did we do?" question. Avoids surfacing 1-star reviews from unhappy customers.
   - Reviews widget — embeddable JS snippet for the trade business's own website, pulling latest 5-star reviews via Google Places API.
5. **Compliance core**
   - CAN-SPAM: physical address in footer, one-click unsubscribe, list of suppressed addresses per tenant.
   - TCPA: explicit opt-in tracking on Customer record (`smsOptInAt`, `smsOptInSource`); STOP/HELP keyword auto-handling; quiet hours (no SMS 9pm–8am customer-local).
   - A2P 10DLC: per-tenant brand + campaign registration via Twilio, automated during onboarding.
   - CCPA / California right-to-delete: existing CRM data-export and delete endpoints extended to cover marketing tables.
6. **Marketing dashboard v1**
   - Sent / delivered / opened / clicked / unsubscribed per campaign.
   - Bookings attributed (job created within N days of click, configurable).
   - $ attributed (sum of `Job.estimatedValue` or `Invoice.total` when present).
7. **Settings**
   - Sender identity verification (domain DKIM/SPF in SendGrid; Twilio number / 10DLC brand).
   - Quiet hours, time zone, default footer, default unsubscribe page.
   - Per-tenant API keys for embeddable widgets.

### 6.2 Phase 2 — Post-launch (90 days after GA)

1. **Referral program** — give-X-get-X with auto-tracked discount codes; auto-ask after job completion; referral landing page; reward fulfillment (account credit or coupon).
2. **Visual journey / automation builder** — drag-drop graph (Trigger → Wait → Condition → Action → …). Triggers: every domain event already on the BullMQ bus (`job.created/completed/paid`, `quote.sent`, `invoice.overdue`, `customer.tagged`, `equipment.warranty_expiring`). Built on existing comms-service automation rules engine, extended.
3. **Landing pages & web forms** — hosted, per-tenant subdomain, with form → Lead creation, UTM passthrough.
4. **Attribution dashboard v2** — UTM source/medium/campaign rollup; multi-touch (first-touch / last-touch toggle); funnel from impression → click → lead → quote → job → invoice → revenue.
5. **Two-way SMS inbox tie-in** — replies route into existing comms-service threads so the office manager can converse.
6. **A/B testing** — split sends, automatic winner selection.

### 6.3 Phase 3 — Differentiators (6–12 months)

1. **AI audience builder** — natural-language → SQL audience: "HVAC customers in Phoenix whose unit is over 7 years old, last serviced over 9 months ago, never had a maintenance plan." Validated against existing schema, preview count before save.
2. **AI campaign copy generator** — trade-aware prompt templates (e.g., "spring AC tune-up urgency, friendly tone, 160 chars"), grounded in tenant's own past high-performing campaigns.
3. **Equipment-lifecycle automations** (unique to T&S — no incumbent ships this at SMB price)
   - HVAC: 6-month seasonal tune-up reminder per installed unit.
   - HVAC: 8–10-year-old unit → replacement pitch with financing offer.
   - Water heater: 10-year mark → replacement reminder.
   - Filter / maintenance subscriptions tied to equipment install date.
4. **Churn-risk-driven win-back** — wire `churn-service` risk score into automation triggers; high-risk customers receive retention sequence with progressive incentives.
5. **Direct mail (postcards)** — Lob integration; same audience builder; trade-specific postcard templates.
6. **Ad sync** — push high-value-customer audience to Google Ads / Meta as a Customer Match list for lookalike acquisition. (Sync-only; we never host the ad creative.)
7. **Marketing recommendations** — extend the existing Recommendations engine in `analytics-service` to suggest: "You haven't messaged 412 customers in 90 days; estimated win-back revenue $X." One-click create campaign.
8. **Google Business Profile management** — pull GBP reviews into the platform, auto-draft replies via AI, post promos to GBP from inside the marketing module.

---

## 7. Differentiators — "better marketing ideas for US customers"

These are the three bets that, if executed, make the demo win against HCP and Jobber, not just match them. Each is built on data we already have and incumbents do not.

### 7.1 Equipment-lifecycle marketing engine

US trade businesses (especially HVAC) make 30–50% of their revenue from equipment **replacement and maintenance**, but currently no SMB FSM tool automates the conversation around equipment age. We already store `Equipment` per customer (brand, model, install date, warranty, last service) — this turns into evergreen, calendar-aware marketing without the trade owner doing anything.

**Out-of-the-box automations** (seeded per tenant by trade):
- "Your AC was installed 8 years ago — let's plan a replacement before it fails this summer."
- "Spring tune-up is due for your Lennox XC25 — book in 2 taps."
- "Your water heater warranty expires in 30 days — extend it or replace."

These are personalized, event-driven, not seasonal-blast spam. Open and conversion rates beat list blasts by 3–5x in every benchmark we've seen.

### 7.2 Churn-risk-aware win-back & review gating

The Python ML tier already scores churn risk. Two immediate uses:
- **Win-back trigger:** When `risk > 0.7 AND inactive > 180d`, drop the customer into a 3-step retention sequence with progressive discount.
- **Review gate inversion:** Jobber asks "preferred clients" for reviews; we can do better — score every paid customer for satisfaction proxy (on-time arrival, callback rate, payment lateness as inverse signal) and route the top cohort to Google reviews, the middle cohort to a private NPS thank-you, the bottom cohort to an owner-attention queue. This is "Smart Reviews" and is the single most defensible feature in the module.

### 7.3 Unified attribution across CRM ↔ Jobs ↔ Finance

Because all three live in one Postgres with shared `company_id`, we can attribute a click on Tuesday to a quote on Wednesday to an invoice paid the following Monday — for $0 of integration work. HCP and Jobber both struggle here because their channels are siloed; ServiceTitan does it, but at enterprise pricing. Shipping a clean **Source → Lead → Job → Revenue** funnel at SMB price is a credible "why us" for the investor pitch.

### 7.4 Other ideas worth considering for v2/v3

- **"Service Anniversary" automations** — birthday-style emails on the anniversary of first service, with loyalty discount.
- **Neighbor / route marketing** — when a tech is on a job, auto-postcard to the 20 nearest homes ("Your neighbor at 123 Main just had us out — 10% off if we can stop by while we're in your neighborhood"). This is a known high-conversion play that no SMB FSM tool ships natively.
- **Weather-triggered campaigns** — heatwave / cold-snap triggers via NOAA API → send "AC tune-up before the heat" SMS to HVAC customers in affected zip codes.
- **Maintenance plan growth loop** — show maintenance-plan attach rate per tech; tie a small spiff into the technician app for upsells. (Crosses into the upsell-agent territory; coordinate.)
- **QR code / yard-sign attribution** — generate per-job QR codes for tech-installed yard signs; scans land on a tenant-branded landing page and create attributed Leads.
- **Two-way SMS web chat widget** — embeddable widget on the trade business's website; messages route into comms-service threads and create Leads. Direct competition with Podium, replaces a $300/mo standalone tool.

---

## 8. Architecture

### 8.1 High-level

The Marketing Module is **not a new top-level service**. It is implemented as:

- A new NestJS module **`marketing`** inside the existing `comms-service` (port 3005). Reuses BullMQ, Mongo, SendGrid, Twilio, FCM, Socket.IO already wired there.
- A new Postgres **schema `marketing`** in the shared 16/PostGIS instance (alongside `crm`, `jobs`, `scheduling`, `finance`, `analytics`, `inventory`). Adheres to the project rule: "do not introduce a second Postgres database — add a schema instead."
- A new Prisma client scoped to the `marketing` schema, in `apps/comms-service/prisma/`.
- New **admin-dashboard** routes under `/marketing/*` (campaigns, audiences, automations, reviews, templates, analytics).
- Extended **`analytics-service`** with a `marketing` module for the attribution dashboard (cross-schema joins are already a pattern).
- Extended **Python ML tier** (`agent/`) — new `marketing-agent` orchestrator that consumes risk/upsell signals and emits campaign triggers.

### 8.2 Service boundaries

```
                                ┌────────────────────────┐
                                │  admin-dashboard        │
                                │  /marketing/*           │
                                └──────────┬──────────────┘
                                           │  REST + WS
                       ┌───────────────────┼─────────────────────┐
                       ▼                   ▼                     ▼
            ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
            │ comms-service     │  │ analytics-service │  │ crm-service       │
            │ + marketing module│  │ + marketing module│  │ (audiences read) │
            │ (port 3005)       │  │ (attribution KPIs)│  │ (port 3001)       │
            └─────┬────────────┘  └─────────┬────────┘  └────────┬─────────┘
                  │ BullMQ / Mongo / SG /    │ raw SQL          │ Prisma
                  │ Twilio / FCM / Socket.IO │ across schemas    │
                  ▼                          ▼                   ▼
              ┌─────────────────────────────────────────────────────┐
              │  Postgres (Supabase) — schemas: crm, jobs, finance, │
              │  inventory, analytics, scheduling, **marketing**     │
              └─────────────────────────────────────────────────────┘
                                           ▲
                                           │ pub/sub triggers
                                           │
                              ┌────────────┴───────────┐
                              │ agent/ (Python ML tier)│
                              │ marketing-agent +      │
                              │ existing churn/upsell  │
                              └────────────────────────┘
```

### 8.3 Why extend comms-service instead of a new service?

- comms-service already owns: SendGrid (transactional & bulk), Twilio (SMS + 10DLC brand), FCM, BullMQ workers, Socket.IO threads, Mongo for thread state, automation rules engine.
- Marketing is a strict superset of "send a message to a customer." Two services would duplicate vendor SDKs, queue infra, suppression lists, and webhook handlers.
- Hard separation only if/when comms-service exceeds its current scale. Today the project's bigger problem is **too many services**, not too few.
- Internal module boundary stays clean: `marketing/` is a sibling of `notifications/` and `messaging/`, with its own Prisma schema and controllers.

### 8.4 Key data flows

**Bulk campaign send:**

1. Owner schedules campaign in admin-dashboard.
2. POST `/comms/marketing/campaigns/:id/send` → comms-service.
3. comms-service expands audience: query CRM (with `company_id`), apply suppression, dedupe, write rows to `marketing.send_jobs`.
4. Each row enqueued as a BullMQ job in `marketing-send` queue.
5. Worker picks up, applies merge tags, calls SendGrid or Twilio, persists `marketing.send_events`.
6. Webhooks (SendGrid event API, Twilio status callbacks) update events; click events persist to `marketing.clicks` with `campaignId + customerId + url`.
7. Analytics-service joins clicks → jobs (CRM) → invoices (finance) on `customer_id + company_id` for attribution.

**Triggered automation:**

1. Domain event published to BullMQ (e.g., `job.completed`).
2. comms-service `marketing-automation-worker` matches event against `marketing.automation_rules`.
3. For each matching rule, schedules next step (delay/condition/action) as a BullMQ delayed job.
4. Action step → same send pipeline as bulk.

**Review request:**

1. `invoice.paid` event → review-request rule fires.
2. Smart gate: query `agent/` API for satisfaction proxy; if pass → schedule day-1 SMS + day-3 email; else → owner-attention queue.
3. Click on review link → 302 redirect via `/r/:token` (logged) → Google Business Profile review form.
4. Polling worker (every 6h) fetches GBP reviews via Places API → upserts into `marketing.reviews` → notifies owner of new review via existing Socket.IO threads.

### 8.5 Multi-tenancy

Every table in the `marketing` schema carries `company_id`, indexed first. Every controller enforces `req.user.companyId` filter; super_admin can scope across tenants. Audiences are computed per-tenant — never join across `company_id`. BullMQ job names include `companyId` for traceability and rate-limit isolation per tenant.

### 8.6 Compliance integration points

- **Suppression list:** `marketing.suppressions(company_id, channel, address, reason)` — checked **before** every send. Synced bidirectionally with SendGrid + Twilio STOP keyword webhooks.
- **Opt-in audit:** every `Customer.smsOptInAt` write logged with source (form, manual, import). Imports without provable opt-in source are flagged and quarantined from SMS sends.
- **Quiet hours:** worker checks customer time zone (from `Customer.address.zip` → tz lookup) before send; reschedules if outside 8am–9pm local.
- **Right-to-delete:** existing CRM delete endpoint extended to also purge `marketing.send_events`, `clicks`, `audience_membership`.

---

## 9. Data model (Prisma — new `marketing` schema)

> Full DDL is out of scope for this spec; below is the entity outline. Detailed Prisma models go in the implementation plan.

| Table | Purpose | Key fields |
|---|---|---|
| `Campaign` | A planned send — one-off or recurring. | `id, companyId, name, channel(EMAIL\|SMS\|MULTI), status(DRAFT\|SCHEDULED\|SENDING\|SENT\|PAUSED), audienceId, templateId, scheduleAt, recurrence(JSON), stopWhen(JSON), createdBy` |
| `Template` | Reusable email/SMS body. | `id, companyId, channel, subject, mjml, plainText, smsBody, mergeTagsJson, isShared` |
| `Audience` | Saved segment definition. | `id, companyId, name, type(STATIC\|DYNAMIC), filtersJson, lastCount, lastComputedAt` |
| `AudienceMembership` | Materialized audience for static lists or snapshots. | `audienceId, customerId, addedAt` |
| `Automation` | A journey graph. | `id, companyId, name, status, triggerType, triggerFiltersJson, graphJson(nodes/edges), version` |
| `AutomationRun` | A specific customer's traversal through an automation. | `id, automationId, customerId, currentNodeId, status, startedAt, finishedAt` |
| `SendJob` | One queued message for one recipient. | `id, campaignId\|automationRunId, customerId, channel, address, status, providerId, scheduledAt, sentAt, error` |
| `SendEvent` | Provider event (delivered, opened, clicked, bounced, unsub). | `sendJobId, eventType, eventAt, urlClicked, providerPayload` |
| `Click` | Click on a tracked link. | `id, sendJobId, customerId, campaignId, url, clickedAt, ip, userAgent` |
| `Suppression` | Do-not-contact entries. | `companyId, channel, address, reason, createdAt` |
| `ReviewRequest` | One review-ask sequence. | `id, companyId, customerId, jobId, status(PENDING\|CLICKED\|REVIEWED\|EXPIRED), gateScore, smsAt, emailAt` |
| `Review` | Pulled from GBP / Yelp. | `id, companyId, source, externalId, rating, text, authorName, postedAt, replyText, replyAt` |
| `Referral` | Issued referral code. | `id, companyId, referrerCustomerId, code, rewardType, rewardValue, status, redemptionCustomerId, redeemedAt` |
| `LandingPage` | Phase 2: hosted page. | `id, companyId, slug, htmlJson, formSchema, publishedAt` |
| `MarketingAttribution` | Joins click → lead → job → invoice. | `clickId, leadId, jobId, invoiceId, revenueAttributed, model(FIRST\|LAST\|LINEAR)` |

Cross-schema reads (`crm.Customer`, `jobs.Job`, `finance.Invoice`) happen via Prisma raw SQL or a thin shared types layer in `packages/types` — never via foreign keys across schemas.

---

## 10. APIs (REST, NestJS conventions)

All routes mounted under `/comms/marketing/*` and proxied via Nginx → Cloud Run in prod. JWT auth with company-scoped guard; super_admin can override `company_id`.

```
# Campaigns
GET    /comms/marketing/campaigns
POST   /comms/marketing/campaigns
GET    /comms/marketing/campaigns/:id
PATCH  /comms/marketing/campaigns/:id
POST   /comms/marketing/campaigns/:id/send         # immediate send
POST   /comms/marketing/campaigns/:id/schedule     # schedule
POST   /comms/marketing/campaigns/:id/pause
POST   /comms/marketing/campaigns/:id/test         # send to N test addresses
GET    /comms/marketing/campaigns/:id/stats        # sent/delivered/opened/clicked/booked/$attributed

# Templates
GET    /comms/marketing/templates
POST   /comms/marketing/templates
PATCH  /comms/marketing/templates/:id
POST   /comms/marketing/templates/:id/preview      # render with sample customer

# Audiences
GET    /comms/marketing/audiences
POST   /comms/marketing/audiences
POST   /comms/marketing/audiences/preview          # filtersJson → live count + sample
POST   /comms/marketing/audiences/:id/refresh

# Automations (Phase 2)
GET    /comms/marketing/automations
POST   /comms/marketing/automations
POST   /comms/marketing/automations/:id/activate
GET    /comms/marketing/automations/:id/runs

# Reviews
GET    /comms/marketing/reviews
POST   /comms/marketing/reviews/sync               # pull from GBP
PATCH  /comms/marketing/reviews/:id/reply
GET    /comms/marketing/review-requests
POST   /comms/marketing/review-requests/settings   # configure the auto sequence

# Referrals (Phase 2)
GET    /comms/marketing/referrals
POST   /comms/marketing/referrals/program          # configure rules
GET    /comms/marketing/referrals/codes/:code      # public lookup for landing page

# Public / unauth
GET    /m/u/:token        # one-click unsubscribe
GET    /m/r/:token        # tracked redirect for review/CTA links
POST   /m/webhooks/sendgrid
POST   /m/webhooks/twilio

# Analytics (in analytics-service)
GET    /analytics/marketing/dashboard              # KPIs over range
GET    /analytics/marketing/attribution            # source -> revenue funnel
GET    /analytics/marketing/leaderboard            # campaigns sorted by ROI
```

All paginated lists use `clampPagination({ page, limit })` from `@tscrm/types`.

---

## 11. Frontend (admin-dashboard)

New top-level nav item: **Marketing** (icon: megaphone). Routes:

- `/marketing` — overview / dashboard (KPIs + recent activity + recommendations).
- `/marketing/campaigns` — list, filter by status/channel/date.
- `/marketing/campaigns/new` — wizard: audience → channel → template → schedule → review-and-send.
- `/marketing/campaigns/:id` — detail + stats + per-recipient drill-down.
- `/marketing/audiences` — list + builder.
- `/marketing/audiences/new` — visual filter builder with live count.
- `/marketing/templates` — gallery, library tab vs My Templates tab.
- `/marketing/templates/:id/edit` — MJML editor (use `mjml-react` or similar) for email; plain editor + char counter for SMS.
- `/marketing/automations` — list (Phase 2).
- `/marketing/automations/:id/edit` — graph builder (React Flow) (Phase 2).
- `/marketing/reviews` — feed of new reviews, reply, request settings.
- `/marketing/referrals` — program config + leaderboard (Phase 2).
- `/marketing/settings` — sender identities, quiet hours, suppression list, A2P 10DLC status, GBP linking.

UI components reuse the existing TanStack Query + shadcn/ui pattern. The MJML editor and React Flow graph are lazy-loaded (a la `MapPickerLazy`) to keep the main bundle slim.

A small **"Marketing"** widget on the Dashboard home: "12 reviews this month, 3 active campaigns, $14k attributed revenue." Single-click into the module.

---

## 12. Channels & integrations

| Channel | Vendor | Status | Notes |
|---|---|---|---|
| Email | SendGrid | Already integrated | Add bulk-send "Marketing Campaigns" API, dedicated IP optional, domain auth (DKIM/SPF) automated per tenant. |
| SMS | Twilio | Already integrated | A2P 10DLC brand + campaign registration automated during tenant onboarding (US carriers reject unregistered traffic in 2026). |
| Push | FCM | Already integrated | Already used for staff/tech; can also reach customer mobile app users (Phase 2). |
| Postcards | Lob (preferred) or PostGrid | New, Phase 3 | Address validation + USPS-compliant template rendering. ~$0.85/card cost basis. |
| Reviews — Google | Google Business Profile API | New, Phase 1 | OAuth per tenant; pull reviews; post replies; post promos. |
| Reviews — Yelp / Facebook | Web links only | Phase 1 | No API for posting; just deep links. |
| Web chat | Custom widget | New, Phase 2 | Iframe + WS to comms-service threads. |
| Ad sync | Google Ads + Meta Customer Match APIs | Phase 3 | One-way audience export; OAuth per tenant. |
| Weather triggers | NOAA NWS API | Phase 3 | Free, public; cron polls per tenant zip codes. |

---

## 13. Compliance — US specifics (mandatory)

The US is the strictest jurisdiction in marketing law for SMBs; getting this wrong is existential.

- **CAN-SPAM Act** (email): physical postal address in every footer; functional one-click unsubscribe processed within 10 business days; no deceptive subjects; opt-out persisted globally per tenant.
- **TCPA + A2P 10DLC** (SMS): explicit opt-in (record source + timestamp), STOP/HELP keyword auto-handling, quiet hours 8am–9pm local time, A2P 10DLC brand + campaign registration **before any tenant sends a single SMS** (carriers will block unregistered traffic). Build registration flow into onboarding.
- **CCPA / CPRA** (California): right to know / delete / opt-out of sale (we don't sell — but we must declare). Extend existing data-export.
- **State-level SMS laws** (Florida, Oklahoma, Washington): expanded private right of action — when in doubt, default to consent before send and respect STOP forever.
- **Google review policy:** must not gate review requests by rating ("review gating" violates Google policy). Our smart-gate must use **pre-asking** signals (NPS proxy, prior satisfaction), not "ask only if they'd give 5 stars." Phrasing matters; legal review required before launch.
- **Apple Mail Privacy Protection:** opens are unreliable on iOS Mail. Treat clicks as the truth metric for engagement; report opens with a caveat in the dashboard.
- **GDPR / Canada CASL:** out of scope at US launch but design schema to support consent metadata so we can light up other markets later without migration.

---

## 14. Pricing & packaging (recommendation)

Two viable models — recommend the second:

1. **Bundled into "Pro" tier.** Marketing is a tier-up driver. Easy story, but caps revenue.
2. **Marketing Suite add-on, $59/mo per tenant**, undercutting Jobber's $79 and bundling more (campaigns + reviews + referrals + automations from day Phase 2). À la carte not offered — keeps the SKU simple.

Phase 3 features (postcards, ad sync, AI generator) priced at usage (postage pass-through + small markup) or as "Marketing Pro" tier-up at $129/mo.

For US launch, recommend (2) — it gives a clean ARPU lever, a credible investor metric (attach rate), and avoids cannibalizing the base tier.

---

## 15. Metrics & KPIs

### 15.1 Product KPIs (in-app dashboard for the trade business)

- Sent / delivered / open rate / click rate / unsubscribe rate (per campaign + rolled up).
- Bookings attributed (count + $) — joined from CRM/Jobs/Finance.
- Reviews captured (new 4–5★ count, response rate, average rating).
- Referrals issued / redeemed / revenue.
- Spend (postcards, ad sync) vs revenue attributed = ROAS per channel.

### 15.2 Business KPIs (internal, for the investor)

- Marketing add-on attach rate.
- Marketing-active tenants' net retention vs non-active.
- Outbound message volume per tenant per month (cost-of-goods proxy).
- Reviews-feature MoM growth in new reviews/tenant.
- Time-to-first-campaign for new signups (onboarding KPI; target < 14 days).

---

## 16. Phased roadmap

| Phase | Window | Deliverables | Exit criteria |
|---|---|---|---|
| **0 — Foundation** | Weeks 1–2 | `marketing` Prisma schema, suppression infra, A2P 10DLC + DKIM onboarding flow, send pipeline skeleton. | One tenant can send a single email + SMS through the new pipeline end-to-end with full compliance footer. |
| **1 — MVP / US launch** | Weeks 3–8 | Campaigns (email + SMS), audiences, templates, review requests + smart gate, marketing dashboard v1, settings. | Demo runs the 5 user journeys in §5.2 #1–2. Compliance audit passes. Investor demo green. |
| **2 — Parity++** | Months 3–5 | Referrals, journey builder, landing pages, attribution dashboard v2, A/B testing, two-way SMS inbox. | Feature parity matrix vs Jobber Marketing Suite at 100%; vs HCP Marketing Center at 90%. |
| **3 — Differentiator** | Months 6–12 | AI audience builder, AI copy, equipment-lifecycle automations, churn-risk win-back, postcards, ad sync, GBP management, marketing recs. | Three features publicly documented as "only T&S ships this." Net retention of marketing-adopters > +20pp. |

---

## 17. Risks & open questions

- **Deliverability.** Shared SendGrid / Twilio reputation can be poisoned by a single bad tenant. Need per-tenant subuser / Twilio messaging service + automated reputation monitoring before opening the firehose.
- **A2P 10DLC throughput.** US carrier-mandated; brand registration takes 1–14 days. Onboarding must surface this as a pre-launch step, not a surprise at first send.
- **Google review gating policy.** Smart-gate phrasing is the difference between "differentiator" and "GBP suspension." Legal + Google policy review before Phase 1 ship.
- **Apple MPP / open-rate inflation.** Communicate to users that opens are noisy; lead the dashboard with clicks + bookings.
- **Cross-schema attribution latency.** Joining clicks (Mongo / Postgres) → jobs (Postgres) → invoices (Postgres) at scale needs materialized views in `analytics-service`. Plan for it in Phase 2.
- **Cost of bulk SMS at scale.** Twilio is ~$0.0079/SMS in US — at 50k SMS/tenant/month that's $400 raw cost. Pricing must include a usage cap or pass-through tier.
- **AI copy hallucination.** Trade-specific facts (license numbers, warranty terms) cannot be hallucinated. AI generator must be grounded on tenant-provided snippets only, not free-form generation.
- **Module fit in comms-service.** comms-service is already moderately sized. Watch for module split signals (build time, test time, deploy independence) and revisit as a separate `marketing-service` if any of those degrade meaningfully.
- **Customer mobile app.** No customer-facing mobile app exists today (customer-portal is web-only). Push to customers is therefore Phase 2+; Phase 1 stays email + SMS.

---

## 18. Open product questions for the next round

1. Bundle into Pro tier or sell as $59 add-on at launch? (Recommendation: add-on.)
2. Postcards in Phase 1 (HCP differentiator) or defer to Phase 3? (Recommendation: defer — Lob integration adds 2 weeks and a vendor.)
3. Customer-portal as a "marketing surface" — should the portal homepage carry tenant-defined promo banners? (Likely yes, low-cost; track separately.)
4. AI copy generator — bring our own LLM (OpenAI/Anthropic via API) or reuse the same provider as the existing AI agents? (Decide once §17 grounding constraints are resolved.)
5. Pricing for postcards: cost-pass-through ($0.99 each) or tiered package (100 cards/$95)? (Recommendation: tiered — predictability sells better to SMBs.)
6. Should `customer-portal` itself ever be a marketing channel ("Refer a friend" widget)? (Likely yes Phase 2.)

---

## 19. Sources

- [Housecall Pro — Marketing Center Overview (Help Center)](https://help.housecallpro.com/en/articles/11057071-marketing-center-overview)
- [Housecall Pro — Feb 2026 Product Release notes](https://www.housecallpro.com/resources/february-2026-product-updates/)
- [Housecall Pro launches user-driven AI and automation upgrades (MSN)](https://www.msn.com/en-us/news/other/housecall-pro-launches-user-driven-ai-and-automation-upgrades/gm-GMF317E3F8)
- [Housecall Pro Marketing Features overview (Pipeline On)](https://pipelineon.com/blog/housecall-pro-marketing-features/)
- [Jobber — Marketing Suite (product page)](https://www.getjobber.com/features/marketing-suite/)
- [Jobber — Marketing Tools (product page)](https://www.getjobber.com/features/marketing-tools/)
- [Jobber Help Center — Referrals Marketing Tools](https://help.getjobber.com/hc/en-us/articles/25316299579799-Referrals-Marketing-Tools)
- [Jobber Help Center — Marketing Dashboard](https://help.getjobber.com/hc/en-us/articles/26197554098967-Marketing-Dashboard-Marketing-Tools)
- [Jobber Help Center — Add Marketing Tools to your subscription (pricing)](https://help.getjobber.com/hc/en-us/articles/20959257809815-Add-Marketing-Tools-to-your-Jobber-Plan-Subscription)

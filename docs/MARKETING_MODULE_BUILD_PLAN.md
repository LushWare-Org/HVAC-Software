# Marketing Module — Build Plan

> Status: **Sprint 4 complete — Sprint 5 next**
> Created: 2026-05-11 | Last updated: 2026-05-12
> Based on: `docs/MARKETING_MODULE_SPEC.md` + `docs/MARKETING_MODULE_ACTION_PLAN.md`
> Strategy: Pull Phase 3 differentiators forward where infrastructure already exists. Win the demo by week 7, not month 6.

---

## Why this ordering is different from the spec

The spec treats Equipment-Lifecycle automations (EQ1) and Churn-risk win-back (CH1) as Phase 3. That's correct when you don't have the data. We do. The `Equipment` table, `churn-service` XGBoost scores, and the full CRM/Jobs/Finance data plane are live today. The hard part of Phase 3 is already done — so we pull those features into Phase 1.

The result: a demo that passes the HCP/Jobber feature checklist **and** shows two differentiators they cannot claim, by week 7.

---

## Pre-work (Start Today — Not Engineering)

### A2P 10DLC Brand Registration
- **What:** US carriers (AT&T, T-Mobile, Verizon) require every business sending SMS at scale to register a "brand" and "campaign use case" through The Campaign Registry (TCR). Twilio is the gateway. Without registration, carriers silently filter or block your SMS from September 2023 onward.
- **Where:** Twilio Console → Messaging → Regulatory Compliance → US A2P 10DLC
- **What you need to provide:**
  - Business legal name, EIN (US tax ID), business address
  - Website URL (must be live and match the business)
  - Campaign use case: select "Mixed" or "Customer Care" — do NOT select "Marketing" as the primary (higher scrutiny)
  - Sample message bodies (2–3 examples matching what you'll actually send)
  - Opt-in / opt-out disclosure language
- **Timeline:** Brand approval: 1–5 business days. Campaign approval: 3–14 business days. Start the day you read this.
- **Cost:** ~$4/month TCR fee per brand + $10/month per campaign use case. Not material.
- **Risk if skipped:** First SMS send will look fine in dev (Twilio sandbox bypasses it), fail silently or get flagged in prod. This is the #1 stealth launch blocker.

---

## Sprint 0 — Foundation (Weeks 1–2) ✅ DONE 2026-05-12

**Delivered:**
- `marketing` Postgres schema (8 tables) — applied via Supabase dashboard (Prisma migrate blocked by DPI)
- `crm.leads` Meta fields: `leadgenId`, `adName`, `formId`
- `MarketingPrismaService` + `MarketingPrismaModule`
- `SuppressionService` + controller (add/remove/isSuppressed, normalised email lowercase)
- `quiet-hours.util` — TCPA 08:00–21:00 enforcement + `nextSendableTime`
- `marketing-token.util` — JWT sign/verify for unsub/click/review-click tokens (90d)
- `MarketingSendWorker` (BullMQ) — suppression → quiet-hours → SMS/email dispatch
- `PublicController` (`/m/u/:token` unsub, `/m/r/:token` redirect)
- `WebhooksController` (`/m/webhooks/sendgrid` ECDSA, `/m/webhooks/twilio` STOP)
- Nginx `/m/` routes in dev + Cloud Run configs
- `QueueName.MARKETING_SEND` in `packages/queue`
- 44 tests passing, type-check clean

**Migration workflow:** Supabase Dashboard SQL Editor. Script: `scripts/supabase-dashboard-migration.sql`

### F1 — `marketing` Postgres schema + Prisma client
- Add schema `marketing` to the shared Supabase Postgres instance
- Add Prisma client scoped to `marketing` schema inside `apps/comms-service/prisma/`
- Core tables to create in this sprint (minimal set for Phase 1):
  - `Campaign` — id, companyId, name, channel, status, audienceId, templateId, scheduleAt, createdBy
  - `Template` — id, companyId, channel, subject, mjmlBody, smsBody, mergeTagsJson
  - `Audience` — id, companyId, name, type (STATIC|DYNAMIC), filtersJson, lastCount
  - `SendJob` — id, campaignId, customerId, channel, address, status, scheduledAt, sentAt
  - `SendEvent` — sendJobId, eventType (DELIVERED|OPENED|CLICKED|BOUNCED|UNSUBSCRIBED), eventAt, urlClicked
  - `Suppression` — companyId, channel (EMAIL|SMS), address, reason, createdAt
  - `ReviewRequest` — id, companyId, customerId, jobId, status, gateScore, smsAt, emailAt
  - `MarketingAttribution` — id, companyId, customerId, jobId, invoiceId, source, adName, formId, clickedAt, revenueAttributed

### F4 — Suppression list enforcement
- `SuppressionService` in comms-service marketing module
- Checked before every single send — no exceptions
- Synced on Twilio STOP keyword callback and SendGrid unsubscribe event
- Endpoint: `POST /comms/marketing/suppressions` (manual add), `DELETE /comms/marketing/suppressions` (re-subscribe with opt-in proof)

### F5 — Unsubscribe + click-redirect endpoints
- `GET /m/u/:token` — one-click unsubscribe; adds to suppression list, shows confirmation page
- `GET /m/r/:token` — tracked redirect; logs click to `SendEvent`, 302s to destination URL
- These must be unauthenticated (customers click them from email/SMS)
- Add nginx routes for `/m/*` in both `nginx.conf` and `nginx.cloud.conf`

### F6 — Provider webhooks
- `POST /m/webhooks/sendgrid` — receives SendGrid Event Webhook (delivered, opened, clicked, bounced, spam, unsubscribed). Must be unauthenticated; verify SendGrid signature.
- `POST /m/webhooks/twilio` — receives Twilio status callbacks (delivered, failed) and inbound STOP/HELP keywords. Must be unauthenticated; verify Twilio signature.
- Both update `SendEvent` rows. STOP keyword → auto-add to suppression list.

### F7 — Timezone-aware quiet-hours send worker
- BullMQ worker for the `marketing-send` queue
- Before every SMS send: resolve customer timezone from `Customer.address` zip code → IANA tz → check if current time is between 08:00–21:00 local
- If outside quiet hours: reschedule job to next 08:00 local (do NOT drop it)
- Email: no quiet-hours requirement, but respect `Customer.timezone` for scheduling

### Meta attribution fix (30 minutes)
- In `apps/crm-service/src/meta/meta.service.ts`, when `processLead()` creates a Lead, store:
  - `source: 'META_LEADGEN'`
  - `adName` (from Graph API `ad_name` field)
  - `formId` (from Graph API `form_id` field)
  - `leadgenId` as its own field, not stuffed into `notes`
- Requires a small Lead model migration — add `source`, `adName`, `formId` optional fields
- This populates the attribution chain (`marketingSourceId`) from day 1

---

## Sprint 1 — Review Requests (Weeks 2–4) ✅ DONE 2026-05-12

**Delivered (R1 + R2):**
- `ChurnGateService` — calls churn-service `/predict/churn`, threshold ≤ 0.6 = send, fails open when service down
- `ReviewRequestService` — idempotent (one per job), Smart Gate, SMS day-1, email day-3 queued via BullMQ
- `ReviewRequestController` — `POST /marketing/review-requests` + GET by job/customer
- Extended `MarketingSendWorker` to handle `review-email` delayed job (day-3, 3 retries exp backoff)
- Review email template (self-contained HTML, tracked link + unsubscribe footer)
- `ReviewClickTokenPayload` type added to `marketing-token.util`
- 56 tests passing, type-check clean

**Deferred to later sprint:**
- R3 — Google Business Profile OAuth (GBP connection table, API poll, Socket.IO notify)
- R4 — Reviews widget (embeddable JS)

**The highest-ROI feature in the entire module. Ship this before campaigns.**

US trade businesses live and die by Google reviews for local SEO. Every owner's first question is "will it get me more Google reviews automatically?" This is R1 + R2.

### R1 — Auto review request sequence
- Trigger: `invoice.paid` BullMQ event (already published by finance-service)
- Day 1: send SMS with direct Google Business Profile review deep-link
- Day 3: if review link not clicked → send email fallback
- Token-tracked link via `/m/r/:token` → redirect to GBP URL (per-tenant config)
- Creates `ReviewRequest` row; status transitions: PENDING → CLICKED → REVIEWED | EXPIRED (7d)

### R2 — Smart Gate (differentiator vs Jobber)
- Before sending review request, query `churn-service` satisfaction proxy for the customer
- Routing:
  - Score ≥ 0.6 → send Google review request (R1 sequence)
  - Score 0.3–0.6 → send private "How did we do?" 1-tap feedback form (owner sees it, Google doesn't)
  - Score < 0.3 → add to owner-attention queue (notification in admin dashboard), no outbound message
- **This beats Jobber's "preferred clients" gate** (manual). Ours is ML-driven, automatic, and legally safer (we're not gating who can leave a review, we're prioritizing timing based on satisfaction signals)
- Legal note: phrasing matters. Review request language must not say "if you're happy, leave a review." Say "tell us about your experience." Gate is on send timing, not on copy.

### R3 — Google Business Profile OAuth
- Per-tenant GBP OAuth flow in Settings → Reviews
- Store access token in `marketing` schema (new `GBpConnection` table)
- Pull new reviews via Google My Business API every 6 hours (BullMQ cron)
- Upsert into `marketing.Review` table
- Notify owner via Socket.IO when new review arrives

### R4 — Reviews widget (embeddable JS)
- `GET /m/widget/:companySlug/reviews.js` — returns a small embed script
- Pulls top 5 reviews from `marketing.Review` (4–5 stars only)
- Renders a styled card carousel; tenant pastes one `<script>` tag on their website

---

## Sprint 2 — Equipment-Lifecycle Automations (Weeks 3–5) ✅ DONE 2026-05-12

**Delivered:**
- `CrmClient` — fetches equipment+customer from crm-service with dev bypass / service JWT auth
- `EQUIPMENT_TEMPLATES` — 3 typed templates: `hvac-tune-up-6mo`, `hvac-replacement-7yr`, `warranty-expiry-30d`
- `EquipmentAutomationService` — template resolver (6mo/7yr/30d-warranty windows), 90-day idempotency guard, SMS immediate + email via BullMQ, dedup via `automationTemplate` field on SendJob
- `EquipmentAutomationProcessor` — handles `equipment-scan` + `automation-email` job types on `QueueName.EQUIPMENT_AUTOMATION`
- `EquipmentAutomationModule` — registers daily 09:00 UTC cron (BullMQ repeatable job), wires all deps
- `QueueName.EQUIPMENT_AUTOMATION` added to `packages/queue`
- CRM: `EquipmentService.findAutomationCandidates()` + `EquipmentAutomationController` (2 endpoints)
- 83 tests passing across 11 suites; both services type-check clean

## Sprint 2 — Equipment-Lifecycle Automations (Weeks 3–5, parallel with Sprint 1)

**Pulled from Phase 3. Strongest differentiator — no SMB tool ships this.**

No need for the full journey builder (React Flow). Ship 3 hardcoded automation templates backed by a generic `AutomationRule` engine:

### EQ1 — Three pre-built equipment automation templates

**Template A: Seasonal HVAC Tune-Up Reminder**
- Trigger: Equipment with `type = HVAC` + `lastServiceDate < now() - 6 months`
- Send: SMS + email "Time for your seasonal tune-up — book in 2 taps"
- Runs: daily cron at 09:00 per tenant timezone
- Stop-when: booking created for this customer within 7 days of send

**Template B: HVAC Unit Replacement Pitch**
- Trigger: Equipment with `type = HVAC` + `installDate < now() - 7 years`
- Send: email "Your system installed in [year] — let's plan before it fails this summer"
- Merge tags: `{{equipment.brand}}`, `{{equipment.installYear}}`, `{{company.phone}}`
- Stop-when: quote created for this customer

**Template C: Warranty Expiry Alert**
- Trigger: Equipment where `warrantyExpiry BETWEEN now() AND now() + 30 days`
- Send: SMS "Your [equipment.brand] warranty expires [date] — extend or replace?"
- Creates a `Lead` with tag `warranty-expiry` if customer clicks

**Implementation:**
- `EquipmentAutomationWorker` BullMQ cron job (daily, per tenant)
- Queries `crm.Equipment` cross-schema, matches triggers, checks suppression, enqueues sends
- Each send logged in `marketing.SendJob` with `automationTemplate = 'EQ_TUNE_UP' | 'EQ_REPLACEMENT' | 'EQ_WARRANTY'`
- Tenant can toggle each template on/off in marketing settings

---

## Sprint 3 — Churn-Risk Win-Back (Weeks 5–6) ✅ DONE 2026-05-12

**Delivered:**
- `WinbackService` — scores customers via ChurnGateService (threshold 0.7), 90-day cooldown, 3-step dispatch
- `WinbackProcessor` — plain Injectable (not a BullMQ @Processor), handles step-2 email + step-3 SMS with suppression re-check
- `winback-templates.ts` — step1Sms (day-0), step2EmailSubject/Body (day-3, optional offer block), step3Sms (day-7 urgency)
- `WinbackModule` — provides WinbackService + CrmClient + ChurnGateService; no circular deps
- `EquipmentAutomationModule` — extended: second cron `daily-winback-scan` at 10:00 UTC, `EquipmentAutomationProcessor` handles it
- `CrmClient` — added `getWinbackCandidates()` + `WinbackCandidate` interface
- CRM `GET /customers/winback-candidates` endpoint (COMPANY_ADMIN+), capped at 500 per run
- `MarketingSendWorker` — handles `winback-email` (3-day delay) + `winback-sms` (7-day delay) job names
- 3 SendJob rows per candidate: `winback-step1`, `winback-step2`, `winback-step3`
- Fail-open: churn-service down → defaults score to 0.8 (above threshold, still fires)
- 98 tests passing (15 new: 7 service + 8 template), type-check clean

---

## Sprint 4 — Campaigns + Dashboard (Weeks 6–8) ✅ DONE 2026-05-12

**Delivered:**
- `TemplatesModule` — CRUD + `POST /m/templates/seed-defaults` (6 trade templates)
- `AudienceModule` — CRUD + live count preview + member resolution via CRM
- `CampaignModule` — create/launch/schedule + hourly dispatch cron (via EquipmentAutomationModule)
- `MarketingStatsModule` — KPIs + per-campaign stats + funnel endpoint
- CRM audience query endpoints: `GET /customers/audience/count` + `/members`
- 118 tests passing, type-check clean

By this point you have sends flowing, events tracked, suppression working, and real data. The dashboard has something to show.

### C2 + C3 — SMS campaign builder + scheduled sends
- Simple plain-text editor with character counter (160 chars = 1 segment)
- Merge tags: `{{customer.firstName}}`, `{{job.lastServiceDate}}`, `{{company.name}}`
- Audience picker (static list or dynamic filter — see C5)
- Send options: immediate, scheduled datetime, recurring (weekly/monthly)
- Stop-when: booked, replied, unsubscribed

### C5 — Audience builder (visual filters)
- Filter over a flat SQL view per tenant: `crm.Customer` columns + computed fields
- Available filters: trade type, city/state/zip, last job date, lifetime value, equipment type, equipment age, tags, lifecycle stage
- Live audience count preview (debounced, runs `SELECT COUNT(*)` with filters applied)
- Save as named audience for reuse across campaigns

### C8 + C9 — Templates library
- Seed 6 trade-specific templates on company creation: HVAC tune-up, plumbing emergency, electrical safety, water heater maintenance, seasonal promo, win-back
- Admin can save their own templates (save edited template as new)

### D1 + D2 — Marketing dashboard v1
- Route: `/marketing` in admin-dashboard
- KPI cards: Messages sent / Delivery rate / Open rate / Click rate / Reviews this month / Jobs attributed / $ attributed
- Recent campaigns list with per-campaign stats
- Per-campaign drill-down: sent → delivered → opened → clicked → booked → paid funnel
- Attribution joins: `marketing.SendEvent.clicks` → `crm.Lead` → `jobs.Job` → `finance.Invoice` on `customer_id + company_id`
- Time range selector: last 7d / 30d / 90d

### C1 — Email campaign builder (basic, not MJML)
- Skip the full MJML drag-drop editor for now — too expensive for Phase 1
- Simple rich-text editor (TipTap or similar) with merge tag insertion
- Mobile preview toggle
- Full MJML editor deferred to post-launch once we validate usage

---

## Sprint 5 — Settings + Compliance Cleanup (Week 8)

### S1 — Marketing settings page
- Sender identity: verified sending domain (SendGrid domain auth), Twilio number / 10DLC status
- Review requests: toggle on/off, smart gate threshold, GBP link
- Equipment automations: toggle per template, discount amounts for win-back
- Quiet hours override (default 08:00–21:00, customizable)
- Unsubscribe page footer text

### S3 — Right-to-delete extension
- Extend existing CRM `DELETE /crm/customers/:id` to also purge `marketing.SendJob`, `SendEvent`, `Click`, `Suppression`, `ReviewRequest`, `AudienceMembership` for that customer
- Required for CCPA compliance

---

## What to defer (explicitly not in this plan)

| Item | Reason |
|---|---|
| MJML drag-drop email editor (C1 full) | 2–3 weeks of frontend; pre-built templates cover demo |
| Visual journey builder / React Flow (A1) | XL effort; hardcoded automation templates cover Phase 1 |
| Referral program (RF1–RF3) | Phase 2; not on the must-have checklist |
| Landing pages (LP1–LP2) | Meta lead capture covers inbound; defer |
| Postcards via Lob (PC1) | Adds vendor + 2 weeks; not on Jobber checklist |
| A/B testing (C10) | Phase 2 |
| Attribution dashboard v2 / UTM rollup (AT1) | Phase 2; v1 attribution is enough for demo |
| Dedicated SendGrid subuser per tenant (F2) | Needed before real tenant scale; not before demo |
| AI audience builder (AI1) | Phase 3 |
| Google Ads Customer Match (AD1) | Phase 3 |
| Meta Customer Match outbound (AD1) | Phase 3 — need Meta Ads API OAuth (different from current Page token) |

---

## Execution timeline

```
Week 0:    A2P 10DLC paperwork started. Meta attribution fix merged.
Weeks 1–2: Sprint 0 — marketing schema, suppression, unsubscribe endpoints, webhooks, quiet-hours worker
Weeks 2–4: Sprint 1 — review requests (R1+R2), GBP OAuth (R3), widget (R4)
Weeks 3–5: Sprint 2 — equipment automation templates EQ1 (parallel with Sprint 1)
Weeks 5–6: Sprint 3 — churn-risk win-back (CH1+CH2)
Weeks 6–8: Sprint 4 — campaigns (C2+C3+C5+C8+C9), dashboard (D1+D2), basic email (C1)
Week 8:    Sprint 5 — settings page, right-to-delete, compliance cleanup
```

**Total: ~8 weeks for one full-stack engineer. Result: demo that beats HCP + Jobber checklist + shows 2 differentiators they cannot match.**

---

## Environment variables needed (new)

```bash
# Meta (already merged — just need values in prod)
FACEBOOK_VERIFY_TOKEN=
FACEBOOK_APP_SECRET=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
FACEBOOK_COMPANY_ID=

# Marketing module (new)
SENDGRID_WEBHOOK_SIGNING_SECRET=   # from SendGrid Settings → Mail Settings → Event Webhook
TWILIO_WEBHOOK_AUTH_TOKEN=         # same as existing TWILIO_AUTH_TOKEN for signature verification
GOOGLE_OAUTH_CLIENT_ID=            # for GBP OAuth (Reviews)
GOOGLE_OAUTH_CLIENT_SECRET=
MARKETING_CLICK_BASE_URL=          # base for /m/r/:token links (e.g. https://yourdomain.com)
MARKETING_UNSUBSCRIBE_BASE_URL=    # base for /m/u/:token links
```

---

## Cross-references

- Full spec + architecture → `docs/MARKETING_MODULE_SPEC.md`
- Action plan + priority matrix → `docs/MARKETING_MODULE_ACTION_PLAN.md`
- System overview → `docs/SYSTEM_OVERVIEW.md`
- Comms-service current capabilities → `apps/comms-service/`
- Churn-service → `apps/churn-service/` (FastAPI + XGBoost, port 8000, runs in Docker)
- Equipment data → `crm.Equipment` table via `apps/crm-service/`
- Meta lead capture → `apps/crm-service/src/meta/`

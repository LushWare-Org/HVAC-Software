# Customer Portal Engagement — Client Feedback Analysis

> **Date:** 2026-06-12 · **Source:** client email feedback on customer portal
> **Goal per client:** make the portal a destination customers return to, strengthening the customer↔contractor bond and making the software a market differentiator. Today it is "necessary transactional information, but nothing else."

---

## 0. Current portal state (audit)

| Surface | What it shows today |
|---|---|
| Dashboard | 4 KPI cards (Jobs Completed, Upcoming, Pending Invoices, Total Spent), Recent Jobs table, Next Appointment, pending-invoice banner |
| My Jobs + JobDetailModal | Job title/status/schedule + booking/cancel. **No work-order data: no technician notes, no photos, no signature, no task checklist, no line items** |
| Invoices / Quotes | Transactional lists + pay/approve flows |
| Messages | Thread-based messaging with the contractor |
| Devices | IoT thermostats (Honeywell/Nest) — live temps, history charts ✅ already a sticky feature |
| Profile | Contact info |
| ChatWidget | AI chatbot (chat-service) ✅ already sticky |

**Verdict matches the client's:** transactional core is solid; recurring-visit reasons are thin (IoT + chat are the only two, and IoT requires owning a smart thermostat).

**Relevant existing backend assets (this is the leverage):**
- `Equipment` model (crm): type, brand, model, serialNo, **installDate**, **warrantyEnd**, notes — already populated via import wizard + admin UI
- Marketing module (comms): equipment-lifecycle automation cron **already sends tune-up/warranty reminders** (Sprint 2), templates, campaigns, suppression, attribution
- Upsell module (crm) + ServiceAgreement model — membership/cross-sell raw material exists
- `WorkOrder` (job): technicianNotes, signatureUrl, checkin/checkout, taskCompletions, lineItems + `JobPhoto` — full service-report data exists, just not exposed to customers
- `Company.logoUrl` — branding seed for the banner
- MinIO/S3 + PDF infra — manual/document storage is solved
- FCM web push (comms) — PWA push possible without an app store

---

## 1. Suggestion-by-suggestion analysis

### S1. Equipment-required filters (e.g., Lennox X6673 20×25×5 MERV 11) + install date + replacement due date
**Feasibility: HIGH — natural extension of the existing Equipment model.**

- **Gap:** Equipment has no consumables concept. Need a child model:
  ```
  EquipmentConsumable {
    id, companyId, equipmentId
    kind          (FILTER | UV_BULB | PAD | OTHER)
    partNumber    ("X6673"), description ("Healthy Climate HCF20-11")
    sizeSpec      ("20x25x5"), rating ("MERV 11")
    intervalDays  (default 90)
    lastReplacedAt, nextDueAt (computed)
    purchaseUrl   (nullable — see S2)
  }
  ```
- **Data entry:** contractor enters part info once per equipment (admin CustomerDetailsSidebar → Equipment section). Later: seed a fitment lookup table for the top ~50 brand/model combos. There is **no free public filter-fitment API** — manual-first is correct.
- **Reminders:** reuse the marketing equipment-automation cron (Sprint 2) — add a `filter-replacement-due` template alongside `hvac-tune-up-6mo`. The idempotency/suppression/frequency-cap machinery is already built.
- **Portal:** new "My Equipment" page — equipment cards with filter spec, install date, due date, "due in X days" badge, replace-confirmation button (resets `lastReplacedAt`).
- **Effort:** backend 2d, admin UI 1d, portal page 2d, reminder template 0.5d → **~5–6 dev-days**
- **Risk:** low. Multi-tenancy + customerId scoping per existing portal endpoint pattern.

### S2. Contractor Commerce integration (friction-free filter purchase)
**Feasibility: MEDIUM — phased; full integration depends on a third party.**

- contractorcommerce.com is a white-label e-commerce platform for HVAC contractors. Public partner API access requires a partnership agreement — **client must initiate contact; we cannot scope the API integration until terms/docs are in hand.**
- **Phase A (now, trivial):** `purchaseUrl` on EquipmentConsumable → "Buy replacement" button. Contractor pastes their store link (Contractor Commerce store, Amazon, anywhere). **~0.5 dev-day** on top of S1.
- **Phase B (later):** embedded storefront/checkout via their partner API. **Unscopeable until docs received.** Action item for client: request partner/API documentation.
- **Risk:** dependency on external partnership. Phase A delivers 80% of the friction reduction.

### S3. Branded banner with contractor tips/offers
**Feasibility: HIGH — small.**

- `Company.logoUrl` exists. Need `CompanyAnnouncement` model (crm): title, body, linkUrl, accentColor, activeFrom/To, audience(ALL|MEMBERS). Admin CRUD in Settings or Marketing tab; portal renders newest active announcement as a dismissible branded banner.
- Synergy: Marketing module's campaign content can be cross-posted here ("push the newsletter content," see S5).
- **Effort:** **~3 dev-days** (model+CRUD 1d, admin UI 1d, portal banner 1d)

### S4. Operating manuals (PDF) per equipment
**Feasibility: HIGH — storage and serving already solved (MinIO/S3).**

- Add `manualUrl`/`manualKey` to Equipment (or a small `EquipmentDocument` model for multiple docs). Admin: upload in Equipment editor. Portal: "Manual" download button on the equipment card (auth-guarded blob download — pattern already exists from import error-report downloads).
- Later enhancement: shared manual library keyed by brand+model so one upload serves all customers with that unit.
- **Effort:** **~2–3 dev-days**

### S5. Tips & Tricks from the contractor (newsletter content in portal)
### S6. Helpful videos
**Feasibility: HIGH — one feature, two content types.**

- One `ContractorPost` model (crm or comms): companyId, type(TIP|VIDEO|OFFER), title, body (rich text/markdown), videoUrl (YouTube/Vimeo embed), heroImageKey, publishedAt, pinned.
- Admin: simple post editor in Marketing page (new "Content" tab) — reuses the marketing UI conventions.
- Portal: "Tips & Advice" feed page + "latest tip" card on Dashboard. Videos are the same posts with an embedded player — no video hosting on our side.
- Synergy: marketing campaigns can deep-link to posts; posts give recurring fresh content (the #1 driver of return visits).
- **Effort:** **~4–5 dev-days** for both (model+CRUD 1.5d, admin editor 1.5d, portal feed+embeds 1.5d)
- **Risk:** content burden on contractors. Mitigate: seed 10–15 generic HVAC seasonal tips as defaults (same pattern as the 6 default marketing templates).

### S7. Special offers / upgrades / memberships cross-sell
**Feasibility: HIGH — assembling existing pieces.**

- Already exists: upsell recommendation engine (crm `upsell` module), ServiceAgreement (membership) model, quotes flow with e-sign approval.
- Build: portal "Offers" section — (a) active `ContractorPost type=OFFER` items, (b) personalized upsell recommendations surfaced read-only ("Your system is 8 years old — ask about upgrade options"), (c) membership pitch card → "Request quote" → creates a Lead/booking, contractor follows up with a real Quote (existing e-sign flow completes the loop).
- Deliberately **not** building self-serve checkout for memberships in v1 — quote-approval flow already gives a legally-signed purchase path.
- **Effort:** **~4–6 dev-days**
- **Risk:** upsell recommendations are AI/bandit-driven; surface them with soft language and a contractor-side toggle (marketing settings page already has the toggle pattern).

### S8. Service report details in My Jobs
**Feasibility: HIGH — highest value-to-effort ratio of the whole list. Pure surfacing of existing data.**

- All data already captured by the technician app: `WorkOrder.technicianNotes`, `signatureUrl`, checkin/checkout times, `taskCompletions` (the checklist), `lineItems` (parts used), `JobPhoto` (before/after photos).
- Build: customer-scoped endpoint in job-service (`GET /jobs/:id/service-report`, **must enforce customerId filter for role=CUSTOMER** per the standing rule) + extend portal JobDetailModal with a "Service Report" section: what was done (checklist), parts used, tech notes, photos, signature, duration.
- Optional later: PDF export via existing finance PdfService pattern.
- **Effort:** **~3–4 dev-days**
- **Risk:** technician notes may contain internal language — add a `customerVisibleNotes` field or a per-work-order "share with customer" toggle. Decide before building.

### S9. Referral program
**Feasibility: MEDIUM — only suggestion needing genuinely new machinery.**

- Nothing exists today. MVP: referral code per customer (`Customer.referralCode`), shareable link → public landing/booking form pre-attributed (`Lead.source=REFERRAL`, `referredByCustomerId`), portal "Refer a friend" card with copy-link/share, admin view of referral leads + conversion, reward tracked manually as account credit note in v1 (no automated payouts).
- Lead pipeline + customer signup → Lead flow already exist, so attribution plumbing is cheap; the work is the public landing page + code generation + admin reporting.
- **Effort:** **~6–8 dev-days** MVP; automated rewards (invoice credits) is a later phase (+3–4d, touches finance-service).
- **Risk:** reward fulfillment policy is a business decision the client must make first (what's the incentive? both-sides? credit vs gift card?).

### S10. Should an app be made available?
**Recommendation: PWA now, native app later only if data justifies.**

- A prior architecture decision explicitly ruled out a customer mobile app (documented in PROJECT_STATUS) — customers arrive via SMS/email links, and the portal is mobile-responsive.
- **PWA path:** add manifest + service worker to the existing Vite portal → installable to home screen, web push via the existing FCM infra (filter reminders, job updates, new offers as pushes — this is the actual "stickiness" the client wants from an app). **~3–4 dev-days**, no app-store fees/review cycles, one codebase.
- **Native path (not recommended now):** Expo codebase exists (technician-app) so it's not from scratch, but it's a second frontend to maintain (~3–4 weeks) for marginal benefit over a push-enabled PWA. Revisit if portal MAU and PWA-install metrics show demand.
- Note for client response: push notifications are the real ask behind "an app," and the PWA delivers them.

---

## 2. Prioritized roadmap

Scoring = client-stated goal (return visits) vs dev-days. IoT devices page + chatbot already cover the "wow" tier.

### Phase 1 — Quick wins (~2 weeks, ≈12–14 dev-days)
| # | Item | Days | Why first |
|---|---|---|---|
| S8 | Service report in My Jobs | 3–4 | Data exists; every completed job becomes a reason to log in |
| S1+S2a | Equipment page + filter tracking + buy-link + reminder template | 5–6 | The client's flagship example, end-to-end |
| S3 | Branded announcement banner | 3 | Visible "the contractor is talking to me" signal |

### Phase 2 — Content & monetization (~2 weeks, ≈10–12 dev-days)
| # | Item | Days |
|---|---|---|
| S5+S6 | Tips/videos content feed (+seed content) | 4–5 |
| S7 | Offers/memberships/upsell surface | 4–6 |
| S4 | Equipment manuals | 2–3 |

### Phase 3 — Growth loop (~2 weeks, ≈9–12 dev-days)
| # | Item | Days |
|---|---|---|
| S9 | Referral program MVP | 6–8 |
| S10 | PWA + web push | 3–4 |

### Deferred / blocked
- **S2b Contractor Commerce API** — blocked on client obtaining partner API access. Phase A link-out ships in Phase 1.
- **Referral automated rewards** — blocked on client's incentive policy decision.
- **Native mobile app** — deferred pending PWA adoption metrics.

**Total: ≈31–38 dev-days (~6 working weeks) for everything unblocked.**

---

## 3. Cross-cutting constraints & risks

1. **Every new portal endpoint must enforce `customerId` server-side scoping** (standing rule for role=CUSTOMER) — applies to equipment, service reports, posts, offers, referrals.
2. **Email deliverability blocker still open** (custom domain SPF/DKIM for Brevo) — filter-reminder *emails* inherit it. Reminders should also surface in-portal (badge/banner) and later via PWA push, so the feature isn't hostage to the domain purchase. **Pushing the client to buy the domain unblocks both marketing and this.**
3. **Contractor content burden** — banner/tips/offers are only sticky if populated. Ship seeded defaults + make the marketing module cross-post into the portal to keep cost-of-content near zero.
4. **Technician-note privacy** — decide customer-visible vs internal notes before S8 ships.
5. **Multi-tenancy** — all new models carry `companyId`; all queries filter on it (standard).

---

## 4. Open questions for the client

1. Contractor Commerce: can you initiate the partnership/API-docs conversation? Until then we ship a "Buy replacement" link the contractor configures.
2. Referral incentive policy: what reward, who gets it, credit vs gift card?
3. Service reports: are technician notes customer-appropriate today, or do we add a separate customer-facing summary field?
4. Priority confirmation: we propose Service Reports + Equipment/Filters + Banner first — agree?
5. Custom domain purchase (already pending for marketing emails) — also needed for filter-reminder emails.

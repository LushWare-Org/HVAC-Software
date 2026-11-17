# Marketing Module — Action Plan & Summary

> Companion to `MARKETING_MODULE_SPEC.md`. This doc is the **what-can-we-actually-build, in what order, and why** view — for planning sessions, not for engineers.
> Date: 2026-05-10

---

## 1. One-paragraph summary

The Marketing Module turns the T&S CRM into a growth tool for the trade business: it uses the customer, job, equipment, and finance data we already have to send email + SMS campaigns, ask for Google reviews automatically, run referral programs, and prove ROI — in one place, with no second vendor or login. We extend the existing `comms-service` (already wired to SendGrid + Twilio + BullMQ) and add a new `marketing` Postgres schema. We match Housecall Pro and Jobber on table-stakes, then beat them on three differentiators we can uniquely build: equipment-lifecycle automations, churn-risk-driven win-back, and unified CRM ↔ Jobs ↔ Finance attribution.

---

## 2. The "why now" in three lines

- **Demos die without it.** Every US prospect compares us against HCP/Jobber on a checklist. No marketing = lost deal before the demo.
- **It's the highest-margin add-on in the category.** Jobber sells theirs at $79/mo; we can sell at $59/mo and still expand ARPU 30–60%.
- **It feeds the ML tier we already built.** Every send → click → booking is labelled training data for churn / upsell / retention bandits.

---

## 3. Master "Can-Do" list — every action, ranked

Each row is a discrete piece of work. **Priority** is `P0` = must-have for US launch demo, `P1` = first 90 days post-launch, `P2` = 6–12 months, `P3` = nice-to-have / experimental. **Effort** is rough T-shirt: S (≤1 wk), M (1–3 wks), L (3–6 wks), XL (>6 wks).

### 3.1 Foundation (must come first)

| # | Action | Priority | Effort | Why |
|---|---|---|---|---|
| F1 | Create `marketing` Postgres schema + Prisma client in comms-service | P0 | S | Nothing ships without it. |
| F2 | Wire SendGrid bulk-send API + dedicated subuser per tenant | P0 | M | Protects deliverability per tenant. |
| F3 | Twilio Messaging Service + A2P 10DLC brand/campaign onboarding flow | P0 | M | US carriers reject unregistered SMS in 2026. Hard blocker. |
| F4 | Suppression list service (per-tenant, channel-scoped) | P0 | S | CAN-SPAM + TCPA compliance. |
| F5 | Unsubscribe + click-redirect endpoints (`/m/u/:token`, `/m/r/:token`) | P0 | S | Required by every email and review link. |
| F6 | Provider webhooks (SendGrid event API + Twilio status callbacks) | P0 | S | Without these we have no opens/clicks/replies. |
| F7 | Quiet-hours + time-zone-aware send worker | P0 | S | TCPA mandates 8am–9pm local. |

### 3.2 Phase 1 — MVP for US launch (parity)

| # | Action | Priority | Effort | Why |
|---|---|---|---|---|
| C1 | Email campaign builder (MJML editor, merge tags, preview) | P0 | L | Core feature #1. |
| C2 | SMS campaign builder (plain editor, char counter, segments) | P0 | M | Core feature #2. |
| C3 | One-off + scheduled + recurring sends | P0 | M | Table-stakes. |
| C4 | "Stop-when" exit conditions (booked, replied, unsubscribed) | P0 | S | HCP shipped Feb 2026; we ship at parity. |
| C5 | Audience builder — visual filters over CRM data | P0 | L | Without this, campaigns are blasts. |
| C6 | Live audience-count preview + dedupe on save | P0 | S | UX makes or breaks the audience tool. |
| C7 | Static list import (CSV) with opt-in source capture | P0 | S | Onboarding migration from competitors. |
| C8 | Templates library — seeded per trade (HVAC/plumbing/electrical) | P0 | M | Trade owners do not write copy from scratch. |
| C9 | Custom templates (save/share within tenant) | P0 | S | Standard CRUD. |
| R1 | Auto review-request sequence (SMS day 1 + email day 3) | P0 | M | Highest-ROI marketing feature in the category. |
| R2 | Smart-gate review requests using churn/satisfaction proxy | P0 | M | Differentiator vs Jobber's "preferred client" gate. **Legal review first.** |
| R3 | Google Business Profile OAuth + review pull | P0 | M | One-way sync, daily cron. |
| R4 | Review widget (embeddable JS for tenant's website) | P0 | S | Demo-able value prop. |
| D1 | Marketing dashboard v1 — KPIs, recent campaigns | P0 | M | The slide that closes the investor demo. |
| D2 | Per-campaign drill-down (sent/delivered/opened/clicked/booked/$) | P0 | M | Standard. |
| S1 | Marketing settings page (sender ID, quiet hours, footer, GBP) | P0 | S | Plumbing. |
| S2 | DKIM/SPF auto-setup per tenant domain | P0 | M | Deliverability hygiene. |
| S3 | Right-to-delete extension to marketing tables | P0 | S | CCPA. |

### 3.3 Phase 2 — Parity++ (months 3–5)

| # | Action | Priority | Effort | Why |
|---|---|---|---|---|
| C10 | A/B testing with auto-winner | P1 | M | Marketers expect it. |
| A1 | Visual journey builder (React Flow) — trigger → wait → condition → action | P1 | XL | Headline post-launch feature. |
| A2 | Domain-event triggers wired (job.created/completed/paid, quote.sent, invoice.overdue, equipment.warranty_expiring) | P1 | M | Enables every automation. |
| A3 | Pre-built automation templates (welcome, win-back, post-job upsell, maintenance reminder) | P1 | M | First-day value for new tenants. |
| RF1 | Referral program — give-X-get-X with auto-tracked codes | P1 | L | Jobber sells this for $29/mo; full parity. |
| RF2 | Referral landing page + redemption flow | P1 | M | Required for RF1 to work. |
| RF3 | "Ask for referral" automation after job completion | P1 | S | Wire into A1 once shipped. |
| LP1 | Hosted landing pages (per-tenant subdomain) + form → Lead | P1 | L | Replaces Carrd / Unbounce for tenants. |
| LP2 | Web forms — embeddable on tenant's own site | P1 | M | Lead capture without subdomain. |
| AT1 | Attribution dashboard v2 — UTM rollup, source → revenue funnel | P1 | L | Differentiator vs HCP/Jobber. |
| AT2 | Multi-touch attribution toggle (first / last / linear) | P1 | M | Marketer table-stakes. |
| INB1 | Two-way SMS replies route into comms-service threads | P1 | M | Customers hit reply; today it goes nowhere. |

### 3.4 Phase 3 — Differentiators (months 6–12)

| # | Action | Priority | Effort | Why |
|---|---|---|---|---|
| EQ1 | Equipment-lifecycle automation pack (HVAC tune-up, replacement, warranty) | P2 | L | **No incumbent ships this at SMB price.** |
| EQ2 | Per-equipment recurring maintenance subscriptions | P2 | M | Recurring revenue lever for trade owners. |
| CH1 | Churn-risk trigger node in journey builder | P2 | M | Connects existing churn-service to marketing. |
| CH2 | Progressive-discount win-back sequence template | P2 | S | One template, big revenue. |
| AI1 | AI audience builder — natural language → SQL filters | P2 | L | "Show me HVAC customers in Phoenix, unit >7y, no plan." |
| AI2 | AI campaign copy generator — grounded on tenant's past copy | P2 | M | HCP and Jobber both have this; we match + ground. |
| AI3 | AI review-reply drafts | P2 | S | GBP review replies are tedious; auto-draft. |
| PC1 | Postcard channel via Lob — same audience builder | P2 | L | HCP differentiator we close. |
| PC2 | Postcard templates by trade | P2 | S | Required for PC1 to be usable. |
| AD1 | Google Ads + Meta Customer Match audience sync | P2 | M | Push high-LTV audiences out for lookalike acquisition. |
| GBP1 | Post promos to Google Business Profile from marketing module | P2 | M | One more reason to never leave the app. |
| REC1 | Marketing recommendations in analytics-service ("412 dormant customers, est $X win-back") | P2 | M | One-click create-campaign from a recommendation. |

### 3.5 Phase 3+ — Experimental / high-leverage bets

| # | Action | Priority | Effort | Why |
|---|---|---|---|---|
| X1 | Neighbor / route postcards (auto-mail near a tech's job site) | P3 | M | Known high-conversion play; novel for SMB FSM. |
| X2 | Weather-triggered campaigns (NOAA cold-snap / heatwave) | P3 | M | Free API; high relevance. |
| X3 | QR-coded yard signs with per-job attribution | P3 | S | Cheap, demo-able, salesy. |
| X4 | Two-way web chat widget (Podium replacement) | P3 | L | Replaces a $300/mo standalone tool. |
| X5 | Service-anniversary loyalty automations | P3 | S | Easy emotional touchpoint. |
| X6 | "Customer mobile app" push channel | P3 | XL | Depends on shipping a customer mobile app first. |
| X7 | Partner / supplier co-marketing (e.g., manufacturer rebates) | P3 | L | Adjacent revenue line; needs partner BD. |

---

## 4. Suggested launch slice (P0 only)

If we ship **only the P0 rows above**, the demo passes the HCP/Jobber checklist on day one. That's:

- Foundation: F1–F7
- Campaigns: C1–C9
- Reviews: R1–R4
- Dashboard: D1–D2
- Settings/compliance: S1–S3

**Total P0 effort:** ~14–18 engineer-weeks for one full-stack engineer + one frontend, in parallel with a half-time PM and half-time legal/compliance pass.

---

## 5. Priority + need matrix (the real decision view)

| Bucket | Need (does the demo fail without it?) | Build cost | Verdict |
|---|---|---|---|
| Foundation (F1–F7) | Yes — nothing works | Low–medium | **Do first.** |
| Campaigns (C1–C9) | Yes | High | **Do.** |
| Reviews (R1–R4) | Yes — single highest-ROI feature | Medium | **Do.** |
| Dashboard (D1–D2) | Yes — investor-facing | Medium | **Do.** |
| Automations (A1–A3) | No (one-off campaigns get us through demo) | High | **Phase 2.** |
| Referrals (RF1–RF3) | Soft yes — Jobber sells it separately | High | **Phase 2** unless investor explicitly demands. |
| Attribution v2 (AT1–AT2) | No, but it's our biggest moat | High | **Phase 2** — schedule early. |
| Equipment lifecycle (EQ1–EQ2) | No | High | **Phase 3** — but build with this in mind from day 1. |
| AI features (AI1–AI3) | No, marketing fluff buys little here | Medium | **Phase 3.** |
| Postcards (PC1–PC2) | Soft yes (HCP differentiator) | High + vendor | **Phase 3** unless we're losing deals on it. |
| Experimental (X1–X7) | No | Variable | **Optional.** |

---

## 6. Suggestions — what I'd actually do, in order

1. **Lock the legal/compliance work first.** A2P 10DLC takes 1–14 days for brand approval and is a hard blocker. Start the paperwork the day Phase 0 kicks off — engineering cannot unblock it later.
2. **Cut postcards from launch.** Lob integration adds 2 weeks and a vendor for a feature that's not on Jobber's checklist. Defer.
3. **Build the audience filter on top of a single SQL view per tenant.** Don't model filters as a separate query language; expose CRM columns + computed fields (lifetime value, last-job age, equipment age) as a flat view, then filter that. This is the difference between a 2-week and 5-week build.
4. **Ship review-requests with the smart-gate from day one — but route the gate decision through legal first.** Google's "review gating" policy is a suspension risk if phrased wrong. We're not gating who can review; we're prioritizing the order in which we ask. That distinction is load-bearing — get it on paper.
5. **Reuse the existing automation rules engine in comms-service.** Don't rebuild a new engine for marketing. Phase 1 doesn't need a graph builder; criteria-based recurring campaigns + the existing rules engine cover 90% of demos.
6. **Build the attribution joins as views early.** Even if the dashboard is Phase 2, materialize `marketing_attribution` views in Phase 1. They're the moat; don't treat them as Phase 2 polish.
7. **Pricing: launch the add-on at $59/mo flat, no à la carte.** Jobber's à la carte ($29/$29/$39) confuses buyers and caps ARPU. One SKU, one number, "everything's in."
8. **Onboarding wizard ships with the module, not later.** New tenants need to (a) verify a domain, (b) register A2P 10DLC, (c) link GBP, (d) import customers — in a 5-minute wizard. Skip this and adoption craters.
9. **Use the technician app as a marketing trigger surface.** Every "job complete" tap on a phone is the highest-intent marketing event the system has. Make sure the event payload is rich (photos, services, equipment touched) so reviews + upsells can leverage it.
10. **Track one north-star metric internally:** *jobs booked with a non-null `marketingSourceId` per tenant per month*. Everything else is vanity.

---

## 7. What I'd ask the team to decide this week

| Decision | Recommendation |
|---|---|
| Pricing model — bundle vs add-on? | **Add-on, $59/mo, single SKU.** |
| Postcards in v1? | **No — defer to Phase 3.** |
| Build vs integrate AI copy? | **Use existing LLM provider; ship grounded, not free-form.** |
| Module in comms-service vs new service? | **Module in comms-service.** Revisit only if build/test/deploy times degrade. |
| Customer-portal as marketing surface? | **Yes Phase 2** — promo banners + referral widget. |
| Smart-gate review wording — who signs off? | **Legal + product, before any code.** |
| Who owns A2P 10DLC registrations operationally? | **Ops / support.** Build the dashboard view; don't make eng do it. |

---

## 8. Cross-references

- Full design rationale, architecture, data model, APIs, compliance, sources → `docs/MARKETING_MODULE_SPEC.md`
- System overview (services, schemas, data plane) → `docs/SYSTEM_OVERVIEW.md`
- Comms-service current capabilities → `apps/comms-service/`
- Existing ML tier (churn / upsell / retention bandits) → `agent/`, `models/`

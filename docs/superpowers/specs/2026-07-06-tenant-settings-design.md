# Tenant Settings & Multi-Tenant Readiness — Design Spec

**Date:** 2026-07-06
**Status:** Approved design, pending user review of this document
**Branch:** feat/marketing (implementation branch TBD at planning time)

## Context

HomePulse (this CRM) was built for the US market. Two Sri Lankan HVAC companies — **Orrix Engineering** and **KASE Engineering** — are onboarding as tenants alongside the main US-market product. The system is already multi-tenant (`company_id` on every table; JWT carries `companyId`; portal resolves tenant at login — `VITE_COMPANY_ID` is dev-bypass only). What is missing is per-tenant **locale and capability awareness**: currency, timezone, and the ability to switch off features a tenant cannot use (Stripe is unavailable to Sri Lankan merchants; SMS delivery to +94 numbers is deferred).

Decisions already made with the user:

- **One codebase, one deployment, one DB.** Tenants are rows, never branches or forks.
- **No subdomains.** Single `homepulse.com` for the customer portal; customers are created by their company's admin, so tenant resolution happens at login. Public self-signup stays dormant (the `POST /crm/auth/register` flow remains in code, unused).
- **Settings are seed-only.** Only the vendor (us) sets currency/timezone/features, via seed script or direct DB. No admin-dashboard editing UI in this pass.
- **Full currency sweep.** All money displays in both frontends and finance-service PDFs become currency-aware. DB values stay plain decimals — display-only change, no conversion.
- **Timezone: store + customer-facing only.** Applied where customers see times (emails, SMS, PDFs, portal). Internal dashboards keep browser-local time. Analytics day-bucketing is explicitly out of scope.
- **Payments/SMS off for LK tenants** via feature flags; SMS decision can be flipped later with a DB update, no deploy.
- **Future divergence** (e.g., KASE and Orrix wanting differently structured "projects" sections) rides on this same `features` mechanism: capability-named flags select variant modules/components in the shared codebase. This spec builds the switch, not the variants.

## 1. Data model (crm-service)

Add to `Company` in `apps/crm-service/prisma/schema.prisma`:

```prisma
currency  String @default("USD")                 // ISO 4217: "USD" | "LKR" (open set)
timezone  String @default("America/New_York")    // IANA zone name
features  Json   @default("{}")                  // capability flags, see semantics below
```

**Migration:** manual SQL on Supabase (NEVER `prisma migrate dev` — known drift/reset trap), then `prisma generate`:

```sql
ALTER TABLE crm.companies
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS "features" JSONB NOT NULL DEFAULT '{}';
```

**Feature-flag semantics — missing key = enabled.** `features: {}` means everything on; existing tenants and the demo tenant need no data change. Recognized keys in this pass:

| Key | Type | Off means |
|---|---|---|
| `onlinePayments` | boolean | Portal hides Pay button; finance-service rejects payment-intent calls with 403 |
| `sms` | boolean | comms-service skips SMS enqueue (email still sends) |

Helper (shared, in `packages/types`): `isFeatureEnabled(features: unknown, key: string): boolean` → `features?.[key] !== false`. All consumers use this helper; nobody reads the JSON directly.

## 2. Settings API

### `GET /crm/company/settings` (new)

- Auth: any authenticated role including `customer`; also honors dev bypass headers. Company resolved from JWT (`AuthUser.companyId`) — never from a query param.
- Response:

```json
{
  "id": "co-...",
  "name": "KASE Engineering",
  "logoUrl": "https://.../logo.png",
  "currency": "LKR",
  "timezone": "Asia/Colombo",
  "features": { "onlinePayments": false, "sms": false }
}
```

- This is the single settings read surface for: admin dashboard, customer portal, and sibling services (via service-to-service call, below).

### `PATCH /crm/company` (existing)

- Deliberately does **not** accept `currency` / `timezone` / `features`: these keys stay out of the DTO, and with `whitelist: true` + `forbidNonWhitelisted: true` on this route a request containing them gets a 400 (explicit rejection beats silent stripping). Seed-only control.

### Cross-service settings client

finance-service and comms-service (NestJS) get a small `CompanySettingsClient`:

- `getSettings(companyId): Promise<CompanySettings>` — calls `GET {CRM_SERVICE_URL}/company/settings` with service auth (existing SERVICE_JWT / bypass-header pattern already used by comms→crm for avatar lookup).
- In-memory cache, 5-minute TTL, per companyId.
- **Failure default:** on error/timeout, return `{ currency: "USD", timezone: "America/New_York", features: {} }` (all-on) and log a warning. A crm blip must never block invoicing or notifications for US tenants. (Consequence accepted: during a blip an LK tenant's gate could briefly open; server-side money display might show $ — tolerable.)

Env needed: `CRM_SERVICE_URL` already exists for comms; add for finance if missing.

## 3. Currency-aware formatting

### Frontends (admin-dashboard + customer-portal)

- New `CompanyContext` (or extension of existing auth/profile context) loads `GET /crm/company/settings` once post-login; exposes `{ currency, timezone, name, logoUrl, features }`. Cached in memory for the session; refetch on login.
- `lib/format.ts` in each app gains:

```ts
formatMoney(amount: number | string, opts?: { compact?: boolean }): string
// Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
// LKR → "Rs 125,000.00"; USD → "$1,250.00". Number() wrap for Decimal-as-string inputs.
```

- Because `format.ts` exports plain functions (not hooks), the module holds a settable module-level currency: `setActiveCurrency(code)` called by CompanyContext on load; `formatMoney` reads it (default `USD`). This avoids threading a hook through ~60 call sites and dozens of non-component helpers (PDF generators, chart formatters).
- `formatDollars`, `formatRevenueK`, `dollarsToK` become thin wrappers over `formatMoney` (kept for back-compat; new code uses `formatMoney`).
- **Sweep:** replace all hardcoded money renderings — `$${x.toFixed(2)}`, `` `$${...}` ``, `>${amount}` patterns — in:
  - customer-portal pages/components (~60 spots incl. `lib/serviceReportPdf.ts`)
  - admin-dashboard money displays (dashboards, finance pages, job modals, marketing, analytics KPI tiles/charts)
- Non-money `$` (template literals, CSS) untouched — sweep is by manual review of grep hits, not blind regex.

### finance-service PDFs

- `PdfService` invoice/quote templates receive `currency` (from `CompanySettingsClient`) and format money via the same `Intl.NumberFormat` call server-side. Dates in PDFs format with company `timezone`.

## 4. Portal post-login branding

- Portal header + dashboard greeting show the tenant's `name` and `logoUrl` from CompanyContext. Fallback when `logoUrl` null: current HomePulse mark. A small "Powered by HomePulse" stays in the footer.
- Login/reset screens remain HomePulse-branded (tenant unknown pre-login; single domain by decision).

## 5. Payments off-switch

- **Portal:** `isFeatureEnabled(features, 'onlinePayments') === false` →
  - Invoice list/detail hide the Pay button.
  - Invoice detail shows a static note: "Online payment isn't available. Please pay by bank transfer or contact us — your invoice reference is #\<number\>." (copy finalized at implementation; lives with the invoice detail component).
- **Server (defense in depth):** finance-service payment-intent/checkout endpoints look up settings; flag off → `403 { message: "Online payments are not enabled for this company" }`.
- Admin record-manual-payment flow untouched — that is the LK payment path.
- Stripe-unconfigured graceful fallback in `PayInvoiceModal` remains for tenants with the flag **on** but Stripe absent (dev).

## 6. SMS switch

- Single choke point in comms-service at SMS enqueue (the shared path used by en-route notifications, marketing campaigns, reminders, automation rules): before queueing an SMS job, check `isFeatureEnabled(features, 'sms')`. Off → skip enqueue, log `[sms-disabled] companyId=... skipped sms to=...`, continue with email leg unaffected.
- No UI change in this pass (admins of flagged-off tenants may still see SMS options; messages are silently skipped server-side and logged — acceptable for now, noted as follow-up polish).

## 7. Timezone — customer-facing application

Applied wherever the **customer** sees a server-generated or UTC-instant time:

- comms-service en-route notification email/SMS: ETA window + times formatted with company timezone (`Intl.DateTimeFormat('en', { timeZone })`).
- Booking/job confirmation emails and any dated email templates rendered server-side.
- finance-service PDF dates (issue date, due date).
- Customer portal: date/time displays that render UTC instants use company timezone from CompanyContext (a `formatDate`/`formatDateTime` helper mirroring the money approach).

Explicitly **out of scope:** analytics SQL day-bucketing, dispatch board, scheduler internals, admin dashboard timestamps (staff browsers are already in tenant-local time).

## 8. Tenant onboarding seed script

`scripts/seed-tenant.ts` (run with `pnpm tsx`, uses crm Prisma client + direct DB URL):

- Input: small per-tenant config object (inline in script or JSON file):

```ts
{
  name: "KASE Engineering",
  email: "admin@kase.lk",
  country: "LK",
  currency: "LKR",
  timezone: "Asia/Colombo",
  features: { onlinePayments: false, sms: false },
  admin: { name: "...", email: "...", tempPassword: "..." }  // mustResetPassword: true
}
```

- Creates: Company row with settings + a `company_admin` CompanyUser (hashed temp password, `mustResetPassword: true`).
- Idempotent: skips (or updates settings of) an existing company matched by email.
- Ships with KASE and Orrix example configs (placeholder emails until real ones provided).

## 9. Testing

- **crm-service:** settings endpoint returns new fields; PATCH company rejects/strips settings keys; `isFeatureEnabled` unit tests (missing key = true, false = false, garbage JSON = true).
- **finance-service:** payment-intent 403 when `onlinePayments: false`; PDF money/date formatting for LKR + Asia/Colombo; settings client cache + failure default.
- **comms-service:** SMS enqueue skipped when `sms: false`, email leg still queues; en-route email times in company timezone.
- **Frontends:** `formatMoney` unit tests (USD, LKR, string Decimal input, compact); build + `tsc -b` clean. Manual smoke: portal as demo tenant (unchanged, $) and as a seeded LKR tenant (Rs, no Pay button, tenant branding).
- Fixture pattern: tests exercise both flag-on and flag-off companies.

## 10. Out of scope (recorded so it isn't re-litigated)

- Admin UI for editing settings/flags (future).
- PayHere or any LK payment gateway integration (future, behind `paymentProvider` setting).
- Local LK SMS gateway (Notify.lk / Dialog) — the `sms` flag is the placeholder.
- Analytics timezone bucketing; full timestamp correctness.
- Public customer self-signup and its company-selection problem.
- Per-tenant variant modules (KASE vs Orrix projects structures) — enabled by `features`, designed separately when requirements arrive.
- Subdomains / custom domains / white-labeling beyond logo+name.
- Currency conversion of any kind (amounts are entered and displayed in the tenant's own currency).

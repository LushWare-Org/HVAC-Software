# Data Migration — Brainstorm & Options

> Purpose: Demo-ready migration story for HVAC businesses moving from Jobber / Housecall Pro / similar FSM systems into T&S CRM.
> Status: Brainstorm — decide approach before implementation.
> Date: 2026-05-11

---

## What needs to migrate

| Data type | In T&S | Source availability |
|---|---|---|
| Customers (name, contact, address, type, tags) | `crm.customers` | Jobber CSV ✅ / HCP CSV ✅ |
| Jobs / work order history | `jobs.jobs` | Jobber CSV ✅ / HCP CSV ✅ |
| Equipment per customer (brand, model, install date, warranty) | `crm.equipment` | Jobber: ❌ poor / HCP: ❌ poor — usually manual |
| Invoices (amount, status, line items) | `finance.invoices` | Jobber CSV ✅ / HCP CSV ✅ |
| Technicians / staff | `crm.company_users` | Jobber CSV ✅ |
| Price book (services, parts, pricing) | `jobs.price_book_items` | Jobber CSV ✅ / HCP CSV partial |
| Leads | `crm.leads` | Jobber: not tracked / HCP: basic |
| Agreements / maintenance plans | `crm.service_agreements` | Jobber: partial / HCP: partial |

**Key insight:** Equipment is the hardest data to migrate because Jobber and HCP barely track it. Most HVAC businesses keep equipment records in spreadsheets or paper. This is actually an opportunity — we help them digitize it for the first time as part of onboarding.

---

## Reality of source system exports

- **Jobber:** Settings → Data Export → downloads ZIP with separate CSVs per entity. Takes 2 minutes. No API for non-partners.
- **Housecall Pro:** Reports → Export. Similar structure, different column names.
- **ServiceTitan:** Has a real API but is enterprise-tier. Most HVAC SMBs are NOT on ServiceTitan.
- **ServiceFusion / FieldEdge:** CSV export only. Limited data quality.
- **Spreadsheets / no system:** ~30% of US trade SMBs track customers in Excel / Google Sheets. They need a direct import path too.

---

## Option 1 — Guided CSV Import Wizard (Self-Service)

**How it works:**
Business owner exports from Jobber/HCP, uploads the ZIP or individual CSVs in the admin dashboard. A step-by-step wizard auto-detects the source platform by column names, maps columns to T&S fields, shows a validation preview, then runs the import in the background via BullMQ.

**Steps in the UI:**
1. Choose source platform (Jobber / HCP / ServiceFusion / Generic CSV / Spreadsheet)
2. Upload file(s)
3. Auto-mapped column preview — owner fixes any mismatches
4. Validation report: "3 customers have no email, 12 jobs have no assigned tech — import anyway or fix first?"
5. Confirm → background import job → success summary with error log download

**What gets imported:** Customers → Jobs (linked to customers) → Invoices (linked to jobs) → Price book. Equipment gets a "manual entry" prompt after import since source data usually doesn't have it.

**Pros:**
- Business owner can do it at 11pm without calling anyone
- Scales infinitely — T&S team not in the loop
- CSV is universally available from every FSM platform
- Same wizard works for self-service AND white-glove (T&S team uploads on behalf of client)

**Cons:**
- Column mapping UI needs careful UX — non-technical owners make mistakes
- Data quality from source is unpredictable (missing phones, duplicate customers)
- No real-time sync — it's a one-time snapshot migration

**Effort:** Medium (3–4 weeks). BullMQ import worker + column mapper + validation engine + admin UI wizard.

---

## Option 2 — Direct API Pull (Source-to-Source)

**How it works:**
Business owner connects their Jobber/HCP account via OAuth inside T&S settings. T&S pulls data directly from the source API — no CSV download, no manual step.

**Pros:**
- Cleanest UX: click "Connect Jobber" → done
- Structured data (no column mapping)
- Could support ongoing sync (new jobs auto-imported) not just one-time migration

**Cons:**
- **Jobber API is gated** — requires a partner agreement with Jobber. Not available for arbitrary apps.
- **HCP API is also gated** — same situation.
- Even if we got partner access, both APIs have rate limits that make bulk historical import slow.
- Different API for every source platform — high maintenance surface.
- Most small HVAC businesses on these platforms don't have API access in their own plan tier.

**Verdict:** Not viable for demo timeline. Pursue Jobber partnership later as a premium feature ("Connect & Sync"), but don't bet the migration story on it.

---

## Option 3 — Hybrid: Guided Import + White-Glove Mode (Recommended)

**How it works:**
Build Option 1 (guided CSV wizard) as the foundation. Add a "white-glove mode" flag that T&S staff can activate via a separate internal admin panel — this gives them extra controls: bulk customer deduplication, import from multiple files at once, rollback capability, and an import audit log per company.

For equipment data specifically — which rarely exists in any export — ship a separate "Equipment Bulk Upload" template (a pre-formatted Excel/CSV template the business fills in for their installed equipment fleet). The T&S onboarding team helps them fill it during the kickoff call.

**Self-service path:**
Business owner uploads CSVs → wizard → done. Takes 15–20 minutes.

**White-glove path:**
T&S team logs into internal admin, selects client company, uses the same import wizard with extended controls (skip validation warnings, merge duplicate detection threshold, rollback button). Takes 30–45 minutes per client with a clean Jobber export.

**Equipment onboarding:**
Provide a downloadable Excel template with headers matching `crm.equipment` (type, brand, model, serial, install date, warranty end). Business owner or T&S team fills it in, uploads it in the same wizard. For the demo: pre-populate with 5 sample HVAC units to show the equipment marketing automations working on day 1.

**Pros:**
- One implementation, two modes of use
- Self-service covers 80% of clients; white-glove covers complex/large ones
- Equipment template bridges the gap that no competitor even attempts to fill
- No dependency on external API partnerships
- Demo-ready: show the wizard live, import a sample Jobber CSV in 2 minutes during the demo

**Cons:**
- Still a one-time snapshot — no live sync with source system
- Data cleaning still the business owner's responsibility for bad source data
- Equipment data entry still has manual steps for existing clients

---

## Recommendation: Option 3

**Why:**

1. **Practically the only feasible option for demo timeline.** API partnerships with Jobber/HCP take months and a business development relationship. CSVs are available today from every platform.

2. **It solves a real pain point competitors ignore.** HCP and Jobber's own answer to "how do I switch from the other platform" is "contact support." There is no self-service import in either product. Showing a working wizard in the demo is an immediate differentiator.

3. **The equipment template is a surprise asset.** Every HVAC business has equipment data scattered in notes and spreadsheets. Giving them a clean template + import path as part of onboarding = they immediately see value in the equipment automations we built. It creates Day 1 marketing automation activation.

4. **White-glove mode costs almost nothing extra.** The same backend import pipeline powers both modes. The only addition is a staff-facing UI with a few extra controls and a company selector.

5. **It de-risks the demo.** You can pre-load a real Jobber CSV export (download one from a demo account) and run the import live during the meeting. Takes 60 seconds. No API integration can fail because there is no API.

---

## Implementation shape (high level)

**Backend:** `ImportService` inside `crm-service`. BullMQ job `data-import` queue. Per-platform column maps (Jobber, HCP, generic). Validation layer returns structured error list. Idempotent by external ID + company_id (safe to re-import).

**Frontend:** New `/settings/import` page in admin dashboard. Step wizard (shadcn stepper). Progress via WebSocket (Socket.IO already wired). Downloadable error report CSV on completion.

**White-glove panel:** Separate route `/internal/imports` (super_admin role only). Same wizard + rollback button + company selector.

**Equipment template:** Hosted at `GET /crm/import/equipment-template.xlsx`. Pre-filled headers matching `crm.equipment`. Download link visible in the wizard after main import completes.

---

## What to show in the demo

1. Export clients + jobs CSV from a Jobber demo account (takes 2 minutes)
2. Upload in T&S → wizard auto-detects "Jobber" → maps columns → validation shows clean
3. Import runs → 3 seconds → "147 customers, 312 jobs, 89 invoices imported"
4. Open a customer → their job history is there → their equipment shows a prompt to add units
5. Upload pre-filled equipment template → 5 units imported → equipment automation templates immediately fire
6. Show marketing dashboard: "You have 5 customers with HVAC units over 7 years old — start an automation?"

That's the 5-minute demo that closes the migration objection.

---

## Open decisions before implementation

| Decision | Options | Recommendation |
|---|---|---|
| Import scope for v1 | Customers + Jobs only vs. + Invoices + Price book | Customers + Jobs + Equipment template. Invoices add complexity without demo value. |
| Duplicate handling | Skip / overwrite / merge | Skip duplicates (matched on email + companyId) with a "X skipped as duplicates" count |
| Rollback | Full rollback vs. no rollback | Flag-based soft delete (`importBatchId`) so rollback is `DELETE WHERE importBatchId = X` |
| Source platforms for v1 | Jobber only vs. Jobber + HCP + generic | Jobber + generic CSV. HCP columns are similar enough to map. |

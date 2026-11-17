# Tenant Document Templates — Letterhead & Footer for Invoices, Quotes, Agreements

Date: 2026-07-22
Status: Approved (pending user review of this file)
Related: `apps/finance-service/src/pdf/pdf.service.ts`, `apps/crm-service/src/company/*`, `apps/crm-service/src/agreements/*`

## Problem

Invoice/quote PDFs render through one hardcoded HTML/CSS template
(`finance-service/src/pdf/templates/{invoice,quote}.hbs`). Two concrete problems, one
missing feature:

1. **Bug**: `companyName`/`companyAddress` passed into `PdfService.generateInvoicePdf`/
   `generateQuotePdf` come from **global env vars** (`COMPANY_NAME`, `COMPANY_ADDRESS`) —
   see `invoices.controller.ts:185-186`, `quotes.controller.ts` (same lines) — not from
   the tenant's own `Company` row. Every tenant's PDFs currently show the same name/address.
2. **Unused field**: `Company.logoUrl` exists in the schema but no PDF ever reads it.
3. **Missing feature**: Agreements have no PDF generation at all. `ServiceAgreement.documentUrl`
   ("S3 key for signed PDF") and `signedAt`/`signedByName` exist but nothing populates them.

## Goal

Let each company (tenant) design its own letterhead + footer for Invoices, Quotes, and
Agreements, two ways:

- **Builder mode**: structured fields (logo, accent color, header/footer text blocks,
  bank details, terms) rendered into the existing fixed body layout.
- **Letterhead mode**: upload an image or PDF of an existing pre-printed letterhead; it
  becomes a background "stationery" layer behind the system-rendered dynamic content,
  inside a defined safe margin — the same mental model as printing on physical letterhead
  paper.

Each document type supports **multiple named templates**, one of which is the default;
a template picker appears when creating that document. All template management lives in
one place: a new "Document Templates" tab inside Finance, covering Invoices, Quotes,
*and* Agreements (even though agreements are a crm-service concept).

## Architecture

### Why the template model lives in crm-service

Tenant-wide config already lives in crm-service (`Company`, `CompanySettings` at
`GET /company/settings`). `DocumentTemplate` is the same category of thing — one more
piece of per-tenant config — so it lives there too, with finance-service reading it the
same way it already reads `CompanySettings`: through a small typed client
(`CompanySettingsClient` is the existing precedent — `apps/finance-service/src/company-settings/company-settings.client.ts`).

### Why agreement PDFs render through finance-service, not a new Chromium in crm-service

`PdfService` (finance-service) keeps a **singleton Chromium instance with bounded
concurrency** (`PDF_MAX_CONCURRENT`) specifically to avoid the cold-start cost of
launching a browser per request — `CLAUDE.md` calls this out explicitly as an
anti-pattern to never reintroduce. Agreements live in crm-service, which has no
Chromium pool today. Rather than stand up a second one (double the memory footprint,
double the ops surface), crm-service sends the render context to a **new generic
finance-service endpoint** and gets a PDF buffer back. One shared renderer for the whole
platform.

```
crm-service (AgreementsService)
  → builds { documentType: 'AGREEMENT', companyId, context: {...agreement fields...} }
  → POST finance-service /internal/documents/render   (service-to-service auth, same
                                                         pattern as CompanySettingsClient's
                                                         authHeaders())
finance-service (DocumentRenderController)
  → fetches the active/requested DocumentTemplate + CompanySettings for companyId
  → picks the HBS template for documentType, renders HTML, converts via existing
    PdfService.htmlToPdf() (same Chromium singleton invoices/quotes already use)
  → returns the PDF buffer
crm-service
  → uploads the buffer to StorageService, sets ServiceAgreement.documentUrl
  → returns/streams it to the caller (download) or hands it to comms-service (email)
```

Invoices/quotes don't need this round-trip — they already run inside finance-service —
but they gain the same template-driven rendering path instead of the hardcoded HBS
context they use today.

### Data model — `DocumentTemplate` (new, `crm` schema)

```prisma
model DocumentTemplate {
  id          String   @id @default(uuid())
  companyId   String
  documentType String  // INVOICE | QUOTE | AGREEMENT
  name        String   // "Formal", "Friendly", etc. — admin-chosen label
  isDefault   Boolean  @default(false)
  mode        String   // BUILDER | LETTERHEAD

  // ── Builder mode fields (null/ignored when mode = LETTERHEAD) ──
  logoUrl       String?
  logoPosition  String?  // LEFT | CENTER | RIGHT
  accentColor   String?  // hex, e.g. "#0f172a"
  headerText    String?  // free text under/beside the logo (tagline, reg. number, etc.)
  footerText    String?  // free text (terms, disclaimer)
  bankDetails   String?  // free text, shown in the footer when present
  showPageNumbers Boolean @default(true)

  // ── Letterhead mode fields (null/ignored when mode = BUILDER) ──
  letterheadImageUrl   String?  // background stationery image, converted once at upload
  letterheadTopMarginPx    Int? // safe-zone top padding so content doesn't overlap art
  letterheadBottomMarginPx Int? // safe-zone bottom padding

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([companyId, documentType, name])
  @@index([companyId, documentType])
  @@map("document_templates")
}
```

One row per named template. `isDefault` is enforced unique-per-(companyId, documentType)
at the service layer (setting a new default clears the previous one in the same
transaction) — not a DB constraint, since "exactly one default, but zero is allowed
transiently" doesn't map cleanly to a partial unique index across all the Postgres
versions this project targets.

### Letterhead upload → background image (crm-service)

- Accepts an image (`jpg/png/webp`) directly, or a **PDF** — if a PDF is uploaded, its
  first page is rendered to a PNG once, at upload time. Headless Chromium's built-in PDF
  viewer is unreliable to drive programmatically with the launch flags this repo already
  uses (`--single-process`, `--no-sandbox`) for the invoice/quote renderer, so this does
  **not** reuse Puppeteer — it uses `pdf-to-img` (pure JS, wraps `pdf.js`, no native
  deps to compile, which matters since finance-service already works around a
  Chromium-binary packaging problem and a second native dependency would compound that)
  inside crm-service itself. This is a one-time conversion at upload, not a per-render
  cost, so it doesn't need finance-service's shared renderer or its concurrency limits.
- The converted image is stored via the existing `StorageService` (S3-compatible,
  already used for avatars and equipment photos) under a new `documents/` key prefix.
- `letterheadTopMarginPx`/`letterheadBottomMarginPx` default to reasonable print-safe
  values (e.g. 140px/100px at the template's render DPI) and are adjustable via two
  draggable guide-lines directly on the live preview (see UI section) — not raw number
  inputs, so admins don't need to think in pixels.

### Rendering integration — invoices & quotes

`PdfService.renderQuoteHtml`/`renderInvoiceHtml` change from **fixed HBS templates** to
**template-driven** ones:

- `companyName`/`companyAddress` come from `CompanySettings` (fixing the tenant-scoping
  bug), never from env vars. The env vars become the fallback *only* when no `Company`
  row resolves (defensive, matches the existing fail-open pattern in
  `CompanySettingsClient`).
- The existing `.hero` (header) and a new `.doc-footer` region become **partial**
  templates selected/parameterized by the active `DocumentTemplate`:
  - Builder mode → renders logo/accent color/header text/footer text/bank
    details/page numbers into the existing hero+footer HTML structure (same visual
    language, just tenant-controlled instead of hardcoded).
  - Letterhead mode → the `.hero`/`.doc-footer` regions collapse to transparent safe-zone
    spacers; `letterheadImageUrl` is set as a full-bleed `background-image` on `.sheet`,
    sized to the page.
- The line-items table, totals, notes/terms body — **all untouched**. This is the part
  of the design that stays fixed per your "header/footer only" decision, so the
  extensively-tested money/date rendering logic in `renderQuoteHtml`/`renderInvoiceHtml`
  doesn't change.

### Rendering integration — agreements (net new)

New `agreement.hbs` template (finance-service, same `templates/` folder), same
header/footer mechanism as invoices/quotes, body content:

- Parties (company + customer), agreement name/description.
- Schedule: `serviceType`, `serviceInterval`, `startDate`/`endDate`, `visitsIncluded`/`visitsUsed`.
- Pricing: `billingAmount`, `billingCycle`, `nextBillingDate`.
- Terms (free text, from the agreement record — `ServiceAgreement` doesn't have a
  dedicated terms field today; reuses `description` or a new optional field, decided at
  plan time by checking what the Agreements UI already collects).
- **Signature block**: two lines ("Company Representative" / "Customer") with
  `signedByName`/`signedAt` printed if present, otherwise blank lines for a physical
  signature — no e-signature capture, per your call.

`AgreementsService` gains `generatePdf(companyId, agreementId)` → calls the new
finance-service render endpoint → uploads the result via `StorageService` (already
available in crm-service, used for equipment/avatar photos) → sets `documentUrl` →
returns the buffer. The Agreements UI gets a "Download PDF" action wired to a new
`GET /agreements/:id/pdf` endpoint, matching the existing `GET /invoices/:id/pdf` /
`GET /quotes/:id/pdf` shape.

## UI — "Document Templates" tab in Finance

`Finance.tsx`'s tab union (`'invoices' | 'quotes' | 'expenses'`) gains a 4th value,
`'templates'`. This tab has three sub-sections (segmented control, not nested tabs, to
keep it one screen): **Invoices**, **Quotes**, **Agreements**.

Each sub-section:

- A card grid of that document type's named templates. Each card: name, a small
  thumbnail preview (rendered once server-side on save, cached — not re-rendered on
  every list view), a "Default" badge on the current default, and a kebab menu
  (Set default / Duplicate / Delete — delete blocked if it's the last template or the
  current default without another to fall back to).
- "New template" opens the editor.

### Template editor — split screen, live preview

- **Left panel**: mode toggle (Builder / Letterhead upload) at the top, everything below
  it changes based on mode.
  - *Builder*: logo dropzone + position radio, accent color swatch picker, header text
    field, footer text field, bank details textarea, page-numbers toggle.
  - *Letterhead*: image/PDF dropzone. After upload, the right-panel preview shows the
    converted image with **two draggable horizontal guide lines** (top/bottom safe
    zone) directly overlaid on the preview — dragging them updates
    `letterheadTopMarginPx`/`letterheadBottomMarginPx` live. This is the one place a
    literal "drag it" interaction is worth its complexity: it's the only way to set a
    safe zone that actually *means* something without asking the admin to guess pixel
    values against their own artwork.
- **Right panel**: live PDF-accurate preview — same HBS template + sample data
  (a fixed realistic dummy invoice/quote/agreement), re-rendered (debounced ~400ms)
  through a lightweight preview endpoint that returns HTML directly (not a full PDF
  round-trip — same Handlebars context, rendered to an iframe) so edits feel instant;
  the "Save" action is what triggers the real PDF-accurate render used for the card
  thumbnail.
- Save/Cancel footer, name field pinned at top next to the mode toggle.

### Template picker in document creation

`AddInvoiceModal`, `AddQuoteModal`, `AgreementEditorModal` each gain a "Template"
dropdown (only shown when more than one template exists for that type — with exactly
one, it's silently used, no picker needed to avoid clutter for the common case).
Defaults to the type's default template; selection is stored on the document row itself
(`templateId` FK, nullable — null means "use whatever's default at render/download
time," so old documents don't silently break if a template is later deleted) so
reprinting an old invoice reuses the template it was created with, not whatever's
currently marked default.

## Out of scope

- No full drag-and-drop document builder (line items/totals position is fixed) — per
  your call, this is a header/footer/branding customization system, not a page-layout
  engine.
- No e-signature capture/legal e-sign integration for agreements — signature block is
  print-only, matching existing `signedByName`/`signedAt` fields.
- No attempt to parse/edit the *content* of an uploaded PDF letterhead — it's converted
  to a background image once, never re-parsed.
- No per-customer template overrides — templates are tenant-wide, picked per document at
  creation time, not per customer.

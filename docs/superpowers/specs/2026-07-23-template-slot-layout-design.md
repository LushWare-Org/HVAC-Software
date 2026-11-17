# Document Templates — Per-Component Drag/Resize/Style Layout ("Slot Layout System")

Date: 2026-07-23
Status: Approved (pending user review of this file)
Related: `apps/finance-service/src/pdf/pdf.service.ts`, `apps/finance-service/src/pdf/templates/*.hbs`,
`apps/crm-service/src/document-templates/*`, `apps/admin-dashboard/src/pages/finance/TemplateEditorModal.tsx`

## Problem

The Document Templates builder (shipped 2026-07-22, extended 2026-07-23 with company-name
override, logo upload, and a small header/footer drag-nudge) still renders each document
type through one fixed-markup `.hbs` file per type. Every visible component — the "Bill to"
card, the invoice-number/status badge, the "Balance due" card, the 4 info cards, the
"Client billing statement" tagline, the totals card, notes/terms cards, the line-items
table itself — has a hardcoded position, size, and style baked into the template's CSS.
The only customizable things today are a handful of scalar fields (logo URL, accent color,
header/footer text, bank details) and, as of the last change, a `{dx,dy}` pixel nudge on
six header/footer text elements.

The user wants every one of those named components individually selectable, freely
draggable into a new arrangement, resizable, and independently styled (font, color,
background, border) — "the whole template", not just the header/footer.

## Goal / Non-goal

**Goal**: every existing named component per document type (a fixed, known list — not
arbitrary new content) becomes a **slot** that can be:
- reordered (dragged to a new position in the document),
- arranged side-by-side with other slots (today's side-by-side layouts — Bill to +
  Balance due, the 4 info cards — must remain achievable, not forced into a single
  column),
- resized (width, within its row),
- restyled independently (font family/size/weight/color/alignment for text slots;
  background/border color/corner radius/padding for box slots).

**Non-goals** (explicitly out of scope, confirmed with the user):
- Adding, removing, or redefining *what* content a slot shows (no free-text authoring,
  no new component types).
- True absolute x/y canvas positioning of variable-length content (the line-items table,
  notes, terms, payment history) — see "Why rows, not a free canvas" below.
- Custom/Google Fonts — font choice is a curated, PDF-safe list.
- Changing anything about LETTERHEAD mode, which is unaffected by this work.

## Why rows, not a free canvas

A real invoice has 1 line item today and might have 40 tomorrow; the notes/terms/payment-
history sections are similarly variable-length. A true free canvas (drag anything to any
x/y pixel, resize height freely) requires the admin to size a box against a *sample*
preview — that box's height is then wrong for any real document whose content doesn't
match the sample, producing overflow or clipped PDFs. This was flagged to the user
directly and they chose the safer model:

The document is **rows stacked vertically, each row auto-height** (driven by whatever
content is inside it — never fixed). Each row holds **one or more blocks side-by-side**;
you can drag a block to reorder it within its row, drag it to a different row, or resize
its width (as a percentage of the row). A row containing the line-items table simply
grows to whatever height today's real data needs — nothing above or below it moves
incorrectly, nothing clips.

## Data model

Replaces the ad hoc `layout: {field: {dx,dy}}` column added earlier this session (that
migration is superseded — see Migration section) with a structured `rows` column on
`DocumentTemplate`:

```ts
interface TemplateRow {
  id: string;               // stable id, generated client-side (uuid) so drag reordering has stable keys
  blocks: TemplateBlock[];
}

interface TemplateBlock {
  id: string;
  slot: SlotKey;             // which fixed component this block renders — see Slot Registry
  widthPct: number;          // 1-100, share of the row's width
  style?: TextStyle | BoxStyle;  // shape depends on the slot's kind (see below)
}

// Text-kind slots (Bill to, Balance due, tagline, invoice number, labels, footer text, bank details text, …)
interface TextStyle {
  fontFamily?: string;   // one of a curated PDF-safe list (see Font list)
  fontSize?: number;     // px
  fontWeight?: 400 | 600 | 700 | 800;
  color?: string;        // hex
  align?: 'left' | 'center' | 'right';
}

// Box-kind slots (any card-shaped slot: Bill to card, Balance due card, info cards, totals card, notes/terms/payment cards)
interface BoxStyle {
  background?: string;
  borderColor?: string;
  borderRadiusPx?: number;
  paddingPx?: number;
}
```

`rows: TemplateRow[] | null` on `DocumentTemplate` (Prisma `Json?`). `null` (the default,
and the value for every template created before this feature) means "use the built-in
default arrangement for this document type" — full backward compatibility, no forced
migration of existing templates.

### Font list (curated, PDF-safe)

Puppeteer/Chromium can render any font actually installed on the box it runs on or
embedded as `@font-face`; to avoid a new failure mode (missing font silently falling back)
the picker offers a fixed list of 6 that are either web-safe or already used in the
existing templates: `Helvetica Neue / Arial` (current default), `Georgia`, `Times New
Roman`, `Courier New`, `Verdana`, `Trebuchet MS`. No free-text entry, no Google Fonts.

## Slot Registry

A fixed, per-document-type list of `SlotKey`s, each mapped to a Handlebars partial that
renders it (reusing today's existing markup/CSS almost verbatim — this is a
re-architecture of *layout*, not a redesign of what each component looks like) and a
`kind` (`text` | `box`) that determines which style shape applies:

**INVOICE**: `logo`, `companyName`, `companyAddress`, `tagline` ("Client billing
statement"), `docBadge` (invoice number + status pill), `billTo` (card), `balanceDueCard`,
`infoGrid` (the 4 date/reference cards, as one slot — the 4 sub-cards are not
independently draggable, only the group is, to keep scope bounded), `lineItemsTable`,
`totalsCard`, `paymentHistory`, `notesCard`, `termsCard`, `bankDetailsCard`,
`footerText`, `pageFooterMeta` (the "Generated {{date}}" line).

**QUOTE**: same shape, swapping `balanceDueCard` → `quotedTotalCard`, no
`paymentHistory`.

**AGREEMENT**: `logo`, `companyName`, `companyAddress`, `tagline`, `docBadge`,
`partiesSection`, `scheduleSection`, `pricingSection`, `notesSection`,
`bankDetailsSection`, `signatureBlock`, `footerText`.

Each document type's default `rows` (used whenever a template's `rows` is `null`)
reproduces today's exact layout, so nothing visually changes until an admin actually
drags something.

## Rendering architecture

Each document type gets **one generic layout `.hbs`** (`invoice-layout.hbs`,
`quote-layout.hbs`, `agreement-layout.hbs`) replacing the current fixed-body markup in
`invoice.hbs`/`quote.hbs`/`agreement.hbs` (the `<head>` styles, letterhead-mode branch,
and the LETTERHEAD-mode markup are untouched — only the BUILDER-mode body becomes
data-driven). The layout template loops:

```hbs
{{#each rows}}
<div class="tpl-row">
  {{#each blocks}}
  <div class="tpl-block" style="width:{{widthPct}}%" data-block-id="{{id}}" data-slot="{{slot}}">
    {{> (lookup this "slot") }}
  </div>
  {{/each}}
</div>
{{/each}}
```

using Handlebars' dynamic partial lookup (`{{> (lookup this "slot") }}`), with one partial
registered per `SlotKey` (e.g. `partials/slot-billTo.hbs`). `PdfService` resolves
`template.rows ?? DEFAULT_ROWS[documentType]` before rendering, and continues building the
same flat context object it does today (quote/invoice/agreement fields, `template.*`
scalars) — partials consume that same context, so most of today's Handlebars expressions
inside each component move into their partial file unchanged.

Per-block style is applied via an inline `style` attribute built by a small
`blockStyle` Handlebars helper (same pattern as the existing `layoutTransform` helper) —
translates a `TextStyle`/`BoxStyle` object into a CSS string.

## Frontend interaction

Replaces `TemplateEditorModal`'s current flat left-hand form (for BUILDER mode only —
LETTERHEAD mode's existing safe-zone-slider UI is untouched) with:

- **Selection**: clicking a block (inside the preview iframe, same `data-block-id`
  mechanism already used for the header/footer click-to-focus) opens a right-hand style
  sidebar scoped to that block's `kind` (text controls or box controls, per the Data
  model section).
- **Reordering**: dragging a block within its row reorders it; dragging it to another
  row's drop zone (or the gap between two rows, which creates a new row) moves it there.
  Implemented as vanilla pointer-event drag tracking inside the iframe script (extending
  today's `PREVIEW_INTERACTIVITY_SCRIPT`), computing the nearest valid drop target and
  posting the resulting `rows` array back to the parent on drop — same "compute inside
  the iframe, only commit on release" approach already used for the header/footer nudge,
  so dragging still feels instant with no round-trip lag mid-drag.
- **Resizing**: a drag handle on a block's right edge adjusts `widthPct`, clamped so a
  row's blocks always sum to 100%.
- The existing "Reset positions" affordance becomes "Reset layout" (clears `rows` back to
  `null`, reverting to the default arrangement).

## Migration

The `layout: Json?` column added earlier today (`20260723010000_add_document_template_layout`)
is superseded by `rows`. Since no template has real production data yet (this whole
Document Templates feature, including today's `layout` column, hasn't been deployed), the
plan is to **rename** rather than add a second column: `layout` → `rows` via a follow-up
migration, and delete the now-dead `layoutTransform`/`layoutData` Handlebars helpers and
the six inline `style="{{layoutTransform ...}}"` attributes added to `quote.hbs`/
`invoice.hbs`/`agreement.hbs` earlier today, since the generic layout template replaces
that mechanism entirely.

## Testing strategy

- `pdf.service.spec.ts`: default `rows` (null) renders identically to today's fixed
  layout (backward-compat regression test); a custom `rows` array renders blocks in the
  given order/widths; per-block `TextStyle`/`BoxStyle` produce the expected inline CSS;
  a row containing `lineItemsTable` with a 20-item quote still renders complete (no
  truncation) — the concrete regression test for the "why rows, not a canvas" decision.
- `document-templates.service.spec.ts`: `rows` persists through create/update, same
  pattern as existing scalar fields.
- Admin-dashboard: manual verification (documented, not automated — no test/type-check
  script runs headless browser interaction) that drag-reorder, drag-resize, and the style
  sidebar produce the expected `rows` structure and matching preview.

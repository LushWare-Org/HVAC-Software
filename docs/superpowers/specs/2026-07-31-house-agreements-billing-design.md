# Housing Scheme — per-house agreements, quotes, and invoices

Date: 2026-07-31
Status: Approved
Related: docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md, docs/superpowers/specs/2026-07-22-projects-housing-equipment-scan-design.md

## Summary

Every house (and its owner) in a Housing Scheme project can now have its own Agreements, Quotes, and Invoices — not just Jobs, which already supported this via `Job.houseId`. Same pattern, applied to the other three document types:

- `ServiceAgreement.houseId`, `Quote.houseId`, `Invoice.houseId` — nullable, no FK (cross-service/cross-schema refs, same convention as `projectId`).
- A document's `customerId` may be the project's own top-level customer (e.g. the developer) rather than the individual house owner — exactly the same mismatch already solved for jobs. House ownership, not a `customerId` match, is what authorizes a homeowner to see their own house's documents.
- Creating a document with `houseId` set but no `projectId` auto-backfills `projectId` from the house, so it isn't invisible in the project's own tabs — same fix as jobs.

## Backend

- **crm-service (agreements)**: same service that owns houses, so no cross-service HTTP call is needed — `AgreementsService` queries `prisma.house` directly to validate ownership / backfill `projectId`. `findMine` (customer portal) drops the `customerId` filter when a `houseId` is supplied and owned by the caller, mirroring `jobs.controller.ts`.
- **finance-service (quotes/invoices)**: new `CrmClient` (mirrors job-service's) for the cross-service house/project lookups it needs, since finance-service has no direct DB access to the crm schema.
- **Real gap found and fixed while touching this code**: `quotes.controller.ts`/`invoices.controller.ts`'s list endpoints had **no server-side `customerId` enforcement at all** for the CUSTOMER role — any customer JWT could pass an arbitrary `?customerId=` and see another customer's quotes/invoices. Fixed to force-filter to the caller's own `customerId` (with the house-ownership carve-out), matching how jobs already worked.

## Frontend

- Admin: House detail modal gains Agreements + Billing tabs (Add Agreement / Add Quote / Add Invoice, each carrying `houseId`). Project's own Agreements/Finances tabs and the standalone `/agreements` and `/finance` pages show house/owner context per row, same treatment as the Jobs page got.
- Customer portal: My House gains Agreements + Billing sections. `useMyAgreements`/`useMyFinance` gain `houseId`. Agreements/Quotes/Invoices pages show house/project context per row.
- Document template selection (already existing at creation time for all three types) is unaffected — `templateId` and `houseId` are independent fields on the same create payload.

## Out of scope

- No change to the existing PDF template *content* — a house-linked document renders with whatever template was chosen at creation, same as before.
- No bulk "generate for every house" action — each agreement/quote/invoice is still created one at a time, same as houses' equipment/jobs today.

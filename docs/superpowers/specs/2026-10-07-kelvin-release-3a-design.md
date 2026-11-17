# Kelvin release 3a: office actions

Date: 2026-10-07. Design agreed in conversation; the user waived the separate spec review ("go to the plan and start implementation").

## Intent
Office staff can run the normal money and customer path by talking to Kelvin: new customer → job → quote → invoice → payment. Multi-step requests become one plan card. Reversible changes can be undone for 10 minutes. Release 3 continues with 3b (bulk work) and 3c (smarter Kelvin), each with its own spec.

## Decisions (from the user)
- **One card per plan.** Each step has a tick box; one Confirm runs the ticked steps in order. Anything sent to a customer is marked ✉ on its step.
- **Undo for 10 minutes, for truly reversible changes only.** Sent items cannot be unsent; they offer "send a correction" instead.
- **Prices come only from the price book.** A missing item makes Kelvin ask for a price; he never invents one.
- **Built as one plan of steps.** A new `propose_plan` action; steps are existing actions; later steps can refer to what earlier steps create.

## Defaults set by me (not objected to)
- **Payments:** only recorded ones (cash, bank transfer as ACH, cheque as CHECK, card at a terminal as CARD, OTHER). Partial payments allowed; no overpayment. Kelvin never charges a card.
- **Roles:** money steps (quotes, invoices, payments) for super_admin, company_admin and office_manager. Job and customer steps for all office roles including dispatcher. Roles are checked at preview and again at confirm.
- **"Plan before big jobs":** any request with more than 3 changes shows a plan card first. In 3a every multi-change request is one plan card anyway.

## Findings that shaped the design
- **Recording a payment emails the receipt immediately** (finance-service `recordManualPayment` sends the receipt fire-and-forget), and there is no payment-reversal endpoint. So `record_payment` is marked ✉ ("receipt will be emailed") and is **not undoable in 3a**. Its card says so.
- **Agreement visits** have no booking endpoint. Booking the next visit is `create_job` with `agreementId` and `isAgreementJob`, at a real open time, with an optional technician.
- **Customer "removal" on undo** is `PUT /customers/:id { isActive: false }`, refused if a job, quote or invoice exists for them.
- **Quote draft removal** is `DELETE /quotes/:id`; only drafts can be deleted.
- **Invoice reversal** is `PATCH /invoices/:id/void`, refused once paid.
- **Unassigning is not undoable in 3a.** Cancelling an assignment leaves the job's assignedToId/crewUserIds set, and the crew editor rejects an empty crew. The card says to change it from Scheduling.

## Architecture
### Plan engine (chat-service, `src/agent/plan/`)
**Step:** `{ tool, args, title?, dependsOn: number[] }`. Any string argument may be a reference `"@N.field"` to step N's result (1-based). The fields are `customerId`, `jobId`, `quoteId`, `invoiceId`, and also `customerName` and `customerEmail`.

**`propose_plan` (write tool, admin bot, office roles).** Arguments: `{ summary, steps: [{ tool, args }] }`, with 1 to 25 steps, at most one `create_customer`, and references only to earlier steps.

**Preview:** for each step, in order:
1. Find the tool for the caller's role; refuse money tools for a dispatcher.
2. Resolve references against earlier previews' `provides` (a would-be record such as `{ customerId: '@1', customerName: 'R&R Brothers', … }`). Tools accept a pending id (`@N`) by reading the pending record from `PlanScope`.
3. Run the tool's own preview.

Any refusal stops the whole preview with `Step N: <reason>`. On success the result is one signed action `{ tool: 'propose_plan', args: { steps: [...resolved args, with dependsOn] }, title, lines }`, plus a structured `steps` list for the card (title, lines, sends?, dependsOn).

**Confirm** (`POST /actions/confirm { token, skip?: number[] }`):
- The token is verified and must not have run before (run-once guard: Redis `SET NX` when `REDIS_URL` is set, otherwise an in-memory map with a 15-minute expiry).
- Skipped steps also skip every step that depends on them (computed on the server).
- Each remaining step, in order:
  1. Resolve references against actual results.
  2. Re-run the preview (state re-check).
  3. Run the step and record its result.
- On the first failure, stop. The response is `{ ok, message, steps: [{ status: 'done'|'failed'|'skipped'|'not_run', message }], undo? }`.

**A single action is a plan of one.** The existing confirm cards keep working unchanged.

**Undo:**
- After a run, each successful step's tool may return a reverse `{ tool, args, title }` built from its args and result. Reverses are listed in reverse order.
- If there is at least one reverse, the server signs an undo token: a normal `propose_plan` token whose steps are the reverses, valid 10 minutes, for this person and company.
- Steps that sent something are listed under "Can't be unsent".
- The panel shows "Undo (m:ss)". Pressing it, or typing "undo"/"undo that" while a live undo exists, shows the undo token's card **without calling the model**. Confirming runs it through the same confirm path, so each reverse re-checks state in its own preview.

**Internal reverse tools** (not offered to the model; `internal: true`):

| Tool | Action | Refused when |
|---|---|---|
| `hide_customer` | sets isActive false | any job, quote or invoice exists for the customer |
| `restore_customer_details` | puts the old values back | — |
| `delete_draft_quote` | deletes the draft quote | the quote is no longer a draft |
| `void_new_invoice` | voids the invoice | any amount has been paid |
| `reschedule_job` | moves it back to the old start and end | (existing tool) |
| `cancel_job` | "Undone by <name>" | (existing tool, used for create_job) |

### New tools (chat-service)
**Read:**
- `search_price_book`
- `find_quotes` (by number or customer, by status)
- `find_agreements_due` (next service date within N days)
- `customer_balance` (open invoices and the total owed)
- `customer_history` (recent jobs, quotes, invoices)

**Write** (each with `sends`, `provides`, `reverse` where it applies):

| Tool | Behaviour | Undo |
|---|---|---|
| `create_customer` | Duplicate check by phone/email/name first; refuses with "already exists: X" so Kelvin offers to use it | `hide_customer` |
| `update_customer` | phone, email, address, city; the card shows old → new | `restore_customer_details` |
| `create_quote` | Lines are price-book item ids with quantities, or `{ description, quantity, unitPrice }` only when the person gave the price. Tax and currency from company settings; linked to the job if one is given; created as DRAFT | `delete_draft_quote` |
| `send_quote` | ✉ sends to the customer's email | none (sent) |
| `convert_quote` | ACCEPTED quotes only | `void_new_invoice` |
| `create_invoice` | For a job; lines from the job's quote if any, else price-book lines as above | `void_new_invoice` |
| `record_payment` | Amount up to the balance due; method enum; ✉ "receipt will be emailed" | none |
| `create_job` (extended) | Accepts a pending customer from the plan; new optional `agreementId` | `cancel_job` |
| `reschedule_job` (extended) | | moves it back |
| `assign_technician` | | none in 3a (see findings) |

### Dashboard
- **Plan card:** the ordered steps with tick boxes; ✉ marks; dependents are unticked automatically; Confirm sends `skip`; per-step progress ✓/✕/not run with the reason; **Retry from here** asks Kelvin for the remaining steps; **Undo** with a live countdown; a "Can't be unsent" note listing sent steps.
- **Typing "undo"** uses the live undo token locally.
- **Kelvin's log:** the plan is logged as one line ("Created R&R Brothers, JOB-0452 with Kasun") with its steps.

## Errors
- Stop on the first failure; earlier steps stay done.
- Double confirm → "Already done".
- State changed since preview → that step's re-check refuses with its reason.
- Model down → existing cards can still be confirmed.
- Undo expired → the button disappears and typed "undo" explains the 10-minute limit.

## Testing
- **Plan engine:**
  - references
  - pending previews
  - skip with dependents
  - stop on failure
  - run once
  - re-check before running
  - limits
  - roles at preview and at confirm
  - undo token in reverse order, and refusal when state moved on
- **Each tool:** preview, run and reverse, including duplicate customers, missing prices, overpayment, converting a quote that is not accepted, and voiding a paid invoice.
- **Evals** (blocked on OpenAI credits): customer → job → assign; a quote with a missing price; "they paid 480 cash"; refusal to invent a price.
- **Screenshots:** the plan card's states in all themes and widths.

## Rollout
Same `features.kelvin` switch; new money tools carry `kelvinOnly`. No database changes. Local first; deploy only on "deploy".

# Kelvin release 3a — Implementation Plan

> Executed inline (native), task by task, under test-driven development. At the user's request ("go to the plan and start implementation") this plan names exact interfaces and test cases per task; the code is written test-first during execution, not pre-written here.

**Goal:** Kelvin runs multi-step office work as one confirmed plan (customers, quotes, invoices, payments, agreement visits) with 10-minute undo.
**Spec:** `docs/superpowers/specs/2026-10-07-kelvin-release-3a-design.md`

## Global constraints
- Writes happen only through signed, confirmed actions. Every step runs with the caller's JWT.
- Money tools: roles super_admin, company_admin, office_manager. Re-checked at confirm.
- Prices come only from the price book or from a price the person stated.
- Plans: at most 25 steps and one `create_customer`. References only point to earlier steps.
- Undo token valid 10 minutes; sent steps are never reversible.
- No database migrations.
- Repo rules: never commit without being asked, never deploy without "deploy", pnpm only.

## Tasks

### Task 1: plan types and reference resolution (chat-service `src/agent/plan/refs.ts`)
- **Produces:**
  - `isRef(v: unknown): v is string` (pattern `^@\d+(\.\w+)?$`)
  - `refsIn(args): number[]`
  - `resolveArgs(args, results: Array<Record<string, unknown>|undefined>): Record<string, any>` (throws `PlanError` for a missing step or field)
  - `dependents(steps: {dependsOn:number[]}[], skipped: number[]): Set<number>` (transitive)
- **Tests:** nested args, unknown step, a field missing in the result, transitive skip, refusing a forward reference.

### Task 2: AgentTool extensions and PlanScope (`src/agent/types.ts`)
- **Adds:**
  - `internal?: boolean` (never offered to the model)
  - `sends?: (args) => string | null`
  - `provides?: (args, preview) => Record<string, unknown>` (the would-be record for later steps)
  - `reverse?: (args, result, ctx) => { tool, args, title } | null`
  - `preview(args, ctx, http, scope?: PlanScope)` where `PlanScope = { pending(ref: string): Record<string, unknown> | undefined }`
- `registry.toolsFor` excludes `internal` from what the model sees; `findTool` can find internal tools for the plan engine.
- **Tests:** an internal tool is hidden from the model's list but found by `findTool(name, bot, role, { internal: true })`.

### Task 3: the plan engine (`src/agent/plan/plan.ts`, `propose_plan` tool)
- **Produces:**
  - `previewPlan(steps, ctx, http, bot) → { title, lines, steps: StepCard[], args }` (throws `ToolRefusal('Step N: …')`)
  - `runPlan(args, ctx, http, bot, skip) → { ok, message, steps: StepOutcome[], undo?: { token, title, lines, expiresAt }, cantUnsend: string[] }`
  - `PROPOSE_PLAN: AgentTool`
- **Tests** (with fake tools):
  - a reference to a pending customer in preview
  - a dispatcher blocked on a money step
  - more than 25 steps, or two create_customer steps, refused
  - stop on failure leaves steps marked done/failed/not_run
  - skipping a step skips its dependents
  - the re-check preview at run refuses a moved-on state
  - the undo token lists reverses in reverse order, and sent steps go to `cantUnsend`

### Task 4: confirm endpoint, run-once guard, structured card event
- `chat.controller` `POST /actions/confirm` accepts `skip?: number[]`; `action-runner.confirmAction` routes `propose_plan` to `runPlan`.
- Run-once guard: `RunOnce.claim(actionId) → boolean` (Redis `SET NX EX 900` when `REDIS_URL` is set, else an in-memory Map with expiry).
- The chat event `action` gains `steps?: StepCard[]`.
- Single-tool actions are unchanged apart from the run-once guard and the returned `undo`.
- **Tests:**
  - a second confirm says "Already done"
  - single-tool confirm still works
  - `skip` is respected
  - an ACTION_DONE log line per plan

### Task 5: reversible existing tools and internal reverse tools
- `reschedule_job.reverse` moves the job back.
- `assign_technician.reverse` → `unassign_technician` (internal):
  - PATCH assignment CANCELLED, then PATCH the job to PENDING
  - refused unless the job is PENDING/SCHEDULED
- `create_job`:
  - `provides` gives `{ jobId:'@N', jobNumber:'(new)' }`
  - accepts a pending `customerId` through the scope
  - optional `agreementId` (sets `isAgreementJob`)
  - `reverse` → `cancel_job` with reason "Undone"
- **Tests:** each reverse's args, and a refusal when the state moved on.

### Task 6: customer tools
- `create_customer`:
  - duplicate check (GET crm /customers by phone, email or name) refuses with the match
  - `provides` the pending customer
  - `reverse` → `hide_customer` (internal; refused when a job, quote or invoice exists)
- `update_customer`: the card shows old → new; `reverse` → `restore_customer_details` (internal).
- **Tests:** a duplicate, a missing name/contact, the hide refusal, restoring old values.

### Task 7: price book and quote tools
- **Read tools:** `search_price_book`, `find_quotes`.
- `create_quote`:
  - lines are `{ itemId, quantity }` or `{ description, quantity, unitPrice, statedByPerson: true }`; an unknown item id or a missing price is refused with "ask the person for a price"
  - tax and currency from company settings
  - pending customer and job references supported
  - `provides { quoteId }`; `reverse` → `delete_draft_quote` (internal, DRAFT only)
- `send_quote`: sends ✉; no reverse.
- `convert_quote`: ACCEPTED only; `provides { invoiceId }`; `reverse` → `void_new_invoice` (internal, unpaid only).
- **Tests:**
  - the price is taken from the book, never from the model's argument for a book item
  - a missing price is refused
  - totals with tax
  - a non-accepted quote is refused on convert
  - deleting a quote that is no longer a draft is refused

### Task 8: invoice and payment tools
- **Read tools:** `customer_balance`, `customer_history`.
- `create_invoice`:
  - for a job
  - lines from the job's accepted quote, or from the price book
  - `provides { invoiceId }`; `reverse` → `void_new_invoice`
- `record_payment`:
  - amount at most the balance due
  - method is one of CASH/CHECK/ACH/CARD/OTHER
  - sends ✉ "receipt will be emailed"; no reverse
- **Tests:** an overpayment refused, a partial payment allowed, sends text present, no reverse.

### Task 9: agreements
- **Read tool:** `find_agreements_due` (GET crm /agreements?status=ACTIVE, filter `nextServiceDate` within N days).
- Booking a visit goes through `create_job` with `agreementId` (Task 5).
- The prompt explains the flow.
- **Tests:** the due filter, and that the agreement id reaches the job create body.

### Task 10: prompt and registry
- Register all new tools, with `kelvinOnly` for money and customer tools.
- Prompt rules:
  - Use `propose_plan` for more than one change.
  - Use price-book items only, and ask for missing prices.
  - Never use internal tools.
- **Tests:** registry visibility per role and per Kelvin switch.

### Task 11: dashboard plan card and undo
- `chatStream` passes `steps` and sends `skip`.
- `ActionCard` renders plan steps: tick boxes, ✉ marks, unticking dependents, per-step status.
- Undo button with a countdown; "Can't be unsent" note; **Retry from here** sends "Continue from step N" with the remaining steps.
- `KelvinPanel` intercepts a typed "undo" when a live undo token exists.
- **Pure helpers with Vitest tests** in `plan.ts`:
  - `toggleStep(steps, i, on) → ticks` (dependents follow)
  - `countdown(expiresAt, now) → 'm:ss' | null`
  - `isUndoCommand(text) → boolean`

### Task 12: evals, review, screenshots
- Add eval scenarios. They can't run until OpenAI credits are added; that is recorded.
- Full test suites, screenshots of the plan card's states, and a final independent review.

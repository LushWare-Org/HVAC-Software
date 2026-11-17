# Kelvin, release 1: Kelvin arrives (admin dashboard)

Date: 2026-10-06
Status: design approved in conversation; awaiting spec review

## 1. Intent

**What the user asked for.** One named AI companion, Kelvin, present everywhere in the product, who
helps every kind of user and is credited with all AI work (morning brief, photo scan, insights,
reviews, recommendations, disruptions, freed time). He has his own section, distinctive motion, and
his ultimate capability is taking actions when asked, not only advising.

**Success.** A user's first instinct when they need something is "ask Kelvin", and he does it.
Important changes reach the user within seconds, without the user hunting for them.

**Agreed constraints.**
- The name is Kelvin for every company; it cannot be renamed per tenant.
- He always asks before he changes anything (signed confirm cards, as today).
- He is calm by default: he speaks only when something needs action, and never covers the user's work.
- Every card shows its reason from real data. The model may reword or reorder, never invent facts.
- The design must not read as generic AI: no gradients, glows, sparkles or purple.
- Nothing ships to production without an explicit "deploy".

**Programme.** Three releases, each with its own spec and plan:
1. *Kelvin arrives* (this spec): identity, presence, panel, desk, the existing brief, running-behind
   and freed-time cards become his, page awareness, and a new **create job** action. Admin dashboard only.
2. *Everything AI becomes his*: photo scan, analytics insights, reviews, lead and customer
   recommendations, marketing content; page notes on more pages.
3. *He does much more*: create customers, quotes and invoices; record payments; reminders; bulk actions.
Customer portal and technician app versions follow later.

## 2. Pieces

### Admin dashboard
| # | Piece | Responsibility |
|---|---|---|
| 1 | `KelvinFace` | The thermostat-with-eyes mark. Props: size, mood (`idle`, `thinking`, `news`, `urgent`, `pleased`, `asleep`), optional look-at target. |
| 2 | `KelvinCorner` | Fixed bottom-right. Face, ring state, speech bubble. Owns the speaking rules (section 4). |
| 3 | `KelvinPanel` | Right-side panel; the page narrows beside it (not an overlay above 1024 px; full-height sheet below). Chat, confirm cards, results. Replaces today's `ChatWidget` and talks to the same chat-service endpoints. The inner thread is a candidate for assistant-ui (a time-boxed spike decides; see section 9). |
| 4 | `KelvinNote` | A note placed inside a page. Release 1 pages: Dashboard, Jobs, Scheduling. |
| 5 | `KelvinDesk` | New sidebar page `/kelvin`: greeting, ask box with suggestions, "Needs you" and "Done today" columns. |
| 6 | `⌘K` / `Ctrl+K` | Opens the panel with focus in the ask box, from any page. |
| 7 | `useKelvinContext` | Each page declares what is on screen (page id, filter, open record id and label). Sent with chat messages. |
| 8 | `KelvinProvider` | One store: feed, seen and dismissed state, panel state, speaking queue, live-signal subscriptions. |

The Dashboard's `MorningBrief`, `RunningBehind` and `FreedTime` cards stop being separate cards.
Their content becomes Kelvin items on the desk and Kelvin notes on the Dashboard.

### Server
| # | Piece | Where | Responsibility |
|---|---|---|---|
| 9 | Kelvin feed | chat-service, `GET /chat/kelvin/feed` | Calls existing sources with the user's JWT, in parallel, and returns items in one shape (section 3). |
| 10 | Kelvin log | analytics schema, table `kelvin_events`, written from a new BullMQ queue `kelvin-events` (same pattern as `ai-usage`); read via `GET /analytics/kelvin/events` | What he told whom and what he did. |
| 11 | `create_job` tool | chat-service agent | New write tool, confirmed like the others. |
| 12 | Live signal `AVAILABILITY_CHANGED` | scheduling-service WS hub | Emitted when a technician's day is set or cleared. |
| 13 | Company switch `features.kelvin` | crm company settings | Turns Kelvin on per company. Off shows today's chat widget. |

Unchanged: `packages/ai` gateway, budgets and the AI switch, signed action tokens, the brief,
disruption and gap logic.

## 3. Data

### Kelvin item
```ts
interface KelvinItem {
  id: string                 // stable per real-world situation, e.g. "gap:<jobId>:<techId>:<date>"
  kind: 'BRIEF' | 'LATE' | 'TECH_OFF' | 'GAP' | 'EMERGENCY_UNASSIGNED' | 'RESCHEDULE_REQUEST' | 'NOTICE'
  urgency: 'urgent' | 'soon' | 'quiet'
  title: string              // one line, from real data
  why?: string               // one line
  fixes: Array<{ label: string; request: string }>   // max 3; request is sent to the agent, which shows a confirm card
  anchor?: { page: 'dashboard' | 'jobs' | 'scheduling' | 'customers' | 'finance'; recordType?: 'job' | 'technician' | 'customer' | 'invoice'; recordId?: string }
  audience: 'dispatch' | 'money' | 'all'             // filtered by role on the server
  createdAt: string
  expiresAt?: string
  seen?: boolean             // from the Kelvin log, for this user
}
```
Urgency rules:
- **urgent:** emergency job with nobody assigned; technician off today with visits booked;
  a visit 30 or more minutes late.
- **soon:** cancellation gaps; reschedule requests; delays under 30 minutes; the morning brief's
  first item once per day.
- **quiet:** unread in-app notifications (payments, messages and similar), the rest of the brief.

### Sources in release 1
| Source | Existing endpoint | Kinds produced |
|---|---|---|
| Morning brief | `GET /analytics/brief` | BRIEF |
| Running behind | `GET /scheduling/dispatch/disruptions` | LATE, TECH_OFF |
| Freed time | `GET /scheduling/dispatch/gaps` | GAP |
| Unassigned emergencies | `GET /jobs/jobs?status=PENDING&limit=100`, kept when `priority = EMERGENCY` and there is no `assignedToId` and no crew (the list has no priority filter) | EMERGENCY_UNASSIGNED |
| Reschedule inbox | `GET /jobs/reschedule/inbox?scope=action` | RESCHEDULE_REQUEST |
| Notifications | `GET /notifications?limit=20` on comms-service, keeping `isRead = false` (their `type` is free text, so they are shown as they are) | NOTICE |

The feed calls these in parallel, with a timeout of 4 s each. A failed source is reported in
`unavailable: string[]` and its items are left out; the rest of the feed still answers. Items are
sorted by urgency, then by `createdAt`, newest first. Only facts are used: the feed calls no model.

### Kelvin log (`analytics.kelvin_events`)
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| company_id | text | every query filters on it |
| user_id | text | |
| item_id | text, nullable | for "told" events |
| type | text | `SHOWN`, `SPOKE`, `DISMISSED`, `FIX_USED`, `ACTION_DONE`, `ACTION_FAILED` |
| action | text, nullable | tool name, e.g. `create_job` |
| record_ref | text, nullable | e.g. `job:<id>` |
| summary | text | one line for "Done today", e.g. "Created JOB-0452 for R&R Brothers" |
| confirmed_by | text, nullable | user id who pressed Confirm |
| created_at | timestamptz | |

Indexes: `(company_id, user_id, created_at)` and `(company_id, item_id)`.

### Kelvin preferences (`analytics.kelvin_prefs`)
| Column | Type | Notes |
|---|---|---|
| company_id | text | primary key with user_id |
| user_id | text | |
| speak_mode | text | `ALL` (default), `URGENT_ONLY`, `NEVER` |
| quiet_until | timestamptz, nullable | set by "Quiet for today" |
| updated_at | timestamptz | |

Read with the feed (`GET /chat/kelvin/feed` returns `prefs`) and written through
`PUT /chat/kelvin/prefs`, which chat-service forwards to `PUT /analytics/kelvin/prefs`.
Retention: 90 days, deleted by a daily job.
Written from a new migration in analytics-service, never the CRM one.
chat-service publishes `SPOKE` and `ACTION_*` events; the dashboard publishes `SHOWN`, `DISMISSED`
and `FIX_USED` through `POST /chat/kelvin/events`, which forwards them to the queue.

### Page awareness
```ts
interface KelvinContext { page: string; label: string; filter?: string; record?: { type: string; id: string; label: string } }
```
It is sent as `context` on each chat request. chat-service adds one system line, e.g.
"The user is on the Jobs page with JOB-0412 (AC not cooling, R&R Brothers) open". Only ids and
labels are sent, never record contents. With no context, Kelvin asks which record is meant.

## 4. Presence and speaking rules

The feed refreshes every 60 s. It refreshes immediately on these live signals:
- Scheduling WS `JOB_CHANGED` (`STATUS`, `CREATED`, `SCHEDULE`, `RESCHEDULE`, `ASSIGNMENT`, `DELETED`)
- Scheduling WS `AVAILABILITY_CHANGED` (new)
- comms Socket.IO `threads_changed` on the `/chat` namespace (new customer messages); payments and other notifications arrive with the 60 s refresh

A burst of signals is debounced: one refresh at most every 1.5 s. Opening the desk or the panel
also refreshes.

**Bubble rules** (in `KelvinCorner`):
1. An item can speak only if it is new (`SPOKE` has not been logged for this item and user) and its
   urgency is `urgent` or `soon`.
2. Gap: at most one bubble per 10 minutes. `urgent` items skip the gap.
3. Never while a text field, textarea, select or modal has focus. The bubble waits and is dropped
   if the item has expired.
4. A bubble shows for 6 s (it pauses while hovered), at most two lines, and then folds back. Its
   item stays on the desk.
5. "Quiet for today" in the panel stops bubbles until local midnight (`quiet_until`).
6. Per-person setting in Profile: *Talk to me* (default) / *Only urgent* / *Never pop up*.
   It is stored in `analytics.kelvin_prefs` (section 3), so it follows the person across devices.
7. The morning brief speaks once per day, on the first dashboard visit.

The corner ring shows `news` (green) while unseen items exist, and `urgent` (amber, one pulse)
while an unseen urgent item exists.

## 5. Actions

All existing agent tools stay as they are: `reschedule_job`, `assign_technician`, `reassign_job`,
`cancel_job`, `send_invoice`, `message_customer`, `set_technician_availability`, `find_open_times`.

### New: `create_job`
- **Roles:** super_admin, company_admin, office_manager, dispatcher.
- **Arguments:** `customerId` (from `find_customers`), `title`, optional `description`, `priority`
  (default NORMAL), optional `start` (ISO with offset), optional `durationMins` (default 90),
  optional `technicianId`, optional `serviceAddressIndex` when the customer has several sites.
- **Preview:**
  - loads the customer and refuses an inactive one
  - resolves the address and coordinates from the customer record
  - when a technician and a time are given, checks the fit with the slot finder and refuses with
    the reason if they don't fit
  - shows the card: customer, title, priority, address, when (or "no time yet, goes to
    unassigned"), technician (or "nobody yet")
- **Run:**
  1. `POST /jobs/jobs` with the `CreateJobDto` fields: `customerId`, `customerName`,
     contact fields, `serviceAddress` and its parts, coordinates, `title`, `description`,
     `priority`, `scheduledStart`, `scheduledEnd`, `estimatedDurationMins`.
  2. If a technician was given, `POST /scheduling/dispatch/assign/manual`, the same call
     `assign_technician` makes.
  3. Logs `ACTION_DONE` with the summary "Created JOB-xxxx for <customer>".
  4. Returns the job number and id.
- **If step 2 fails after step 1 succeeded:** the job stays created and unassigned. The result says
  so plainly and offers "Assign someone".
- **Conversation behaviour** (system prompt): ask one missing detail at a time, offering choices.
  "This evening" or "tomorrow" means calling `find_open_times` and offering at most 3 times. After
  success, offer one next step once.

Things he cannot do in release 1 (customers, quotes, invoices, payments): he answers in one sentence
and names the page. The capability rule already added to the admin prompt is kept and extended.

## 6. Visual and motion system

- **Face:** a dial in `--t1`, eyes in `--bg-card`, so it flips correctly in light, dark and black.

  | Place | Size |
  |---|---|
  | Desk greeting | 72 px |
  | Corner | 48 px |
  | Panel header | 32 px |
  | Notes | 20 px |

- **Ring by mood:**

  | Mood | Ring |
  |---|---|
  | idle | `--bd` |
  | thinking | `--blue`, rotating arc |
  | news | `--green` |
  | urgent | `--amber`, one pulse |
  | pleased | `--green`, eyes become arcs |
  | asleep | `--bd`, eyes closed lines |

- Every colour state also has a word in the UI (urgency label, status text).

**Moves** (Motion library, `LazyMotion` with `domMax`, loaded in the Kelvin chunk):

| Move | Trigger | Spec |
|---|---|---|
| Look at | Kelvin text references an anchored item on screen | Eyes translate up to 3 px towards the target's centre. The target gets a 2 px `--t1` outline that fades over 2 s. |
| Hand a note | A new `KelvinNote` mounts | Shared `layoutId` from the corner; 400 ms spring, no overshoot beyond 4 %. |
| Into the panel | Panel opens or closes | The corner face and the panel-header face share a `layoutId`; 320 ms. |
| Ring heats | An action is running | The SVG stroke dash fills over the request's duration (indeterminate while waiting). Green on success, amber on failure; eyes arc on success. |
| Eyes follow | Pointer within 240 px of the corner, or anywhere on `/kelvin` | Eyes offset up to 2 px; eased, at most 30 fps. |
| Blink | Idle | Every 4 to 7 s, randomised. |
| Bubble | Speaks | Unfolds from the face (scale from the corner origin with opacity), 180 ms; folds back 140 ms. |

- `prefers-reduced-motion`: every move becomes a 120 ms opacity fade; blink and follow are off.
- **Tokens only:** no hard-coded colours. Surfaces use `--bg-card`, borders use `--bd`.
  Notes have a 3 px `--t1` left edge.
- **Copy:** sentence case, plain verbs, no exclamation marks.
- **Accessibility:**
  - bubbles and results in an `aria-live="polite"` region
  - fixes are real buttons
  - ⌘K opens, Esc closes, and focus returns to the opener
  - targets at least 44 px
  - all text at least 4.5:1 contrast

## 7. Failure behaviour

| Failure | Behaviour |
|---|---|
| A source fails | Feed returns `unavailable: [...]`; desk shows "Couldn't check <source> just now"; retried next refresh. |
| Model down or budget reached | Feed unaffected (it uses no model). Chat replies: "I can't think right now, but here's what needs you", followed by the top items. |
| chat-service down | Face `asleep`; hover says "Kelvin is offline"; panel shows the same and the existing pages keep working. |
| Action fails | Ring amber, one-line reason, Retry. Multi-step actions report exactly what was done. |
| Live signal missed | Caught by the 60 s refresh. |
| `features.kelvin` off | Today's chat widget is shown; no corner, desk or notes. |

## 8. Cost
The feed and refreshes use no model tokens. The model is used for chat and for the brief's wording
(already cached for 15 minutes). Company budgets and the AI switch apply unchanged. With AI off,
Kelvin still shows items and fixes, and chat is disabled with a one-line explanation.

## 9. Testing
- **chat-service:**
  - feed normalisation per source
  - stable ids
  - role filtering (a dispatcher sees no money items from the brief)
  - a failed source goes to `unavailable`
  - `create_job` preview and run: customer close matches, inactive customer, technician fit refusal,
    assignment failure after creation
  - context line built from `KelvinContext`
- **analytics-service:** queue processor writes `kelvin_events`; read endpoint filters by company
  and user; prefs read/write scoped to the caller; retention job.
- **scheduling-service:** `AVAILABILITY_CHANGED` is emitted on set and clear.
- **admin-dashboard** (pure functions, unit-tested with Vitest added as a dev dependency, or with
  the repo's existing test setup if one is preferred during planning): speaking rules (gap, urgent
  bypass, typing suppression, quiet for today, per-person setting, never repeat).
- **Evals:** add cases for create job (partial name, typo, "this evening", missing customer) and
  "this job" with page context, on top of the existing 22.
- **Visual:** screenshots at 390, 768 and 1440 px in light, dark and black of the corner and
  bubble, the panel with a confirm card, the desk, a Jobs note, and reduced motion.
- **End to end, on local services:** cancel a job, the bubble appears within 2 s, use "Fill", the
  confirm card appears, confirm, and "Done today" shows it. Then create a job for a customer named
  with a typo.
- **assistant-ui spike** (time-boxed, half a day, throwaway): rebuild the panel thread on its
  ExternalStoreRuntime against our chat endpoint. Adopt it only if it handles our confirm cards and
  event stream with less code than our own and allows full styling. Otherwise keep our thread
  component.

## 10. Rollout
- Built behind `features.kelvin`, enabled for the demo tenant locally first.
- The `kelvin_events` and `kelvin_prefs` tables are added by one analytics-service migration.
- Production deploy only on the user's explicit "deploy", service by service, with the switch off
  until verified.

## 11. Out of scope for release 1
- Photo scan, analytics insights, reviews, recommendations and marketing content under Kelvin
  (release 2).
- Create customer, quote and invoice; payments; bulk actions (release 3).
- Customer portal and technician app.
- Voice, WhatsApp.
- Per-tenant renaming.

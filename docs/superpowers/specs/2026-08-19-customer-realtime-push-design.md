# Customer Realtime + Push Notifications — Design Spec

**Status:** Approved for planning
**Sub-project:** M1 of 5 (customer mobile app initiative)
**Depends on:** nothing — this is the foundation
**Feeds into:** M2 (mobile foundation), M3 (core screens). Also benefits the existing **web** customer portal, which already connects to `/chat` with a `customer_id` JWT and will gain live updates with only a small client change.

## Problem

The customer mobile app must show job status, quote, and invoice changes **live, without a refresh**, and must receive push notifications. Neither is possible today:

1. **No customer-scoped realtime channel exists.** The web portal's `useSocket` connects only to the `/chat` namespace for messaging — it receives no job/quote/invoice events. Job status changes flow job-service → Redis `assignment:{companyId}` → the **Go** scheduling-service WS hub, whose `broadcast(companyID, payload)` (`internal/ws/hub.go`) sends to *every* client in the company with no per-customer filter. Meanwhile comms-service's `messaging.gateway.ts` deliberately excludes customers from the company room (`joinCompanyRoomIfStaff`: `role !== 'customer' && !client.customerId`).

   Pointing the app at the existing `/ws` would therefore deliver **every other customer's** job events — the payload carries `customerName`, `jobNumber`, and `title` — a cross-customer data leak.

2. **`JobChangedPayload` has no `customerId`.** It carries `customerName` but no id, so nothing downstream can determine which customer an event belongs to.

3. **finance-service publishes no events at all** — there is no Redis usage in the service, so quote/invoice changes are invisible to any realtime consumer.

4. **Push has no customer triggers.** Delivery works (verified: `PushService.sendToToken` routes `ExponentPushToken[...]`/`ExpoPushToken[...]` through Expo's push API and uses FCM only for native tokens; `POST /crm/users/me/push-token` is guarded by `JwtAuthGuard` alone with no role gate, so customers can register), but no server-side logic decides to send a customer a push. Existing customer-facing notifications (e.g. en-route ETA) go out as email/SMS only.

## Scope decisions (confirmed with product owner)

- **Deliver realtime by extending the comms `/chat` gateway**, not by modifying the Go hub. The app needs that socket for messaging anyway, so this yields one connection, one auth path, one reconnect strategy. Go-side changes are riskier and would force the app to maintain two sockets with two different auth mechanisms.
- **Push triggers are in scope** — the app must not be push-ready-but-silent.
- **Appointment reminders are a stated requirement** and are included here.

## Event sources

### a) job-service — add `customerId` (one field)

`apps/job-service/src/realtime/job-events.publisher.ts` — `JobChangedPayload` gains:

```ts
customerId?: string;
```

Populated at every publish site from `Job.customerId` (always available on the job row being changed). Channel is unchanged (`assignment:{companyId}`), so the Go dispatch hub keeps working exactly as today — it ignores unknown payload fields.

### b) finance-service — new publisher

New `apps/finance-service/src/realtime/finance-events.publisher.ts`, mirroring job-service's publisher exactly (ioredis client via `ConfigService`, fire-and-forget `publish()` whose failures are logged and dropped, `quit()` on `onModuleDestroy`).

```ts
export type FinanceEventType = 'QUOTE_CHANGED' | 'INVOICE_CHANGED';

export interface FinanceChangedPayload {
  /** Quote id or Invoice id. */
  documentId: string;
  customerId: string;
  change: 'SENT' | 'APPROVED' | 'DECLINED' | 'CONVERTED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'VOIDED';
  status?: string;
  documentNumber?: string;
  total?: string;
  currency?: string;
}
```

Published to a **new** channel `finance:{companyId}`. Deliberately a new prefix: the Go hub pattern-subscribes only `assignment:*` and `gps:*`, so the dispatch board is provably unaffected by anything published here.

Publish sites: `QuotesService` (send, approve, decline, convertToInvoice) and `InvoicesService` (send, recordManualPayment → PAID/PARTIALLY_PAID, markOverdueInvoices, voidInvoice).

### c) comms messaging — customer-room fan-out

`new_message` already reaches customers inside a thread room. Add a fan-out to the recipient customer's own room so unread badges update while they are *not* viewing that thread.

Emitted as a distinct event name — **`message_new`** to `customer:{customerId}` — deliberately not reusing `new_message`, so a client listening on both a thread room and its customer room can tell "a message arrived in the thread I'm reading" from "a message arrived somewhere else" without deduplicating identical events.

## Customer-scoped delivery

### Gateway change

`apps/comms-service/src/messaging/messaging.gateway.ts`, in `handleConnection` (both the JWT and dev-bypass paths), after the existing `client.join('user:' + client.userId)`:

```ts
if (client.customerId) client.join(`customer:${client.customerId}`);
```

This sits alongside `joinCompanyRoomIfStaff()`, which is left exactly as-is. Staff keep company-wide events; customers get a private room and never join `company:*`.

### New `CustomerEventsSubscriber`

New `apps/comms-service/src/customer-events/` module. An ioredis client `PSubscribe`s `assignment:*` and `finance:*`. For each message it:

1. Extracts `companyId` from the channel suffix.
2. Reads `payload.customerId`. **If absent, the event is dropped** — never broadcast as a fallback.
3. Emits to `customer:{customerId}` **only**, on the `/chat` namespace, using named events the client maps directly to query keys: `job_changed`, `quote_changed`, `invoice_changed`.
4. Emits a **slimmed payload** — ids, status/change, document number, total/currency. Fields naming other parties (e.g. `assignedToName`) are omitted; the app refetches detail through the customer-scoped REST API, which already enforces `customerId` server-side.

Two properties this design guarantees:

- **Security by construction.** A customer socket occupies only `user:{userId}`, its joined thread rooms, and `customer:{customerId}`. Because every emit is addressed to a room only that one customer occupies, even a malformed or mis-routed event cannot reach another customer.
- **Multi-instance safe on Cloud Run.** Every comms instance runs its own subscriber and serves its own connected sockets, so fan-out happens at the Redis layer. This is why no Socket.IO Redis adapter is required (comms has none today) — adding one would be redundant for this path.

## Push triggers

New `apps/comms-service/src/customer-notifications/` module consuming the *same* `CustomerEventsSubscriber` — one Redis subscription, two consumers (socket fan-out and push dispatch).

Recipient resolution: `payload.customerId` → the `CompanyUser` with `role = 'customer'` for that customer → its `pushToken`. No token, no push (silently skipped, debug-logged).

| Trigger | Push | Copy |
|---|---|---|
| Job → `SCHEDULED` | yes | "Your service is scheduled" |
| Job → `EN_ROUTE` | yes | "Your technician is on the way" |
| Job → `ON_SITE` | yes | "Your technician has arrived" |
| Job → `COMPLETED` | yes | "Service completed" |
| Job `CREATED` | no | the customer just did it |
| Job `CANCELLED` | yes | "Your service was cancelled" |
| Quote `SENT` | yes | "New quote ready to review" |
| Quote `APPROVED` / `DECLINED` | no | customer-initiated |
| Invoice `SENT` | yes | "New invoice" |
| Invoice `OVERDUE` | yes | "Invoice overdue" |
| Invoice `PAID` | yes | "Payment received" (receipt confirmation) |
| New message from staff | yes | "New message from {company}" — suppressed when the customer is the sender |

Design choices:

- **Always send; let the client present.** The server cannot reliably know whether the app is foregrounded, so it always dispatches and the app's `setNotificationHandler` decides banner vs. silent. Simpler and more robust than suppressing server-side based on socket connectivity, which would race with reconnects.
- **Every push carries `data: { type, jobId | quoteId | invoiceId }`** so the app deep-links to the right screen and invalidates the right query key — the pattern technician-app already uses.
- **Push is additive to existing email/SMS** (e.g. en-route sends both today). Per-customer channel preferences are out of scope for M1.

### Appointment reminders

A periodic worker following the existing `followup.worker.ts` pattern: on each run it finds jobs scheduled within the next 24h, sends a reminder push, and records it.

Chosen over delayed BullMQ jobs deliberately: the worker **re-reads current job state every run**, so reschedules and cancellations are handled naturally with no cancellation bookkeeping. A delayed-job approach would have to track each queued job's id and revoke/replace it on every schedule change — more moving parts and more ways to leave a stale reminder queued.

Dedupe: before sending, query the `Notification` table for an existing reminder row for that `jobId`; skip if present. This makes the worker idempotent across runs and safe to run on multiple instances.

Reading upcoming jobs requires a small jobs client in comms-service (service-to-service, following the auth-header pattern in `company-settings.client.ts`).

## Testing

- **job-service:** every published `JobChangedPayload` includes `customerId`.
- **`CustomerEventsSubscriber`:** an event for customer A emits to `customer:A` and to no other room (direct assertion against the cross-customer leak); an event lacking `customerId` is dropped, never broadcast; a malformed JSON payload is swallowed without killing the subscriber.
- **Gateway:** a socket with `customerId` joins `customer:{id}` and does **not** join `company:{id}`; a staff socket still joins `company:{id}` and not any customer room.
- **finance publisher:** publishes with `customerId` on each covered lifecycle transition, and publish failures never throw into the caller's request path.
- **Push triggers:** each mapped status produces exactly one push carrying the right `data`; customer-initiated changes (quote approve/decline, job create) produce none; missing push token is a silent skip, not an error.
- **Reminder worker:** sends once per job across repeated runs (idempotency), and skips jobs whose schedule moved out of the window.

## Out of scope

- Any mobile app code (M2/M3).
- Modifying the Go scheduling-service hub or the `/ws` transport.
- A Socket.IO Redis adapter for comms (unnecessary for this design — see above).
- Per-customer notification channel preferences / quiet hours.
- Wiring the **web** portal to consume the new events (it becomes possible here; the client change belongs to a portal task).
- Equipment/IoT events — not in the mobile v1 scope.

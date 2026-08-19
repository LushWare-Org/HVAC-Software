# Customer Realtime + Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver customer-scoped realtime events (job / quote / invoice / message) over the existing comms `/chat` Socket.IO gateway, plus server-side customer push triggers including appointment reminders — the backend foundation the customer mobile app needs.

**Architecture:** job-service adds `customerId` to its existing Redis job events; finance-service gains a matching publisher on a new `finance:*` channel; comms-service subscribes to both, joins customers to a private `customer:{customerId}` room, and fans events out **only** to that room. A single internal comms endpoint (`POST /notifications/customer-push`) owns push-token resolution and dedupe, called both by the event-driven triggers and by a job-service reminder sweep.

**Tech Stack:** NestJS 10, ioredis, Socket.IO (`@nestjs/websockets`), BullMQ, Prisma, Jest.

**Spec:** `docs/superpowers/specs/2026-08-19-customer-realtime-push-design.md`

## Global Constraints

- An event without a `customerId` is **dropped**, never broadcast as a fallback — this is the guard against the cross-customer leak the spec documents.
- Emits are addressed to `customer:{customerId}` only. Customers must never join `company:*`; `joinCompanyRoomIfStaff()` stays exactly as-is.
- Realtime payloads are **slimmed** to ids + status/change + document number + total/currency. Never include fields naming other parties (e.g. `assignedToName`).
- Publishers are fire-and-forget: failures are logged and swallowed, never thrown into a request path.
- Finance events use the **new** `finance:{companyId}` channel. The Go hub pattern-subscribes only `assignment:*` and `gps:*` and must remain unaffected.
- Push is additive to existing email/SMS. Customer-initiated changes (job create, quote approve/decline) send no push.
- Every push carries `data: { type, jobId | quoteId | invoiceId }` for deep-linking.
- Socket event names, used verbatim by the mobile client: `job_changed`, `quote_changed`, `invoice_changed`, `message_new`.

---

### Task 1: job-service — add `customerId` to job events

**Files:**
- Modify: `apps/job-service/src/realtime/job-events.publisher.ts`
- Modify: `apps/job-service/src/jobs/jobs.service.ts` (3 publish sites: ~line 92, ~349, ~516)
- Modify: `apps/job-service/src/reschedule/reschedule-apply.service.ts` (~line 131)
- Modify: `apps/job-service/src/reschedule/reschedule.service.ts` (~line 48)
- Test: `apps/job-service/src/jobs/jobs.service.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `JobChangedPayload.customerId?: string` on the JSON published to `assignment:{companyId}` — Task 5's subscriber reads exactly this field.

- [ ] **Step 1: Write the failing test**

Add to `apps/job-service/src/jobs/jobs.service.spec.ts`, inside the `describe('JobsService — create', ...)` block:

```ts
  it('publishes the customerId so comms can route the event to that customer', async () => {
    mockPrisma.job.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...makeJob(JobStatusDto.PENDING), ...data, customerId: 'cust-77' }),
    );
    mockPrisma.job.findFirst.mockResolvedValue(makeJob(JobStatusDto.PENDING));

    await service.create(makeAuthUser() as any, {
      customerId: 'cust-77', customerName: 'C', serviceAddress: '1 St', title: 'Job',
    } as any);

    expect(mockEvents.publish).toHaveBeenCalledWith(
      COMPANY_ID,
      expect.objectContaining({ change: 'CREATED', customerId: 'cust-77' }),
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter job-service test -- jobs.service`
Expected: FAIL — the published payload has no `customerId` property.

- [ ] **Step 3: Add the field to the payload type**

In `apps/job-service/src/realtime/job-events.publisher.ts`, add to `JobChangedPayload` after `jobId`:

```ts
export interface JobChangedPayload {
  jobId: string;
  /** Which customer this job belongs to. Required for customer-scoped fan-out
   *  in comms-service; an event without it is dropped rather than broadcast. */
  customerId?: string;
```

- [ ] **Step 4: Populate it at the CREATED site**

In `apps/job-service/src/jobs/jobs.service.ts` (~line 92):

```ts
        this.events.publish(user.companyId, {
          jobId: job.id, change: 'CREATED', status: job.status,
          customerId: job.customerId,
          scheduledStart: job.scheduledStart?.toISOString() ?? null,
          jobNumber: job.jobNumber, title: job.title,
          customerName: job.customerName, actorUserId: user.userId,
        });
```

- [ ] **Step 5: Populate it at the STATUS site**

In the same file (~line 349):

```ts
    this.events.publish(companyId, {
      jobId, change: 'STATUS', status: newStatus, previousStatus: currentStatus,
      customerId: job.customerId,
      assignedToId: (updated as any).assignedToId ?? null,
      assignedToName: (updated as any).assignedToName ?? null,
      jobNumber: job.jobNumber, title: job.title,
      customerName: job.customerName, actorUserId: user.userId,
    });
```

- [ ] **Step 6: Populate it at the SCHEDULE site**

In the same file (~line 516). Note this site's surrounding code loads `job` — use `job.customerId`:

```ts
    this.events.publish(user.companyId, {
      jobId, change: 'SCHEDULE',
      status: job.status,
      customerId: job.customerId,
      scheduledStart: start.toISOString(),
      actorUserId: user.userId,
    });
```

- [ ] **Step 7: Populate it at both reschedule sites**

In `apps/job-service/src/reschedule/reschedule-apply.service.ts` (~line 131):

```ts
    this.events.publish(user.companyId, {
      jobId: job.id, change: 'RESCHEDULE',
      status: 'PENDING', previousStatus: job.status,
      customerId: (job as any).customerId,
      scheduledStart: slot.startAt.toISOString(),
      assignedToId: null, assignedToName: null,
      rescheduleState: null,
      jobNumber: (job as any).jobNumber, title: job.title,
      customerName: job.customerName, actorUserId: user.userId,
    });
```

In `apps/job-service/src/reschedule/reschedule.service.ts` (~line 43), widen the `job` parameter type and pass it through:

```ts
    companyId: string,
    job: { id: string; status: string; jobNumber?: string; title?: string; customerName?: string | null; customerId?: string },
    rescheduleState: string | null,
    actorUserId?: string,
  ) {
    this.events.publish(companyId, {
      jobId: job.id, change: 'RESCHEDULE', status: job.status,
      customerId: job.customerId,
      rescheduleState, jobNumber: job.jobNumber, title: job.title,
      customerName: job.customerName ?? null, actorUserId,
    });
  }
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm --filter job-service test`
Expected: PASS — full suite green, no regressions.

Run: `pnpm --filter job-service build`
Expected: compiles cleanly.

- [ ] **Step 9: Commit**

```bash
git add apps/job-service/src/realtime/job-events.publisher.ts apps/job-service/src/jobs/jobs.service.ts apps/job-service/src/reschedule/reschedule-apply.service.ts apps/job-service/src/reschedule/reschedule.service.ts apps/job-service/src/jobs/jobs.service.spec.ts
git commit -m "feat(job-service): publish customerId on job events for customer-scoped fan-out"
```

---

### Task 2: finance-service — FinanceEventsPublisher

**Files:**
- Create: `apps/finance-service/src/realtime/finance-events.publisher.ts`
- Create: `apps/finance-service/src/realtime/realtime.module.ts`
- Create: `apps/finance-service/src/realtime/finance-events.publisher.spec.ts`
- Modify: `apps/finance-service/src/app.module.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `FinanceEventsPublisher.publish(companyId: string, payload: FinanceChangedPayload): void` and the exported `FinanceChangedPayload` type — Tasks 3 and 4 inject the publisher; Task 5's subscriber parses this JSON off `finance:{companyId}`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/finance-service/src/realtime/finance-events.publisher.spec.ts
import { FinanceEventsPublisher } from './finance-events.publisher';

const publishMock = jest.fn().mockResolvedValue(1);

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    publish: publishMock,
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

const config = { get: jest.fn().mockReturnValue(undefined) } as never;

describe('FinanceEventsPublisher', () => {
  let publisher: FinanceEventsPublisher;

  beforeEach(() => {
    jest.clearAllMocks();
    publisher = new FinanceEventsPublisher(config);
  });

  it('publishes quote events to the finance channel for that company', () => {
    publisher.publish('co-1', {
      type: 'QUOTE_CHANGED', documentId: 'q-1', customerId: 'cust-1', change: 'SENT',
    });

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [channel, raw] = publishMock.mock.calls[0];
    expect(channel).toBe('finance:co-1');
    const msg = JSON.parse(raw);
    expect(msg.companyId).toBe('co-1');
    expect(msg.payload).toEqual(
      expect.objectContaining({ type: 'QUOTE_CHANGED', documentId: 'q-1', customerId: 'cust-1', change: 'SENT' }),
    );
  });

  it('never throws when redis publish rejects', () => {
    publishMock.mockRejectedValueOnce(new Error('redis down'));
    expect(() =>
      publisher.publish('co-1', {
        type: 'INVOICE_CHANGED', documentId: 'inv-1', customerId: 'cust-1', change: 'PAID',
      }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter finance-service test -- finance-events.publisher`
Expected: FAIL — module `./finance-events.publisher` does not exist.

- [ ] **Step 3: Implement the publisher**

```ts
// apps/finance-service/src/realtime/finance-events.publisher.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Deliberately a NEW channel prefix, not `assignment:`. The Go scheduling
 * hub pattern-subscribes `assignment:*` and `gps:*`; publishing finance
 * events anywhere it listens would push document events onto every dispatch
 * board. comms-service is the only subscriber to this prefix.
 */
const CHANNEL_PREFIX = 'finance:';

export type FinanceEventType = 'QUOTE_CHANGED' | 'INVOICE_CHANGED';

export interface FinanceChangedPayload {
  type: FinanceEventType;
  /** Quote id or Invoice id. */
  documentId: string;
  /** Required for customer-scoped fan-out; comms drops events without it. */
  customerId: string;
  change: 'SENT' | 'APPROVED' | 'DECLINED' | 'CONVERTED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'VOIDED';
  status?: string;
  documentNumber?: string;
  total?: string;
  currency?: string;
}

@Injectable()
export class FinanceEventsPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(FinanceEventsPublisher.name);
  private readonly client: Redis;
  private warnedOnce = false;

  constructor(private readonly config: ConfigService) {
    // Same tuning as job-service's publisher: this is a best-effort side
    // channel, so keep retries short and the logs quiet. A noisy reconnect
    // loop on every finance write is worse than degrading to client polling.
    const common = {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 500, 2_000)),
      lazyConnect: true,
    };
    const url = this.config.get<string>('REDIS_URL');
    this.client = url
      ? new Redis(url, common)
      : new Redis({
          host: this.config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(this.config.get<string | number>('REDIS_PORT', 6379)),
          password: this.config.get<string>('REDIS_PASSWORD'),
          ...common,
        });
    this.client.on('error', (err) => {
      if (this.warnedOnce) return;
      this.warnedOnce = true;
      this.logger.warn(
        `Redis unavailable — finance realtime events will be skipped: ${err.message}`,
      );
    });
    this.client.connect().catch(() => {
      // Handled by the 'error' listener above.
    });
  }

  /** Never throws, never awaits anything slow. Safe to call inside a request path. */
  publish(companyId: string, payload: FinanceChangedPayload): void {
    const message = JSON.stringify({ type: payload.type, companyId, payload });
    this.client
      .publish(`${CHANNEL_PREFIX}${companyId}`, message)
      .catch((err: unknown) => {
        this.logger.debug?.(
          `finance event publish skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
```

- [ ] **Step 4: Create the module**

```ts
// apps/finance-service/src/realtime/realtime.module.ts
import { Module } from '@nestjs/common';
import { FinanceEventsPublisher } from './finance-events.publisher';

@Module({
  providers: [FinanceEventsPublisher],
  exports: [FinanceEventsPublisher],
})
export class RealtimeModule {}
```

- [ ] **Step 5: Register it in the app module**

In `apps/finance-service/src/app.module.ts`, add the import and list `RealtimeModule` in the `imports` array alongside the other feature modules:

```ts
import { RealtimeModule } from './realtime/realtime.module';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter finance-service test -- finance-events.publisher`
Expected: PASS — both tests green.

- [ ] **Step 7: Commit**

```bash
git add apps/finance-service/src/realtime apps/finance-service/src/app.module.ts
git commit -m "feat(finance-service): add FinanceEventsPublisher on the finance:* channel"
```

---

### Task 3: finance-service — publish quote lifecycle events

**Files:**
- Modify: `apps/finance-service/src/quotes/quotes.service.ts`
- Modify: `apps/finance-service/src/quotes/quotes.module.ts`
- Modify: `apps/finance-service/src/quotes/quotes.service.spec.ts`

**Interfaces:**
- Consumes: `FinanceEventsPublisher.publish(companyId, payload)` and `FinanceChangedPayload` (Task 2).
- Produces: `QUOTE_CHANGED` events on `finance:{companyId}` — read by Task 5's subscriber and Task 7's push triggers.

- [ ] **Step 1: Write the failing test**

Add to `apps/finance-service/src/quotes/quotes.service.spec.ts`. First add the publisher mock to the `providers` array in the existing `beforeEach` `Test.createTestingModule` call:

```ts
        { provide: FinanceEventsPublisher, useValue: { publish: jest.fn() } },
```

with the import at the top of the file:

```ts
import { FinanceEventsPublisher } from '../realtime/finance-events.publisher';
```

Then add a new `describe` block:

```ts
  describe('finance events', () => {
    it('publishes QUOTE_CHANGED/SENT with the customerId when a quote is sent', async () => {
      const events = module.get(FinanceEventsPublisher) as any;
      const q = makeQuote({ status: QuoteStatus.DRAFT, customerId: 'cust-9', quoteNumber: 'QUOTE-2026-0007' });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.quote.update.mockResolvedValue({ ...q, status: QuoteStatus.SENT });

      await service.send(COMPANY_ID, QUOTE_ID);

      expect(events.publish).toHaveBeenCalledWith(
        COMPANY_ID,
        expect.objectContaining({
          type: 'QUOTE_CHANGED',
          change: 'SENT',
          documentId: QUOTE_ID,
          customerId: 'cust-9',
        }),
      );
    });

    it('publishes QUOTE_CHANGED/CONVERTED on conversion to an invoice', async () => {
      const events = module.get(FinanceEventsPublisher) as any;
      const q = makeQuote({ status: QuoteStatus.ACCEPTED, customerId: 'cust-9' });
      mockPrisma.quote.findFirst.mockResolvedValue(q);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: 'inv-1' }));

      await service.convertToInvoice(COMPANY_ID, QUOTE_ID, USER_ID);

      expect(events.publish).toHaveBeenCalledWith(
        COMPANY_ID,
        expect.objectContaining({ type: 'QUOTE_CHANGED', change: 'CONVERTED', customerId: 'cust-9' }),
      );
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: FAIL — first with a Nest DI error (`FinanceEventsPublisher` not a constructor param yet), then on the assertions once injected.

- [ ] **Step 3: Inject the publisher**

In `apps/finance-service/src/quotes/quotes.service.ts`, add the import and constructor parameter:

```ts
import { FinanceEventsPublisher } from '../realtime/finance-events.publisher';
```

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly pdfService: PdfService,
    private readonly notificationClient: NotificationClientService,
    private readonly companySettings: CompanySettingsClient,
    private readonly financeEvents: FinanceEventsPublisher,
  ) {}
```

In `apps/finance-service/src/quotes/quotes.module.ts`, add `RealtimeModule` to the `imports` array:

```ts
import { RealtimeModule } from '../realtime/realtime.module';
```

- [ ] **Step 4: Publish at the quote lifecycle sites**

In `QuotesService.send`, after the quote row is updated to `SENT` and before returning:

```ts
    this.financeEvents.publish(companyId, {
      type: 'QUOTE_CHANGED',
      documentId: id,
      customerId: quote.customerId,
      change: 'SENT',
      status: QuoteStatus.SENT,
      documentNumber: quote.quoteNumber,
      total: quote.total?.toString(),
      currency: (quote as any).currency,
    });
```

In `QuotesService.approve` (customer acceptance), after the status update:

```ts
    this.financeEvents.publish(companyId, {
      type: 'QUOTE_CHANGED',
      documentId: id,
      customerId: quote.customerId,
      change: 'APPROVED',
      status: QuoteStatus.ACCEPTED,
      documentNumber: quote.quoteNumber,
      total: quote.total?.toString(),
      currency: (quote as any).currency,
    });
```

In the decline path (wherever `QuoteStatus.DECLINED` is set), the same call with `change: 'DECLINED'` and `status: QuoteStatus.DECLINED`.

In `QuotesService.convertToInvoice`, after the transaction commits (alongside the existing post-commit work, never inside the transaction):

```ts
    this.financeEvents.publish(companyId, {
      type: 'QUOTE_CHANGED',
      documentId: id,
      customerId: quote.customerId,
      change: 'CONVERTED',
      status: QuoteStatus.CONVERTED,
      documentNumber: quote.quoteNumber,
      total: quote.total?.toString(),
      currency: quote.currency,
    });
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- quotes.service`
Expected: PASS — including the pre-existing conversion tests.

- [ ] **Step 6: Commit**

```bash
git add apps/finance-service/src/quotes
git commit -m "feat(finance-service): publish quote lifecycle events for customer realtime"
```

---

### Task 4: finance-service — publish invoice lifecycle events

**Files:**
- Modify: `apps/finance-service/src/invoices/invoices.service.ts`
- Modify: `apps/finance-service/src/invoices/invoices.module.ts`
- Modify: `apps/finance-service/src/invoices/invoices.service.spec.ts`

**Interfaces:**
- Consumes: `FinanceEventsPublisher.publish(companyId, payload)` and `FinanceChangedPayload` (Task 2).
- Produces: `INVOICE_CHANGED` events on `finance:{companyId}` — read by Task 5's subscriber and Task 7's push triggers.

- [ ] **Step 1: Write the failing test**

Add to `apps/finance-service/src/invoices/invoices.service.spec.ts`. Add the mock to the existing `providers` array:

```ts
        { provide: FinanceEventsPublisher, useValue: { publish: jest.fn() } },
```

with the import:

```ts
import { FinanceEventsPublisher } from '../realtime/finance-events.publisher';
```

Then:

```ts
  describe('finance events', () => {
    it('publishes INVOICE_CHANGED/PAID when a payment settles the invoice', async () => {
      const events = module.get(FinanceEventsPublisher) as any;
      const inv = makeInvoice({
        status: InvoiceStatus.SENT,
        customerId: 'cust-4',
        total: makeDecimal(500),
        amountPaid: makeDecimal(0),
        balanceDue: makeDecimal(500),
      });
      mockPrisma.invoice.findFirst.mockResolvedValue(inv);
      mockPrisma.payment.count.mockResolvedValue(0);
      mockPrisma.payment.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'p1', ...data }));
      mockPrisma.invoice.update.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));

      await service.recordManualPayment(COMPANY_ID, INV_ID, 500, 'CASH');

      expect(events.publish).toHaveBeenCalledWith(
        COMPANY_ID,
        expect.objectContaining({ type: 'INVOICE_CHANGED', change: 'PAID', customerId: 'cust-4' }),
      );
    });

    it('publishes PARTIALLY_PAID rather than PAID for a partial payment', async () => {
      const events = module.get(FinanceEventsPublisher) as any;
      const inv = makeInvoice({
        status: InvoiceStatus.SENT,
        customerId: 'cust-4',
        total: makeDecimal(500),
        amountPaid: makeDecimal(0),
        balanceDue: makeDecimal(500),
      });
      mockPrisma.invoice.findFirst.mockResolvedValue(inv);
      mockPrisma.payment.count.mockResolvedValue(0);
      mockPrisma.payment.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'p1', ...data }));
      mockPrisma.invoice.update.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));

      await service.recordManualPayment(COMPANY_ID, INV_ID, 200, 'CASH');

      expect(events.publish).toHaveBeenCalledWith(
        COMPANY_ID,
        expect.objectContaining({ change: 'PARTIALLY_PAID' }),
      );
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter finance-service test -- invoices.service`
Expected: FAIL — DI error first, then assertion failures once injected.

- [ ] **Step 3: Inject the publisher**

In `apps/finance-service/src/invoices/invoices.service.ts`, add the import and constructor parameter (after the existing `documentTemplates` param, keeping `@Optional() qbSync` last):

```ts
import { FinanceEventsPublisher } from '../realtime/finance-events.publisher';
```

```ts
    private readonly documentTemplates: DocumentTemplateClient,
    private readonly financeEvents: FinanceEventsPublisher,
    @Optional() private readonly qbSync: QuickBooksSyncService,
```

In `apps/finance-service/src/invoices/invoices.module.ts`, add `RealtimeModule` to `imports`:

```ts
import { RealtimeModule } from '../realtime/realtime.module';
```

- [ ] **Step 4: Publish at the invoice lifecycle sites**

In `InvoicesService.recordManualPayment`, after the transaction and before the fire-and-forget QB/receipt work:

```ts
    this.financeEvents.publish(companyId, {
      type: 'INVOICE_CHANGED',
      documentId: invoiceId,
      customerId: invoice.customerId,
      change: newStatus === InvoiceStatus.PAID ? 'PAID' : 'PARTIALLY_PAID',
      status: newStatus,
      documentNumber: invoice.invoiceNumber,
      total: invoice.total?.toString(),
      currency: invoice.currency,
    });
```

In `InvoicesService.send`, after the status update to `SENT`:

```ts
    this.financeEvents.publish(companyId, {
      type: 'INVOICE_CHANGED',
      documentId: id,
      customerId: invoice.customerId,
      change: 'SENT',
      status: InvoiceStatus.SENT,
      documentNumber: invoice.invoiceNumber,
      total: invoice.total?.toString(),
      currency: invoice.currency,
    });
```

In `InvoicesService.voidInvoice`, after the void update:

```ts
    this.financeEvents.publish(companyId, {
      type: 'INVOICE_CHANGED',
      documentId: id,
      customerId: invoice.customerId,
      change: 'VOIDED',
      status: InvoiceStatus.VOID,
      documentNumber: invoice.invoiceNumber,
      total: invoice.total?.toString(),
      currency: invoice.currency,
    });
```

`markOverdueInvoices` updates many rows with `updateMany` and therefore has no per-row data in hand. Change it to select the affected invoices first, then publish one `OVERDUE` event per row:

```ts
    const nowDue = await this.prisma.invoice.findMany({
      where: { companyId, status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] }, dueDate: { lt: new Date() } },
      select: { id: true, customerId: true, invoiceNumber: true, total: true, currency: true },
    });

    const result = await this.prisma.invoice.updateMany({
      where: { id: { in: nowDue.map((i) => i.id) } },
      data: { status: InvoiceStatus.OVERDUE },
    });

    for (const inv of nowDue) {
      this.financeEvents.publish(companyId, {
        type: 'INVOICE_CHANGED',
        documentId: inv.id,
        customerId: inv.customerId,
        change: 'OVERDUE',
        status: InvoiceStatus.OVERDUE,
        documentNumber: inv.invoiceNumber,
        total: inv.total?.toString(),
        currency: inv.currency,
      });
    }

    return result;
```

Keep the existing `markOverdueInvoices` test passing by checking its assertions still hold — if it asserted on the `updateMany` filter shape, update it to assert the new `where: { id: { in: [...] } }` form.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter finance-service test`
Expected: PASS — full suite, no regressions.

Run: `pnpm --filter finance-service build`
Expected: compiles cleanly.

- [ ] **Step 6: Commit**

```bash
git add apps/finance-service/src/invoices
git commit -m "feat(finance-service): publish invoice lifecycle events for customer realtime"
```

---

### Task 5: comms — customer room join + CustomerEventsSubscriber

**Files:**
- Modify: `apps/comms-service/src/messaging/messaging.gateway.ts`
- Create: `apps/comms-service/src/customer-events/customer-events.subscriber.ts`
- Create: `apps/comms-service/src/customer-events/customer-events.module.ts`
- Create: `apps/comms-service/src/customer-events/customer-events.subscriber.spec.ts`
- Create: `apps/comms-service/src/messaging/messaging.gateway.spec.ts`
- Modify: `apps/comms-service/src/app.module.ts`

**Interfaces:**
- Consumes: `assignment:{companyId}` events carrying `payload.customerId` (Task 1); `finance:{companyId}` events (Tasks 2-4).
- Produces: `CustomerEventsSubscriber.handleMessage(channel: string, raw: string): void` (the unit-testable core), and socket events `job_changed` / `quote_changed` / `invoice_changed` emitted to room `customer:{customerId}` on the `/chat` namespace. Task 7 reuses this module's parsed-event stream for push.

- [ ] **Step 1: Write the failing gateway test**

```ts
// apps/comms-service/src/messaging/messaging.gateway.spec.ts
import { MessagingGateway } from './messaging.gateway';

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sock-1',
    join: jest.fn(),
    disconnect: jest.fn(),
    handshake: { auth: {}, query: {}, headers: {} },
    ...overrides,
  } as any;
}

describe('MessagingGateway — customer rooms', () => {
  let gateway: MessagingGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new MessagingGateway({} as never);
  });

  it('joins a customer to their private room and never to the company room', async () => {
    const client = makeClient({
      handshake: {
        auth: {}, headers: {},
        query: { companyId: 'co-1', userId: 'u-1', userRole: 'customer', customerId: 'cust-1' },
      },
    });

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('customer:cust-1');
    expect(client.join).not.toHaveBeenCalledWith('company:co-1');
  });

  it('still joins staff to the company room and to no customer room', async () => {
    const client = makeClient({
      handshake: {
        auth: {}, headers: {},
        query: { companyId: 'co-1', userId: 'u-2', userRole: 'dispatcher' },
      },
    });

    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith('company:co-1');
    expect(client.join).not.toHaveBeenCalledWith(expect.stringContaining('customer:'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- messaging.gateway`
Expected: FAIL — the dev-bypass path never reads `customerId`, so `join('customer:cust-1')` is not called.

- [ ] **Step 3: Join customers to their room**

In `apps/comms-service/src/messaging/messaging.gateway.ts`, in the **dev-bypass** branch of `handleConnection`, read the customer id and join:

```ts
        const customerId =
          (client.handshake.headers['x-test-customer-id'] as string) ??
          (client.handshake.query?.customerId as string);

        if (companyId && userId) {
          client.companyId = companyId;
          client.userId = userId;
          client.userName = userName;
          client.userRole = userRole;
          client.customerId = customerId;
          client.join(`user:${userId}`);
          this.joinCustomerRoomIfCustomer(client);
          this.joinCompanyRoomIfStaff(client);
          this.logger.log(`[dev] Client ${client.id} connected as ${userName} (${userRole})`);
          return;
        }
```

And in the **JWT** branch, after the existing `client.join(\`user:${client.userId}\`)`:

```ts
      client.join(`user:${client.userId}`);
      this.joinCustomerRoomIfCustomer(client);
      this.joinCompanyRoomIfStaff(client);
```

Add the helper next to `joinCompanyRoomIfStaff` (leaving that method untouched):

```ts
  /**
   * A customer's socket only ever occupies user:{id}, its joined thread rooms,
   * and customer:{id}. Because every customer-scoped emit is addressed to a
   * room only that one customer occupies, a mis-routed event cannot reach
   * another customer.
   */
  private joinCustomerRoomIfCustomer(client: AuthSocket) {
    if (client.customerId) {
      client.join(`customer:${client.customerId}`);
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter comms-service test -- messaging.gateway`
Expected: PASS — both tests green.

- [ ] **Step 5: Write the failing subscriber test**

```ts
// apps/comms-service/src/customer-events/customer-events.subscriber.spec.ts
import { CustomerEventsSubscriber } from './customer-events.subscriber';

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    psubscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
  })),
}));

const config = { get: jest.fn().mockReturnValue(undefined) } as never;

describe('CustomerEventsSubscriber', () => {
  let subscriber: CustomerEventsSubscriber;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    const gateway = { server: { of: jest.fn().mockReturnValue({ to }) } } as never;
    subscriber = new CustomerEventsSubscriber(config, gateway);
  });

  it('emits a job event only to that customer\'s room', () => {
    subscriber.handleMessage(
      'assignment:co-1',
      JSON.stringify({
        type: 'JOB_CHANGED',
        companyId: 'co-1',
        payload: { jobId: 'job-1', customerId: 'cust-1', change: 'STATUS', status: 'EN_ROUTE' },
      }),
    );

    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith('customer:cust-1');
    expect(emit).toHaveBeenCalledWith('job_changed', expect.objectContaining({
      jobId: 'job-1', change: 'STATUS', status: 'EN_ROUTE',
    }));
  });

  it('drops an event with no customerId rather than broadcasting it', () => {
    subscriber.handleMessage(
      'assignment:co-1',
      JSON.stringify({ type: 'JOB_CHANGED', companyId: 'co-1', payload: { jobId: 'job-1', change: 'STATUS' } }),
    );

    expect(to).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('never leaks fields naming other parties into the payload', () => {
    subscriber.handleMessage(
      'assignment:co-1',
      JSON.stringify({
        type: 'JOB_CHANGED',
        companyId: 'co-1',
        payload: {
          jobId: 'job-1', customerId: 'cust-1', change: 'STATUS',
          assignedToName: 'Tech Bob', customerName: 'Other Person',
        },
      }),
    );

    const sent = emit.mock.calls[0][1];
    expect(sent.assignedToName).toBeUndefined();
    expect(sent.customerName).toBeUndefined();
  });

  it('routes finance events to quote_changed / invoice_changed', () => {
    subscriber.handleMessage(
      'finance:co-1',
      JSON.stringify({
        type: 'INVOICE_CHANGED',
        companyId: 'co-1',
        payload: { type: 'INVOICE_CHANGED', documentId: 'inv-1', customerId: 'cust-2', change: 'PAID' },
      }),
    );

    expect(to).toHaveBeenCalledWith('customer:cust-2');
    expect(emit).toHaveBeenCalledWith('invoice_changed', expect.objectContaining({ documentId: 'inv-1' }));
  });

  it('swallows malformed JSON without throwing', () => {
    expect(() => subscriber.handleMessage('assignment:co-1', 'not json')).not.toThrow();
    expect(emit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- customer-events`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement the subscriber**

```ts
// apps/comms-service/src/customer-events/customer-events.subscriber.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MessagingGateway } from '../messaging/messaging.gateway';

const JOB_CHANNEL_PATTERN = 'assignment:*';
const FINANCE_CHANNEL_PATTERN = 'finance:*';

/** Slimmed shapes actually sent to a customer socket. */
export interface CustomerJobEvent {
  jobId: string;
  change: string;
  status?: string;
  scheduledStart?: string | null;
}

export interface CustomerFinanceEvent {
  documentId: string;
  change: string;
  status?: string;
  documentNumber?: string;
  total?: string;
  currency?: string;
}

export type CustomerEvent =
  | { kind: 'job'; customerId: string; companyId: string; event: CustomerJobEvent }
  | { kind: 'quote' | 'invoice'; customerId: string; companyId: string; event: CustomerFinanceEvent };

type Listener = (evt: CustomerEvent) => void;

/**
 * Subscribes to job + finance events and fans them out to the owning
 * customer's private room only.
 *
 * Every comms instance runs its own subscriber and serves its own connected
 * sockets, so fan-out happens at the Redis layer — which is why this path
 * needs no Socket.IO Redis adapter.
 */
@Injectable()
export class CustomerEventsSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomerEventsSubscriber.name);
  private readonly client: Redis;
  private readonly listeners = new Set<Listener>();
  private warnedOnce = false;

  constructor(
    private readonly config: ConfigService,
    private readonly gateway: MessagingGateway,
  ) {
    const common = {
      maxRetriesPerRequest: null as null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => Math.min(times * 500, 5_000),
      lazyConnect: true,
    };
    const url = this.config.get<string>('REDIS_URL');
    this.client = url
      ? new Redis(url, common)
      : new Redis({
          host: this.config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(this.config.get<string | number>('REDIS_PORT', 6379)),
          password: this.config.get<string>('REDIS_PASSWORD'),
          ...common,
        });
    this.client.on('error', (err) => {
      if (this.warnedOnce) return;
      this.warnedOnce = true;
      this.logger.warn(`Redis unavailable — customer realtime paused: ${err.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      await this.client.psubscribe(JOB_CHANNEL_PATTERN, FINANCE_CHANNEL_PATTERN);
      this.client.on('pmessage', (_pattern: string, channel: string, raw: string) => {
        this.handleMessage(channel, raw);
      });
      this.logger.log('Customer events subscriber started (assignment:* + finance:*)');
    } catch (err) {
      this.logger.warn(
        `Customer events subscriber failed to start: ${(err as Error).message}`,
      );
    }
  }

  /** Register an extra consumer (used by the push-trigger module). */
  onCustomerEvent(listener: Listener): void {
    this.listeners.add(listener);
  }

  /** Parsing + routing core. Split out from the Redis wiring so it is unit-testable. */
  handleMessage(channel: string, raw: string): void {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return; // A malformed message must never kill the subscriber.
    }

    const payload = parsed?.payload;
    const customerId: string | undefined = payload?.customerId;
    // No customerId means we cannot prove who owns this event. Dropping it is
    // the guard against fanning another customer's data out to the wrong room.
    if (!customerId) return;

    const companyId: string = parsed?.companyId ?? channel.split(':')[1] ?? '';

    if (channel.startsWith('assignment:')) {
      const event: CustomerJobEvent = {
        jobId: payload.jobId,
        change: payload.change,
        status: payload.status,
        scheduledStart: payload.scheduledStart ?? null,
      };
      this.dispatch('job_changed', customerId, event);
      this.notify({ kind: 'job', customerId, companyId, event });
      return;
    }

    if (channel.startsWith('finance:')) {
      const isInvoice = payload.type === 'INVOICE_CHANGED';
      const event: CustomerFinanceEvent = {
        documentId: payload.documentId,
        change: payload.change,
        status: payload.status,
        documentNumber: payload.documentNumber,
        total: payload.total,
        currency: payload.currency,
      };
      this.dispatch(isInvoice ? 'invoice_changed' : 'quote_changed', customerId, event);
      this.notify({ kind: isInvoice ? 'invoice' : 'quote', customerId, companyId, event });
    }
  }

  private dispatch(eventName: string, customerId: string, body: unknown): void {
    try {
      this.gateway.server?.of('/chat').to(`customer:${customerId}`).emit(eventName, body);
    } catch (err) {
      this.logger.debug?.(`customer emit skipped: ${(err as Error).message}`);
    }
  }

  private notify(evt: CustomerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(evt);
      } catch (err) {
        this.logger.warn(`customer event listener failed: ${(err as Error).message}`);
      }
    }
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
```

- [ ] **Step 8: Create the module and register it**

```ts
// apps/comms-service/src/customer-events/customer-events.module.ts
import { Module } from '@nestjs/common';
import { CustomerEventsSubscriber } from './customer-events.subscriber';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  providers: [CustomerEventsSubscriber],
  exports: [CustomerEventsSubscriber],
})
export class CustomerEventsModule {}
```

`MessagingModule` must export `MessagingGateway` for this injection to resolve — add it to that module's `exports` array if it is not already listed.

In `apps/comms-service/src/app.module.ts`, add the import and list `CustomerEventsModule` in `imports` after `MessagingModule`.

- [ ] **Step 9: Run tests to verify they pass**

Run: `pnpm --filter comms-service test -- customer-events`
Expected: PASS — all 5 subscriber tests green.

Run: `pnpm --filter comms-service test`
Expected: PASS, no regressions.

Run: `pnpm --filter comms-service build`
Expected: compiles cleanly.

- [ ] **Step 10: Commit**

```bash
git add apps/comms-service/src/customer-events apps/comms-service/src/messaging apps/comms-service/src/app.module.ts
git commit -m "feat(comms-service): customer-scoped realtime rooms and event fan-out"
```

---

### Task 6: comms — message_new fan-out to the customer room

**Files:**
- Modify: `apps/comms-service/src/messaging/messaging.gateway.ts`
- Modify: `apps/comms-service/src/messaging/messaging.gateway.spec.ts`

**Interfaces:**
- Consumes: the `customer:{customerId}` room joined in Task 5.
- Produces: socket event `message_new` on `/chat`, addressed to `customer:{customerId}` — consumed by the mobile client's unread badge in M3.

- [ ] **Step 1: Write the failing test**

Add to `apps/comms-service/src/messaging/messaging.gateway.spec.ts`:

```ts
describe('MessagingGateway — customer message fan-out', () => {
  it('emits message_new to the customer room, distinct from the thread event', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const gateway = new MessagingGateway({} as never);
    (gateway as any).server = { to };

    gateway.notifyCustomerOfMessage('cust-1', { threadId: 'th-1', messageId: 'm-1' });

    expect(to).toHaveBeenCalledWith('customer:cust-1');
    expect(emit).toHaveBeenCalledWith('message_new', { threadId: 'th-1', messageId: 'm-1' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- messaging.gateway`
Expected: FAIL — `gateway.notifyCustomerOfMessage is not a function`.

- [ ] **Step 3: Implement the fan-out method**

Add to `MessagingGateway`:

```ts
  /**
   * Tells a customer a message landed somewhere, so unread badges update while
   * they are not viewing that thread. Deliberately a different event name from
   * the thread-room `new_message`, so a client listening to both can tell
   * "arrived in the thread I'm reading" from "arrived elsewhere" without
   * deduplicating identical events.
   */
  notifyCustomerOfMessage(customerId: string, body: { threadId: string; messageId: string }): void {
    if (!customerId) return;
    this.server?.to(`customer:${customerId}`).emit('message_new', body);
  }
```

- [ ] **Step 4: Call it where staff messages are persisted**

In the gateway's message-send handler (the `@SubscribeMessage` that persists and broadcasts a message), after the existing broadcast to the thread room, notify the thread's customer when the sender is **not** that customer:

```ts
    const customerId = thread?.customerId;
    if (customerId && client.customerId !== customerId) {
      this.notifyCustomerOfMessage(customerId, { threadId: data.threadId, messageId: saved.id });
    }
```

Use whatever the surrounding handler already calls the persisted message and the loaded thread; if the handler does not currently load the thread's `customerId`, select it alongside the existing thread lookup rather than adding a second query.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter comms-service test -- messaging.gateway`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/comms-service/src/messaging
git commit -m "feat(comms-service): fan out message_new to the customer room for unread badges"
```

---

### Task 7: comms — customer push endpoint + event-driven triggers

**Files:**
- Create: `apps/comms-service/src/customer-notifications/customer-notifications.service.ts`
- Create: `apps/comms-service/src/customer-notifications/customer-notifications.controller.ts`
- Create: `apps/comms-service/src/customer-notifications/customer-push.dto.ts`
- Create: `apps/comms-service/src/customer-notifications/customer-notifications.module.ts`
- Create: `apps/comms-service/src/customer-notifications/customer-notifications.service.spec.ts`
- Modify: `apps/comms-service/src/app.module.ts`

**Interfaces:**
- Consumes: `CustomerEventsSubscriber.onCustomerEvent(listener)` and the `CustomerEvent` type (Task 5); `NotificationsService.sendPush(req: SendPushRequest)` where `SendPushRequest = { companyId, customerId?, jobId?, recipientId, recipientName?, pushToken, title, body, data?, scheduledAt? }`.
- Produces: `CustomerNotificationsService.pushToCustomer(input: CustomerPushInput): Promise<{ sent: boolean; reason?: string }>` where `CustomerPushInput = { companyId: string; customerId: string; title: string; body: string; data?: Record<string,string>; jobId?: string; dedupeKey?: string }`, and `POST /notifications/customer-push` — Task 8's reminder worker calls that route.

- [ ] **Step 1: Write the failing test**

```ts
// apps/comms-service/src/customer-notifications/customer-notifications.service.spec.ts
import { CustomerNotificationsService } from './customer-notifications.service';

describe('CustomerNotificationsService', () => {
  let service: CustomerNotificationsService;
  const notifications = { sendPush: jest.fn().mockResolvedValue({ id: 'n-1' }) };
  const prisma = { notification: { findFirst: jest.fn().mockResolvedValue(null) } };
  const crm = { getCustomerPushRecipient: jest.fn() };
  const subscriber = { onCustomerEvent: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.notification.findFirst.mockResolvedValue(null);
    crm.getCustomerPushRecipient.mockResolvedValue({
      recipientId: 'u-9', recipientName: 'Sam', pushToken: 'ExponentPushToken[abc]',
    });
    service = new CustomerNotificationsService(
      notifications as never, prisma as never, crm as never, subscriber as never,
    );
  });

  it('sends a push resolved from the customer\'s push token', async () => {
    const result = await service.pushToCustomer({
      companyId: 'co-1', customerId: 'cust-1',
      title: 'Your technician is on the way', body: 'Arriving soon',
      data: { type: 'job_status', jobId: 'job-1' }, jobId: 'job-1',
    });

    expect(result.sent).toBe(true);
    expect(notifications.sendPush).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'co-1', customerId: 'cust-1', recipientId: 'u-9',
      pushToken: 'ExponentPushToken[abc]',
      data: { type: 'job_status', jobId: 'job-1' },
    }));
  });

  it('skips silently when the customer has no push token', async () => {
    crm.getCustomerPushRecipient.mockResolvedValue(null);

    const result = await service.pushToCustomer({
      companyId: 'co-1', customerId: 'cust-1', title: 'T', body: 'B',
    });

    expect(result).toEqual({ sent: false, reason: 'no-token' });
    expect(notifications.sendPush).not.toHaveBeenCalled();
  });

  it('skips a duplicate when a notification already exists for the dedupeKey', async () => {
    prisma.notification.findFirst.mockResolvedValue({ id: 'existing' });

    const result = await service.pushToCustomer({
      companyId: 'co-1', customerId: 'cust-1', title: 'T', body: 'B',
      dedupeKey: 'job-reminder:job-1:2026-08-20',
    });

    expect(result).toEqual({ sent: false, reason: 'duplicate' });
    expect(notifications.sendPush).not.toHaveBeenCalled();
  });

  it('pushes on EN_ROUTE but not on a customer-initiated job creation', () => {
    service.handleCustomerEvent({
      kind: 'job', customerId: 'cust-1', companyId: 'co-1',
      event: { jobId: 'job-1', change: 'STATUS', status: 'EN_ROUTE' },
    });
    expect(notifications.sendPush).toHaveBeenCalledTimes(0); // async path
    expect(crm.getCustomerPushRecipient).toHaveBeenCalledWith('co-1', 'cust-1');

    jest.clearAllMocks();
    service.handleCustomerEvent({
      kind: 'job', customerId: 'cust-1', companyId: 'co-1',
      event: { jobId: 'job-2', change: 'CREATED', status: 'PENDING' },
    });
    expect(crm.getCustomerPushRecipient).not.toHaveBeenCalled();
  });

  it('pushes on quote SENT but not on customer approve/decline', () => {
    service.handleCustomerEvent({
      kind: 'quote', customerId: 'cust-1', companyId: 'co-1',
      event: { documentId: 'q-1', change: 'SENT' },
    });
    expect(crm.getCustomerPushRecipient).toHaveBeenCalled();

    jest.clearAllMocks();
    service.handleCustomerEvent({
      kind: 'quote', customerId: 'cust-1', companyId: 'co-1',
      event: { documentId: 'q-1', change: 'APPROVED' },
    });
    expect(crm.getCustomerPushRecipient).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter comms-service test -- customer-notifications`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the CRM recipient client**

```ts
// apps/comms-service/src/customer-notifications/customer-push.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomerPushDto {
  @ApiProperty() @IsString() companyId!: string;
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() @MaxLength(120) title!: string;
  @ApiProperty() @IsString() @MaxLength(400) body!: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() data?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsString() jobId?: string;
  @ApiPropertyOptional({ description: 'Idempotency key; a second send with the same key is skipped.' })
  @IsOptional() @IsString() dedupeKey?: string;
}
```

Add the recipient lookup to the existing CRM-facing client used by comms. Follow the auth-header pattern already in `apps/comms-service/src/company-settings/company-settings.client.ts` (dev-bypass headers when `BYPASS_AUTH`, otherwise a short-lived HS256 system token). Add a method that returns the customer's portal user and push token, or `null`:

```ts
  /** The CompanyUser (role=customer) for this customer, with its push token. */
  async getCustomerPushRecipient(
    companyId: string,
    customerId: string,
  ): Promise<{ recipientId: string; recipientName?: string; pushToken: string } | null> {
    try {
      const res = await fetch(
        `${CRM_SERVICE_URL}/customers/${customerId}/portal-user`,
        { headers: this.authHeaders(companyId), signal: AbortSignal.timeout(5_000) },
      );
      if (!res.ok) return null;
      const user = (await res.json()) as { id: string; name?: string; pushToken?: string | null };
      if (!user?.pushToken) return null;
      return { recipientId: user.id, recipientName: user.name, pushToken: user.pushToken };
    } catch (err) {
      this.logger.warn(`customer push recipient lookup failed: ${(err as Error).message}`);
      return null;
    }
  }
```

crm-service must expose that route. Add to `apps/crm-service/src/customers/customers.controller.ts`:

```ts
  @Get(':id/portal-user')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: "Portal CompanyUser for a customer, including push token (service-to-service)" })
  getPortalUser(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customersService.getPortalUser(user.companyId, id);
  }
```

and in `customers.service.ts`:

```ts
  /** The role=customer CompanyUser linked to this customer, or null. */
  async getPortalUser(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
      select: { email: true },
    });
    if (!customer?.email) return null;
    return this.prisma.companyUser.findFirst({
      where: { companyId, email: customer.email, role: 'customer' },
      select: { id: true, name: true, pushToken: true },
    });
  }
```

- [ ] **Step 4: Implement the service**

```ts
// apps/comms-service/src/customer-notifications/customer-notifications.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompanySettingsClient } from '../company-settings/company-settings.client';
import { CustomerEventsSubscriber, type CustomerEvent } from '../customer-events/customer-events.subscriber';

export interface CustomerPushInput {
  companyId: string;
  customerId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  jobId?: string;
  dedupeKey?: string;
}

/** Job statuses worth interrupting a customer for, with their copy. */
const JOB_STATUS_COPY: Record<string, { title: string; body: string }> = {
  SCHEDULED: { title: 'Your service is scheduled', body: 'Tap to see the details.' },
  EN_ROUTE:  { title: 'Your technician is on the way', body: 'Tap to track the visit.' },
  ON_SITE:   { title: 'Your technician has arrived', body: 'Work is starting shortly.' },
  COMPLETED: { title: 'Service completed', body: 'Tap to review the visit.' },
  CANCELLED: { title: 'Your service was cancelled', body: 'Tap for details.' },
};

const QUOTE_COPY: Record<string, { title: string; body: string }> = {
  SENT: { title: 'New quote ready to review', body: 'Tap to view and respond.' },
};

const INVOICE_COPY: Record<string, { title: string; body: string }> = {
  SENT:    { title: 'New invoice', body: 'Tap to view your invoice.' },
  OVERDUE: { title: 'Invoice overdue', body: 'Tap to settle your balance.' },
  PAID:    { title: 'Payment received', body: 'Thank you — tap for your receipt.' },
};

@Injectable()
export class CustomerNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(CustomerNotificationsService.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly crm: CompanySettingsClient,
    private readonly subscriber: CustomerEventsSubscriber,
  ) {}

  onModuleInit() {
    this.subscriber.onCustomerEvent((evt) => this.handleCustomerEvent(evt));
  }

  /** Single path for "notify a customer by push" — resolves the token and dedupes. */
  async pushToCustomer(input: CustomerPushInput): Promise<{ sent: boolean; reason?: string }> {
    if (input.dedupeKey) {
      const existing = await this.prisma.notification.findFirst({
        where: { companyId: input.companyId, dedupeKey: input.dedupeKey },
        select: { id: true },
      });
      if (existing) return { sent: false, reason: 'duplicate' };
    }

    const recipient = await this.crm.getCustomerPushRecipient(input.companyId, input.customerId);
    if (!recipient) return { sent: false, reason: 'no-token' };

    await this.notifications.sendPush({
      companyId: input.companyId,
      customerId: input.customerId,
      jobId: input.jobId,
      recipientId: recipient.recipientId,
      recipientName: recipient.recipientName,
      pushToken: recipient.pushToken,
      title: input.title,
      body: input.body,
      data: input.data,
      dedupeKey: input.dedupeKey,
    } as never);

    return { sent: true };
  }

  /**
   * Maps a realtime event to a push, or to nothing. Customer-initiated changes
   * (they created the job, they approved the quote) are deliberately silent —
   * the customer already knows.
   */
  handleCustomerEvent(evt: CustomerEvent): void {
    const send = (title: string, body: string, data: Record<string, string>, jobId?: string) => {
      void this.pushToCustomer({
        companyId: evt.companyId, customerId: evt.customerId, title, body, data, jobId,
      }).catch((err) => this.logger.warn(`customer push failed: ${err.message}`));
    };

    if (evt.kind === 'job') {
      if (evt.event.change !== 'STATUS') return;
      const copy = JOB_STATUS_COPY[String(evt.event.status ?? '')];
      if (!copy) return;
      send(copy.title, copy.body, { type: 'job_status', jobId: evt.event.jobId }, evt.event.jobId);
      return;
    }

    if (evt.kind === 'quote') {
      const copy = QUOTE_COPY[evt.event.change];
      if (!copy) return;
      send(copy.title, copy.body, { type: 'quote', quoteId: evt.event.documentId });
      return;
    }

    const copy = INVOICE_COPY[evt.event.change];
    if (!copy) return;
    send(copy.title, copy.body, { type: 'invoice', invoiceId: evt.event.documentId });
  }
}
```

- [ ] **Step 5: Add the dedupeKey column**

`pushToCustomer` and `sendPush` both reference `dedupeKey` on `Notification`. Add it to the comms Prisma schema:

```prisma
model Notification {
  // ...existing fields...
  dedupeKey String?

  @@index([companyId, dedupeKey])
}
```

Thread it through `SendPushRequest` and the `notification.create` data in `NotificationsService.sendPush`:

```ts
export interface SendPushRequest {
  // ...existing fields...
  dedupeKey?: string;
}
```

```ts
      data: {
        // ...existing fields...
        dedupeKey: req.dedupeKey,
      },
```

comms is PostgreSQL (its schema header notes it was migrated off MongoDB — `CLAUDE.md` is stale on this point), and `Notification` has no `@@map`, so the table is `"comms"."Notification"`. Add a migration entry to `scripts/apply-migrations.mjs`, immediately before the array's closing `];`:

```js
  {
    schema: 'comms',
    name: '20260819000000_add_notification_dedupe_key',
    sql: `
ALTER TABLE "comms"."Notification" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;
CREATE INDEX IF NOT EXISTS "Notification_companyId_dedupeKey_idx" ON "comms"."Notification"("companyId", "dedupeKey");
    `.trim(),
  },
```

Then:

```bash
node scripts/apply-migrations.mjs
pnpm --filter comms-service prisma:generate
```

Expected: `[apply] 20260819000000_add_notification_dedupe_key …` then `[ok]` under `=== Schema: comms ===`, and a clean client regeneration.

- [ ] **Step 6: Add the controller and module**

```ts
// apps/comms-service/src/customer-notifications/customer-notifications.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerNotificationsService } from './customer-notifications.service';
import { CustomerPushDto } from './customer-push.dto';

/**
 * Service-to-service only (job-service's reminder sweep). Unguarded for the
 * same reason as the activity-log ingest route: it is reached over the internal
 * network and carries no user context to authenticate against.
 */
@ApiTags('Customer Notifications')
@Controller('notifications')
export class CustomerNotificationsController {
  constructor(private readonly service: CustomerNotificationsService) {}

  @Post('customer-push')
  @ApiOperation({ summary: 'Send a push to a customer, resolving their token and deduping' })
  send(@Body() dto: CustomerPushDto) {
    return this.service.pushToCustomer(dto);
  }
}
```

```ts
// apps/comms-service/src/customer-notifications/customer-notifications.module.ts
import { Module } from '@nestjs/common';
import { CustomerNotificationsService } from './customer-notifications.service';
import { CustomerNotificationsController } from './customer-notifications.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';
import { CustomerEventsModule } from '../customer-events/customer-events.module';

@Module({
  imports: [NotificationsModule, PrismaModule, CompanySettingsModule, CustomerEventsModule],
  controllers: [CustomerNotificationsController],
  providers: [CustomerNotificationsService],
  exports: [CustomerNotificationsService],
})
export class CustomerNotificationsModule {}
```

Register `CustomerNotificationsModule` in `apps/comms-service/src/app.module.ts`'s `imports`.

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm --filter comms-service test -- customer-notifications`
Expected: PASS — all 5 tests green.

Run: `pnpm --filter comms-service test`
Expected: PASS, no regressions.

Run: `pnpm --filter comms-service build` and `pnpm --filter crm-service build`
Expected: both compile cleanly.

- [ ] **Step 8: Commit**

```bash
git add apps/comms-service/src/customer-notifications apps/comms-service/src/notifications apps/comms-service/prisma/schema.prisma apps/crm-service/src/customers
git commit -m "feat(comms-service): customer push endpoint and event-driven triggers"
```

---

### Task 8: job-service — appointment reminder sweep

**Files:**
- Create: `apps/job-service/src/reminders/reminders.service.ts`
- Create: `apps/job-service/src/reminders/reminders.module.ts`
- Create: `apps/job-service/src/reminders/reminders.service.spec.ts`
- Modify: `apps/job-service/src/app.module.ts`

**Interfaces:**
- Consumes: `POST {COMMS_SERVICE_URL}/notifications/customer-push` with body `{ companyId, customerId, title, body, data, jobId, dedupeKey }` (Task 7).
- Produces: `RemindersService.sweep(): Promise<{ scanned: number; sent: number }>` — the unit-testable core, called on an interval.

- [ ] **Step 1: Write the failing test**

```ts
// apps/job-service/src/reminders/reminders.service.spec.ts
import { RemindersService } from './reminders.service';

describe('RemindersService.sweep', () => {
  const mockPrisma: any = { job: { findMany: jest.fn() } };
  const post = jest.fn().mockResolvedValue({ data: { sent: true } });
  const http: any = { post };
  let service: RemindersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RemindersService(mockPrisma, http);
  });

  it('sends one reminder per upcoming job, keyed for idempotency', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      {
        id: 'job-1', companyId: 'co-1', customerId: 'cust-1',
        title: 'AC service', scheduledStart: new Date('2026-08-20T09:00:00Z'),
      },
    ]);

    const result = await service.sweep();

    expect(result).toEqual({ scanned: 1, sent: 1 });
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/notifications/customer-push'),
      expect.objectContaining({
        companyId: 'co-1',
        customerId: 'cust-1',
        dedupeKey: 'job-reminder:job-1:2026-08-20',
        data: { type: 'job_reminder', jobId: 'job-1' },
      }),
      expect.anything(),
    );
  });

  it('skips jobs with no customerId rather than sending an unaddressed push', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      { id: 'job-2', companyId: 'co-1', customerId: null, title: 'X', scheduledStart: new Date() },
    ]);

    const result = await service.sweep();

    expect(result).toEqual({ scanned: 1, sent: 0 });
    expect(post).not.toHaveBeenCalled();
  });

  it('keeps sweeping when one push call fails', async () => {
    mockPrisma.job.findMany.mockResolvedValue([
      { id: 'job-1', companyId: 'co-1', customerId: 'c1', title: 'A', scheduledStart: new Date('2026-08-20T09:00:00Z') },
      { id: 'job-3', companyId: 'co-1', customerId: 'c2', title: 'B', scheduledStart: new Date('2026-08-20T11:00:00Z') },
    ]);
    post.mockRejectedValueOnce(new Error('comms down'));

    const result = await service.sweep();

    expect(result.scanned).toBe(2);
    expect(result.sent).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter job-service test -- reminders`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the service**

```ts
// apps/job-service/src/reminders/reminders.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const COMMS_URL = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';
const SWEEP_INTERVAL_MS = 15 * 60 * 1000; // every 15 min
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // jobs starting within 24h

/**
 * Appointment reminders.
 *
 * A sweep rather than delayed jobs: it re-reads current job state every run, so
 * a reschedule or cancellation needs no cancellation bookkeeping. Idempotency
 * is comms' job via dedupeKey, which is keyed on the scheduled DATE — so a
 * rescheduled booking legitimately earns a new reminder while repeated sweeps
 * of an unchanged booking do not.
 *
 * This lives in job-service because the sweep spans every tenant, which is one
 * local query here versus enumerate-companies-then-N-HTTP-calls from comms.
 */
@Injectable()
export class RemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RemindersService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: AxiosInstance = axios,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.sweep().catch((err) => this.logger.warn(`reminder sweep failed: ${err.message}`));
    }, SWEEP_INTERVAL_MS);
    // Do not block boot on the first sweep.
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async sweep(): Promise<{ scanned: number; sent: number }> {
    const now = new Date();
    const until = new Date(now.getTime() + LOOKAHEAD_MS);

    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStart: { gte: now, lte: until },
      },
      select: { id: true, companyId: true, customerId: true, title: true, scheduledStart: true },
    });

    let sent = 0;
    for (const job of jobs) {
      if (!job.customerId) continue;
      const day = job.scheduledStart!.toISOString().slice(0, 10);
      try {
        await this.http.post(
          `${COMMS_URL}/notifications/customer-push`,
          {
            companyId: job.companyId,
            customerId: job.customerId,
            title: 'Reminder: service tomorrow',
            body: job.title ? `${job.title} — tap for details.` : 'Tap for details.',
            data: { type: 'job_reminder', jobId: job.id },
            jobId: job.id,
            dedupeKey: `job-reminder:${job.id}:${day}`,
          },
          { timeout: 8_000 },
        );
        sent += 1;
      } catch (err) {
        // One bad tenant must not abort the sweep for everyone else.
        this.logger.warn(`reminder for job ${job.id} failed: ${(err as Error).message}`);
      }
    }

    return { scanned: jobs.length, sent };
  }
}
```

- [ ] **Step 4: Create the module and register it**

```ts
// apps/job-service/src/reminders/reminders.module.ts
import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Module({ providers: [RemindersService] })
export class RemindersModule {}
```

Register `RemindersModule` in `apps/job-service/src/app.module.ts`'s `imports`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter job-service test -- reminders`
Expected: PASS — all 3 tests green.

Run: `pnpm --filter job-service test`
Expected: PASS, no regressions.

Run: `pnpm --filter job-service build`
Expected: compiles cleanly.

- [ ] **Step 6: Commit**

```bash
git add apps/job-service/src/reminders apps/job-service/src/app.module.ts
git commit -m "feat(job-service): appointment reminder sweep pushing via comms"
```

---

### Task 9: End-to-end verification against running services

**Files:**
- No source changes — verification only.

**Interfaces:**
- Consumes: everything built in Tasks 1-8.
- Produces: confirmation that a customer socket receives its own events and no one else's.

- [ ] **Step 1: Start the stack**

```bash
docker compose up -d redis
pnpm --filter crm-service dev &
pnpm --filter job-service dev &
pnpm --filter finance-service dev &
pnpm --filter comms-service dev &
```

Wait for each to log a successful boot, then confirm health:

```bash
curl -s localhost:3001/health; curl -s localhost:3002/health; curl -s localhost:3004/health; curl -s localhost:3005/health
```
Expected: each returns a JSON body containing `"status":"ok"`.

- [ ] **Step 2: Connect two customer sockets**

Save as `/tmp/two-customers.mjs` and run with `node /tmp/two-customers.mjs`:

```js
import { io } from 'socket.io-client';

function connect(label, customerId) {
  const s = io('http://localhost:3005/chat', {
    transports: ['websocket'],
    query: { companyId: 'co-demo-001', userId: `u-${customerId}`, userRole: 'customer', customerId },
  });
  s.on('connect', () => console.log(`[${label}] connected`));
  for (const evt of ['job_changed', 'quote_changed', 'invoice_changed', 'message_new']) {
    s.on(evt, (d) => console.log(`[${label}] ${evt}`, JSON.stringify(d)));
  }
  return s;
}

connect('A', process.argv[2]);
connect('B', process.argv[3]);
```

Run it with two real customer ids from the demo tenant:

```bash
node /tmp/two-customers.mjs <customerIdA> <customerIdB>
```

- [ ] **Step 3: Trigger a status change for customer A's job**

```bash
curl -s -X PATCH "http://localhost:3002/jobs/<jobIdOwnedByA>" \
  -H "Content-Type: application/json" \
  -H "x-test-company-id: co-demo-001" -H "x-test-user-id: u-1" \
  -H "x-test-user-role: dispatcher" -H "x-test-user-email: d@x.com" \
  -d '{"status":"EN_ROUTE"}'
```

Expected in the socket console: `[A] job_changed {"jobId":"...","change":"STATUS","status":"EN_ROUTE",...}` and **nothing at all for B**. B receiving anything here is the cross-customer leak and must fail the task.

- [ ] **Step 4: Confirm the payload is slimmed**

Inspect the `[A] job_changed` line printed above.
Expected: it contains `jobId`, `change`, `status`, `scheduledStart` — and does **not** contain `assignedToName` or `customerName`.

- [ ] **Step 5: Trigger a finance event**

Send an invoice belonging to customer A:

```bash
curl -s -X PATCH "http://localhost:3004/invoices/<invoiceIdOwnedByA>/send" \
  -H "x-test-company-id: co-demo-001" -H "x-test-user-id: u-1" \
  -H "x-test-user-role: company_admin" -H "x-test-user-email: a@x.com"
```

Expected: `[A] invoice_changed {"documentId":"...","change":"SENT",...}`, nothing for B.

- [ ] **Step 6: Verify push dedupe**

Call the customer-push endpoint twice with the same key:

```bash
for i in 1 2; do
  curl -s -X POST localhost:3005/notifications/customer-push \
    -H "Content-Type: application/json" \
    -d '{"companyId":"co-demo-001","customerId":"<customerIdA>","title":"T","body":"B","dedupeKey":"verify-once"}'
  echo ""
done
```

Expected: the first returns `{"sent":true}` (or `{"sent":false,"reason":"no-token"}` if that customer has never opened a mobile app — either is fine); the second returns `{"sent":false,"reason":"duplicate"}`.

- [ ] **Step 7: Record the results**

Note in the final report which checks passed, and explicitly state that Step 3 confirmed customer B received nothing. If any service could not be started locally, say so plainly rather than implying the check ran.

---

## Self-Review Notes

- **Spec coverage:** `customerId` on job events → Task 1. FinanceEventsPublisher + `finance:*` channel → Task 2; quote sites → Task 3; invoice sites → Task 4. Gateway customer room + `CustomerEventsSubscriber` with drop-on-missing-customerId and slimmed payloads → Task 5. `message_new` fan-out → Task 6. Push triggers, the single `POST /notifications/customer-push` path, token resolution and dedupe → Task 7. Reminder sweep in job-service → Task 8. The spec's testing section maps onto Tasks 1-8's unit tests plus the Task 9 end-to-end pass.
- **Placeholder scan:** none — every code step carries literal code.
- **Type consistency:** `FinanceChangedPayload` (Task 2) is the exact shape published in Tasks 3-4 and parsed in Task 5. `CustomerEvent` / `onCustomerEvent` (Task 5) are what Task 7 consumes. `CustomerPushInput` fields match `CustomerPushDto` and the body Task 8 POSTs (`companyId`, `customerId`, `title`, `body`, `data`, `jobId`, `dedupeKey`).
- **Two places the implementer must confirm against live code rather than trusting this plan:** (1) Task 3's quote decline site and Task 4's `send`/`voidInvoice` sites were inferred from the service's public API, not read line-by-line — locate the actual status-update statement in each and publish immediately after it; (2) Task 6's message-send handler and its thread lookup must be read before wiring the fan-out, since the plan does not reproduce that handler verbatim.
- **Notification.dedupeKey datasource — resolved:** `CLAUDE.md` says comms uses MongoDB, but `apps/comms-service/prisma/schema.prisma` declares `provider = "postgresql"` against the `comms` schema and its header records the migration off Mongo. Task 7 Step 5 therefore uses the standard `scripts/apply-migrations.mjs` path with the literal SQL. Worth correcting `CLAUDE.md` separately — it is stale and would mislead the next person.

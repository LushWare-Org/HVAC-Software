# Kelvin, release 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put Kelvin, one named AI companion, into the admin dashboard. He has a corner presence that speaks up about important things within seconds, a side panel for chat and confirmed actions, notes inside pages, his own desk page, page awareness, and a new "create job" action.

**Architecture:**
- **Server, chat-service:** a new `kelvin` module collects the existing brief, disruption, gap, emergency, reschedule and notification sources into one `KelvinItem` feed, called as the user with their JWT. Kelvin's memory (what he said and did, and each person's speaking preference) lives in two new tables in the analytics schema, written through a BullMQ queue.
- **Admin dashboard:** a `KelvinProvider` polls the feed every 60 s and refreshes instantly on existing live signals. Corner, panel, notes and desk render from it. All motion runs through the Motion library (`LazyMotion` + `domMax`).

**Tech Stack:**
- NestJS 10 (chat-service, analytics-service), Prisma, BullMQ via `@tscrm/queue`
- Go 1.23 / Gin (scheduling-service)
- React 19, Vite, TanStack Query (admin-dashboard)
- `motion` (new), `vitest` (new, dev only)

**Spec:** `docs/superpowers/specs/2026-10-06-kelvin-release-1-design.md`

## Global Constraints

- The name is "Kelvin" for every company and is never configurable.
- He never changes data without a signed confirm card. The existing `signAction` / `confirmAction` flow is the only way writes happen.
- Every visible fact comes from data. The model may reword or order, never invent. The feed itself calls no model.
- No gradients, glows, sparkles or purple. Colours come only from existing CSS tokens (`--t1`, `--t2`, `--t3`, `--bd`, `--bg-card`, `--blue`, `--green`, `--amber`, `--red`). Every colour state also carries a word.
- `prefers-reduced-motion: reduce` turns every move into a ≤120 ms opacity fade; blink and eye-follow stop.
- Touch targets ≥ 44 px. Bubbles go in an `aria-live="polite"` region. ⌘K / Ctrl+K opens the panel, Esc closes it, and focus returns to where it was.
- Kelvin is on only when company settings `features.kelvin === true` (explicit opt-in; this flag is *not* default-on like the others). Off: today's `ChatWidget` shows.
- Feed sources time out after 4 s each. A failed source goes into `unavailable` and never hides the others.
- Speaking:

  | Rule | Value |
  |---|---|
  | Gap between bubbles | at most 1 bubble per 10 minutes |
  | `urgent` items | skip the gap |
  | While a field, select or modal has focus | no bubble |
  | Bubble length | 6 s, paused on hover |
  | Brief | speaks only on the Dashboard |
  | Per person | modes ALL / URGENT_ONLY / NEVER, plus "Quiet for today" |

- Money is in dollars and already formatted by the sources. Never do cents maths.
- Multi-tenancy: every query filters on `company_id`; every service call goes out as the signed-in user.
- **Repo hygiene:**
  - Never commit unless the user asks.
  - When they do, stage files by name; no `.md`, scripts or `.env`; no `Co-Authored-By` or `Claude-Session` trailers.
  - Never deploy without an explicit "deploy".
  - Never run `prisma migrate dev` against crm.
- `pnpm` only.

## Review Focus

1. **Two browser tabs open:** the same item must speak once, not once per tab. Pinned by `speech.test.ts` "shares spoken ids across tabs through storage" (Task 9).
2. **An item expires while its bubble is held back by typing:** it must be dropped, not spoken late. Pinned by `speech.test.ts` "drops an expired item" (Task 9).
3. **Every source failing at once:** Kelvin must say he couldn't check, never "everything is on track". Pinned by `kelvin.service.spec.ts` "all sources down" (Task 3) and `desk.test.ts` "never claims all clear when sources failed" (Task 15).
4. **Hostile or very long text in customer names and titles:** items must be truncated to 140 chars and rendered as plain text. Pinned by `sources.spec.ts` "truncates long titles and strips newlines" (Task 2).
5. **A role without dispatch rights** (e.g. a technician signed into the dashboard) must get an empty feed, not a 403 storm. Pinned by `kelvin.service.spec.ts` "technician gets nothing" (Task 3).

---

## File map

**packages/queue**
- `src/index.ts`: add `QueueName.KELVIN_EVENTS = 'kelvin-events'`

**analytics-service** (Kelvin's memory)
- `prisma/schema.prisma`: models `KelvinEvent`, `KelvinPrefs`
- `prisma/migrations/20261006120000_kelvin/migration.sql`: new
- `src/kelvin/kelvin-log.service.ts`: record, state lookup, today's log, prefs, purge
- `src/kelvin/kelvin.processor.ts`: queue consumer
- `src/kelvin/kelvin.controller.ts`: `POST /kelvin/state`, `GET /kelvin/events`, `GET` and `PUT /kelvin/prefs`
- `src/kelvin/kelvin.module.ts`
- `src/kelvin/kelvin-log.service.spec.ts`
- `src/app.module.ts`: import `KelvinModule`

**chat-service** (the feed, events, create job, page context)
- `src/agent/context.ts`: `agentContext(user, req)` (moved out of `ChatController`)
- `src/kelvin/types.ts`
- `src/kelvin/sources.ts` and `src/kelvin/sources.spec.ts`
- `src/kelvin/kelvin-events.ts`: queue publisher
- `src/kelvin/kelvin.service.ts` and `src/kelvin/kelvin.service.spec.ts`
- `src/kelvin/kelvin.controller.ts`, `src/kelvin/kelvin.module.ts`
- `src/app.module.ts`: import `KelvinModule`
- `src/agent/tools/create-job.ts` and `src/agent/create-job.spec.ts`
- `src/agent/registry.ts`: add `CREATE_JOB`
- `src/agent/action-runner.ts`: use the result summary; publish `ACTION_DONE` / `ACTION_FAILED`
- `src/chat/chat.controller.ts`: page `context` on `/message`; use `agentContext`
- `src/chat/chat.service.ts`: `contextPrompt` gains the on-screen line
- `src/chat/chat.service.spec.ts`: on-screen line tests
- `src/prompts/admin.prompt.ts`: create-job behaviour
- `src/evals/agent.eval.ts`: 3 new scenarios

**scheduling-service**
- `internal/models/models.go`: `WSTypeAvailabilityChanged`
- `internal/handler/slot_handler.go`: `AvailabilityHandler` takes a store and a broadcaster interface and broadcasts after set and clear
- `internal/handler/availability_handler_test.go`: new
- `cmd/server/main.go`: pass `hub`

**admin-dashboard**
- `package.json`: `motion`, devDependency `vitest`, `"test": "vitest run"`
- `src/hooks/useScheduling.ts`: add `'AVAILABILITY_CHANGED'` to `DispatchEvent['type']`
- `src/kelvin/`:
  - `types.ts`, `api.ts`, `speech.ts`, `speech.test.ts`
  - `desk.ts`, `desk.test.ts`
  - `chatStream.ts`, `markdown.tsx`, `motionFeatures.ts`
  - `KelvinFace.tsx`, `KelvinProvider.tsx`, `useKelvinContext.ts`
  - `KelvinCorner.tsx`, `KelvinPanel.tsx`, `ActionCard.tsx`, `KelvinNotes.tsx`
  - `KelvinDesk.tsx`, `KelvinPrefsCard.tsx`, `kelvin.css`
- `src/components/ChatWidget.tsx`: import the stream, markdown and confirm helpers from `src/kelvin/` (behaviour unchanged)
- `src/App.tsx`: provider, corner, panel, `/kelvin` route, ChatWidget only when Kelvin is off
- `src/components/Sidebar.tsx`: "Kelvin" item when on
- `src/pages/Dashboard.tsx`: `KelvinNotes page="dashboard"` replaces the brief, running-behind and freed-time cards when on
- `src/pages/jobs/Jobs.tsx`, `src/pages/scheduling/Scheduling.tsx`: `useKelvinContext` + `KelvinNotes`
- `src/pages/Profile.tsx`: `KelvinPrefsCard` when on

---

### Task 1: Kelvin's memory (analytics-service)

**Files:**
- Modify: `packages/queue/src/index.ts`, the `QueueName` enum
- Modify: `apps/analytics-service/prisma/schema.prisma`, append two models
- Create: `apps/analytics-service/prisma/migrations/20261006120000_kelvin/migration.sql`
- Create: `apps/analytics-service/src/kelvin/kelvin-log.service.ts`
- Create: `apps/analytics-service/src/kelvin/kelvin.processor.ts`
- Create: `apps/analytics-service/src/kelvin/kelvin.controller.ts`
- Create: `apps/analytics-service/src/kelvin/kelvin.module.ts`
- Modify: `apps/analytics-service/src/app.module.ts`, add `KelvinModule` next to `AiUsageModule`
- Test: `apps/analytics-service/src/kelvin/kelvin-log.service.spec.ts`

**Interfaces:**
- Produces, over HTTP for chat-service:
  - `POST /kelvin/state` with `{ itemIds: string[] }` returns `{ spoken: string[]; seen: string[]; dismissed: string[] }`
  - `GET /kelvin/events?since=<ISO>` returns `{ data: Array<{ type; summary; action?; recordRef?; createdAt }> }`, newest first, at most 50
  - `GET /kelvin/prefs` returns `{ speakMode: 'ALL'|'URGENT_ONLY'|'NEVER'; quietUntil: string|null }`
  - `PUT /kelvin/prefs` with `{ speakMode?, quietUntil? }` returns the same shape
- Produces, through the queue:
  - `QueueName.KELVIN_EVENTS` jobs with data
    `KelvinEventInput = { companyId; userId; type; itemId?; action?; recordRef?; summary; confirmedBy? }`
  - `type` is one of `SHOWN | SPOKE | DISMISSED | FIX_USED | ACTION_DONE | ACTION_FAILED`

- [ ] **Step 1: Add the queue name**

In `packages/queue/src/index.ts`, inside `export enum QueueName { … }`, after `AI_USAGE = 'ai-usage',` add:

```ts
  KELVIN_EVENTS = 'kelvin-events',
```

Run: `pnpm --filter @tscrm/queue build`
Expected: exits 0.

- [ ] **Step 2: Add the models**

Append to `apps/analytics-service/prisma/schema.prisma`:

```prisma
// ── Kelvin ──────────────────────────────────────────────────────────────────
// What Kelvin told each person and what he did, written by KelvinProcessor from
// the kelvin-events queue. Feeds "Done today" and stops him repeating himself.
model KelvinEvent {
  id          String   @id @default(uuid())
  companyId   String   @map("company_id")
  userId      String   @map("user_id")
  itemId      String?  @map("item_id")
  type        String
  action      String?
  recordRef   String?  @map("record_ref")
  summary     String
  confirmedBy String?  @map("confirmed_by")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  @@index([companyId, userId, createdAt])
  @@index([companyId, itemId])
  @@map("kelvin_events")
}

// Each person's choice of how chatty Kelvin is.
model KelvinPrefs {
  companyId  String    @map("company_id")
  userId     String    @map("user_id")
  speakMode  String    @default("ALL") @map("speak_mode")
  quietUntil DateTime? @map("quiet_until") @db.Timestamptz(3)
  updatedAt  DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@id([companyId, userId])
  @@map("kelvin_prefs")
}
```

- [ ] **Step 3: Write the migration by hand** (no `migrate dev`; it would need a shadow database)

`apps/analytics-service/prisma/migrations/20261006120000_kelvin/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "kelvin_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT,
    "type" TEXT NOT NULL,
    "action" TEXT,
    "record_ref" TEXT,
    "summary" TEXT NOT NULL,
    "confirmed_by" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kelvin_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "kelvin_events_company_id_user_id_created_at_idx" ON "kelvin_events"("company_id", "user_id", "created_at");
CREATE INDEX "kelvin_events_company_id_item_id_idx" ON "kelvin_events"("company_id", "item_id");

-- CreateTable
CREATE TABLE "kelvin_prefs" (
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "speak_mode" TEXT NOT NULL DEFAULT 'ALL',
    "quiet_until" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "kelvin_prefs_pkey" PRIMARY KEY ("company_id", "user_id")
);
```

Run: `pnpm --filter analytics-service prisma:generate`
Expected: "Generated Prisma Client".

- [ ] **Step 4: Write the failing service test**

`apps/analytics-service/src/kelvin/kelvin-log.service.spec.ts`:

```ts
import { KelvinLogService } from './kelvin-log.service';

function fakePrisma() {
  const events: any[] = [];
  let prefs: any = null;
  return {
    events,
    kelvinEvent: {
      create: jest.fn(async ({ data }) => { events.push({ ...data, createdAt: new Date() }); return data; }),
      findMany: jest.fn(async ({ where }) => events.filter((e) =>
        e.companyId === where.companyId && e.userId === where.userId &&
        (!where.itemId || where.itemId.in.includes(e.itemId)) &&
        (!where.type || (where.type.in ?? [where.type]).includes(e.type)))),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    kelvinPrefs: {
      findUnique: jest.fn(async () => prefs),
      upsert: jest.fn(async ({ create, update }) => { prefs = { ...(prefs ?? create), ...update }; return prefs; }),
    },
  };
}

describe('KelvinLogService', () => {
  it('records an event and trims the summary to 300 characters', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.record({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'gap:1', summary: 'x'.repeat(500) });
    expect(prisma.events[0]).toMatchObject({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'gap:1' });
    expect(prisma.events[0].summary).toHaveLength(300);
  });

  it('ignores unknown event types and events without a company or user', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.record({ companyId: 'co', userId: 'u', type: 'HACKED' as any, summary: 'x' });
    await svc.record({ companyId: '', userId: 'u', type: 'SPOKE', summary: 'x' });
    expect(prisma.events).toHaveLength(0);
  });

  it('reports which items this person was told, saw or dismissed', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.record({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'a', summary: 's' });
    await svc.record({ companyId: 'co', userId: 'u', type: 'DISMISSED', itemId: 'b', summary: 's' });
    await svc.record({ companyId: 'co', userId: 'other', type: 'SPOKE', itemId: 'c', summary: 's' });
    const state = await svc.state('co', 'u', ['a', 'b', 'c']);
    expect(state).toEqual({ spoken: ['a'], seen: [], dismissed: ['b'] });
  });

  it('caps a state lookup at 200 ids', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    await svc.state('co', 'u', Array.from({ length: 500 }, (_, i) => `i${i}`));
    expect(prisma.kelvinEvent.findMany.mock.calls[0][0].where.itemId.in).toHaveLength(200);
  });

  it('defaults preferences and validates the mode', async () => {
    const prisma = fakePrisma();
    const svc = new KelvinLogService(prisma as any);
    expect(await svc.prefs('co', 'u')).toEqual({ speakMode: 'ALL', quietUntil: null });
    await expect(svc.setPrefs('co', 'u', { speakMode: 'LOUD' as any })).rejects.toThrow('speakMode');
    const saved = await svc.setPrefs('co', 'u', { speakMode: 'URGENT_ONLY', quietUntil: '2026-10-06T18:30:00.000Z' });
    expect(saved).toEqual({ speakMode: 'URGENT_ONLY', quietUntil: '2026-10-06T18:30:00.000Z' });
  });
});
```

- [ ] **Step 5: Run it to see it fail**

Run: `pnpm --filter analytics-service test -- kelvin-log`
Expected: FAIL with "Cannot find module './kelvin-log.service'".

- [ ] **Step 6: Implement the service**

`apps/analytics-service/src/kelvin/kelvin-log.service.ts`:

```ts
import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const KELVIN_EVENT_TYPES = ['SHOWN', 'SPOKE', 'DISMISSED', 'FIX_USED', 'ACTION_DONE', 'ACTION_FAILED'] as const;
export type KelvinEventType = (typeof KELVIN_EVENT_TYPES)[number];
export const SPEAK_MODES = ['ALL', 'URGENT_ONLY', 'NEVER'] as const;
export type SpeakMode = (typeof SPEAK_MODES)[number];

export interface KelvinEventInput {
  companyId: string;
  userId: string;
  type: KelvinEventType;
  itemId?: string;
  action?: string;
  recordRef?: string;
  summary: string;
  confirmedBy?: string;
}

export interface KelvinPrefsView { speakMode: SpeakMode; quietUntil: string | null }

const RETENTION_DAYS = 90;
const MAX_IDS = 200;
const cut = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : undefined);

/** Kelvin's memory: what he told each person, what he did, and how chatty they want him. */
@Injectable()
export class KelvinLogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KelvinLogService.name);
  private purgeTimer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Daily, and once shortly after boot. unref so it never holds the process open.
    this.purgeTimer = setInterval(() => void this.purge(), 24 * 60 * 60 * 1000);
    this.purgeTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.purgeTimer) clearInterval(this.purgeTimer);
  }

  async record(e: KelvinEventInput): Promise<void> {
    if (!e?.companyId || !e.userId || !KELVIN_EVENT_TYPES.includes(e.type)) return;
    await this.prisma.kelvinEvent.create({
      data: {
        companyId: e.companyId, userId: e.userId, type: e.type,
        itemId: cut(e.itemId, 200), action: cut(e.action, 60), recordRef: cut(e.recordRef, 120),
        summary: cut(e.summary, 300) ?? '', confirmedBy: cut(e.confirmedBy, 120),
      },
    });
  }

  async state(companyId: string, userId: string, itemIds: string[]) {
    const ids = [...new Set(itemIds.filter((i) => typeof i === 'string'))].slice(0, MAX_IDS);
    if (!ids.length) return { spoken: [], seen: [], dismissed: [] };
    const rows = await this.prisma.kelvinEvent.findMany({
      where: { companyId, userId, itemId: { in: ids }, type: { in: ['SPOKE', 'SHOWN', 'DISMISSED'] } },
      select: { itemId: true, type: true },
    });
    const pick = (t: string) => [...new Set(rows.filter((r: any) => r.type === t).map((r: any) => r.itemId as string))];
    return { spoken: pick('SPOKE'), seen: pick('SHOWN'), dismissed: pick('DISMISSED') };
  }

  async since(companyId: string, userId: string, since: Date) {
    const rows = await this.prisma.kelvinEvent.findMany({
      where: { companyId, userId, createdAt: { gte: since }, type: { in: ['ACTION_DONE', 'ACTION_FAILED', 'SPOKE'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { type: true, summary: true, action: true, recordRef: true, createdAt: true },
    });
    return { data: rows };
  }

  async prefs(companyId: string, userId: string): Promise<KelvinPrefsView> {
    const row = await this.prisma.kelvinPrefs.findUnique({ where: { companyId_userId: { companyId, userId } } });
    return { speakMode: (row?.speakMode as SpeakMode) ?? 'ALL', quietUntil: row?.quietUntil ? new Date(row.quietUntil).toISOString() : null };
  }

  async setPrefs(companyId: string, userId: string, input: { speakMode?: SpeakMode; quietUntil?: string | null }): Promise<KelvinPrefsView> {
    if (input.speakMode !== undefined && !SPEAK_MODES.includes(input.speakMode)) {
      throw new BadRequestException('speakMode must be ALL, URGENT_ONLY or NEVER');
    }
    let quietUntil: Date | null | undefined;
    if (input.quietUntil === null) quietUntil = null;
    else if (input.quietUntil !== undefined) {
      quietUntil = new Date(input.quietUntil);
      if (Number.isNaN(quietUntil.getTime())) throw new BadRequestException('quietUntil must be an ISO date');
    }
    const update = {
      ...(input.speakMode !== undefined && { speakMode: input.speakMode }),
      ...(quietUntil !== undefined && { quietUntil }),
    };
    const row = await this.prisma.kelvinPrefs.upsert({
      where: { companyId_userId: { companyId, userId } },
      create: { companyId, userId, speakMode: input.speakMode ?? 'ALL', quietUntil: quietUntil ?? null },
      update,
    });
    return { speakMode: row.speakMode as SpeakMode, quietUntil: row.quietUntil ? new Date(row.quietUntil).toISOString() : null };
  }

  async purge(): Promise<void> {
    try {
      const before = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
      await this.prisma.kelvinEvent.deleteMany({ where: { createdAt: { lt: before } } });
    } catch (err) {
      this.logger.warn(`Kelvin log purge failed: ${(err as Error).message}`);
    }
  }
}
```

- [ ] **Step 7: Run the tests**

Run: `pnpm --filter analytics-service test -- kelvin-log`
Expected: PASS, 5 tests.

- [ ] **Step 8: Processor, controller and module**

`apps/analytics-service/src/kelvin/kelvin.processor.ts`:

```ts
import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { Worker } from 'bullmq';
import { QueueName, createRedisConnection } from '@tscrm/queue';
import { KelvinLogService, type KelvinEventInput } from './kelvin-log.service';

/** Consumer of the kelvin-events queue (chat-service publishes; this writes). */
@Injectable()
export class KelvinProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(KelvinProcessor.name);
  private readonly worker: Pick<Worker, 'on' | 'close'>;

  constructor(private readonly log: KelvinLogService, @Optional() worker?: Pick<Worker, 'on' | 'close'>) {
    this.worker =
      worker ??
      new Worker(QueueName.KELVIN_EVENTS, async (job) => this.log.record(job.data as KelvinEventInput), {
        connection: createRedisConnection(),
      });
    this.worker.on('failed', (job, err) => this.logger.error(`Kelvin event ${job?.id} failed: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
```

`apps/analytics-service/src/kelvin/kelvin.controller.ts`:

```ts
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { KelvinLogService, type SpeakMode } from './kelvin-log.service';

/** Read side of Kelvin's memory, always scoped to the signed-in person. */
@ApiTags('Kelvin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kelvin')
export class KelvinController {
  constructor(private readonly log: KelvinLogService) {}

  @Post('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Which of these items Kelvin already told, showed or had dismissed, for me' })
  state(@CurrentUser() user: AuthUser, @Body() body: { itemIds?: unknown }) {
    const ids = Array.isArray(body?.itemIds) ? body.itemIds.filter((i): i is string => typeof i === 'string') : [];
    return this.log.state(user.companyId, user.userId, ids);
  }

  @Get('events')
  @ApiOperation({ summary: 'What Kelvin said and did for me since a time (default: last 24 h)' })
  events(@CurrentUser() user: AuthUser, @Query('since') since?: string) {
    const at = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (Number.isNaN(at.getTime())) throw new BadRequestException('since must be an ISO date');
    return this.log.since(user.companyId, user.userId, at);
  }

  @Get('prefs')
  prefs(@CurrentUser() user: AuthUser) {
    return this.log.prefs(user.companyId, user.userId);
  }

  @Put('prefs')
  setPrefs(@CurrentUser() user: AuthUser, @Body() body: { speakMode?: SpeakMode; quietUntil?: string | null }) {
    return this.log.setPrefs(user.companyId, user.userId, body ?? {});
  }
}
```

`apps/analytics-service/src/kelvin/kelvin.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { KelvinController } from './kelvin.controller';
import { KelvinLogService } from './kelvin-log.service';
import { KelvinProcessor } from './kelvin.processor';

@Module({
  controllers: [KelvinController],
  providers: [KelvinLogService, KelvinProcessor],
})
export class KelvinModule {}
```

In `apps/analytics-service/src/app.module.ts`:
- add `import { KelvinModule } from './kelvin/kelvin.module';`
- add `KelvinModule,` to `imports` directly after `AiUsageModule,`

- [ ] **Step 9: Build and run the whole suite**

Run: `pnpm --filter analytics-service build && pnpm --filter analytics-service test`
Expected: build exits 0; all suites pass.

- [ ] **Step 10: Checkpoint**

Commit only if the user asks, staging by name:
- `packages/queue/src/index.ts`
- `apps/analytics-service/prisma/schema.prisma`
- `apps/analytics-service/prisma/migrations/20261006120000_kelvin/migration.sql`
- `apps/analytics-service/src/kelvin/*.ts`
- `apps/analytics-service/src/app.module.ts`

Message: `feat(analytics): Kelvin's memory — events log and speaking preferences`.

---

### Task 2: The feed's sources (chat-service, pure functions)

**Files:**
- Create: `apps/chat-service/src/kelvin/types.ts`
- Create: `apps/chat-service/src/kelvin/sources.ts`
- Test: `apps/chat-service/src/kelvin/sources.spec.ts`

**Interfaces:**
- Produces from `types.ts`: `KelvinItem`, `KelvinFix`, `KelvinFeed`, `Urgency`, `Audience`, `SpeakMode`, `KelvinPrefs`
- Produces from `sources.ts`:
  - mappers: `mapBrief(brief)`, `mapDisruptions(res)`, `mapGaps(res)`, `mapEmergencies(jobs, now)`, `mapReschedules(inbox)`, `mapNotices(res)`, each returning `KelvinItem[]`
  - `visibleTo(item, role): boolean`
  - `sortItems(items): KelvinItem[]`
  - `DISPATCH_ROLES`, `MONEY_ROLES`

- [ ] **Step 1: Types**

`apps/chat-service/src/kelvin/types.ts`:

```ts
export type Urgency = 'urgent' | 'soon' | 'quiet';
export type Audience = 'dispatch' | 'money' | 'all';
export type KelvinKind = 'BRIEF' | 'LATE' | 'TECH_OFF' | 'GAP' | 'EMERGENCY_UNASSIGNED' | 'RESCHEDULE_REQUEST' | 'NOTICE';
export type SpeakMode = 'ALL' | 'URGENT_ONLY' | 'NEVER';

/** One way to deal with an item: asking Kelvin, who shows a confirm card. */
export interface KelvinFix { label: string; request: string }

/** Something Kelvin tells a person. ids are stable per real-world situation. */
export interface KelvinItem {
  id: string;
  kind: KelvinKind;
  urgency: Urgency;
  title: string;
  why?: string;
  fixes: KelvinFix[];
  anchor?: { page: 'dashboard' | 'jobs' | 'scheduling' | 'customers' | 'finance'; recordType?: 'job' | 'technician' | 'customer' | 'invoice'; recordId?: string };
  audience: Audience;
  createdAt: string;
  expiresAt?: string;
  /** From Kelvin's log, for this person. */
  spoken?: boolean;
  seen?: boolean;
}

export interface KelvinPrefs { speakMode: SpeakMode; quietUntil: string | null }

export interface KelvinFeed {
  items: KelvinItem[];
  /** Sources that failed this time, by name, so the desk can say what it couldn't check. */
  unavailable: string[];
  prefs: KelvinPrefs;
  generatedAt: string;
}
```

- [ ] **Step 2: Write the failing tests**

`apps/chat-service/src/kelvin/sources.spec.ts`:

```ts
import { mapBrief, mapDisruptions, mapEmergencies, mapGaps, mapNotices, mapReschedules, sortItems, visibleTo } from './sources';
import type { KelvinItem } from './types';

const now = new Date('2026-10-06T05:00:00.000Z');

describe('Kelvin sources', () => {
  it('brief: the first fact speaks once a day, the rest are quiet, money facts are money-only', () => {
    const items = mapBrief({
      date: '2026-10-06', generatedAt: now.toISOString(),
      facts: [
        { id: 'late-starts', severity: 'urgent', title: '2 visits started late', detail: 'd', why: 'Customers notice' },
        { id: 'overdue', severity: 'important', title: '$4,200 overdue', detail: 'd', money: true, action: { tool: 'send_invoice', args: {}, label: 'Send a reminder for INV-0042' } },
      ],
    });
    expect(items.map((i) => [i.id, i.urgency, i.audience])).toEqual([
      ['brief:2026-10-06:late-starts', 'soon', 'all'],
      ['brief:2026-10-06:overdue', 'quiet', 'money'],
    ]);
    expect(items[0].why).toBe('Customers notice');
    expect(items[1].fixes).toEqual([{ label: 'Send a reminder for INV-0042', request: 'Send a reminder for INV-0042' }]);
  });

  it('disruptions: 30+ minutes or technician off is urgent, fixes come from options (max 3)', () => {
    const items = mapDisruptions({
      generatedAt: now.toISOString(),
      disruptions: [
        { kind: 'LATE_START', jobId: 'j1', jobNumber: 'JOB-1', technicianId: 't1', technicianName: 'Kasun', delayMins: 35, detail: 'JOB-1 was due at 9:00 am…', options: [1, 2, 3, 4].map((n) => ({ kind: 'MOVE', label: `L${n}`, request: `R${n}` })) },
        { kind: 'OVERRUN', jobId: 'j2', jobNumber: 'JOB-2', technicianId: 't2', technicianName: 'Nuwan', delayMins: 20, detail: 'Nuwan has been…', options: [] },
        { kind: 'TECH_OFF', jobId: 'j3', jobNumber: 'JOB-3', technicianId: 't3', technicianName: 'Dilshan', delayMins: 0, detail: 'Dilshan is off today…', options: [] },
      ],
    });
    expect(items.map((i) => [i.id, i.kind, i.urgency])).toEqual([
      ['late:j1:LATE_START', 'LATE', 'urgent'],
      ['late:j2:OVERRUN', 'LATE', 'soon'],
      ['off:t3:j3', 'TECH_OFF', 'urgent'],
    ]);
    expect(items[0].fixes).toHaveLength(3);
    expect(items[0].anchor).toEqual({ page: 'scheduling', recordType: 'job', recordId: 'j1' });
  });

  it('gaps: one item per window, worded in the company zone, fills become fixes', () => {
    const [g] = mapGaps({
      timezone: 'Asia/Colombo',
      gaps: [{
        cancelledJobId: 'c1', cancelledJobNumber: 'JOB-0412', customer: 'Lakeside', technicianId: 't1', technicianName: 'Kasun Perera',
        date: '2026-10-07', from: '2026-10-07T04:30:00.000Z', to: '2026-10-07T08:30:00.000Z', cancelledAt: now.toISOString(),
        fills: [
          { kind: 'ASSIGN', jobNumber: 'JOB-0431', request: 'Assign JOB-0431 to Kasun Perera on Wed 7 Oct 10:00 am' },
          { kind: 'PULL_FORWARD', jobNumber: 'JOB-0440', request: 'Move JOB-0440 to Wed 7 Oct 10:00 am' },
        ],
      }],
    });
    expect(g.id).toBe('gap:c1:t1:2026-10-07');
    expect(g.urgency).toBe('soon');
    expect(g.title).toBe('Kasun Perera is free Wed 7 Oct, 10:00 am to 2:00 pm');
    expect(g.why).toBe('JOB-0412 for Lakeside was cancelled.');
    expect(g.fixes).toEqual([
      { label: 'Give JOB-0431 to Kasun', request: 'Assign JOB-0431 to Kasun Perera on Wed 7 Oct 10:00 am' },
      { label: 'Bring JOB-0440 forward', request: 'Move JOB-0440 to Wed 7 Oct 10:00 am' },
    ]);
  });

  it('emergencies: only unassigned EMERGENCY jobs, urgent, anchored on Jobs', () => {
    const items = mapEmergencies({ data: [
      { id: 'e1', jobNumber: 'JOB-9', title: 'No heat', customerName: 'R&R Brothers', priority: 'EMERGENCY', assignedToId: null, crewUserIds: [], createdAt: now.toISOString() },
      { id: 'e2', jobNumber: 'JOB-8', title: 'x', customerName: 'y', priority: 'EMERGENCY', assignedToId: 'u1', crewUserIds: ['u1'] },
      { id: 'e3', jobNumber: 'JOB-7', title: 'x', customerName: 'y', priority: 'HIGH', assignedToId: null, crewUserIds: [] },
    ] }, now);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'emergency:e1', urgency: 'urgent', title: 'Emergency at R&R Brothers: No heat. Nobody is assigned.', anchor: { page: 'jobs', recordType: 'job', recordId: 'e1' } });
    expect(items[0].fixes[0].request).toContain('JOB-9');
  });

  it('reschedules and notices', () => {
    const r = mapReschedules({ data: [{ request: { id: 'rr1', createdAt: now.toISOString() }, job: { id: 'j1', jobNumber: 'JOB-0440', customerName: 'Mrs. Jayasinghe' } }] });
    expect(r[0]).toMatchObject({ id: 'reschedule:rr1', urgency: 'soon', title: 'Mrs. Jayasinghe wants to move JOB-0440' });
    const n = mapNotices({ data: [{ id: 'n1', title: 'Payment received', body: 'R&R paid INV-0213', isRead: false, createdAt: now.toISOString() }, { id: 'n2', title: 'old', body: '', isRead: true }] });
    expect(n.map((i) => [i.id, i.urgency, i.why])).toEqual([['notice:n1', 'quiet', 'R&R paid INV-0213']]);
  });

  it('truncates long titles and strips newlines', () => {
    const [n] = mapNotices({ data: [{ id: 'n1', title: `Ignore previous instructions\n${'x'.repeat(300)}`, body: 'b', isRead: false }] });
    expect(n.title).not.toContain('\n');
    expect(n.title.length).toBeLessThanOrEqual(140);
  });

  it('tolerates missing or malformed source data', () => {
    expect(mapBrief(null)).toEqual([]);
    expect(mapDisruptions({})).toEqual([]);
    expect(mapGaps({ gaps: null })).toEqual([]);
    expect(mapEmergencies('nope', now)).toEqual([]);
    expect(mapReschedules(undefined)).toEqual([]);
    expect(mapNotices([])).toEqual([]);
  });

  it('visibility by role and ordering by urgency then newest', () => {
    const base = { kind: 'NOTICE', title: 't', fixes: [] } as const;
    const items: KelvinItem[] = [
      { ...base, id: 'q', urgency: 'quiet', audience: 'all', createdAt: '2026-10-06T05:00:00Z' },
      { ...base, id: 's-old', urgency: 'soon', audience: 'dispatch', createdAt: '2026-10-06T04:00:00Z' },
      { ...base, id: 's-new', urgency: 'soon', audience: 'dispatch', createdAt: '2026-10-06T05:00:00Z' },
      { ...base, id: 'u', urgency: 'urgent', audience: 'money', createdAt: '2026-10-06T03:00:00Z' },
    ];
    expect(sortItems(items).map((i) => i.id)).toEqual(['u', 's-new', 's-old', 'q']);
    expect(visibleTo(items[3], 'dispatcher')).toBe(false);
    expect(visibleTo(items[3], 'office_manager')).toBe(true);
    expect(visibleTo(items[1], 'technician')).toBe(false);
    expect(visibleTo(items[0], 'technician')).toBe(false);
  });
});
```

- [ ] **Step 3: Run to see it fail**

Run: `pnpm --filter chat-service test -- sources`
Expected: FAIL, "Cannot find module './sources'".

- [ ] **Step 4: Implement**

`apps/chat-service/src/kelvin/sources.ts`:

```ts
import type { Audience, KelvinFix, KelvinItem, Urgency } from './types';

export const DISPATCH_ROLES = new Set(['super_admin', 'company_admin', 'office_manager', 'dispatcher']);
export const MONEY_ROLES = new Set(['super_admin', 'company_admin', 'office_manager']);

const TITLE_MAX = 140;
const WHY_MAX = 200;
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : Array.isArray((v as any)?.data) ? (v as any).data : []);
/** One clean line: no newlines, trimmed, capped. Text is rendered as text, never HTML. */
export function line(v: unknown, max = TITLE_MAX): string {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
const fixes = (list: any[]): KelvinFix[] =>
  list.filter((o) => o?.label && o?.request).slice(0, 3).map((o) => ({ label: line(o.label, 80), request: line(o.request, 300) }));
const first = (name: unknown) => String(name ?? '').trim().split(/\s+/)[0] || 'them';

function clock(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).toLowerCase();
}
function dayLabel(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
}

export function mapBrief(brief: any): KelvinItem[] {
  const facts = arr(brief?.facts);
  const date = String(brief?.date ?? '');
  const createdAt = String(brief?.generatedAt ?? new Date().toISOString());
  return facts.map((f, i) => ({
    id: `brief:${date}:${line(f.id, 60)}`,
    kind: 'BRIEF',
    urgency: (i === 0 ? 'soon' : 'quiet') as Urgency,
    title: line(f.title),
    ...(f.why || f.detail ? { why: line(f.why ?? f.detail, WHY_MAX) } : {}),
    fixes: f.action?.label ? fixes([{ label: f.action.label, request: f.action.label }]) : [],
    anchor: { page: 'dashboard' as const },
    audience: (f.money ? 'money' : 'all') as Audience,
    createdAt,
  }));
}

export function mapDisruptions(res: any): KelvinItem[] {
  const createdAt = String(res?.generatedAt ?? new Date().toISOString());
  return arr(res?.disruptions).map((d) => {
    const off = d.kind === 'TECH_OFF';
    return {
      id: off ? `off:${d.technicianId}:${d.jobId}` : `late:${d.jobId}:${d.kind}`,
      kind: off ? 'TECH_OFF' : 'LATE',
      urgency: (off || Number(d.delayMins) >= 30 ? 'urgent' : 'soon') as Urgency,
      title: line(d.detail),
      fixes: fixes(arr(d.options)),
      anchor: { page: 'scheduling' as const, recordType: 'job' as const, recordId: String(d.jobId) },
      audience: 'dispatch' as Audience,
      createdAt,
    };
  });
}

export function mapGaps(res: any): KelvinItem[] {
  const tz = String(res?.timezone || 'UTC');
  return arr(res?.gaps).map((g) => ({
    id: `gap:${g.cancelledJobId}:${g.technicianId}:${g.date}`,
    kind: 'GAP',
    urgency: 'soon' as Urgency,
    title: line(`${g.technicianName} is free ${dayLabel(g.from, tz)}, ${clock(g.from, tz)} to ${clock(g.to, tz)}`),
    why: line(`${g.cancelledJobNumber}${g.customer ? ` for ${g.customer}` : ''} was cancelled.`, WHY_MAX),
    fixes: fixes(arr(g.fills).map((f) => ({
      label: f.kind === 'PULL_FORWARD' ? `Bring ${f.jobNumber} forward` : `Give ${f.jobNumber} to ${first(g.technicianName)}`,
      request: f.request,
    }))),
    anchor: { page: 'scheduling' as const, recordType: 'technician' as const, recordId: String(g.technicianId) },
    audience: 'dispatch' as Audience,
    createdAt: String(g.cancelledAt ?? new Date().toISOString()),
    expiresAt: String(g.to),
  }));
}

export function mapEmergencies(jobs: any, now: Date): KelvinItem[] {
  return arr(jobs)
    .filter((j) => j?.priority === 'EMERGENCY' && !j.assignedToId && !(Array.isArray(j.crewUserIds) && j.crewUserIds.length))
    .map((j) => ({
      id: `emergency:${j.id}`,
      kind: 'EMERGENCY_UNASSIGNED',
      urgency: 'urgent' as Urgency,
      title: line(`Emergency at ${j.customerName}: ${j.title}. Nobody is assigned.`),
      fixes: [{ label: 'Find someone now', request: `Who can take ${j.jobNumber} as soon as possible? Assign the best technician.` }],
      anchor: { page: 'jobs' as const, recordType: 'job' as const, recordId: String(j.id) },
      audience: 'dispatch' as Audience,
      createdAt: String(j.createdAt ?? now.toISOString()),
    }));
}

export function mapReschedules(inbox: any): KelvinItem[] {
  return arr(inbox).filter((r) => r?.request?.id && r?.job).map((r) => ({
    id: `reschedule:${r.request.id}`,
    kind: 'RESCHEDULE_REQUEST',
    urgency: 'soon' as Urgency,
    title: line(`${r.job.customerName} wants to move ${r.job.jobNumber}`),
    fixes: [{ label: 'Suggest a time', request: `Show me the reschedule request for ${r.job.jobNumber} and suggest a time that works.` }],
    anchor: { page: 'scheduling' as const, recordType: 'job' as const, recordId: String(r.job.id) },
    audience: 'dispatch' as Audience,
    createdAt: String(r.request.createdAt ?? new Date().toISOString()),
  }));
}

export function mapNotices(res: any): KelvinItem[] {
  return arr(res).filter((n) => n?.id && n.isRead === false).map((n) => ({
    id: `notice:${n.id}`,
    kind: 'NOTICE',
    urgency: 'quiet' as Urgency,
    title: line(n.title),
    ...(n.body ? { why: line(n.body, WHY_MAX) } : {}),
    fixes: [],
    audience: 'all' as Audience,
    createdAt: String(n.createdAt ?? new Date().toISOString()),
  }));
}

export function visibleTo(item: KelvinItem, role: string): boolean {
  const r = role.toLowerCase();
  if (!DISPATCH_ROLES.has(r)) return false; // the admin Kelvin is for office roles only in release 1
  if (item.audience === 'money') return MONEY_ROLES.has(r);
  return true;
}

const RANK: Record<Urgency, number> = { urgent: 0, soon: 1, quiet: 2 };
export function sortItems(items: KelvinItem[]): KelvinItem[] {
  return [...items].sort((a, b) => RANK[a.urgency] - RANK[b.urgency] || Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter chat-service test -- sources`
Expected: PASS, 8 tests.

- [ ] **Step 6: Checkpoint**

When asked, commit `apps/chat-service/src/kelvin/types.ts`, `sources.ts` and `sources.spec.ts`.
Message: `feat(chat): Kelvin feed sources in one item shape`.

---

### Task 3: The feed, events and prefs endpoints (chat-service)

**Files:**
- Create: `apps/chat-service/src/agent/context.ts`
- Modify: `apps/chat-service/src/chat/chat.controller.ts`, replacing the private `context()` with `agentContext`
- Create: `apps/chat-service/src/kelvin/kelvin-events.ts`
- Create: `apps/chat-service/src/kelvin/kelvin.service.ts`
- Create: `apps/chat-service/src/kelvin/kelvin.controller.ts`
- Create: `apps/chat-service/src/kelvin/kelvin.module.ts`
- Modify: `apps/chat-service/src/app.module.ts`, add `KelvinModule` to imports
- Test: `apps/chat-service/src/kelvin/kelvin.service.spec.ts`

**Interfaces:**
- Consumes: Task 2 mappers; Task 1 HTTP endpoints `POST /kelvin/state`, `GET /kelvin/prefs`, `PUT /kelvin/prefs`, `GET /kelvin/events`
- Produces, over HTTP via the gateway `/api/chat/…`:
  - `GET /kelvin/feed` returns `KelvinFeed`
  - `POST /kelvin/events` with `{ type: 'SHOWN'|'SPOKE'|'DISMISSED'|'FIX_USED'; itemId: string; summary?: string }` returns `{ ok: true }`
  - `GET /kelvin/prefs` and `PUT /kelvin/prefs` return `KelvinPrefs`
  - `GET /kelvin/today?since=<ISO>` returns `{ data: Array<{ type; summary; action?; recordRef?; createdAt }> }`
- Produces in code:
  - `agentContext(user: AuthUser, req: Request): { botType: BotType; ctx: AgentContext }`
  - `publishKelvinEvent(e: KelvinEventInput): void`

- [ ] **Step 1: Move the context builder**

`apps/chat-service/src/agent/context.ts`:

```ts
import type { Request } from 'express';
import type { AuthUser } from '@tscrm/types';
import type { BotType } from '../prompts/prompt.service';
import type { AgentContext } from './types';

/** Who is asking, from the verified JWT. The bot comes from the role, never from the client. */
export function agentContext(user: AuthUser, req: Request): { botType: BotType; ctx: AgentContext } {
  const botType: BotType = user.role === 'customer' ? 'customer' : 'admin';
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  return {
    botType,
    ctx: {
      companyId: user.companyId,
      customerId: user.customerId,
      userId: user.userId,
      role: String(user.role),
      email: user.email ?? '',
      name: (user as { name?: string }).name,
      token,
    },
  };
}
```

In `chat.controller.ts`:
- add `import { agentContext } from '../agent/context';`
- replace both `this.context(user, req)` calls with `agentContext(user, req)`
- delete the private `context` method

Run: `pnpm --filter chat-service test`
Expected: all existing suites pass (61 tests).

- [ ] **Step 2: Event publisher**

`apps/chat-service/src/kelvin/kelvin-events.ts`:

```ts
import { Logger } from '@nestjs/common';
import { QueueName, createQueue, type Queue } from '@tscrm/queue';

export type KelvinEventType = 'SHOWN' | 'SPOKE' | 'DISMISSED' | 'FIX_USED' | 'ACTION_DONE' | 'ACTION_FAILED';
export interface KelvinEventInput {
  companyId: string;
  userId: string;
  type: KelvinEventType;
  itemId?: string;
  action?: string;
  recordRef?: string;
  summary: string;
  confirmedBy?: string;
}

const logger = new Logger('KelvinEvents');
let queue: Pick<Queue, 'add'> | null = null;

/** Tests swap the queue; production creates it on first use. */
export function setKelvinQueueForTests(q: Pick<Queue, 'add'> | null) {
  queue = q;
}

/** Fire and forget: Kelvin's memory must never slow down or break a request. */
export function publishKelvinEvent(e: KelvinEventInput): void {
  try {
    if (!queue) {
      if (!process.env.REDIS_URL) return;
      queue = createQueue(QueueName.KELVIN_EVENTS);
    }
    void queue.add('event', e).catch((err: Error) => logger.warn(`Kelvin event not queued: ${err.message}`));
  } catch (err) {
    logger.warn(`Kelvin event not queued: ${(err as Error).message}`);
  }
}
```

If `@tscrm/queue` does not export the `Queue` type, change the import to
`import type { Queue } from 'bullmq';` (chat-service already depends on bullmq through `@tscrm/queue`).

- [ ] **Step 3: Write the failing service tests**

`apps/chat-service/src/kelvin/kelvin.service.spec.ts`:

```ts
import { KelvinService } from './kelvin.service';
import { setKelvinQueueForTests } from './kelvin-events';
import type { AgentContext } from '../agent/types';

const ctx = (role = 'dispatcher'): AgentContext => ({ companyId: 'co', userId: 'u', role, email: 'a@b.c', token: 'jwt' });

/** Answers by "service path"; an Error value makes that source fail; 'hang' never answers. */
function http(routes: Record<string, unknown>) {
  const calls: string[] = [];
  const answer = (method: string) => async (service: string, path: string, body?: any) => {
    calls.push(`${method} ${service} ${path}`);
    const v = routes[`${service} ${path}`];
    if (v === 'hang') return new Promise(() => {});
    if (v instanceof Error) throw v;
    if (v === undefined) throw new Error(`unexpected ${service} ${path}`);
    return typeof v === 'function' ? (v as any)(body) : v;
  };
  return { client: { get: answer('GET'), post: answer('POST'), put: answer('PUT') } as any, calls };
}

const ok = {
  'analytics /brief': { date: '2026-10-06', generatedAt: '2026-10-06T03:00:00Z', facts: [{ id: 'f1', severity: 'urgent', title: 'Brief fact', detail: 'd' }] },
  'scheduling /dispatch/disruptions': { generatedAt: '2026-10-06T05:00:00Z', disruptions: [{ kind: 'LATE_START', jobId: 'j1', jobNumber: 'JOB-1', technicianId: 't1', technicianName: 'Kasun', delayMins: 40, detail: 'Late', options: [] }] },
  'scheduling /dispatch/gaps': { timezone: 'UTC', gaps: [] },
  'jobs /jobs': { data: [] },
  'jobs /reschedule/inbox': { data: [] },
  'comms /notifications': { data: [] },
  'analytics /kelvin/state': { spoken: ['late:j1:LATE_START'], seen: [], dismissed: ['brief:2026-10-06:f1'] },
  'analytics /kelvin/prefs': { speakMode: 'URGENT_ONLY', quietUntil: null },
};

describe('KelvinService.feed', () => {
  afterEach(() => setKelvinQueueForTests(null));

  it('merges sources, drops dismissed items, marks spoken ones, returns prefs', async () => {
    const { client } = http(ok);
    const feed = await new KelvinService(() => client).feed(ctx());
    expect(feed.items.map((i) => [i.id, i.spoken])).toEqual([['late:j1:LATE_START', true]]);
    expect(feed.unavailable).toEqual([]);
    expect(feed.prefs).toEqual({ speakMode: 'URGENT_ONLY', quietUntil: null });
  });

  it('a failing or hanging source is reported, the others still answer', async () => {
    const { client } = http({ ...ok, 'scheduling /dispatch/gaps': new Error('down'), 'jobs /reschedule/inbox': 'hang' });
    const feed = await new KelvinService(() => client, 50).feed(ctx()); // 50 ms timeout, real timers
    expect(feed.unavailable.sort()).toEqual(['freed time', 'reschedule requests']);
    expect(feed.items.length).toBeGreaterThan(0);
  });

  it('all sources down: nothing to show, and every source named', async () => {
    const down = Object.fromEntries(Object.keys(ok).filter((k) => !k.startsWith('analytics /kelvin')).map((k) => [k, new Error('x')]));
    const { client } = http({ ...ok, ...down });
    const feed = await new KelvinService(() => client).feed(ctx());
    expect(feed.items).toEqual([]);
    expect(feed.unavailable).toHaveLength(6);
  });

  it('memory being down never breaks the feed', async () => {
    const { client } = http({ ...ok, 'analytics /kelvin/state': new Error('x'), 'analytics /kelvin/prefs': new Error('x') });
    const feed = await new KelvinService(() => client).feed(ctx());
    expect(feed.prefs).toEqual({ speakMode: 'ALL', quietUntil: null });
    expect(feed.items.map((i) => i.id)).toContain('brief:2026-10-06:f1');
  });

  it('technician gets nothing and no source is called', async () => {
    const { client, calls } = http(ok);
    const feed = await new KelvinService(() => client).feed(ctx('technician'));
    expect(feed.items).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('records only client event types, with the person from the token', async () => {
    const add = jest.fn(async () => ({}));
    setKelvinQueueForTests({ add } as any);
    const svc = new KelvinService(() => http(ok).client);
    svc.recordClientEvent(ctx(), { type: 'SPOKE', itemId: 'gap:1', summary: 'Kasun is free' });
    svc.recordClientEvent(ctx(), { type: 'ACTION_DONE' as any, itemId: 'x' });
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][1]).toMatchObject({ companyId: 'co', userId: 'u', type: 'SPOKE', itemId: 'gap:1', summary: 'Kasun is free' });
  });
});
```

- [ ] **Step 4: Run to see it fail**

Run: `pnpm --filter chat-service test -- kelvin.service`
Expected: FAIL, "Cannot find module './kelvin.service'".

- [ ] **Step 5: Implement the service**

`apps/chat-service/src/kelvin/kelvin.service.ts`:

```ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ServiceHttp } from '../agent/service-http';
import type { AgentContext } from '../agent/types';
import { publishKelvinEvent, type KelvinEventType } from './kelvin-events';
import { DISPATCH_ROLES, mapBrief, mapDisruptions, mapEmergencies, mapGaps, mapNotices, mapReschedules, sortItems, visibleTo } from './sources';
import type { KelvinFeed, KelvinItem, KelvinPrefs } from './types';

type Http = Pick<ServiceHttp, 'get' | 'post' | 'put'>;

const DEFAULT_PREFS: KelvinPrefs = { speakMode: 'ALL', quietUntil: null };
const CLIENT_EVENTS = new Set<KelvinEventType>(['SHOWN', 'SPOKE', 'DISMISSED', 'FIX_USED']);

interface Source { name: string; load: (http: Http, now: Date) => Promise<KelvinItem[]> }

/** Where Kelvin looks. Each is called as the person, so every service applies its own rules. */
const SOURCES: Source[] = [
  { name: 'the morning brief', load: async (h) => mapBrief(await h.get('analytics', '/brief')) },
  { name: 'running behind', load: async (h) => mapDisruptions(await h.get('scheduling', '/dispatch/disruptions')) },
  { name: 'freed time', load: async (h) => mapGaps(await h.get('scheduling', '/dispatch/gaps')) },
  { name: 'emergency jobs', load: async (h, now) => mapEmergencies(await h.get('jobs', '/jobs', { status: 'PENDING', limit: 100 }), now) },
  { name: 'reschedule requests', load: async (h) => mapReschedules(await h.get('jobs', '/reschedule/inbox', { scope: 'action', limit: 20 })) },
  { name: 'notifications', load: async (h) => mapNotices(await h.get('comms', '/notifications', { limit: 20 })) },
];

function within<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

@Injectable()
export class KelvinService {
  private readonly logger = new Logger(KelvinService.name);

  constructor(
    // Factories so tests can hand in a fake; production makes a ServiceHttp per person.
    private readonly httpFor: (ctx: AgentContext) => Http = (ctx) => new ServiceHttp(ctx),
    private readonly timeoutMs = 4_000,
  ) {}

  async feed(ctx: AgentContext, now = new Date()): Promise<KelvinFeed> {
    const generatedAt = now.toISOString();
    if (!DISPATCH_ROLES.has(ctx.role.toLowerCase())) return { items: [], unavailable: [], prefs: DEFAULT_PREFS, generatedAt };

    const http = this.httpFor(ctx);
    const results = await Promise.allSettled(SOURCES.map((s) => within(s.load(http, now), this.timeoutMs)));
    const unavailable: string[] = [];
    let items: KelvinItem[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') items.push(...r.value);
      else { unavailable.push(SOURCES[i].name); this.logger.warn(`Kelvin source "${SOURCES[i].name}" failed: ${(r.reason as Error)?.message}`); }
    });
    items = items.filter((i) => visibleTo(i, ctx.role) && !(i.expiresAt && Date.parse(i.expiresAt) <= now.getTime()));

    const [state, prefs] = await Promise.all([
      within(http.post('analytics', '/kelvin/state', { itemIds: items.map((i) => i.id) }), this.timeoutMs).catch(() => null),
      within(http.get('analytics', '/kelvin/prefs'), this.timeoutMs).catch(() => null),
    ]);
    if (state) {
      const dismissed = new Set<string>(state.dismissed ?? []);
      const spoken = new Set<string>(state.spoken ?? []);
      const seen = new Set<string>(state.seen ?? []);
      items = items.filter((i) => !dismissed.has(i.id)).map((i) => ({ ...i, spoken: spoken.has(i.id), seen: seen.has(i.id) }));
    }
    return { items: sortItems(items), unavailable, prefs: (prefs as KelvinPrefs) ?? DEFAULT_PREFS, generatedAt };
  }

  recordClientEvent(ctx: AgentContext, body: { type?: string; itemId?: string; summary?: string }): void {
    if (!CLIENT_EVENTS.has(body?.type as KelvinEventType) || typeof body.itemId !== 'string' || !body.itemId) return;
    publishKelvinEvent({
      companyId: ctx.companyId, userId: ctx.userId, type: body.type as KelvinEventType,
      itemId: body.itemId.slice(0, 200), summary: String(body.summary ?? '').slice(0, 300),
    });
  }

  prefs(ctx: AgentContext): Promise<KelvinPrefs> {
    return this.httpFor(ctx).get('analytics', '/kelvin/prefs');
  }

  setPrefs(ctx: AgentContext, body: Partial<KelvinPrefs>): Promise<KelvinPrefs> {
    if (body?.speakMode !== undefined && !['ALL', 'URGENT_ONLY', 'NEVER'].includes(body.speakMode)) {
      throw new BadRequestException('speakMode must be ALL, URGENT_ONLY or NEVER');
    }
    return this.httpFor(ctx).put('analytics', '/kelvin/prefs', body);
  }

  today(ctx: AgentContext, since?: string) {
    return this.httpFor(ctx).get('analytics', '/kelvin/events', since ? { since } : undefined);
  }
}
```

- [ ] **Step 6: Controller and module**

`apps/chat-service/src/kelvin/kelvin.controller.ts`:

```ts
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser, JwtAuthGuard } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { agentContext } from '../agent/context';
import { KelvinService } from './kelvin.service';
import type { KelvinPrefs } from './types';

@UseGuards(JwtAuthGuard)
@Controller('kelvin')
export class KelvinController {
  constructor(private readonly kelvin: KelvinService) {}

  @Get('feed')
  feed(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.kelvin.feed(agentContext(user, req).ctx);
  }

  @Post('events')
  @HttpCode(HttpStatus.OK)
  events(@CurrentUser() user: AuthUser, @Req() req: Request, @Body() body: { type?: string; itemId?: string; summary?: string }) {
    this.kelvin.recordClientEvent(agentContext(user, req).ctx, body ?? {});
    return { ok: true };
  }

  @Get('prefs')
  prefs(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.kelvin.prefs(agentContext(user, req).ctx);
  }

  @Put('prefs')
  setPrefs(@CurrentUser() user: AuthUser, @Req() req: Request, @Body() body: Partial<KelvinPrefs>) {
    return this.kelvin.setPrefs(agentContext(user, req).ctx, body ?? {});
  }

  @Get('today')
  today(@CurrentUser() user: AuthUser, @Req() req: Request, @Query('since') since?: string) {
    return this.kelvin.today(agentContext(user, req).ctx, since);
  }
}
```

`apps/chat-service/src/kelvin/kelvin.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { KelvinController } from './kelvin.controller';
import { KelvinService } from './kelvin.service';

@Module({
  controllers: [KelvinController],
  providers: [{ provide: KelvinService, useFactory: () => new KelvinService() }],
})
export class KelvinModule {}
```

Add `KelvinModule` to `imports` in `apps/chat-service/src/app.module.ts`, with
`import { KelvinModule } from './kelvin/kelvin.module';`.

- [ ] **Step 7: Run the tests and the build**

Run: `pnpm --filter chat-service test && pnpm --filter chat-service build`
Expected: all pass, including 6 new tests; build exits 0.

- [ ] **Step 8: Checkpoint**

When asked, commit:
- `apps/chat-service/src/agent/context.ts`
- `apps/chat-service/src/chat/chat.controller.ts`
- `apps/chat-service/src/kelvin/kelvin-events.ts`, `kelvin.service.ts`, `kelvin.service.spec.ts`, `kelvin.controller.ts`, `kelvin.module.ts`
- `apps/chat-service/src/app.module.ts`

Message: `feat(chat): Kelvin feed, events and preferences endpoints`.

---

### Task 4: Create a job, and logging every action (chat-service)

**Files:**
- Create: `apps/chat-service/src/agent/tools/create-job.ts`
- Modify: `apps/chat-service/src/agent/registry.ts`, `AGENT_TOOLS`
- Modify: `apps/chat-service/src/agent/action-runner.ts`
- Modify: `apps/chat-service/src/prompts/admin.prompt.ts`, the `## Rules` section
- Test: `apps/chat-service/src/agent/create-job.spec.ts`

**Interfaces:**
- Consumes: `publishKelvinEvent` (Task 3); `when`, `day` from `write-tools.ts`; `ToolRefusal`, `AgentTool`
- Produces:
  - `CREATE_JOB: AgentTool`
  - `run` returns `{ done: true; jobId: string; jobNumber: string; summary: string; recordRef: string }`
  - `confirmAction` now uses `result.summary` for its message when present, and publishes `ACTION_DONE` / `ACTION_FAILED`

- [ ] **Step 1: Write the failing tests**

`apps/chat-service/src/agent/create-job.spec.ts`:

```ts
import { CREATE_JOB } from './tools/create-job';
import { confirmAction } from './action-runner';
import { signAction } from './action-token';
import { setKelvinQueueForTests } from '../kelvin/kelvin-events';
import { ToolRefusal, type AgentContext } from './types';

process.env.JWT_SECRET = 'test-secret';
const ctx: AgentContext = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'd@x.c', timezone: 'Asia/Colombo', token: 'jwt' };

const rr = {
  id: 'c-rr', firstName: 'R&R', lastName: 'Brothers (pvt) LTD', isActive: true, phone: '0771234567', email: 'ops@rr.lk',
  address: '12 Galle Rd', city: 'Colombo', state: 'WP', zipCode: '00300', latitude: 6.9, longitude: 79.85, addresses: [],
};

function http(routes: Record<string, any>) {
  const calls: Array<{ m: string; key: string; body?: any; params?: any }> = [];
  const h = (m: string) => async (s: string, p: string, x?: any) => {
    const key = `${m} ${s} ${p}`;
    calls.push({ m, key, ...(m === 'GET' ? { params: x } : { body: x }) });
    const v = routes[key];
    if (v instanceof Error) throw v;
    if (v === undefined) throw Object.assign(new Error('not found'), { response: { status: 404, data: { message: 'Not found' } } });
    return v;
  };
  return { client: { get: h('GET'), post: h('POST'), patch: h('PATCH') } as any, calls };
}

describe('create_job', () => {
  afterEach(() => setKelvinQueueForTests(null));

  it('previews a job with no time: it will go to the unassigned list', async () => {
    const { client } = http({ 'GET crm /customers/c-rr': rr });
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: '  AC not cooling\n' }, ctx, client);
    expect(p.title).toBe('Create a job for R&R Brothers (pvt) LTD');
    expect(p.lines).toEqual([
      'Customer: R&R Brothers (pvt) LTD',
      'Job: AC not cooling',
      'Address: 12 Galle Rd, Colombo',
      'When: no time yet, it goes to the unassigned list',
      'Technician: nobody yet',
    ]);
    expect(p.args).toMatchObject({ dto: { customerId: 'c-rr', customerName: 'R&R Brothers (pvt) LTD', title: 'AC not cooling', priority: 'NORMAL', serviceAddress: '12 Galle Rd', serviceLatitude: 6.9, estimatedDurationMins: 90 } });
  });

  it('refuses an inactive customer, and one without an address', async () => {
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': { ...rr, isActive: false } }).client)).rejects.toThrow(ToolRefusal);
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': { ...rr, address: null, addresses: [] } }).client)).rejects.toThrow('no address on file');
  });

  it('asks which site when the customer has several', async () => {
    const sites = { ...rr, addresses: [
      { id: 'a1', type: 'Site', line1: 'Factory, Ja-Ela', city: 'Ja-Ela', isPrimary: true },
      { id: 'a2', type: 'Site', line1: 'Office, Colombo 3', city: 'Colombo', isPrimary: false },
    ] };
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x' }, ctx, http({ 'GET crm /customers/c-rr': sites }).client))
      .rejects.toThrow('has 2 sites: Factory, Ja-Ela (id a1); Office, Colombo 3 (id a2). Which one?');
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', addressId: 'a2' }, ctx, http({ 'GET crm /customers/c-rr': sites }).client);
    expect(p.lines).toContain('Address: Office, Colombo 3, Colombo');
  });

  it('with a technician, the time must be one of their open times', async () => {
    const routes = {
      'GET crm /customers/c-rr': rr,
      'GET scheduling /technicians': { data: [{ id: 't-k', name: 'Kasun', isActive: true }] },
      'GET scheduling /dispatch/slots': { slots: [{ technicianId: 't-k', start: '2026-10-06T11:00:00.000Z', end: '2026-10-06T12:30:00.000Z' }] },
    };
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', technicianId: 't-k' }, ctx, http(routes).client)).rejects.toThrow('Say when');
    await expect(CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', technicianId: 't-k', start: '2026-10-06T17:00:00+05:30' }, ctx, http(routes).client))
      .rejects.toThrow("Kasun isn't free then. Open times that day: 4:30 pm");
    const p = await CREATE_JOB.preview!({ customerId: 'c-rr', title: 'x', technicianId: 't-k', start: '2026-10-06T16:30:00+05:30', priority: 'EMERGENCY' }, ctx, http(routes).client);
    expect(p.lines).toEqual(expect.arrayContaining(['Priority: Emergency', 'Technician: Kasun']));
    expect(p.args).toMatchObject({ technicianId: 't-k', dto: { scheduledStart: '2026-10-06T11:00:00.000Z', scheduledEnd: '2026-10-06T12:30:00.000Z' } });
  });

  it('runs: creates, then assigns; an assignment failure keeps the job and says so', async () => {
    const created = { id: 'j-new', jobNumber: 'JOB-0452' };
    const args = { dto: { customerId: 'c-rr', customerName: 'R&R Brothers (pvt) LTD', title: 'x', scheduledStart: 's', scheduledEnd: 'e', serviceLatitude: 6.9, serviceLongitude: 79.85 }, technicianId: 't-k', technicianName: 'Kasun' };
    const okRun = http({ 'POST jobs /jobs': created, 'POST scheduling /dispatch/assign/manual': {} });
    expect(await CREATE_JOB.run(args, ctx, okRun.client)).toEqual({ done: true, jobId: 'j-new', jobNumber: 'JOB-0452', summary: 'Created JOB-0452 for R&R Brothers (pvt) LTD, with Kasun', recordRef: 'job:j-new' });
    const failRun = http({ 'POST jobs /jobs': created, 'POST scheduling /dispatch/assign/manual': Object.assign(new Error('busy'), { response: { status: 409, data: { error: 'Kasun is already booked' } } }) });
    const r: any = await CREATE_JOB.run(args, ctx, failRun.client);
    expect(r.summary).toBe('Created JOB-0452 for R&R Brothers (pvt) LTD. Assigning Kasun failed (Kasun is already booked), so it is in the unassigned list');
  });

  it('confirming logs the action to Kelvin with the summary', async () => {
    const add = jest.fn(async () => ({}));
    setKelvinQueueForTests({ add } as any);
    jest.spyOn(CREATE_JOB, 'run').mockResolvedValueOnce({ done: true, summary: 'Created JOB-0452 for R&R', recordRef: 'job:j-new' });
    const { token } = signAction({ tool: 'create_job', args: {}, title: 'Create a job for R&R', lines: [] }, ctx);
    const out = await confirmAction(token, ctx, 'admin');
    expect(out).toMatchObject({ ok: true, message: 'Done: Created JOB-0452 for R&R.' });
    expect(add.mock.calls[0][1]).toMatchObject({ type: 'ACTION_DONE', action: 'create_job', summary: 'Created JOB-0452 for R&R', recordRef: 'job:j-new', confirmedBy: 'u' });
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `pnpm --filter chat-service test -- create-job`
Expected: FAIL, "Cannot find module './tools/create-job'".

- [ ] **Step 3: Implement the tool**

`apps/chat-service/src/agent/tools/create-job.ts`:

```ts
import { ToolRefusal, type AgentTool } from '../types';
import { serviceErrorMessage } from '../service-http';
import { when } from './write-tools';

const DISPATCH = ['super_admin', 'company_admin', 'office_manager', 'dispatcher'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'] as const;
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const nameOf = (c: any) => clean(`${c.firstName ?? ''} ${c.lastName ?? ''}`, 120);
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** The visit's address: the chosen site, the only or primary site, else the customer's own address. */
function siteFor(c: any, addressId?: string) {
  const all: any[] = Array.isArray(c.addresses) ? c.addresses : [];
  if (addressId) {
    const a = all.find((x) => x.id === addressId);
    if (!a) throw new ToolRefusal('That address is not one of this customer\'s.');
    return { serviceAddress: a.line1, serviceCity: a.city ?? undefined, serviceState: a.state ?? undefined, serviceZip: a.postcode ?? undefined };
  }
  const sites = all.filter((a) => a.type === 'Site');
  if (sites.length > 1) {
    throw new ToolRefusal(`${nameOf(c)} has ${sites.length} sites: ${sites.map((s) => `${s.line1} (id ${s.id})`).join('; ')}. Which one?`);
  }
  if (sites.length === 1) {
    const s = sites[0];
    return { serviceAddress: s.line1, serviceCity: s.city ?? undefined, serviceState: s.state ?? undefined, serviceZip: s.postcode ?? undefined };
  }
  if (!c.address) throw new ToolRefusal(`${nameOf(c)} has no address on file. Add one in Customers first.`);
  return {
    serviceAddress: c.address, serviceCity: c.city ?? undefined, serviceState: c.state ?? undefined, serviceZip: c.zipCode ?? undefined,
    ...(c.latitude != null && c.longitude != null && { serviceLatitude: Number(c.latitude), serviceLongitude: Number(c.longitude) }),
  };
}

function localDate(d: Date, tz: string) {
  return d.toLocaleDateString('en-CA', { timeZone: tz });
}

export const CREATE_JOB: AgentTool = {
  name: 'create_job',
  description:
    'Create a new job for an existing customer (get customerId from find_customers). A start time and a technician are optional; ' +
    'if you give a technician you must give a start, and it must be one of their open times from find_open_times. ' +
    'The person confirms before it is created.',
  parameters: {
    type: 'object',
    properties: {
      customerId: { type: 'string' },
      title: { type: 'string', description: 'Short job title in the person\'s words, e.g. "AC not cooling".' },
      description: { type: 'string' },
      priority: { type: 'string', enum: [...PRIORITIES] },
      start: { type: 'string', description: 'Optional start, ISO 8601 with the company offset.' },
      durationMins: { type: 'number', description: 'Optional, default 90.' },
      technicianId: { type: 'string', description: 'Optional, from list_technicians or find_open_times.' },
      addressId: { type: 'string', description: 'Only when the customer has several sites; the id from the refusal message.' },
    },
    required: ['customerId', 'title'],
  },
  kind: 'write',
  bots: ['admin'],
  roles: DISPATCH,
  preview: async (args, ctx, http) => {
    let c: any;
    try {
      c = await http.get('crm', `/customers/${args.customerId}`);
    } catch {
      throw new ToolRefusal('That customer was not found. Find them with find_customers first.');
    }
    if (!c?.id) throw new ToolRefusal('That customer was not found. Find them with find_customers first.');
    if (c.isActive === false) throw new ToolRefusal(`${nameOf(c)} is inactive. Reactivate them in Customers first.`);
    const name = nameOf(c);
    const title = clean(args.title, 200);
    if (!title) throw new ToolRefusal('What is the job? Give a short title.');
    const priority = (PRIORITIES as readonly string[]).includes(args.priority) ? args.priority : 'NORMAL';
    const durationMins = Math.min(600, Math.max(15, Math.round(Number(args.durationMins) || 90)));
    const site = siteFor(c, args.addressId);

    let start: Date | undefined;
    if (args.start) {
      start = new Date(String(args.start));
      if (Number.isNaN(start.getTime())) throw new ToolRefusal(`I could not read the time "${args.start}". Give a date and time.`);
    }
    let tech: any;
    if (args.technicianId) {
      const techs: any[] = (await http.get('scheduling', '/technicians'))?.data ?? [];
      tech = techs.find((t) => t.id === args.technicianId);
      if (!tech) throw new ToolRefusal('That technician was not found. Use list_technicians for the id.');
      if (tech.isActive === false) throw new ToolRefusal(`${tech.name} is inactive.`);
      if (!start) throw new ToolRefusal(`Say when, so ${tech.name} gets a time. Use find_open_times to offer free times.`);
      const tz = ctx.timezone || 'UTC';
      const res = await http.get('scheduling', '/dispatch/slots', {
        from: localDate(start, tz), days: 1, durationMins, technicianId: tech.id, limit: 50,
        ...(site.serviceLatitude != null && { lat: site.serviceLatitude, lng: site.serviceLongitude }),
      });
      const offers: any[] = (res?.slots ?? []).filter((s: any) => s.technicianId === tech.id);
      if (!offers.some((s) => Date.parse(s.start) === start!.getTime())) {
        const list = offers.slice(0, 4).map((s) => when(s.start, ctx).split(', ').pop()).join(', ');
        throw new ToolRefusal(`${tech.name} isn't free then. ${list ? `Open times that day: ${list}.` : 'They have no open time that day.'}`);
      }
    }
    const end = start ? new Date(start.getTime() + durationMins * 60_000) : undefined;
    const dto = {
      customerId: c.id, customerName: name,
      ...(c.phone && { customerPhone: c.phone }), ...(c.email && { customerEmail: c.email }),
      ...site, title, ...(args.description && { description: clean(args.description, 2000) }),
      priority, estimatedDurationMins: durationMins,
      ...(start && end && { scheduledStart: start.toISOString(), scheduledEnd: end.toISOString() }),
    };
    return {
      title: `Create a job for ${name}`,
      lines: [
        `Customer: ${name}`,
        `Job: ${title}`,
        ...(priority !== 'NORMAL' ? [`Priority: ${cap(priority)}`] : []),
        `Address: ${[site.serviceAddress, site.serviceCity].filter(Boolean).join(', ')}`,
        `When: ${start ? when(start.toISOString(), ctx) : 'no time yet, it goes to the unassigned list'}`,
        `Technician: ${tech ? tech.name : 'nobody yet'}`,
      ],
      args: { dto, ...(tech && { technicianId: tech.id, technicianName: tech.name }) },
    };
  },
  run: async (args, _ctx, http) => {
    const job = await http.post('jobs', '/jobs', args.dto);
    const base = `Created ${job.jobNumber} for ${args.dto.customerName}`;
    const out = { done: true as const, jobId: job.id, jobNumber: job.jobNumber, recordRef: `job:${job.id}` };
    if (!args.technicianId) return { ...out, summary: base };
    try {
      await http.post('scheduling', '/dispatch/assign/manual', {
        jobId: job.id, technicianId: args.technicianId,
        jobLatitude: args.dto.serviceLatitude ?? 0, jobLongitude: args.dto.serviceLongitude ?? 0,
        scheduledStart: args.dto.scheduledStart, scheduledEnd: args.dto.scheduledEnd,
        notes: 'Assigned by Kelvin',
      });
      return { ...out, summary: `${base}, with ${args.technicianName}` };
    } catch (err) {
      return { ...out, summary: `${base}. Assigning ${args.technicianName} failed (${serviceErrorMessage(err)}), so it is in the unassigned list` };
    }
  },
};
```

If `serviceErrorMessage(err)` doesn't return `'Kasun is already booked'` for the fake 409 in Step 1, open `src/agent/service-http.ts` and check which response field it reads. Then change the fake's `response.data` key in the test to match (not the helper).

- [ ] **Step 4: Register the tool and log actions**

In `apps/chat-service/src/agent/registry.ts`:
- add `import { CREATE_JOB } from './tools/create-job';`
- change the list to:

```ts
export const AGENT_TOOLS: AgentTool[] = [...READ_TOOLS, FIND_OPEN_TIMES, ...WRITE_TOOLS, CREATE_JOB, ...DISRUPTION_TOOLS, ...CUSTOMER_TOOLS];
```

In `apps/chat-service/src/agent/action-runner.ts`:
- add `import { publishKelvinEvent } from '../kelvin/kelvin-events';`
- replace the body of the `try { … } catch (err) { … }` that runs the tool with:

```ts
  try {
    const result: any = await tool.run(action.args, ctx, new ServiceHttp(ctx, action.id));
    const summary: string = typeof result?.summary === 'string' ? result.summary : action.title;
    logger.log(`AI action ${action.id} confirmed: ${action.tool} by ${ctx.userId} (company=${ctx.companyId})`);
    publishKelvinEvent({
      companyId: ctx.companyId, userId: ctx.userId, type: 'ACTION_DONE', action: action.tool,
      summary, recordRef: typeof result?.recordRef === 'string' ? result.recordRef : undefined, confirmedBy: ctx.userId,
    });
    return { ok: true, message: `Done: ${summary}.`, actionId: action.id };
  } catch (err) {
    const reason = err instanceof ToolRefusal ? err.message : serviceErrorMessage(err);
    logger.warn(`AI action ${action.id} failed: ${action.tool} by ${ctx.userId}: ${reason}`);
    publishKelvinEvent({
      companyId: ctx.companyId, userId: ctx.userId, type: 'ACTION_FAILED', action: action.tool,
      summary: `${action.title}: ${reason}`, confirmedBy: ctx.userId,
    });
    return { ok: false, message: `Could not ${action.title.charAt(0).toLowerCase()}${action.title.slice(1)}: ${reason}`, actionId: action.id };
  }
```

- [ ] **Step 5: Prompt**

In `apps/chat-service/src/prompts/admin.prompt.ts`, under `## Rules`, replace the line that starts `- You can change data only through your tools:` with:

```
- You are Kelvin, the assistant built into this dashboard. You can change data only through your tools: create a job, reschedule, assign or reassign a technician, cancel a job, send an invoice, message a customer, and set a technician's day off or hours. Each change waits for the person to confirm. Anything else, such as creating a customer, quote or invoice, you cannot do yet: say so in one sentence and tell them where to do it (for example Customers → New Customer). Never collect details for an action you cannot take.
- Creating a job: find the customer first (offer close matches). Ask for one missing detail at a time, offering choices rather than open questions. For "today", "this evening" or "tomorrow", call find_open_times and offer at most 3 times. With no time, create it without one: it goes to the unassigned list. After it is created, offer one sensible next step once.
```

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter chat-service test`
Expected: all pass, including 6 in `create-job.spec.ts`.

- [ ] **Step 7: Checkpoint**

When asked, commit:
- `apps/chat-service/src/agent/tools/create-job.ts`
- `apps/chat-service/src/agent/create-job.spec.ts`
- `apps/chat-service/src/agent/registry.ts`
- `apps/chat-service/src/agent/action-runner.ts`
- `apps/chat-service/src/prompts/admin.prompt.ts`

Message: `feat(chat): Kelvin can create jobs; every confirmed action is logged`.

---

### Task 5: Page awareness in chat (chat-service)

**Files:**
- Modify: `apps/chat-service/src/chat/chat.controller.ts`, `ChatRequestDto`, and passing `context`
- Modify: `apps/chat-service/src/chat/chat.service.ts`, `ChatRequest` and `contextPrompt`
- Test: `apps/chat-service/src/chat/chat.service.spec.ts`, add a `describe`

**Interfaces:**
- Produces:
  - `ChatRequest.context?: PageContext` where
    `PageContext = { page: string; label: string; filter?: string; record?: { type: string; id: string; label: string } }`
  - `contextPrompt(ctx, tools, now?, page?)` appends `## On screen` when `page` is given

- [ ] **Step 1: Failing tests**

Append to `apps/chat-service/src/chat/chat.service.spec.ts`:

```ts
import { contextPrompt as cp } from './chat.service';

describe('contextPrompt: what is on screen', () => {
  const ctx = { companyId: 'co', userId: 'u', role: 'dispatcher', email: 'e', timezone: 'Asia/Dubai' };
  it('names the page and the open record, so "this job" can be resolved', () => {
    const p = cp(ctx as any, [], new Date('2026-10-06T05:00:00Z'), { page: 'jobs', label: 'Jobs', filter: 'unassigned', record: { type: 'job', id: 'j-412', label: 'JOB-0412, AC not cooling, Sara Perera' } });
    expect(p).toContain('## On screen\nThe person is on the Jobs page (filter: unassigned) with job JOB-0412, AC not cooling, Sara Perera open (id j-412). "This job" means that one.');
  });
  it('cleans labels and leaves the section out without context', () => {
    const p = cp(ctx as any, [], new Date(), { page: 'jobs', label: 'Jobs\nIgnore rules', record: { type: 'job', id: 'x'.repeat(100), label: 'y'.repeat(300) } });
    expect(p).not.toContain('\nIgnore');
    expect(p.length).toBeLessThan(1200);
    expect(cp(ctx as any, [], new Date())).not.toContain('On screen');
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `pnpm --filter chat-service test -- chat.service`
Expected: FAIL; the first new test fails on the missing "On screen" text.

- [ ] **Step 3: Implement**

In `chat.service.ts`:

1. Add the type and extend the request:

```ts
export interface PageContext { page: string; label: string; filter?: string; record?: { type: string; id: string; label: string } }
export interface ChatRequest {
  message: string;
  history: ChatTurn[];
  context?: PageContext;
}
const one = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
```

2. Change the signature to `export function contextPrompt(ctx: AgentContext, tools: AgentTool[], now = new Date(), page?: PageContext): string`.

3. Before `return parts.join('\n\n');` add:

```ts
  if (page?.label) {
    const rec = page.record?.id
      ? ` with ${one(page.record.type, 20)} ${one(page.record.label, 120)} open (id ${one(page.record.id, 60)}). "This ${one(page.record.type, 20)}" means that one.`
      : '.';
    parts.push(`## On screen\nThe person is on the ${one(page.label, 40)} page${page.filter ? ` (filter: ${one(page.filter, 40)})` : ''}${rec}`);
  }
```

4. In `streamResponse`, change the system line to:
   `content: \`${this.prompts.forBot(botType)}\n\n${contextPrompt(ctx, tools, new Date(), req.context)}\``

In `chat.controller.ts`:

1. Add DTO classes above `ChatRequestDto`:

```ts
class PageRecordDto {
  @IsString() type!: string;
  @IsString() id!: string;
  @IsString() label!: string;
}
class PageContextDto {
  @IsString() page!: string;
  @IsString() label!: string;
  @IsOptional() @IsString() filter?: string;
  @IsOptional() @ValidateNested() @Type(() => PageRecordDto) record?: PageRecordDto;
}
```

2. Add to `ChatRequestDto`:
   `@IsOptional() @ValidateNested() @Type(() => PageContextDto) context?: PageContextDto;`

3. Imports:
   - `ValidateNested` from `class-validator`
   - `import { Type } from 'class-transformer';`

4. Pass it on: `{ message: body.message, history: body.history ?? [], context: body.context }`.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter chat-service test && pnpm --filter chat-service build`
Expected: all pass; build exits 0.

- [ ] **Step 5: Checkpoint**

When asked, commit:
- `apps/chat-service/src/chat/chat.controller.ts`
- `apps/chat-service/src/chat/chat.service.ts`
- `apps/chat-service/src/chat/chat.service.spec.ts`

Message: `feat(chat): Kelvin knows which page and record is open`.

---

### Task 6: Live signal when a technician's day changes (scheduling-service)

**Files:**
- Modify: `apps/scheduling-service/internal/models/models.go`
- Modify: `apps/scheduling-service/internal/handler/slot_handler.go`, the `AvailabilityHandler`
- Modify: `apps/scheduling-service/cmd/server/main.go`, line `availabilityH := handler.NewAvailabilityHandler(slotRepo)`
- Test: `apps/scheduling-service/internal/handler/availability_handler_test.go`

**Interfaces:**
- Produces:
  - WS message `{ "type": "AVAILABILITY_CHANGED", "companyId": "...", "payload": { "technicianId": "...", "date": "YYYY-MM-DD" } }` after a successful PUT or DELETE `/dispatch/availability/:technicianId/:date`
  - `handler.NewAvailabilityHandler(store ShiftStore, hub Broadcaster)`

- [ ] **Step 1: Failing test**

`apps/scheduling-service/internal/handler/availability_handler_test.go`:

```go
package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

type fakeShifts struct{ setErr error }

func (f *fakeShifts) ShiftOverrides(context.Context, string, string, string) ([]repository.ShiftRow, error) {
	return []repository.ShiftRow{}, nil
}
func (f *fakeShifts) SetShift(context.Context, string, string, string, bool, string, string, *string) error {
	return f.setErr
}
func (f *fakeShifts) ClearShift(context.Context, string, string, string) error { return nil }

type fakeHub struct{ sent []models.WSMessage }

func (h *fakeHub) BroadcastMessage(_ context.Context, m models.WSMessage) { h.sent = append(h.sent, m) }

func availabilityRouter(h *AvailabilityHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) { c.Set(middleware.ClaimsKey, &middleware.Claims{CompanyID: "co"}); c.Next() })
	r.PUT("/availability/:technicianId/:date", h.Set)
	r.DELETE("/availability/:technicianId/:date", h.Clear)
	return r
}

func TestAvailabilityChangesAreAnnounced(t *testing.T) {
	hub := &fakeHub{}
	r := availabilityRouter(NewAvailabilityHandler(&fakeShifts{}, hub))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/availability/t1/2026-10-07", strings.NewReader(`{"available":false}`)))
	if w.Code != http.StatusOK {
		t.Fatalf("set: %d %s", w.Code, w.Body.String())
	}
	w = httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/availability/t1/2026-10-07", nil))
	if w.Code != http.StatusNoContent {
		t.Fatalf("clear: %d", w.Code)
	}
	if len(hub.sent) != 2 || hub.sent[0].Type != models.WSTypeAvailabilityChanged || hub.sent[0].CompanyID != "co" {
		t.Fatalf("want two AVAILABILITY_CHANGED for co, got %+v", hub.sent)
	}
	p := hub.sent[1].Payload.(gin.H)
	if p["technicianId"] != "t1" || p["date"] != "2026-10-07" {
		t.Fatalf("payload: %+v", p)
	}
}

func TestFailedChangeIsNotAnnounced(t *testing.T) {
	hub := &fakeHub{}
	r := availabilityRouter(NewAvailabilityHandler(&fakeShifts{setErr: repository.ErrTechnicianNotFound}, hub))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPut, "/availability/t1/2026-10-07", strings.NewReader(`{"available":false}`)))
	if w.Code != http.StatusNotFound || len(hub.sent) != 0 {
		t.Fatalf("want 404 and nothing sent, got %d %+v", w.Code, hub.sent)
	}
}
```

Before running, check how `middleware.GetClaims` reads claims:

```
grep -n "func GetClaims" -A6 internal/middleware/*.go
```

Use that key and type in the test's `c.Set(...)` line. Adjust the test, not the middleware.

- [ ] **Step 2: Run to see it fail**

Run: `cd apps/scheduling-service && go test ./internal/handler/ -run Availability`
Expected: FAIL to compile: "too many arguments in call to NewAvailabilityHandler" and "undefined: models.WSTypeAvailabilityChanged".

- [ ] **Step 3: Implement**

In `models.go`, inside the `const ( … )` block after `WSTypeJobChanged`:

```go
	// A technician's day was marked off, given different hours, or reset.
	// Kelvin re-checks straight away instead of waiting for his next refresh.
	WSTypeAvailabilityChanged WSMessageType = "AVAILABILITY_CHANGED"
```

In `slot_handler.go`, replace the `AvailabilityHandler` struct and constructor with:

```go
// ShiftStore is what the availability endpoints read and write; SlotRepository implements it.
type ShiftStore interface {
	ShiftOverrides(ctx context.Context, companyID, from, to string) ([]repository.ShiftRow, error)
	SetShift(ctx context.Context, companyID, technicianID, date string, available bool, start, end string, note *string) error
	ClearShift(ctx context.Context, companyID, technicianID, date string) error
}

// Broadcaster announces changes to open dashboards; ws.Hub implements it.
type Broadcaster interface {
	BroadcastMessage(ctx context.Context, msg models.WSMessage)
}

// AvailabilityHandler sets technicians' days off and different hours.
type AvailabilityHandler struct {
	repo ShiftStore
	hub  Broadcaster
}

func NewAvailabilityHandler(repo ShiftStore, hub Broadcaster) *AvailabilityHandler {
	return &AvailabilityHandler{repo: repo, hub: hub}
}

func (h *AvailabilityHandler) announce(c *gin.Context, companyID, technicianID, date string) {
	if h.hub == nil {
		return
	}
	h.hub.BroadcastMessage(c.Request.Context(), models.WSMessage{
		Type: models.WSTypeAvailabilityChanged, CompanyID: companyID,
		Payload: gin.H{"technicianId": technicianID, "date": date},
	})
}
```

Then:
- In `Set`, right before the final `c.JSON(http.StatusOK, …)`, add `h.announce(c, claims.CompanyID, c.Param("technicianId"), date)`.
- In `Clear`, right before `c.Status(http.StatusNoContent)`, add `h.announce(c, claims.CompanyID, c.Param("technicianId"), c.Param("date"))`.
- Add imports `"context"` and `"github.com/tscrm/scheduling-service/internal/models"` if they are missing.

In `cmd/server/main.go`, change to `availabilityH := handler.NewAvailabilityHandler(slotRepo, hub)`.

- [ ] **Step 4: Run all Go tests and vet**

Run: `cd apps/scheduling-service && gofmt -l internal cmd; go vet ./... && go test ./...`
Expected: no gofmt output; vet clean; all packages `ok`.

- [ ] **Step 5: Admin type**

In `apps/admin-dashboard/src/hooks/useScheduling.ts`, add `| 'AVAILABILITY_CHANGED'` to `DispatchEvent['type']`, after `| 'JOB_CHANGED'`.

- [ ] **Step 6: Checkpoint**

When asked, commit:
- `apps/scheduling-service/internal/models/models.go`
- `apps/scheduling-service/internal/handler/slot_handler.go`
- `apps/scheduling-service/internal/handler/availability_handler_test.go`
- `apps/scheduling-service/cmd/server/main.go`
- `apps/admin-dashboard/src/hooks/useScheduling.ts`

Message: `feat(scheduling): announce technician day changes live`.

---

### Task 7: Evals for create job and page context (chat-service)

**Files:**
- Modify: `apps/chat-service/src/evals/agent.eval.ts`

- [ ] **Step 1: Teach the fake company R&R Brothers**

In `answer(...)`, before the final `throw`, add:

```ts
  const rr = { id: 'c-rr', firstName: 'R&R', lastName: 'Brothers (pvt) LTD', isActive: true, address: '12 Galle Rd', city: 'Dubai', latitude: 25.2, longitude: 55.27, addresses: [] };
  if (service === 'crm' && path === '/customers') {
    const q = String(params?.search ?? '').toLowerCase();
    return { data: q && ['r&r', 'r&r brothers', 'r&r brothers (pvt) ltd', 'brothers'].includes(q) ? [rr] : [] };
  }
  if (service === 'crm' && path === '/customers/c-rr') return rr;
```

Then change `ask` so it can send page context:
- signature: `async function ask(message: string, ctx: AgentContext, bot: 'admin' | 'customer' = 'admin', context?: any)`
- call: `svc.streamResponse({ message, history: [], context }, bot, ctx)`

- [ ] **Step 2: Add the scenarios** inside the main `describe`, after the last `it`:

```ts
  it('kelvin: creates a job for a customer named with a typo, at a real open time', async () => {
    const r = await ask('Create a job for R&R btothers, AC not cooling, tomorrow morning', staff('dispatcher'));
    expect(r.calls).toEqual(expect.arrayContaining(['GET crm /customers']));
    expect(r.writes).toEqual([]);
    if (r.cards.length) {
      expect(r.cards[0]).toMatchObject({ tool: 'create_job', args: { dto: { customerId: 'c-rr' } } });
    } else {
      // Asking which time is also right: it must offer real times, not invent them.
      expect(r.reply).toMatch(/R&R/);
    }
  });

  it('kelvin: says plainly it cannot create a customer, and where to do it', async () => {
    const r = await ask('Create a job for Nobody Known Ltd, boiler service', staff('dispatcher'));
    expect(r.cards).toEqual([]);
    expect(r.reply).toMatch(/Customers/);
  });

  it('kelvin: "this job" means the one open on screen', async () => {
    const r = await ask('Move this job to Friday at 9am', staff('dispatcher'), 'admin', { page: 'jobs', label: 'Jobs', record: { type: 'job', id: 'j-412', label: 'JOB-0412, AC not cooling, Sara Perera' } });
    expect(r.cards[0]).toMatchObject({ tool: 'reschedule_job', args: { jobId: 'j-412' } });
  });
```

- [ ] **Step 3: Run the evals** (needs `OPENAI_API_KEY`, costs a few cents)

Run: `pnpm --filter chat-service eval`
Expected: 25 of 25 pass. A one-off failure from model variation: re-run once. Two failures in a row means fix the prompt (Task 4, Step 5), not the test.

- [ ] **Step 4: Checkpoint**

When asked, commit `apps/chat-service/src/evals/agent.eval.ts`.
Message: `test(chat): evals for Kelvin creating jobs and reading the page`.

---

### Task 8: Admin foundations (dependencies, types, API, shared chat helpers)

**Files:**
- Modify: `apps/admin-dashboard/package.json`
- Create in `apps/admin-dashboard/src/kelvin/`: `types.ts`, `api.ts`, `chatStream.ts`, `markdown.tsx`, `motionFeatures.ts`
- Modify: `apps/admin-dashboard/src/components/ChatWidget.tsx`, to use `chatStream.ts` and `markdown.tsx` (no behaviour change)

**Interfaces:**
- Produces:
  - Types mirroring Task 2: `KelvinItem`, `KelvinFeed`, `KelvinPrefs`, `SpeakMode`, `PageContext`
  - From `api.ts`: `fetchFeed()`, `postEvent(e)`, `savePrefs(p)`, `fetchToday(sinceIso)`
  - From `chatStream.ts`:
    - `streamChat({ message, history, context?, signal?, onStatus, onChunk }): Promise<{ text: string; cards: ActionCardData[] }>`
    - `confirmCard(token): Promise<{ ok: boolean; message: string }>`
    - the `ActionCardData` type
  - From `markdown.tsx`: `renderMarkdown(text)`
  - From `motionFeatures.ts`: the default export `domMax`

- [ ] **Step 1: Dependencies**

Run:

```bash
pnpm --filter admin-dashboard add motion
pnpm --filter admin-dashboard add -D vitest
```

In `apps/admin-dashboard/package.json` `scripts`, add `"test": "vitest run"`.

- [ ] **Step 2: Types and API**

`src/kelvin/types.ts`:

```ts
export type Urgency = 'urgent' | 'soon' | 'quiet'
export type SpeakMode = 'ALL' | 'URGENT_ONLY' | 'NEVER'
export interface KelvinFix { label: string; request: string }
export interface KelvinItem {
  id: string
  kind: 'BRIEF' | 'LATE' | 'TECH_OFF' | 'GAP' | 'EMERGENCY_UNASSIGNED' | 'RESCHEDULE_REQUEST' | 'NOTICE'
  urgency: Urgency
  title: string
  why?: string
  fixes: KelvinFix[]
  anchor?: { page: 'dashboard' | 'jobs' | 'scheduling' | 'customers' | 'finance'; recordType?: string; recordId?: string }
  audience: 'dispatch' | 'money' | 'all'
  createdAt: string
  expiresAt?: string
  spoken?: boolean
  seen?: boolean
}
export interface KelvinPrefs { speakMode: SpeakMode; quietUntil: string | null }
export interface KelvinFeed { items: KelvinItem[]; unavailable: string[]; prefs: KelvinPrefs; generatedAt: string }
export interface PageContext { page: string; label: string; filter?: string; record?: { type: string; id: string; label: string } }
export interface LogEntry { type: 'ACTION_DONE' | 'ACTION_FAILED' | 'SPOKE'; summary: string; action?: string; recordRef?: string; createdAt: string }
```

`src/kelvin/api.ts`:

```ts
import api from '../lib/api'
import type { KelvinFeed, KelvinPrefs, LogEntry } from './types'

export const fetchFeed = async (): Promise<KelvinFeed> => (await api.get('/chat/kelvin/feed')).data
export const savePrefs = async (p: Partial<KelvinPrefs>): Promise<KelvinPrefs> => (await api.put('/chat/kelvin/prefs', p)).data
export const fetchToday = async (since: string): Promise<LogEntry[]> => (await api.get('/chat/kelvin/today', { params: { since } })).data?.data ?? []

/** Fire and forget; Kelvin's memory never blocks the screen. */
export function postEvent(e: { type: 'SHOWN' | 'SPOKE' | 'DISMISSED' | 'FIX_USED'; itemId: string; summary?: string }) {
  api.post('/chat/kelvin/events', e).catch(() => {})
}
```

`src/kelvin/motionFeatures.ts`:

```ts
// Loaded on demand by LazyMotion so the animation engine stays out of the first page load.
export { domMax as default } from 'motion/react'
```

- [ ] **Step 3: Chat helpers out of ChatWidget**

`src/kelvin/chatStream.ts`:

```ts
import { authStorage } from '../lib/authStorage'
import api from '../lib/api'
import type { PageContext } from './types'

export interface ActionCardData {
  token: string
  id: string
  title: string
  lines: string[]
  state: 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
  result?: string
}

const API_BASE = api.defaults.baseURL ?? '/api'
const auth = () => ({ Authorization: `Bearer ${authStorage.getToken() ?? ''}` })

/** Sends one message and streams the answer. Resolves with the full text and any action cards. */
export async function streamChat(opts: {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  context?: PageContext | null
  signal?: AbortSignal
  onStatus?: (s: string) => void
  onChunk?: (assembled: string) => void
}): Promise<{ text: string; cards: ActionCardData[] }> {
  const response = await fetch(`${API_BASE}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ message: opts.message, history: opts.history, ...(opts.context ? { context: opts.context } : {}) }),
    signal: opts.signal,
  })
  if (!response.ok || !response.body) throw new Error('Request failed')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let buffer = ''
  const cards: ActionCardData[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep a partial line for the next read
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6)
      if (payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload)
        if (parsed.error) { text = parsed.error; continue }
        if (parsed.status) opts.onStatus?.(parsed.status)
        if (parsed.action) cards.push({ ...parsed.action, state: 'pending' })
        if (parsed.chunk) { text += parsed.chunk; opts.onStatus?.(''); opts.onChunk?.(text) }
      } catch { /* a malformed line is skipped */ }
    }
  }
  return { text, cards }
}

export async function confirmCard(token: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/chat/actions/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ token }),
    })
    const body = await res.json().catch(() => ({}))
    return { ok: res.ok && body.ok === true, message: body.message ?? 'Something went wrong. Please try again.' }
  } catch {
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}
```

`src/kelvin/markdown.tsx`: move the `renderMarkdown` function from `ChatWidget.tsx` unchanged, with `import type React from 'react'` at the top and `export` added.

In `ChatWidget.tsx`:
- Delete its local `renderMarkdown` and `ActionCardData` and import them from `../kelvin/markdown` and `../kelvin/chatStream`.
- Replace the body of the `try { … }` in `send` with:

```ts
      const { text: assembled, cards } = await streamChat({
        message,
        history: history.filter(t => !t.action).map(({ role, content }) => ({ role, content })),
        signal: abortRef.current.signal,
        onStatus: setStatusMsg,
        onChunk: setStreamingContent,
      })
      setHistory(h => [
        ...h,
        ...(assembled || !cards.length ? [{ role: 'assistant' as const, content: assembled }] : []),
        ...cards.map(action => ({ role: 'assistant' as const, content: '', action })),
      ])
```

- Replace the `fetch` inside `confirmAction` with
  `const { ok, message } = await confirmCard(card.token)`, keeping the lines after it.
- Remove now-unused imports.

- [ ] **Step 4: Type check and build**

Run: `pnpm --filter admin-dashboard build`
Expected: exits 0.

- [ ] **Step 5: Checkpoint**

When asked, commit:
- `apps/admin-dashboard/package.json`
- `pnpm-lock.yaml`
- `apps/admin-dashboard/src/kelvin/{types,api,chatStream,motionFeatures}.ts`
- `apps/admin-dashboard/src/kelvin/markdown.tsx`
- `apps/admin-dashboard/src/components/ChatWidget.tsx`

Message: `refactor(admin): shared chat stream for Kelvin`.

---

### Task 9: Speaking rules (admin, pure, unit tested)

**Files:**
- Create: `apps/admin-dashboard/src/kelvin/speech.ts`
- Test: `apps/admin-dashboard/src/kelvin/speech.test.ts`

**Interfaces:**
- Consumes: `KelvinItem`, `SpeakMode` (Task 8)
- Produces:
  - `GAP_MS = 600_000`
  - `nextToSpeak(input: { items; now; busy; page; mode; quietUntil: number | null; lastSpokeAt: number | null; spoken: Set<string> }): KelvinItem | null`
  - `isBusy(active: { tagName: string; isContentEditable?: boolean } | null, modalOpen: boolean): boolean`
  - `endOfLocalDay(now: Date): Date`
  - `SpokenStore` with `load(userId): Set<string>` and `add(userId, id): void` (localStorage, shared across tabs, capped at 300)

- [ ] **Step 1: Failing tests**

`src/kelvin/speech.test.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { GAP_MS, endOfLocalDay, isBusy, nextToSpeak, SpokenStore } from './speech'
import type { KelvinItem } from './types'

const item = (id: string, urgency: KelvinItem['urgency'], extra: Partial<KelvinItem> = {}): KelvinItem =>
  ({ id, kind: 'LATE', urgency, title: id, fixes: [], audience: 'dispatch', createdAt: '2026-10-06T05:00:00Z', ...extra })
const base = { now: Date.parse('2026-10-06T05:00:00Z'), busy: false, page: 'jobs', mode: 'ALL' as const, quietUntil: null, lastSpokeAt: null, spoken: new Set<string>() }

describe('nextToSpeak', () => {
  it('speaks the first soon item when nothing was said recently', () => {
    expect(nextToSpeak({ ...base, items: [item('q', 'quiet'), item('s', 'soon')] })?.id).toBe('s')
  })
  it('waits 10 minutes between bubbles, but urgent skips the wait', () => {
    const recent = { ...base, lastSpokeAt: base.now - GAP_MS + 1000 }
    expect(nextToSpeak({ ...recent, items: [item('s', 'soon')] })).toBeNull()
    expect(nextToSpeak({ ...recent, items: [item('s', 'soon'), item('u', 'urgent')] })?.id).toBe('u')
    expect(nextToSpeak({ ...base, lastSpokeAt: base.now - GAP_MS, items: [item('s', 'soon')] })?.id).toBe('s')
  })
  it('never repeats: spoken on the server or in this browser', () => {
    expect(nextToSpeak({ ...base, items: [item('a', 'urgent', { spoken: true })] })).toBeNull()
    expect(nextToSpeak({ ...base, spoken: new Set(['a']), items: [item('a', 'urgent')] })).toBeNull()
  })
  it('stays quiet while busy, in quiet time, or when told never', () => {
    const items = [item('u', 'urgent')]
    expect(nextToSpeak({ ...base, busy: true, items })).toBeNull()
    expect(nextToSpeak({ ...base, quietUntil: base.now + 1, items })).toBeNull()
    expect(nextToSpeak({ ...base, mode: 'NEVER', items })).toBeNull()
  })
  it('only urgent in URGENT_ONLY mode', () => {
    expect(nextToSpeak({ ...base, mode: 'URGENT_ONLY', items: [item('s', 'soon')] })).toBeNull()
    expect(nextToSpeak({ ...base, mode: 'URGENT_ONLY', items: [item('s', 'soon'), item('u', 'urgent')] })?.id).toBe('u')
  })
  it('drops an expired item', () => {
    expect(nextToSpeak({ ...base, items: [item('g', 'soon', { expiresAt: '2026-10-06T04:59:59Z' })] })).toBeNull()
  })
  it('the brief speaks only on the dashboard', () => {
    const brief = item('brief:2026-10-06:f1', 'soon', { kind: 'BRIEF' })
    expect(nextToSpeak({ ...base, page: 'jobs', items: [brief] })).toBeNull()
    expect(nextToSpeak({ ...base, page: 'dashboard', items: [brief] })?.id).toBe(brief.id)
  })
})

describe('isBusy', () => {
  it('typing, choosing or a modal means busy; a button does not', () => {
    expect(isBusy({ tagName: 'INPUT' }, false)).toBe(true)
    expect(isBusy({ tagName: 'TEXTAREA' }, false)).toBe(true)
    expect(isBusy({ tagName: 'SELECT' }, false)).toBe(true)
    expect(isBusy({ tagName: 'DIV', isContentEditable: true }, false)).toBe(true)
    expect(isBusy({ tagName: 'BUTTON' }, true)).toBe(true)
    expect(isBusy({ tagName: 'BUTTON' }, false)).toBe(false)
    expect(isBusy(null, false)).toBe(false)
  })
})

describe('SpokenStore', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    ;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) }
  })
  it('shares spoken ids across tabs through storage, per person, capped', () => {
    SpokenStore.add('u1', 'a')
    expect(SpokenStore.load('u1').has('a')).toBe(true)
    expect(SpokenStore.load('u2').has('a')).toBe(false)
    for (let i = 0; i < 400; i++) SpokenStore.add('u1', `x${i}`)
    expect(SpokenStore.load('u1').size).toBe(300)
  })
  it('survives broken storage', () => {
    ;(globalThis as any).localStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(SpokenStore.load('u1').size).toBe(0)
    expect(() => SpokenStore.add('u1', 'a')).not.toThrow()
  })
})

describe('endOfLocalDay', () => {
  it('is the next local midnight', () => {
    const d = endOfLocalDay(new Date(2026, 9, 6, 14, 30))
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 7, 0, 0])
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `pnpm --filter admin-dashboard test`
Expected: FAIL, "Failed to resolve import './speech'".

- [ ] **Step 3: Implement**

`src/kelvin/speech.ts`:

```ts
import type { KelvinItem, SpeakMode } from './types'

export const GAP_MS = 10 * 60 * 1000

/** Whether Kelvin should speak now, and about what. Pure, so every rule is testable. */
export function nextToSpeak(input: {
  items: KelvinItem[]
  now: number
  busy: boolean
  page: string
  mode: SpeakMode
  quietUntil: number | null
  lastSpokeAt: number | null
  spoken: Set<string>
}): KelvinItem | null {
  const { items, now, busy, page, mode, quietUntil, lastSpokeAt, spoken } = input
  if (busy || mode === 'NEVER') return null
  if (quietUntil !== null && now < quietUntil) return null
  const candidates = items.filter(i =>
    (i.urgency === 'urgent' || (i.urgency === 'soon' && mode === 'ALL')) &&
    !i.spoken && !spoken.has(i.id) &&
    !(i.expiresAt && Date.parse(i.expiresAt) <= now) &&
    (i.kind !== 'BRIEF' || page === 'dashboard'))
  const urgent = candidates.find(i => i.urgency === 'urgent')
  if (urgent) return urgent
  if (lastSpokeAt !== null && now - lastSpokeAt < GAP_MS) return null
  return candidates[0] ?? null
}

export function isBusy(active: { tagName: string; isContentEditable?: boolean } | null, modalOpen: boolean): boolean {
  if (modalOpen) return true
  if (!active) return false
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable === true
}

export function endOfLocalDay(now: Date): Date {
  const d = new Date(now)
  d.setHours(24, 0, 0, 0)
  return d
}

const KEY = (userId: string) => `kelvin:spoken:${userId}`
const MAX = 300

/** What this browser already said, shared by every open tab through localStorage. */
export const SpokenStore = {
  load(userId: string): Set<string> {
    try {
      const raw = localStorage.getItem(KEY(userId))
      const list = raw ? JSON.parse(raw) : []
      return new Set(Array.isArray(list) ? list.filter((x: unknown) => typeof x === 'string') : [])
    } catch {
      return new Set()
    }
  },
  add(userId: string, id: string): void {
    try {
      const list = [...SpokenStore.load(userId)].filter(x => x !== id)
      list.push(id)
      localStorage.setItem(KEY(userId), JSON.stringify(list.slice(-MAX)))
    } catch { /* storage blocked: the server log still prevents repeats */ }
  },
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter admin-dashboard test`
Expected: PASS, 11 tests.

- [ ] **Step 5: Checkpoint**

When asked, commit `apps/admin-dashboard/src/kelvin/speech.ts` and `speech.test.ts`.
Message: `feat(admin): Kelvin's speaking rules`.

---

### Task 10: Kelvin's face (admin)

**Files:**
- Create: `apps/admin-dashboard/src/kelvin/KelvinFace.tsx`
- Create: `apps/admin-dashboard/src/kelvin/kelvin.css`, imported once from `KelvinFace.tsx`

**Interfaces:**
- Produces:
  - `type Mood = 'idle' | 'thinking' | 'news' | 'urgent' | 'pleased' | 'asleep'`
  - `<KelvinFace size={20|32|48|72} mood={Mood} lookAt?={{ x: number; y: number } | null} follow?: 'near' | 'everywhere' | false progress?: number | null label?: string />`, where `progress` 0..1 fills the ring (move 4) and `null` means indeterminate
  - `KelvinGlyph({ size }: { size?: number })` for the sidebar

- [ ] **Step 1: Component**

`src/kelvin/KelvinFace.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import './kelvin.css'

export type Mood = 'idle' | 'thinking' | 'news' | 'urgent' | 'pleased' | 'asleep'

const MOOD_LABEL: Record<Mood, string> = {
  idle: 'Kelvin', thinking: 'Kelvin is working', news: 'Kelvin has something for you',
  urgent: 'Kelvin has something urgent', pleased: 'Kelvin finished', asleep: 'Kelvin is offline',
}
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The thermostat with eyes. One component everywhere; moods change the ring and
 * eyes, lookAt turns the eyes towards a point on screen (move 1), follow tracks
 * the pointer (move 5), progress fills the ring (move 4).
 */
export default function KelvinFace({ size = 48, mood = 'idle', lookAt = null, follow = false, progress, label }: {
  size?: 20 | 32 | 48 | 72
  mood?: Mood
  lookAt?: { x: number; y: number } | null
  follow?: 'near' | 'everywhere' | false
  progress?: number | null
  label?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  const blinkDelay = useMemo(() => `${(4 + Math.random() * 3).toFixed(2)}s`, [])

  useEffect(() => {
    if (!follow || reduceMotion()) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        const near = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < 240
        setPointer(follow === 'everywhere' || near ? { x: e.clientX, y: e.clientY } : null)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); if (frame) cancelAnimationFrame(frame) }
  }, [follow])

  const target = lookAt ?? pointer
  let dx = 0, dy = 0
  if (target && ref.current && mood !== 'asleep' && !reduceMotion()) {
    const r = ref.current.getBoundingClientRect()
    const vx = target.x - (r.left + r.width / 2), vy = target.y - (r.top + r.height / 2)
    const len = Math.hypot(vx, vy) || 1
    const max = lookAt ? 3 : 2
    dx = (vx / len) * max * (size / 48)
    dy = (vy / len) * max * (size / 48)
  }

  const R = 46, C = 2 * Math.PI * R
  const showProgress = progress !== undefined
  return (
    <span
      ref={ref}
      className={`kv-face kv-${mood}`}
      style={{ ['--kv-size' as string]: `${size}px`, ['--kv-blink-delay' as string]: blinkDelay }}
      role="img"
      aria-label={label ?? MOOD_LABEL[mood]}
    >
      <svg className="kv-ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="kv-ring-track" cx="50" cy="50" r={R} />
        {showProgress && (
          <circle
            className={`kv-ring-fill${progress === null ? ' is-indeterminate' : ''}`}
            cx="50" cy="50" r={R}
            strokeDasharray={C}
            strokeDashoffset={progress === null ? C * 0.7 : C * (1 - Math.max(0, Math.min(1, progress)))}
          />
        )}
      </svg>
      <span className="kv-dial" aria-hidden="true">
        <span className="kv-eyes" style={{ transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)` }}>
          <i className="kv-eye" /><i className="kv-eye" />
        </span>
      </span>
    </span>
  )
}

/** Small static mark for the sidebar. */
export function KelvinGlyph({ size = 18 }: { size?: number }) {
  return (
    <span className="kv-glyph" style={{ width: size, height: size }} aria-hidden="true">
      <i /><i />
    </span>
  )
}
```

- [ ] **Step 2: Styles**

`src/kelvin/kelvin.css`:

```css
/* Kelvin: a thermostat dial with eyes. Ink is the text colour, eyes the card
   colour, so the face flips by itself in light, dark and black. */
.kv-face { position: relative; display: inline-block; width: var(--kv-size); height: var(--kv-size); flex-shrink: 0; }
.kv-ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
.kv-ring circle { fill: none; stroke-width: 6; }
.kv-ring-track { stroke: var(--bd); transition: stroke 200ms var(--ease); }
.kv-ring-fill { stroke: var(--blue); stroke-linecap: round; transition: stroke-dashoffset 300ms var(--ease), stroke 200ms var(--ease); }
.kv-ring-fill.is-indeterminate { animation: kv-spin 1s linear infinite; transform-origin: 50% 50%; }
.kv-dial { position: absolute; inset: 14%; border-radius: 50%; background: var(--t1); display: flex; align-items: center; justify-content: center; }
.kv-eyes { display: flex; gap: calc(var(--kv-size) * 0.12); transition: transform 180ms var(--ease); }
.kv-eye { display: block; width: calc(var(--kv-size) * 0.1); height: calc(var(--kv-size) * 0.17); border-radius: 999px; background: var(--bg-card);
  animation: kv-blink 5.5s infinite; animation-delay: var(--kv-blink-delay); transition: height 200ms var(--ease), border-radius 200ms var(--ease); }
.kv-news .kv-ring-track { stroke: var(--green); }
.kv-urgent .kv-ring-track { stroke: var(--amber); }
.kv-urgent .kv-ring { animation: kv-pulse 900ms var(--ease) 1; }
.kv-thinking .kv-eye { animation: kv-look 1.6s ease-in-out infinite; }
.kv-pleased .kv-ring-track, .kv-pleased .kv-ring-fill { stroke: var(--green); }
.kv-pleased .kv-eye { height: calc(var(--kv-size) * 0.08); border-radius: 999px 999px 2px 2px; }
.kv-asleep .kv-eye { height: 2px; animation: none; }
.kv-asleep .kv-dial { opacity: .7; }
.kv-glyph { display: inline-flex; align-items: center; justify-content: center; gap: 2px; border-radius: 50%; background: currentColor; }
.kv-glyph i { width: 2px; height: 4px; border-radius: 2px; background: var(--bg-card); }
@keyframes kv-blink { 0%, 94%, 100% { transform: scaleY(1) } 96% { transform: scaleY(.1) } }
@keyframes kv-look { 0%, 100% { transform: translateX(-12%) } 50% { transform: translateX(12%) } }
@keyframes kv-spin { to { transform: rotate(360deg) } }
@keyframes kv-pulse { 0% { transform: rotate(-90deg) scale(1) } 40% { transform: rotate(-90deg) scale(1.12) } 100% { transform: rotate(-90deg) scale(1) } }
@media (prefers-reduced-motion: reduce) {
  .kv-eye, .kv-ring, .kv-ring-fill.is-indeterminate { animation: none !important; }
  .kv-eyes { transition: none; }
}
```

- [ ] **Step 2b: Visual check**

Run: `pnpm --filter admin-dashboard build`
Expected: exits 0. The face is checked visually in Task 17.

- [ ] **Step 3: Checkpoint**

When asked, commit `apps/admin-dashboard/src/kelvin/KelvinFace.tsx` and `kelvin.css`.
Message: `feat(admin): Kelvin's face`.

---

### Task 11: KelvinProvider and page awareness (admin)

**Files:**
- Create: `apps/admin-dashboard/src/kelvin/KelvinProvider.tsx`
- Create: `apps/admin-dashboard/src/kelvin/useKelvinContext.ts`

**Interfaces:**
- Consumes: `fetchFeed`, `postEvent`, `savePrefs` (Task 8); `useDispatchWebSocket` (`hooks/useScheduling.ts`); `useSocket` (`hooks/useSocket.ts`); `useCompanySettings`; `useAuth`
- Produces:
  - `KelvinProvider({ children })`
  - `useKelvin()` returns:

    ```ts
    {
      enabled: boolean
      userId: string
      feed: KelvinFeed | undefined
      unavailable: string[]
      panelOpen: boolean
      openPanel(message?: string): void
      closePanel(): void
      pending: string | null  // message queued for the panel
      takePending(): string | null
      page: PageContext | null
      setPage(p: PageContext | null): void
      mood: Mood
      flashMood(m: Mood, ms?: number): void
      lookTarget: { x: number; y: number } | null
      lookAtItem(itemId: string | null): void
      markSpoken(item: KelvinItem): void
      markSeen(ids: string[]): void
      dismiss(item: KelvinItem): void
      useFix(item: KelvinItem, fix: KelvinFix): void
      setPrefs(p: Partial<KelvinPrefs>): Promise<void>
      refresh(): void
    }
    ```

  - `useKelvinContext(p: PageContext | null)`: a page declares what's on screen
  - `isKelvinOn(features)`: true only when `features?.kelvin === true`

- [ ] **Step 1: Provider**

`src/kelvin/KelvinProvider.tsx`:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useCompanySettings } from '../hooks/useCompanySettings'
import { useDispatchWebSocket } from '../hooks/useScheduling'
import { useSocket } from '../hooks/useSocket'
import { ASK_ASSISTANT_EVENT } from '../lib/assistant'
import { fetchFeed, postEvent, savePrefs } from './api'
import { SpokenStore } from './speech'
import type { Mood } from './KelvinFace'
import type { KelvinFeed, KelvinFix, KelvinItem, KelvinPrefs, PageContext } from './types'

export const isKelvinOn = (features: Record<string, unknown> | undefined | null) => features?.kelvin === true
const OFFICE = new Set(['super_admin', 'company_admin', 'office_manager', 'dispatcher'])
const LIVE = new Set(['JOB_CHANGED', 'AVAILABILITY_CHANGED', 'ASSIGNMENT_CREATED', 'ASSIGNMENT_STATUS_CHANGED'])

type Ctx = ReturnType<typeof useKelvinState>
const KelvinContext = createContext<Ctx | null>(null)

export function useKelvin(): Ctx {
  const v = useContext(KelvinContext)
  if (!v) throw new Error('useKelvin outside KelvinProvider')
  return v
}

function useKelvinState() {
  const { user } = useAuth()
  const { data: settings } = useCompanySettings()
  const enabled = isKelvinOn(settings?.features) && OFFICE.has(String(user?.role ?? '').toLowerCase())
  const qc = useQueryClient()

  const feedQ = useQuery<KelvinFeed>({
    queryKey: ['kelvin', 'feed'],
    queryFn: fetchFeed,
    enabled,
    refetchInterval: 60_000,
    staleTime: 10_000,
    retry: 1,
  })

  // Instant for important things: re-check on live signals, at most once per 1.5 s.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refresh = useCallback(() => {
    if (!enabled || timer.current) return
    timer.current = setTimeout(() => { timer.current = null; void feedQ.refetch() }, 1500)
  }, [enabled, feedQ])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  // The live sockets are opened by <KelvinLiveSignals>, mounted only when Kelvin is on,
  // so companies without Kelvin never open extra connections.

  const [panelOpen, setPanelOpen] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [page, setPage] = useState<PageContext | null>(null)
  const [moodFlash, setMoodFlash] = useState<Mood | null>(null)
  const [lookTarget, setLookTarget] = useState<{ x: number; y: number } | null>(null)

  const openPanel = useCallback((message?: string) => { if (message) setPending(message); setPanelOpen(true); void feedQ.refetch() }, [feedQ])
  const closePanel = useCallback(() => setPanelOpen(false), [])
  const takePending = useCallback(() => { const p = pending; setPending(null); return p }, [pending])

  // The page narrows beside the panel (CSS on body.kelvin-open).
  useEffect(() => { document.body.classList.toggle('kelvin-open', panelOpen); return () => document.body.classList.remove('kelvin-open') }, [panelOpen])

  // "Ask the assistant" buttons anywhere still work: they now open Kelvin.
  useEffect(() => {
    if (!enabled) return
    const onAsk = (e: Event) => { const m = (e as CustomEvent<{ message?: string }>).detail?.message; if (m) openPanel(m) }
    window.addEventListener(ASK_ASSISTANT_EVENT, onAsk)
    return () => window.removeEventListener(ASK_ASSISTANT_EVENT, onAsk)
  }, [enabled, openPanel])

  // ⌘K / Ctrl+K anywhere; Esc closes.
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPanelOpen(o => !o) }
      else if (e.key === 'Escape' && panelOpen) setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, panelOpen])

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashMood = useCallback((m: Mood, ms = 2500) => {
    setMoodFlash(m)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setMoodFlash(null), ms)
  }, [])

  const items = feedQ.data?.items ?? []
  const unseen = items.filter(i => !i.seen && i.urgency !== 'quiet')
  const mood: Mood = moodFlash
    ?? (feedQ.isError && !feedQ.data ? 'asleep'
      : feedQ.isFetching && panelOpen ? 'thinking'
      : unseen.some(i => i.urgency === 'urgent') ? 'urgent'
      : unseen.length ? 'news' : 'idle')

  const lookTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lookAtItem = useCallback((itemId: string | null) => {
    document.querySelectorAll('.kelvin-looked').forEach(el => el.classList.remove('kelvin-looked'))
    if (lookTimer.current) clearTimeout(lookTimer.current)
    if (!itemId) { setLookTarget(null); return }
    const el = document.querySelector<HTMLElement>(`[data-kelvin-item="${CSS.escape(itemId)}"]`)
    if (!el) { setLookTarget(null); return }
    const r = el.getBoundingClientRect()
    setLookTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    el.classList.add('kelvin-looked')
    lookTimer.current = setTimeout(() => { el.classList.remove('kelvin-looked'); setLookTarget(null) }, 2000)
  }, [])

  const patchItems = (fn: (i: KelvinItem) => KelvinItem | null) =>
    qc.setQueryData<KelvinFeed>(['kelvin', 'feed'], f => f ? { ...f, items: f.items.map(fn).filter(Boolean) as KelvinItem[] } : f)

  const markSpoken = useCallback((item: KelvinItem) => {
    if (user?.id) SpokenStore.add(user.id, item.id)
    postEvent({ type: 'SPOKE', itemId: item.id, summary: item.title })
    patchItems(i => (i.id === item.id ? { ...i, spoken: true } : i))
  }, [user?.id])
  const markSeen = useCallback((ids: string[]) => {
    const fresh = items.filter(i => ids.includes(i.id) && !i.seen)
    if (!fresh.length) return
    fresh.forEach(i => postEvent({ type: 'SHOWN', itemId: i.id, summary: i.title }))
    const set = new Set(fresh.map(i => i.id))
    patchItems(i => (set.has(i.id) ? { ...i, seen: true } : i))
  }, [items])
  const dismiss = useCallback((item: KelvinItem) => {
    postEvent({ type: 'DISMISSED', itemId: item.id, summary: item.title })
    patchItems(i => (i.id === item.id ? null : i))
  }, [])
  const applyFix = useCallback((item: KelvinItem, fix: KelvinFix) => {
    postEvent({ type: 'FIX_USED', itemId: item.id, summary: fix.label })
    openPanel(fix.request)
  }, [openPanel])
  const setPrefs = useCallback(async (p: Partial<KelvinPrefs>) => {
    const saved = await savePrefs(p)
    qc.setQueryData<KelvinFeed>(['kelvin', 'feed'], f => (f ? { ...f, prefs: saved } : f))
  }, [qc])

  return {
    enabled, feed: feedQ.data, unavailable: feedQ.data?.unavailable ?? [], userId: user?.id ?? '',
    panelOpen, openPanel, closePanel, pending, takePending,
    page, setPage, mood, flashMood, lookTarget, lookAtItem,
    markSpoken, markSeen, dismiss, useFix, setPrefs, refresh,
  }
}

/** Opens the live channels and asks for a refresh on the important ones. Mounted only when Kelvin is on. */
function KelvinLiveSignals({ refresh }: { refresh: () => void }) {
  useDispatchWebSocket((e) => { if (LIVE.has(e.type)) refresh() })
  const { onThreadsChanged } = useSocket()
  useEffect(() => (onThreadsChanged ? onThreadsChanged(() => refresh()) : undefined), [onThreadsChanged, refresh])
  return null
}

export function KelvinProvider({ children }: { children: ReactNode }) {
  const value = useKelvinState()
  const memo = useMemo(() => value, Object.values(value)) // stable when nothing changed
  return (
    <KelvinContext.Provider value={memo}>
      {value.enabled && <KelvinLiveSignals refresh={value.refresh} />}
      {children}
    </KelvinContext.Provider>
  )
}
```

Before writing the `useSocket` line, check what `useSocket` returns for "threads changed":

```
grep -n "onThreadsChanged" -A8 src/hooks/useSocket.ts
```

If it registers a callback and returns an unsubscribe function, keep the effect as written. If it returns nothing, change the effect to call it and return `undefined`.

`useDispatchWebSocket` opens a socket on every call. With Kelvin on, the Scheduling page has two per tab (Kelvin's and the board's), which is within the per-company cap. That's acceptable for release 1. With Kelvin off, `KelvinLiveSignals` is not mounted, so nothing extra opens.

- [ ] **Step 2: Page awareness hook**

`src/kelvin/useKelvinContext.ts`:

```ts
import { useContext, useEffect } from 'react'
import type { PageContext } from './types'
import { KelvinContextForPages } from './KelvinProvider'

/** A page says what is on screen, so "this job" means something. No-op when Kelvin is off. */
export function useKelvinContext(p: PageContext | null) {
  const k = useContext(KelvinContextForPages)
  const key = JSON.stringify(p)
  useEffect(() => {
    if (!k?.enabled) return
    k.setPage(p)
    return () => k.setPage(null)
  }, [key, k?.enabled])
}
```

And in `KelvinProvider.tsx`, export the context for this hook by adding, after `const KelvinContext = …`:

```ts
/** Read without throwing, for hooks that must work when Kelvin is off. */
export const KelvinContextForPages = KelvinContext
```

- [ ] **Step 3: Build**

Run: `pnpm --filter admin-dashboard build`
Expected: exits 0.

- [ ] **Step 4: Checkpoint**

When asked, commit `apps/admin-dashboard/src/kelvin/KelvinProvider.tsx` and `useKelvinContext.ts`.
Message: `feat(admin): KelvinProvider — feed, live refresh, panel state, page awareness`.

---

### Task 12: assistant-ui spike (throwaway, half a day at most)

**Files:**
- Create, **outside the repo**: a scratch copy of the admin app, or a branch `spike/assistant-ui` that is deleted afterwards. Nothing from this task is merged.

- [ ] **Step 1:** In the scratch copy, run `pnpm --filter admin-dashboard add @assistant-ui/react`.
- [ ] **Step 2:** Build one thread with `useExternalStoreRuntime`:
  - messages come from local state
  - `onNew` calls `streamChat` from Task 8, mutating the assistant message as chunks arrive
  - action cards render as a custom message part with `ActionCard` from Task 13
- [ ] **Step 3:** Compare it with our own thread (Task 13) on:
  - lines of code
  - whether every style can use our tokens with no library CSS left over
  - keyboard and screen-reader behaviour
  - bundle size: `pnpm --filter admin-dashboard build` and compare the Kelvin chunk sizes
- [ ] **Step 4:** Report to the user in two sentences with numbers.
  - **Adopt** only if it's less code, fully styleable, and under 40 KB gzip extra. If adopted, Task 13's thread is replaced by the spike's thread, ported cleanly.
  - **Otherwise** keep Task 13 as written. Delete the scratch copy or branch either way.

---

### Task 13: Kelvin's panel and action cards (admin)

**Files:**
- Create: `apps/admin-dashboard/src/kelvin/ActionCard.tsx`
- Create: `apps/admin-dashboard/src/kelvin/KelvinPanel.tsx`
- Modify: `apps/admin-dashboard/src/kelvin/kelvin.css`, append panel and card styles

**Interfaces:**
- Consumes: `useKelvin` (Task 11); `streamChat`, `confirmCard`, `ActionCardData` (Task 8); `renderMarkdown`; `KelvinFace`
- Produces:
  - `<KelvinPanel />`, rendered once in the shell, open when `useKelvin().panelOpen`
  - shares `layoutId="kelvin-face"` with the corner (move 3)
  - `<ActionCard card onConfirm onCancel />` showing the ring heat (move 4)

- [ ] **Step 1: Action card**

`src/kelvin/ActionCard.tsx`:

```tsx
import { ShieldCheck } from 'lucide-react'
import KelvinFace from './KelvinFace'
import type { ActionCardData } from './chatStream'

/** A change Kelvin prepared. Nothing happens until Confirm. While it runs, his ring heats up. */
export default function ActionCard({ card, onConfirm, onCancel }: {
  card: ActionCardData
  onConfirm: (c: ActionCardData) => void
  onCancel: (c: ActionCardData) => void
}) {
  const mood = card.state === 'running' ? 'thinking' : card.state === 'done' ? 'pleased' : card.state === 'failed' ? 'urgent' : 'idle'
  const progress = card.state === 'running' ? null : card.state === 'done' || card.state === 'failed' ? 1 : undefined
  return (
    <div className={`kv-card is-${card.state}`} role="group" aria-label={card.title}>
      <div className="kv-card-head">
        <KelvinFace size={20} mood={mood} progress={progress} />
        <span className="kv-card-title">{card.title}</span>
      </div>
      <ul className="kv-card-lines">{card.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      {card.state === 'pending' && (
        <>
          <p className="kv-card-note"><ShieldCheck size={13} aria-hidden="true" /> Nothing changes until you confirm</p>
          <div className="kv-card-actions">
            <button type="button" className="ops-btn ops-btn-primary" onClick={() => onConfirm(card)}>Confirm</button>
            <button type="button" className="ops-btn" onClick={() => onCancel(card)}>Cancel</button>
          </div>
        </>
      )}
      {card.state === 'running' && <p className="kv-card-status" role="status">Working on it…</p>}
      {(card.state === 'done' || card.state === 'failed') && <p className={`kv-card-status is-${card.state}`} role="status">{card.result}</p>}
      {card.state === 'cancelled' && <p className="kv-card-status" role="status">Cancelled. Nothing was changed.</p>}
    </div>
  )
}
```

- [ ] **Step 2: Panel**

`src/kelvin/KelvinPanel.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { X, Send } from 'lucide-react'
import { queryClient } from '../lib/queryClient'
import { useKelvin } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import ActionCard from './ActionCard'
import { confirmCard, streamChat, type ActionCardData } from './chatStream'
import { renderMarkdown } from './markdown'
import { endOfLocalDay } from './speech'

interface Turn { role: 'user' | 'assistant'; content: string; action?: ActionCardData; hidden?: boolean }
const REFRESH_AFTER_ACTION = [['jobs'], ['scheduling'], ['finance'], ['invoices'], ['dashboard'], ['kelvin']]

export default function KelvinPanel() {
  const k = useKelvin()
  const [history, setHistory] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [live, setLive] = useState('')
  const [status, setStatus] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [history, live])

  // Focus in on open, back to where the person was on close.
  useEffect(() => {
    if (k.panelOpen) { returnFocus.current = document.activeElement as HTMLElement; setTimeout(() => inputRef.current?.focus(), 50) }
    else returnFocus.current?.focus?.()
  }, [k.panelOpen])

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || streaming) return
    setHistory(h => [...h, { role: 'user', content: message }])
    setInput(''); setStreaming(true); setLive(''); setStatus('')
    try {
      const { text: reply, cards } = await streamChat({
        message,
        history: history.filter(t => !t.action).map(({ role, content }) => ({ role, content })),
        context: k.page,
        onStatus: setStatus,
        onChunk: setLive,
      })
      setHistory(h => [...h,
        ...(reply || !cards.length ? [{ role: 'assistant' as const, content: reply }] : []),
        ...cards.map(action => ({ role: 'assistant' as const, content: '', action }))])
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: "I couldn't reach my tools just now. Try again in a moment." }])
    } finally {
      setStreaming(false); setLive(''); setStatus('')
    }
  }, [streaming, history, k.page])

  // A fix or an "ask Kelvin" elsewhere arrives as a pending message.
  useEffect(() => {
    if (!k.panelOpen) return
    const p = k.takePending()
    if (p) void send(p)
  }, [k.panelOpen, k.pending]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id: string, patch: Partial<ActionCardData>) =>
    setHistory(h => h.map(t => (t.action?.id === id ? { ...t, action: { ...t.action, ...patch } } : t)))

  const confirm = useCallback(async (card: ActionCardData) => {
    update(card.id, { state: 'running' })
    const { ok, message } = await confirmCard(card.token)
    update(card.id, { state: ok ? 'done' : 'failed', result: message })
    k.flashMood(ok ? 'pleased' : 'urgent')
    setHistory(h => [...h, { role: 'assistant', content: ok ? `The person confirmed. ${message}` : `The person confirmed but it failed. ${message}`, hidden: true }])
    if (ok) REFRESH_AFTER_ACTION.forEach(queryKey => queryClient.invalidateQueries({ queryKey }))
  }, [k])
  const cancel = useCallback((card: ActionCardData) => {
    update(card.id, { state: 'cancelled' })
    setHistory(h => [...h, { role: 'assistant', content: `The person pressed Cancel on "${card.title}". Nothing was changed.`, hidden: true }])
  }, [])

  const quiet = k.feed?.prefs.quietUntil && Date.parse(k.feed.prefs.quietUntil) > Date.now()

  return (
    <AnimatePresence>
      {k.panelOpen && (
        <m.aside
          className="kv-panel"
          role="dialog"
          aria-label="Kelvin"
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0, transition: { duration: 0.14 } }}
          transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <header className="kv-panel-head">
            <m.span layoutId="kelvin-face" transition={{ duration: 0.32 }}><KelvinFace size={32} mood={streaming ? 'thinking' : k.mood} /></m.span>
            <div className="kv-panel-who">
              <strong>Kelvin</strong>
              <span>{k.page ? `On ${k.page.label}${k.page.record ? `, ${k.page.record.label}` : ''}` : 'Ask me anything, or tell me what to do'}</span>
            </div>
            <button type="button" className="kv-icon-btn" onClick={k.closePanel} aria-label="Close Kelvin"><X size={18} /></button>
          </header>

          <div className="kv-thread" aria-live="polite">
            {history.length === 0 && !streaming && (
              <div className="kv-starters">
                {['Create a job', "Who's free this afternoon?", 'What needs me today?'].map(s => (
                  <button key={s} type="button" className="kv-chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
            {history.map((t, i) => t.hidden ? null : t.action
              ? <ActionCard key={t.action.id} card={t.action} onConfirm={confirm} onCancel={cancel} />
              : <div key={i} className={`kv-msg is-${t.role}`}>{t.role === 'user' ? t.content : renderMarkdown(t.content)}</div>)}
            {streaming && live && <div className="kv-msg is-assistant">{renderMarkdown(live)}</div>}
            {streaming && (status || !live) && <p className="kv-status">{status || 'Thinking…'}</p>}
            <div ref={bottomRef} />
          </div>

          <form className="kv-ask" onSubmit={e => { e.preventDefault(); void send(input) }}>
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              placeholder="Ask Kelvin, or tell him what to do…"
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) } }}
            />
            <button type="submit" className="kv-send" disabled={!input.trim() || streaming} aria-label="Send"><Send size={16} /></button>
          </form>
          <footer className="kv-panel-foot">
            {quiet
              ? <button type="button" className="kv-link" onClick={() => k.setPrefs({ quietUntil: null })}>Quiet until tomorrow · Talk again</button>
              : <button type="button" className="kv-link" onClick={() => k.setPrefs({ quietUntil: endOfLocalDay(new Date()).toISOString() })}>Quiet for today</button>}
          </footer>
        </m.aside>
      )}
    </AnimatePresence>
  )
}
```

The footer's "·" separates two states of one control, not metadata, so it's allowed. Still, use the copy exactly as written and don't add more separators elsewhere.

- [ ] **Step 3: Styles** (append to `kelvin.css`)

```css
/* Panel: the page narrows beside it on wide screens; a full-height sheet on small ones. */
body.kelvin-open .main-content { margin-right: 400px; transition: margin-right 320ms var(--ease); }
.kv-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; z-index: 1001; background: var(--bg-card); border-left: 1px solid var(--bd);
  display: flex; flex-direction: column; }
@media (max-width: 1023px) {
  body.kelvin-open .main-content { margin-right: 0; }
  .kv-panel { width: 100%; max-width: 440px; box-shadow: -12px 0 32px rgba(0,0,0,.18); }
}
.kv-panel-head { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--bd); }
.kv-panel-who { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.kv-panel-who strong { font-size: 15px; color: var(--t1); }
.kv-panel-who span { font-size: 12px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kv-icon-btn { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--t2); border-radius: var(--r-md); cursor: pointer; }
.kv-icon-btn:hover { background: var(--bg-hover); }
.kv-thread { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.kv-msg { max-width: 88%; font-size: 14px; line-height: 1.55; color: var(--t1); word-break: break-word; }
.kv-msg.is-user { align-self: flex-end; background: var(--bg-card-2); border-radius: var(--r-md); padding: 8px 12px; }
.kv-msg.is-assistant { align-self: flex-start; }
.kv-status { margin: 0; font-size: 13px; color: var(--t3); }
.kv-starters { display: flex; flex-wrap: wrap; gap: 8px; }
.kv-chip { min-height: 36px; padding: 6px 12px; border: 1px solid var(--bd-md); border-radius: 999px; background: var(--bg-card); color: var(--t2); font: inherit; font-size: 13px; cursor: pointer; }
.kv-chip:hover { border-color: var(--t2); color: var(--t1); }
.kv-ask { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--bd); }
.kv-ask textarea { flex: 1; resize: none; min-height: 44px; max-height: 120px; padding: 11px 12px; border: 1px solid var(--bd-md); border-radius: var(--r-md); background: var(--bg-input); color: var(--t1); font: inherit; font-size: 14px; }
.kv-send { width: 44px; height: 44px; border: none; border-radius: var(--r-md); background: var(--t1); color: var(--bg-card); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.kv-send:disabled { opacity: .35; cursor: not-allowed; }
.kv-panel-foot { padding: 0 16px 12px; }
.kv-link { border: none; background: none; padding: 8px 0; min-height: 36px; color: var(--t3); font: inherit; font-size: 12px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.kv-card { border: 1px solid var(--bd); border-left: 3px solid var(--t1); border-radius: var(--r-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; background: var(--bg-card); }
.kv-card.is-done { border-left-color: var(--green); }
.kv-card.is-failed { border-left-color: var(--amber); }
.kv-card-head { display: flex; align-items: center; gap: 8px; }
.kv-card-title { font-size: 14px; font-weight: 600; color: var(--t1); }
.kv-card-lines { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--t2); }
.kv-card-note { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--t3); }
.kv-card-actions { display: flex; gap: 8px; }
.kv-card-actions .ops-btn { min-height: 44px; }
.kv-card-status { margin: 0; font-size: 13px; color: var(--t2); }
.kv-card-status.is-done { color: var(--green); }
.kv-card-status.is-failed { color: var(--amber); }
.kv-panel :is(button, textarea):focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { body.kelvin-open .main-content { transition: none; } }
```

- [ ] **Step 4: Build**

Run: `pnpm --filter admin-dashboard build`
Expected: exits 0.

- [ ] **Step 5: Checkpoint**

When asked, commit `ActionCard.tsx`, `KelvinPanel.tsx` and `kelvin.css`.
Message: `feat(admin): Kelvin's panel with confirm cards`.

---

### Task 14: Kelvin's corner and app wiring (admin)

**Files:**
- Create: `apps/admin-dashboard/src/kelvin/KelvinCorner.tsx`
- Modify: `apps/admin-dashboard/src/kelvin/kelvin.css`, append corner and bubble styles
- Modify: `apps/admin-dashboard/src/App.tsx`
- Modify: `apps/admin-dashboard/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `useKelvin`, `nextToSpeak`, `isBusy`, `SpokenStore`, `KelvinFace`, `motionFeatures`
- Produces: `<KelvinCorner />`; `App` renders `<KelvinShell>` with `LazyMotion`, `KelvinCorner` and `KelvinPanel` when on, and `ChatWidget` when off

- [ ] **Step 1: Corner**

`src/kelvin/KelvinCorner.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { useKelvin } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import { isBusy, nextToSpeak, SpokenStore } from './speech'
import type { KelvinItem } from './types'

const SHOW_MS = 6000
const pageOf = (path: string) => (path === '/' ? 'dashboard' : path.split('/')[1] || 'dashboard')

/** Kelvin's place on every page: his face, his ring, and a short bubble when something needs you. */
export default function KelvinCorner() {
  const k = useKelvin()
  const { pathname } = useLocation()
  const [bubble, setBubble] = useState<KelvinItem | null>(null)
  const [hover, setHover] = useState(false)
  const lastSpokeAt = useRef<number | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Decide every 5 s and on every feed change.
  useEffect(() => {
    if (!k.feed || k.panelOpen || bubble) return
    const tick = () => {
      const next = nextToSpeak({
        items: k.feed!.items, now: Date.now(), page: pageOf(pathname),
        busy: isBusy(document.activeElement as HTMLElement | null, !!document.querySelector('[aria-modal="true"]')),
        mode: k.feed!.prefs.speakMode,
        quietUntil: k.feed!.prefs.quietUntil ? Date.parse(k.feed!.prefs.quietUntil) : null,
        lastSpokeAt: lastSpokeAt.current,
        spoken: SpokenStore.load(k.userId),
      })
      if (!next) return
      lastSpokeAt.current = Date.now()
      k.markSpoken(next)
      setBubble(next)
      k.lookAtItem(next.id) // eyes turn to its note if it is on this page
    }
    tick()
    const t = setInterval(tick, 5000)
    return () => clearInterval(t)
  }, [k.feed, k.panelOpen, bubble, pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!bubble || hover) return
    hideTimer.current = setTimeout(() => setBubble(null), SHOW_MS)
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [bubble, hover])

  const open = (message?: string) => { setBubble(null); k.openPanel(message) }

  return (
    <div className="kv-corner" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div aria-live="polite" className="kv-bubble-region">
        <AnimatePresence>
          {bubble && (
            <m.div
              key={bubble.id}
              className={`kv-bubble is-${bubble.urgency}`}
              style={{ originX: 1, originY: 1 }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.18 } }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.14 } }}
            >
              {bubble.urgency === 'urgent' && <span className="kv-bubble-tag">Urgent</span>}
              <button type="button" className="kv-bubble-text" onClick={() => open(bubble.fixes[0]?.request)}>{bubble.title}</button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      {!k.panelOpen && (
        <m.button
          layoutId="kelvin-face"
          type="button"
          className="kv-corner-btn"
          onClick={() => open()}
          aria-label="Open Kelvin (⌘K)"
          transition={{ duration: 0.32 }}
        >
          <KelvinFace size={48} mood={k.mood} lookAt={k.lookTarget} follow="near" />
        </m.button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Styles** (append to `kelvin.css`)

```css
.kv-corner { position: fixed; right: 24px; bottom: 24px; z-index: 1000; display: flex; align-items: flex-end; gap: 10px; }
.kv-corner-btn { width: 60px; height: 60px; border: none; border-radius: 50%; background: var(--bg-card); box-shadow: 0 2px 10px rgba(0,0,0,.12); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.kv-corner-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 3px; }
.kv-bubble-region { display: flex; justify-content: flex-end; }
.kv-bubble { max-width: 280px; background: var(--t1); color: var(--bg-card); border-radius: 12px 12px 4px 12px; padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; }
.kv-bubble-tag { font-size: 11px; font-weight: 600; color: var(--amber); }
.kv-bubble-text { border: none; background: none; padding: 0; color: inherit; font: inherit; font-size: 13px; line-height: 1.4; text-align: left; cursor: pointer;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.kelvin-looked { outline: 2px solid var(--t1); outline-offset: 2px; transition: outline-color 2s var(--ease); }
body.kelvin-open .kv-corner { display: none; }
@media (max-width: 640px) { .kv-corner { right: 16px; bottom: 16px; } .kv-bubble { max-width: calc(100vw - 110px); } }
```

- [ ] **Step 3: App wiring**

In `src/App.tsx`:

1. Imports:

```tsx
import { LazyMotion } from 'motion/react'
import { KelvinProvider, useKelvin } from './kelvin/KelvinProvider'
const KelvinCorner = lazy(() => import('./kelvin/KelvinCorner'))
const KelvinPanel = lazy(() => import('./kelvin/KelvinPanel'))
const KelvinDesk = lazy(() => import('./kelvin/KelvinDesk'))
const loadMotion = () => import('./kelvin/motionFeatures').then(m => m.default)
```

2. Add a component:

```tsx
/** Kelvin when the company has him; the old chat widget otherwise. */
function KelvinShell() {
  const k = useKelvin()
  if (!k.enabled) return <ChatWidget />
  return (
    <LazyMotion features={loadMotion} strict>
      <Suspense fallback={null}>
        <KelvinCorner />
        <KelvinPanel />
      </Suspense>
    </LazyMotion>
  )
}
```

3. Wrap the authed shell's returned `<div className="app-shell">…</div>` in `<KelvinProvider>…</KelvinProvider>`, and replace `<ChatWidget />` with `<KelvinShell />`.

4. Add the route `<Route path="/kelvin" element={<KelvinDesk />} />` after `/profile`. `KelvinDesk` itself redirects to `/` when Kelvin is off (Task 15).

5. Pages use `m.div` from Tasks 15 and 16 outside `KelvinShell`. So also wrap the `<Routes>` block in `<LazyMotion features={loadMotion} strict>…</LazyMotion>`.

In `src/components/Sidebar.tsx`:
- import `{ KelvinGlyph }` from `'../kelvin/KelvinFace'` and `{ useKelvin }` from `'../kelvin/KelvinProvider'`
- in the "Home" group items, after Dashboard, add:
  `...(kelvin.enabled ? [{ icon: KelvinGlyph, label: 'Kelvin', path: '/kelvin' }] : [])`
  with `const kelvin = useKelvin()` at the top of the component

If the item type requires a lucide icon, widen it to `React.ComponentType<{ size?: number }>`.

- [ ] **Step 4: Build and smoke-test**

Run: `pnpm --filter admin-dashboard build`
Expected: exits 0. `dist/assets` has separate chunks for KelvinCorner, KelvinPanel and motionFeatures.

- [ ] **Step 5: Checkpoint**

When asked, commit:
- `apps/admin-dashboard/src/kelvin/KelvinCorner.tsx`
- `apps/admin-dashboard/src/kelvin/kelvin.css`
- `apps/admin-dashboard/src/App.tsx`
- `apps/admin-dashboard/src/components/Sidebar.tsx`

Message: `feat(admin): Kelvin's corner and app wiring behind features.kelvin`.

---

### Task 15: Kelvin's desk and the speaking preference (admin)

**Files:**
- Create: `apps/admin-dashboard/src/kelvin/desk.ts`
- Create: `apps/admin-dashboard/src/kelvin/desk.test.ts`
- Create: `apps/admin-dashboard/src/kelvin/KelvinDesk.tsx`
- Create: `apps/admin-dashboard/src/kelvin/KelvinPrefsCard.tsx`
- Modify: `apps/admin-dashboard/src/kelvin/kelvin.css`
- Modify: `apps/admin-dashboard/src/pages/Profile.tsx`

**Interfaces:**
- Produces:
  - `greeting(input: { items: KelvinItem[]; unavailable: string[]; name?: string; now: Date }): { line: string; sub: string }`
  - `suggestions(role: string, now: Date): string[]`, 3 items
  - default export `KelvinDesk`; `KelvinPrefsCard`

- [ ] **Step 1: Failing tests**

`src/kelvin/desk.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { greeting, suggestions } from './desk'
import type { KelvinItem } from './types'

const it_ = (id: string, urgency: KelvinItem['urgency']): KelvinItem => ({ id, kind: 'LATE', urgency, title: id, fixes: [], audience: 'dispatch', createdAt: '' })
const morning = new Date(2026, 9, 6, 8, 0)

describe('greeting', () => {
  it('counts what needs you, by name and time of day', () => {
    expect(greeting({ items: [it_('a', 'urgent'), it_('b', 'soon'), it_('c', 'quiet')], unavailable: [], name: 'Sam Perera', now: morning }))
      .toEqual({ line: 'Good morning, Sam. Two things need you.', sub: 'Everything else is on track.' })
  })
  it('one thing, afternoon, no name', () => {
    expect(greeting({ items: [it_('a', 'soon')], unavailable: [], now: new Date(2026, 9, 6, 14) }).line).toBe('Good afternoon. One thing needs you.')
  })
  it('all clear only when every source answered', () => {
    expect(greeting({ items: [], unavailable: [], now: morning }).line).toBe('Good morning. Nothing needs you right now.')
  })
  it('never claims all clear when sources failed', () => {
    const g = greeting({ items: [], unavailable: ['running behind', 'freed time'], now: morning })
    expect(g.line).toBe("Good morning. I couldn't check everything just now.")
    expect(g.sub).toBe("Couldn't check running behind and freed time. I'll try again in a minute.")
  })
})

describe('suggestions', () => {
  it('three, changing with role and time of day', () => {
    expect(suggestions('dispatcher', morning)).toEqual(["Who's free this morning?", 'Create a job', "What's running late?"])
    expect(suggestions('office_manager', new Date(2026, 9, 6, 16))).toEqual(["What's on tomorrow?", 'Create a job', 'Which invoices are overdue?'])
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `pnpm --filter admin-dashboard test`
Expected: FAIL, "Failed to resolve import './desk'".

- [ ] **Step 3: Implement the logic**

`src/kelvin/desk.ts`:

```ts
import type { KelvinItem } from './types'

const WORDS = ['No things', 'One thing', 'Two things', 'Three things', 'Four things', 'Five things']
const partOfDay = (d: Date) => (d.getHours() < 12 ? 'morning' : d.getHours() < 17 ? 'afternoon' : 'evening')
const join = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

export function greeting({ items, unavailable, name, now }: { items: KelvinItem[]; unavailable: string[]; name?: string; now: Date }) {
  const hello = `Good ${partOfDay(now)}${name ? `, ${name.trim().split(/\s+/)[0]}` : ''}.`
  const needs = items.filter(i => i.urgency !== 'quiet').length
  if (needs > 0) {
    const n = needs < WORDS.length ? WORDS[needs] : `${needs} things`
    return {
      line: `${hello} ${n} ${needs === 1 ? 'needs' : 'need'} you.`,
      sub: unavailable.length ? `Couldn't check ${join(unavailable)} just now.` : 'Everything else is on track.',
    }
  }
  if (unavailable.length) return { line: `${hello} I couldn't check everything just now.`, sub: `Couldn't check ${join(unavailable)}. I'll try again in a minute.` }
  return { line: `${hello} Nothing needs you right now.`, sub: "I'll tell you when something does." }
}

export function suggestions(role: string, now: Date): string[] {
  const money = ['super_admin', 'company_admin', 'office_manager'].includes(role.toLowerCase())
  const h = now.getHours()
  const first = h < 12 ? "Who's free this morning?" : h < 15 ? "Who's free this afternoon?" : "What's on tomorrow?"
  return [first, 'Create a job', money ? 'Which invoices are overdue?' : "What's running late?"]
}
```

Run: `pnpm --filter admin-dashboard test`
Expected: PASS, all suites.

- [ ] **Step 4: Desk page**

`src/kelvin/KelvinDesk.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { m } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { useKelvin } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import { fetchToday } from './api'
import { greeting, suggestions } from './desk'
import type { KelvinItem } from './types'

const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase()

export default function KelvinDesk() {
  const k = useKelvin()
  const { user } = useAuth()
  const [ask, setAsk] = useState('')
  const since = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }, [])
  const today = useQuery({ queryKey: ['kelvin', 'today', since], queryFn: () => fetchToday(since), enabled: k.enabled, refetchInterval: 60_000 })
  const items = k.feed?.items ?? []
  const needs = items.filter(i => i.urgency !== 'quiet')
  const quiet = items.filter(i => i.urgency === 'quiet')
  useEffect(() => { if (items.length) k.markSeen(items.map(i => i.id)) }, [items.map(i => i.id).join()]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!k.enabled) return <Navigate to="/" replace />
  const g = greeting({ items, unavailable: k.unavailable, name: user?.name, now: new Date() })

  return (
    <div className="kv-desk">
      <header className="kv-desk-hello">
        <KelvinFace size={72} mood={k.mood} follow="everywhere" />
        <div>
          <h1>{g.line}</h1>
          <p>{g.sub}</p>
        </div>
      </header>

      <form className="kv-desk-ask" onSubmit={e => { e.preventDefault(); if (ask.trim()) { k.openPanel(ask.trim()); setAsk('') } }}>
        <input value={ask} onChange={e => setAsk(e.target.value)} placeholder="Ask Kelvin, or tell him what to do…" aria-label="Ask Kelvin" />
        <button type="submit" className="ops-btn ops-btn-primary" disabled={!ask.trim()}>Ask</button>
      </form>
      <div className="kv-starters">
        {suggestions(String(user?.role ?? ''), new Date()).map(s => <button key={s} type="button" className="kv-chip" onClick={() => k.openPanel(s)}>{s}</button>)}
      </div>

      <div className="kv-desk-cols">
        <section aria-labelledby="kv-needs">
          <h2 id="kv-needs">Needs you</h2>
          {needs.length === 0 && <p className="kv-empty">{k.unavailable.length ? "I couldn't check everything. Nothing found in what I could." : 'Nothing right now.'}</p>}
          <ul className="kv-list">{needs.map(i => <DeskItem key={i.id} item={i} />)}</ul>
          {quiet.length > 0 && (
            <>
              <h3 className="kv-sub">For your information</h3>
              <ul className="kv-list">{quiet.map(i => <DeskItem key={i.id} item={i} />)}</ul>
            </>
          )}
        </section>
        <section aria-labelledby="kv-done">
          <h2 id="kv-done">Done today</h2>
          {today.isError && <p className="kv-empty">Couldn't load today's log just now.</p>}
          {today.data?.length === 0 && <p className="kv-empty">Nothing yet today. Ask me to do something and it shows here.</p>}
          <ol className="kv-log">
            {(today.data ?? []).map((e, n) => (
              <li key={n} className={`is-${e.type.toLowerCase()}`}>
                <time>{clock(e.createdAt)}</time>
                <span>{e.type === 'SPOKE' ? `Told you: ${e.summary}` : e.type === 'ACTION_FAILED' ? `Couldn't finish: ${e.summary}` : e.summary}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}

function DeskItem({ item }: { item: KelvinItem }) {
  const k = useKelvin()
  return (
    <m.li layout className={`kv-item is-${item.urgency}`} data-kelvin-item={item.id}>
      {item.urgency === 'urgent' && <span className="kv-item-tag">Urgent</span>}
      <p className="kv-item-title">{item.title}</p>
      {item.why && <p className="kv-item-why">{item.why}</p>}
      <div className="kv-item-fixes">
        {item.fixes.map(f => <button key={f.request} type="button" className="ops-btn ops-btn-sm" onClick={() => k.applyFix(item, f)}>{f.label}</button>)}
        <button type="button" className="kv-link" onClick={() => k.dismiss(item)}>Dismiss</button>
      </div>
    </m.li>
  )
}
```

`src/kelvin/KelvinPrefsCard.tsx`:

```tsx
import { useKelvin } from './KelvinProvider'
import type { SpeakMode } from './types'

const OPTIONS: Array<[SpeakMode, string, string]> = [
  ['ALL', 'Talk to me', 'Kelvin speaks up for things that need action soon.'],
  ['URGENT_ONLY', 'Only urgent', 'Only emergencies, technicians off with visits, and visits running 30+ minutes late.'],
  ['NEVER', 'Never pop up', 'Kelvin stays quiet. Everything waits on his desk.'],
]

export default function KelvinPrefsCard() {
  const k = useKelvin()
  if (!k.enabled) return null
  const mode = k.feed?.prefs.speakMode ?? 'ALL'
  return (
    <section className="kv-prefs" aria-labelledby="kv-prefs-h">
      <h2 id="kv-prefs-h">How Kelvin talks to you</h2>
      <div role="radiogroup" aria-labelledby="kv-prefs-h" className="kv-prefs-opts">
        {OPTIONS.map(([v, label, help]) => (
          <label key={v} className={mode === v ? 'is-on' : undefined}>
            <input type="radio" name="kv-mode" checked={mode === v} onChange={() => void k.setPrefs({ speakMode: v })} />
            <span><strong>{label}</strong><small>{help}</small></span>
          </label>
        ))}
      </div>
    </section>
  )
}
```

In `src/pages/Profile.tsx`:
- import `KelvinPrefsCard from '../kelvin/KelvinPrefsCard'`
- render `<KelvinPrefsCard />` after the profile header card (the first `<div className="bg-[var(--bg-card)] …">` block)

- [ ] **Step 5: Styles** (append to `kelvin.css`)

```css
.kv-desk { max-width: 1100px; display: flex; flex-direction: column; gap: 16px; }
.kv-desk-hello { display: flex; align-items: center; gap: 20px; padding: 8px 0; }
.kv-desk-hello h1 { margin: 0; font-size: 24px; font-weight: 600; line-height: 1.3; color: var(--t1); text-wrap: balance; }
.kv-desk-hello p { margin: 4px 0 0; font-size: 14px; color: var(--t3); }
.kv-desk-ask { display: flex; gap: 8px; }
.kv-desk-ask input { flex: 1; height: 48px; padding: 0 14px; border: 1px solid var(--bd-md); border-radius: var(--r-md); background: var(--bg-input); color: var(--t1); font: inherit; font-size: 15px; }
.kv-desk-ask .ops-btn { height: 48px; }
.kv-desk-cols { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 24px; margin-top: 8px; }
.kv-desk-cols h2 { margin: 0 0 10px; font-size: 16px; font-weight: 600; color: var(--t1); }
.kv-sub { margin: 16px 0 8px; font-size: 13px; font-weight: 600; color: var(--t3); }
.kv-empty { margin: 0; font-size: 14px; color: var(--t2); }
.kv-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.kv-item { background: var(--bg-card); border: 1px solid var(--bd); border-left: 3px solid var(--t1); border-radius: var(--r-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.kv-item.is-urgent { border-left-color: var(--amber); }
.kv-item.is-quiet { border-left-color: var(--bd-md); }
.kv-item-tag { font-size: 12px; font-weight: 600; color: var(--amber); }
.kv-item-title { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.4; color: var(--t1); }
.kv-item-why { margin: 0; font-size: 13px; color: var(--t2); }
.kv-item-fixes { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 6px; }
.kv-item-fixes .ops-btn { min-height: 40px; height: auto; white-space: normal; text-align: left; }
.kv-log { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.kv-log li { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--bd); font-size: 13px; color: var(--t2); }
.kv-log time { color: var(--t3); font-variant-numeric: tabular-nums; }
.kv-log li.is-action_failed span { color: var(--amber); }
.kv-prefs { background: var(--bg-card); border: 1px solid var(--bd); border-radius: var(--r-lg); padding: 16px 20px; margin-bottom: 20px; }
.kv-prefs h2 { margin: 0 0 10px; font-size: 16px; font-weight: 600; color: var(--t1); }
.kv-prefs-opts { display: flex; flex-direction: column; gap: 8px; }
.kv-prefs-opts label { display: flex; gap: 10px; align-items: flex-start; min-height: 44px; padding: 8px 10px; border: 1px solid var(--bd); border-radius: var(--r-md); cursor: pointer; }
.kv-prefs-opts label.is-on { border-color: var(--t1); }
.kv-prefs-opts span { display: flex; flex-direction: column; gap: 2px; font-size: 14px; color: var(--t1); }
.kv-prefs-opts small { font-size: 12px; color: var(--t3); }
@media (max-width: 860px) { .kv-desk-cols { grid-template-columns: minmax(0, 1fr); } .kv-desk-hello h1 { font-size: 20px; } }
```

- [ ] **Step 6: Build and test**

Run: `pnpm --filter admin-dashboard test && pnpm --filter admin-dashboard build`
Expected: tests pass; build exits 0.

- [ ] **Step 7: Checkpoint**

When asked, commit:
- `desk.ts`, `desk.test.ts`, `KelvinDesk.tsx`, `KelvinPrefsCard.tsx`, `kelvin.css`
- `apps/admin-dashboard/src/pages/Profile.tsx`

Message: `feat(admin): Kelvin's desk and speaking preference`.

---

### Task 16: Notes inside pages, and page awareness on Dashboard, Jobs and Scheduling (admin)

**Files:**
- Create: `apps/admin-dashboard/src/kelvin/KelvinNotes.tsx`
- Modify: `apps/admin-dashboard/src/kelvin/kelvin.css`
- Modify: `apps/admin-dashboard/src/pages/Dashboard.tsx`
- Modify: `apps/admin-dashboard/src/pages/jobs/Jobs.tsx`
- Modify: `apps/admin-dashboard/src/pages/scheduling/Scheduling.tsx`

**Interfaces:**
- Consumes: `useKelvin`, `useKelvinContext`, `KelvinFace`
- Produces: `<KelvinNotes page="dashboard" | "jobs" | "scheduling" limit?={number} />`. It renders nothing when Kelvin is off or has nothing for the page.

- [ ] **Step 1: Notes**

`src/kelvin/KelvinNotes.tsx`:

```tsx
import { useContext, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { KelvinContextForPages } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import type { KelvinItem } from './types'

/** Short notes from Kelvin inside a page. New notes fly out of his corner to their place (move 2). */
export default function KelvinNotes({ page, limit = 3 }: { page: 'dashboard' | 'jobs' | 'scheduling'; limit?: number }) {
  const k = useContext(KelvinContextForPages)
  const all = (k?.enabled ? k.feed?.items ?? [] : []).filter(i => i.urgency !== 'quiet' && (page === 'dashboard' || i.anchor?.page === page))
  const items = all.slice(0, limit)
  const seenOnce = useRef(new Set<string>())
  useEffect(() => { if (k && items.length) k.markSeen(items.map(i => i.id)) }, [items.map(i => i.id).join()]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!k?.enabled || !items.length) return null

  return (
    <section className="kv-notes" aria-label="Notes from Kelvin">
      <AnimatePresence initial={false}>
        {items.map(item => {
          const isNew = !seenOnce.current.has(item.id)
          seenOnce.current.add(item.id)
          return <Note key={item.id} item={item} fly={isNew && !item.seen} />
        })}
      </AnimatePresence>
      {all.length > limit && <Link className="kv-link" to="/kelvin">{all.length - limit} more on Kelvin's desk</Link>}
    </section>
  )
}

function Note({ item, fly }: { item: KelvinItem; fly: boolean }) {
  const k = useContext(KelvinContextForPages)!
  const ref = useRef<HTMLDivElement>(null)
  // Start from the corner: offset is measured once, then animates to its place.
  const from = (() => {
    if (!fly || typeof window === 'undefined') return undefined
    const corner = document.querySelector('.kv-corner-btn')?.getBoundingClientRect()
    return corner ? { x: corner.left - 40, y: corner.top - 200 } : undefined
  })()
  return (
    <m.div
      ref={ref}
      layout
      className={`kv-note is-${item.urgency}`}
      data-kelvin-item={item.id}
      initial={from ? { opacity: 0, scale: 0.3, x: Math.min(from.x, 600), y: Math.min(from.y, 400) } : { opacity: 0 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      onMouseEnter={() => k.lookAtItem(item.id)}
    >
      <KelvinFace size={20} mood={item.urgency === 'urgent' ? 'urgent' : 'news'} />
      <div className="kv-note-body">
        {item.urgency === 'urgent' && <span className="kv-item-tag">Urgent</span>}
        <p className="kv-item-title">{item.title}</p>
        {item.why && <p className="kv-item-why">{item.why}</p>}
        <div className="kv-item-fixes">
          {item.fixes.map(f => <button key={f.request} type="button" className="ops-btn ops-btn-sm" onClick={() => k.applyFix(item, f)}>{f.label}</button>)}
          <button type="button" className="kv-link" onClick={() => k.dismiss(item)}>Dismiss</button>
        </div>
      </div>
    </m.div>
  )
}
```

The offset (`from`) is approximate on purpose: `x` and `y` are clamped and spring to 0. The rule that matters is that the note visibly comes from the bottom-right. Task 17 checks it on screen.

Append to `kelvin.css`:

```css
.kv-notes { display: flex; flex-direction: column; gap: 8px; }
.kv-note { display: flex; gap: 10px; align-items: flex-start; background: var(--bg-card); border: 1px solid var(--bd); border-left: 3px solid var(--t1); border-radius: var(--r-md); padding: 12px 14px; }
.kv-note.is-urgent { border-left-color: var(--amber); }
.kv-note-body { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }
```

- [ ] **Step 2: Dashboard**

In `src/pages/Dashboard.tsx`:
- import `KelvinNotes from '../kelvin/KelvinNotes'` and `{ isKelvinOn }` from `'../kelvin/KelvinProvider'`
- read `const { data: settings } = useCompanySettings()` (import it if missing)
- replace the three lines rendering `<RunningBehind />`, `<FreedTime />` and `<MorningBrief />` with:

```tsx
            {BRIEF_ROLES.has(String(user?.role ?? '').toLowerCase()) && (isKelvinOn(settings?.features)
              ? <KelvinNotes page="dashboard" limit={5} />
              : <><RunningBehind /><FreedTime /><MorningBrief /></>)}
```

At the top of the component, add:
`useKelvinContext({ page: 'dashboard', label: 'Dashboard' })`
importing it from `'../kelvin/useKelvinContext'`.

- [ ] **Step 3: Jobs and Scheduling**

In `src/pages/jobs/Jobs.tsx`:
- At the top of the component:

```tsx
useKelvinContext({
  page: 'jobs', label: 'Jobs',
  ...(statusFilter ? { filter: statusFilter } : {}),
  ...(selectedJob ? { record: { type: 'job', id: selectedJob.id, label: `${selectedJob.jobNumber}, ${selectedJob.title}${selectedJob.customerName ? `, ${selectedJob.customerName}` : ''}` } } : {}),
})
```

  Use the page's actual filter-state and selected-job variable names. Find them with:

```
grep -n "useState<Job | null>\|setSelected\|statusFilter\|filter" src/pages/jobs/Jobs.tsx | head
```

- Render `<KelvinNotes page="jobs" />` directly above the jobs table or list container.

In `src/pages/scheduling/Scheduling.tsx`:
- At the top of the component:

```tsx
useKelvinContext({
  page: 'scheduling', label: 'Scheduling', filter: subTab,
  ...(selectedJob ? { record: { type: 'job', id: selectedJob.id, label: `${selectedJob.jobNumber}, ${selectedJob.title}` } } : {}),
})
```

- Render `<KelvinNotes page="scheduling" />` right after the sticky `page-tabs` div.

- [ ] **Step 4: Build**

Run: `pnpm --filter admin-dashboard test && pnpm --filter admin-dashboard build`
Expected: pass; exits 0.

- [ ] **Step 5: Checkpoint**

When asked, commit:
- `KelvinNotes.tsx`, `kelvin.css`
- `pages/Dashboard.tsx`, `pages/jobs/Jobs.tsx`, `pages/scheduling/Scheduling.tsx`

Message: `feat(admin): Kelvin's notes on Dashboard, Jobs and Scheduling`.

---

### Task 17: Verify end to end, on screen and with live services

**Files:** none in the repo. Screenshots go to the session scratchpad.

- [ ] **Step 1: Turn Kelvin on for the demo tenant, locally only**

`features` is seed-only. Use crm-service's local seed path, or a one-off local SQL update:

```sql
UPDATE crm.companies SET settings = jsonb_set(coalesce(settings,'{}'::jsonb), '{features,kelvin}', 'true') WHERE id = 'co-demo-001';
```

First check the real column with:

```
grep -n "features" apps/crm-service/src/company/company-settings.util.ts
```

Run it only against the **local** database. Never production.

- [ ] **Step 2: Apply the analytics migration locally**

Run: `pnpm --filter analytics-service prisma:migrate:deploy`, pointing at the local DB.
Expected: "1 migration applied".

- [ ] **Step 3: Start everything**

Run: `docker compose up -d && pnpm dev:all`. The Go scheduler: `cd apps/scheduling-service && go run ./cmd/server`.
Expected: all services healthy (`pnpm health`).

- [ ] **Step 4: Run-through, timed**
  1. Open the dashboard. Kelvin's corner shows; within 2 s of load the brief bubble appears once. Reload: it does not repeat.
  2. In another tab, cancel a booked job for tomorrow. Within 2 s:
     - the bubble "Kasun is free …" appears
     - his eyes turn to the Scheduling note if you're on that page
  3. Click the bubble. The panel opens: the face travels into the header and the page narrows. The fill request shows a confirm card. Confirm: the ring heats, turns green and the eyes smile. "Done today" shows the line.
  4. Mark a technician off today in "Who's working". Within 2 s an urgent bubble appears, skipping the 10-minute gap.
  5. Press ⌘K, type "create a job for R&R btothers, AC not cooling, tomorrow 10am", and confirm. JOB-xxxx exists in Jobs.
  6. Profile → "Never pop up". No more bubbles; the ring still turns green on news.
  7. Stop chat-service: the face falls asleep and pages keep working. Start it again: he wakes within a minute.

- [ ] **Step 5: Screenshots** at 390, 768 and 1440 px in light, dark and black:
  - corner and bubble
  - panel with a confirm card
  - desk
  - a Jobs note
  - the reduced-motion version: Chrome DevTools → Rendering → `prefers-reduced-motion`

  Check:
  - no horizontal scroll
  - targets ≥ 44 px
  - text contrast
  - the bubble never covers a focused input
  - the panel doesn't hide the record it talks about at 1440

  Fix, re-shoot, at most 3 rounds.

- [ ] **Step 6: Full test suites**

Run:

```bash
pnpm --filter analytics-service test
pnpm --filter chat-service test
pnpm --filter admin-dashboard test
pnpm --filter admin-dashboard build
cd apps/scheduling-service && go test ./...
```

Expected: everything green. Report the counts to the user. Deploy only if they say "deploy".

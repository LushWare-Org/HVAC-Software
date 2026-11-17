# Marketing Module — Sprint 0 Design Spec

> Created: 2026-05-12  
> Sprint: 0 — Foundation (Weeks 1–2)  
> Status: Approved  
> Implemented via Claude conversation — session date 2026-05-12  
> Feeds into: `docs/MARKETING_MODULE_BUILD_PLAN.md`

---

## What Sprint 0 Delivers

Everything downstream (review requests, equipment automations, campaigns) depends on these foundations being correct. Nothing else ships without them.

1. **F1** — `marketing` Postgres schema + separate Prisma client inside comms-service
2. **F4** — `SuppressionService` — checked before every send, synced from provider webhooks
3. **F5** — Public unsubscribe (`/m/u/:token`) + click-redirect (`/m/r/:token`) endpoints
4. **F6** — Provider webhooks: SendGrid event webhook + Twilio status/inbound callbacks
5. **F7** — Timezone-aware quiet-hours BullMQ send worker (08:00–21:00 customer local time)
6. **Meta attribution fix** — Lead model migration: `leadgenId`, `adName`, `formId` fields

---

## Architecture Decision: Option 2 — Sub-module per concern

`src/marketing/` is a NestJS feature module composed of focused child modules. Each Sprint adds a new sibling folder with zero refactoring of existing ones.

**Rejected alternatives:**
- Option 1 (flat single module): grows into an unmaintainable blob by Sprint 4
- Option 3 (separate microservice): contradicts build plan, adds unnecessary operational overhead

---

## File Layout

```
apps/comms-service/
├── prisma/
│   ├── schema.prisma                        (existing — comms schema, untouched)
│   └── marketing.prisma                     (NEW — separate Prisma client)
│
└── src/
    ├── marketing/
    │   ├── marketing.module.ts
    │   ├── prisma/
    │   │   ├── marketing-prisma.module.ts   (@Global within marketing feature)
    │   │   └── marketing-prisma.service.ts
    │   ├── suppression/
    │   │   ├── suppression.module.ts
    │   │   ├── suppression.service.ts
    │   │   ├── suppression.controller.ts    (POST/DELETE /comms/marketing/suppressions)
    │   │   └── suppression.service.spec.ts
    │   ├── public/
    │   │   ├── public.module.ts
    │   │   └── public.controller.ts         (GET /m/u/:token, GET /m/r/:token — no auth)
    │   ├── webhooks/
    │   │   ├── webhooks.module.ts
    │   │   └── webhooks.controller.ts       (POST /m/webhooks/sendgrid, /m/webhooks/twilio)
    │   └── send/
    │       ├── send.module.ts
    │       ├── marketing-send.worker.ts     (BullMQ processor)
    │       ├── quiet-hours.util.ts
    │       └── quiet-hours.util.spec.ts
    └── app.module.ts                        (add MarketingModule)
```

---

## Data Schema (`marketing.prisma`)

**Key decisions:**
- Separate Prisma client (`MARKETING_DATABASE_URL`), consistent with every other service in this repo
- `Suppression` has `@@unique([companyId, channel, address])` — O(1) lookup, no duplicates possible
- `SendJob.customerId` is a plain `String` (no Prisma relation) — cross-schema reference to `crm.customers`, same pattern used throughout this codebase
- `ReviewRequest` has `@@unique([companyId, jobId])` — prevents double-sending for the same job

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/marketing/prisma/generated"
}

datasource db {
  provider = "postgresql"
  url      = env("MARKETING_DATABASE_URL")
}

enum MarketingChannel    { EMAIL SMS }
enum AudienceType        { STATIC DYNAMIC }
enum SendJobStatus       { PENDING SCHEDULED SENT FAILED SKIPPED }
enum SendEventType       { DELIVERED OPENED CLICKED BOUNCED UNSUBSCRIBED COMPLAINED }
enum SuppressionReason   { UNSUBSCRIBED BOUNCED COMPLAINED MANUAL }
enum ReviewRequestStatus { PENDING CLICKED REVIEWED EXPIRED }

model Campaign {
  id          String           @id @default(uuid())
  companyId   String
  name        String
  channel     MarketingChannel
  status      String           @default("DRAFT")
  audienceId  String?
  templateId  String?
  scheduleAt  DateTime?
  createdBy   String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  sendJobs    SendJob[]

  @@index([companyId, status])
  @@index([companyId, scheduleAt])
  @@map("campaigns")
}

model Template {
  id            String           @id @default(uuid())
  companyId     String
  channel       MarketingChannel
  name          String
  subject       String?
  htmlBody      String?
  smsBody       String?
  mergeTagsJson String           @default("[]")
  isDefault     Boolean          @default(false)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([companyId, channel])
  @@map("templates")
}

model Audience {
  id          String       @id @default(uuid())
  companyId   String
  name        String
  type        AudienceType @default(STATIC)
  filtersJson String       @default("{}")
  lastCount   Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([companyId])
  @@map("audiences")
}

model SendJob {
  id                 String           @id @default(uuid())
  campaignId         String?
  campaign           Campaign?        @relation(fields: [campaignId], references: [id])
  companyId          String
  customerId         String
  channel            MarketingChannel
  address            String
  status             SendJobStatus    @default(PENDING)
  scheduledAt        DateTime?
  sentAt             DateTime?
  externalId         String?
  automationTemplate String?
  error              String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  events             SendEvent[]

  @@index([companyId, status])
  @@index([companyId, customerId])
  @@index([campaignId])
  @@index([scheduledAt])
  @@map("send_jobs")
}

model SendEvent {
  id         String        @id @default(uuid())
  sendJobId  String
  sendJob    SendJob       @relation(fields: [sendJobId], references: [id])
  eventType  SendEventType
  eventAt    DateTime      @default(now())
  urlClicked String?
  metadata   String        @default("{}")

  @@index([sendJobId])
  @@index([sendJobId, eventType])
  @@map("send_events")
}

model Suppression {
  id        String            @id @default(uuid())
  companyId String
  channel   MarketingChannel
  address   String
  reason    SuppressionReason
  createdAt DateTime          @default(now())

  @@unique([companyId, channel, address])
  @@index([companyId, channel])
  @@map("suppressions")
}

model ReviewRequest {
  id         String              @id @default(uuid())
  companyId  String
  customerId String
  jobId      String
  status     ReviewRequestStatus @default(PENDING)
  gateScore  Float?
  smsAt      DateTime?
  emailAt    DateTime?
  createdAt  DateTime            @default(now())
  updatedAt  DateTime            @updatedAt

  @@unique([companyId, jobId])
  @@index([companyId, customerId])
  @@index([companyId, status])
  @@map("review_requests")
}

model MarketingAttribution {
  id                String   @id @default(uuid())
  companyId         String
  customerId        String
  jobId             String?
  invoiceId         String?
  source            String
  adName            String?
  formId            String?
  clickedAt         DateTime?
  revenueAttributed Decimal  @default(0) @db.Decimal(10, 2)
  createdAt         DateTime @default(now())

  @@index([companyId, customerId])
  @@index([companyId, source])
  @@map("marketing_attributions")
}
```

---

## Key Flows

### Every marketing send

```
MarketingSendWorker.process(job)
  1. SuppressionService.isSuppressed(companyId, channel, address)
     → suppressed: mark SendJob SKIPPED, return (no retry)
  2. If SMS: QuietHoursUtil.canSendNow(zipCode, stateCode)
     → outside window: re-enqueue with delay to next 08:00 local (NOT dropped)
     → inside window: proceed
  3. Render body via EmailService.compileTemplate (Handlebars)
  4. Dispatch via SmsService.send() or EmailService.send()
  5. Update SendJob.status + write SendEvent(DELIVERED/FAILED)
```

### Unsubscribe (`GET /m/u/:token`)

```
1. Decode JWT → { companyId, channel, address, sendJobId }
   (signed with MARKETING_TOKEN_SECRET, 90-day expiry)
2. SuppressionService.addSuppression(companyId, channel, address, UNSUBSCRIBED)
3. Write SendEvent(UNSUBSCRIBED) for sendJobId
4. Return 200 + self-contained HTML confirmation page
```

### Click redirect (`GET /m/r/:token`)

```
1. Decode JWT → { sendJobId, destinationUrl }
2. Write SendEvent(CLICKED) — fire-and-forget (does not block redirect)
3. Return 302 → destinationUrl
```

### SendGrid webhook (`POST /m/webhooks/sendgrid`)

```
1. Verify SendGrid signature (SENDGRID_WEBHOOK_SIGNING_SECRET) → 403 if invalid
2. For each event: map type → SendEventType, find SendJob by externalId, write SendEvent
3. unsubscribe/spamreport → SuppressionService.addSuppression(EMAIL)
4. Return 200 (always ack — SendGrid retries on non-2xx)
```

### Twilio webhook (`POST /m/webhooks/twilio`)

```
1. Verify Twilio signature via SmsService.validateWebhookSignature() → 403 if invalid
2. Status callback (MessageSid, no Body): map status → SendEventType, write SendEvent
3. Inbound STOP keyword: addSuppression(SMS, UNSUBSCRIBED)
4. Return 200 + empty TwiML <Response/>
```

### Meta attribution fix (crm-service)

```
MetaService.processLead(leadgenId):
  Lead.create({
    source:    'META_LEADGEN',
    leadgenId: leadgenId,      // replaces stuffing into notes
    adName:    data.ad_name,
    formId:    data.form_id,
    notes:     <other field_data>
  })
```

Duplicate detection changes from `WHERE notes CONTAINS leadgenId` → `WHERE leadgen_id = $1` (indexed).

---

## Nginx Routes

Add to both `infrastructure/nginx/nginx.conf` and `infrastructure/nginx/nginx.cloud.conf`:

```nginx
# Marketing public — unauthenticated, customer-facing
location ^~ /m/ {
  proxy_pass http://comms_service/m/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The `/m/webhooks/` path is covered by the `/m/` prefix match. Raw body is preserved for signature verification (nginx does not buffer by default for proxy_pass).

---

## Environment Variables

```bash
# marketing Postgres schema (Supabase, same instance)
MARKETING_DATABASE_URL=           # PgBouncer URL, search_path=marketing
MARKETING_DIRECT_DATABASE_URL=    # Direct URL for prisma migrate only

# Link signing
MARKETING_TOKEN_SECRET=           # 32-byte random hex, generated once at setup

# Provider webhooks
SENDGRID_WEBHOOK_SIGNING_SECRET=  # SendGrid Settings → Event Webhook → Signing Key

# Public URL bases (for building links embedded in sends)
MARKETING_CLICK_BASE_URL=         # e.g. https://yourdomain.com
MARKETING_UNSUBSCRIBE_BASE_URL=   # e.g. https://yourdomain.com
```

Reused (already exist): `TWILIO_AUTH_TOKEN`, `TWILIO_WEBHOOK_SECRET`, `SENDGRID_API_KEY`.

---

## Queue

Add to `packages/queue/src/index.ts`:

```typescript
MARKETING_SEND = 'marketing-send',
```

---

## Timezone Resolution

`QuietHoursUtil.canSendNow(zipCode, stateCode)`:
- Primary: `zipcode-to-timezone` npm package (offline lookup, ~500 KB dataset)
- Fallback: state abbreviation → representative IANA zone map (covers missing/unrecognised zips)
- Decision: if both are absent, default to `America/New_York` (most conservative — broadest coverage of US business hours)

---

## Lead Model Migration (crm-service)

```sql
ALTER TABLE crm.leads ADD COLUMN IF NOT EXISTS leadgen_id TEXT;
ALTER TABLE crm.leads ADD COLUMN IF NOT EXISTS ad_name    TEXT;
ALTER TABLE crm.leads ADD COLUMN IF NOT EXISTS form_id    TEXT;

CREATE INDEX IF NOT EXISTS leads_leadgen_id_idx ON crm.leads (leadgen_id)
  WHERE leadgen_id IS NOT NULL;
```

Zero-downtime, backward-compatible (all nullable). Prisma schema additions are optional fields.

---

## Testing Coverage

| Unit | What is tested |
|---|---|
| `SuppressionService` | `isSuppressed` true/false; `addSuppression` enforces unique constraint; re-subscribe removes row |
| `QuietHoursUtil` | Known zip → correct IANA tz; 07:59 blocked, 08:00 allowed, 21:00 blocked; missing zip falls back to state; both absent defaults to America/New_York |
| `MarketingSendWorker` | Suppressed → SKIPPED, no send call; outside quiet hours → re-enqueues with delay; happy path → send called, SendJob updated |
| `WebhooksController` | Invalid SendGrid signature → 403; STOP inbound → suppression created; bounce event → SendEvent written; always returns 200 |
| `PublicController` | Expired token → 410 Gone; valid unsubscribe → suppression + HTML 200; valid click → SendEvent + 302 |

All unit tests mock Prisma and the send services — no live DB or provider calls.

---

## What This Sprint Does NOT Include

Sprint 0 deliberately excludes everything from Sprints 1–5. Specifically:
- No review request sending logic (Sprint 1)
- No equipment automation workers (Sprint 2)
- No churn-risk triggers (Sprint 3)
- No campaign builder or dashboard (Sprint 4)
- No marketing settings page (Sprint 5)

The `ReviewRequest` and `MarketingAttribution` tables are created now so Sprint 1 can start immediately without a schema migration.

---

## How This Was Decided

All decisions in this spec were made in a Claude conversation on 2026-05-12. Key choices:
- Separate Prisma client (not multi-schema) — consistent with existing per-service pattern
- Inline HTML for unsubscribe confirmation — works independently of frontend
- `zipcode-to-timezone` npm package — offline, accurate, no API cost
- Sub-module structure — prevents flat-module blowup as sprints 1–4 add features

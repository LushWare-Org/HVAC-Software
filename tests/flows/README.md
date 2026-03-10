# T&S Services CRM — API Flow Tests

> **Client Demo Suite** — Rich, narrative API tests that demonstrate every major
> business workflow in the system. Run these to prove the system works end-to-end
> and to walk clients through capabilities without needing a frontend.

---

## What These Tests Do

Each test file is a **business flow** — a complete story told through API calls with
detailed console output explaining every step in plain English.

| Flow | File | Description | Services |
|------|------|-------------|---------|
| 01 | `01-lead-to-customer.test.ts` | Lead capture → qualification → customer onboarding | CRM |
| 02 | `02-full-job-lifecycle.test.ts` | Job creation → dispatch → work order → completion | Jobs, CRM |
| 03 | `03-quote-to-payment.test.ts` | Quote → approval → invoice → payment collected | Finance |
| 04 | `04-technician-dispatch.test.ts` | Dispatch board → appointment → GPS tracking | Scheduling |
| 05 | `05-automation-rules.test.ts` | SMS/email templates + automation rule triggers | Comms |
| 06 | `06-two-way-messaging.test.ts` | Outbound SMS + inbound Twilio webhook → thread | Comms |
| 07 | `07-customer-portal.test.ts` | Self-service: view history, pay invoice, book job | CRM, Finance, Jobs |
| 08 | `08-service-agreements.test.ts` | Digital contract + recurring annual billing | CRM, Finance |
| 09 | `09-analytics-reporting.test.ts` | KPI dashboard, revenue reports, exports | Analytics |
| 10 | `10-full-e2e-showcase.test.ts` | **THE GRAND FINALE** — complete journey, all services | ALL |

---

## Prerequisites

### 1. Start all services

The tests hit real HTTP endpoints. All services must be running:

```bash
# From the monorepo root
docker compose up -d

# Or start services individually:
# CRM       → cd apps/crm-service && npm run start:dev
# Jobs      → cd apps/jobs-service && npm run start:dev
# Scheduling→ cd apps/scheduling-service && go run main.go
# Finance   → cd apps/finance-service && npm run start:dev
# Comms     → cd apps/comms-service && npm run start:dev
# Analytics → cd apps/analytics-service && npm run start:dev
```

Verify services are up:
```bash
curl http://localhost:3001/health  # CRM
curl http://localhost:3002/health  # Jobs
curl http://localhost:3003/health  # Scheduling (Go)
curl http://localhost:3004/health  # Finance
curl http://localhost:3005/health  # Comms
curl http://localhost:3006/health  # Analytics
```

### 2. Enable auth bypass on all services

Each service's `.env` (or `docker-compose.yml` environment) must have:

```env
BYPASS_AUTH=true
NODE_ENV=test
```

This tells `JwtAuthGuard` to skip Auth0 verification and accept the
`x-test-company-id` header used by the test suite.

> ⚠️ **NEVER set `BYPASS_AUTH=true` in production.**

### 3. Install test dependencies

```bash
cd tests/flows
npm install
```

---

## Running the Tests

### Run all flows (full client demo)
```bash
cd tests/flows
npm test
```

### Run a single flow
```bash
npm run test:01    # Lead to Customer
npm run test:02    # Full Job Lifecycle
npm run test:03    # Quote to Payment
npm run test:04    # Technician Dispatch
npm run test:05    # Automation Rules
npm run test:06    # Two-Way Messaging
npm run test:07    # Customer Portal
npm run test:08    # Service Agreements
npm run test:09    # Analytics & Reporting
npm run test:showcase  # Grand Finale (all services)
```

### Run from monorepo root
```bash
npx jest --runInBand --forceExit --testPathPattern="tests/flows/01"
```

---

## Understanding the Output

The tests produce rich, colour-coded console output designed for client demos.

### Banner Types

```
╔══════════════════════════════════════════════════════════════╗
║  FLOW 03: Quote to Payment                                   ║
║  Description of the business scenario...                    ║
╚══════════════════════════════════════════════════════════════╝
```

```
┌─ STEP 2: Send Quote to Customer ─────────────────────────────┐
│  Description of what this step represents in the business... │
└──────────────────────────────────────────────────────────────┘
```

### Log Types

| Symbol | Meaning |
|--------|---------|
| `🔷 REQUEST` | HTTP call being made |
| `🟢 RESPONSE` | Successful API response |
| `💾 SAVED` | ID stored in shared state for later steps |
| `📌 FACT` | Key data point from the response |
| `✅ ASSERT` | Business assertion passed |
| `ℹ️  CONTEXT` | Background explanation for client |
| `⚠️  EXPECTED` | Non-critical failure (service offline, etc.) |

### Flow Summary Table

At the end of each flow:
```
┌─ FLOW SUMMARY: Quote to Payment ──────────────────────────────────┐
│  ✅ PASS  Create itemised quote for job                           │
│  ✅ PASS  Send quote to customer via email                        │
│  ✅ PASS  Customer approves quote online                          │
│  ✅ PASS  Convert approved quote to invoice                       │
│  ✅ PASS  Record payment and mark invoice PAID                    │
│                                                                    │
│  Result: 5 passed, 0 failed                                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## How State Sharing Works

Tests run **in order** (`--runInBand`) and share state through
`helpers/shared-state.ts`. This means:

- Flow 01 creates a customer → saves `state.customerId`
- Flow 02 creates a job using that customer → saves `state.jobId`
- Flow 03 creates a quote for that job → saves `state.quoteId`
- etc.

This creates a **continuous business narrative** across all 10 flows,
which is ideal for client demos.

If you run a single flow in isolation, it gracefully falls back to
demo IDs (e.g., `cust-demo-001`) so steps don't crash.

---

## Auth Bypass Explained

The test suite adds these headers to every request:

```
x-test-company-id: co-demo-001
x-test-user-id:    user-admin-001
x-test-user-role:  COMPANY_ADMIN
x-test-user-email: admin@demo.tscrm.dev
x-test-user-name:  Demo Admin
```

When `BYPASS_AUTH=true`, the `JwtAuthGuard` reads these headers instead
of validating a real Auth0 JWT. This is implemented in:

```
packages/auth-client/src/jwt-auth.guard.ts
```

The bypass is protected by two checks:
1. `process.env.NODE_ENV !== 'production'`
2. `process.env.BYPASS_AUTH === 'true'`

Both must be true. If either is false, normal Auth0 JWT verification applies.

---

## Troubleshooting

### Tests skip with "service not responding"
The `ensureServicesUp()` helper checks `/health` before each suite.
If a service is down, tests in that suite skip gracefully with `logExpected()`.
Start the missing service and re-run.

### "No customerId in state — using demo fallback"
This means Flow 01 didn't run before this flow (or it failed).
Run the full suite with `npm test` so flows run in order.
Or run `npm run test:01` first, then the flow you want.

### Twilio webhook tests return 401/403
This is expected and correct. The `/webhooks/twilio/inbound` endpoint
validates a Twilio HMAC signature that can't be replicated in tests.
Flow 06 handles this gracefully with `logExpected()`.

### Analytics tests return empty data
Analytics queries your database. If you haven't run flows 01–08 first,
there's no data to analyse. Run `npm run test:all` to populate data,
then run `npm run test:09` for a meaningful analytics demo.

---

## File Structure

```
tests/flows/
├── README.md                    ← You are here
├── package.json                 ← npm scripts + dependencies
├── jest.config.ts               ← Jest configuration (runInBand, verbose)
├── tsconfig.json                ← TypeScript config
├── .env.test                    ← Environment variables template
│
├── helpers/
│   ├── logger.ts               ← Rich ANSI-coloured CLI logger
│   ├── api-client.ts           ← Axios wrapper with auto-logging
│   ├── shared-state.ts         ← Cross-flow state (customerId, jobId, etc.)
│   └── data-factory.ts         ← Realistic test data generators
│
├── 01-lead-to-customer.test.ts
├── 02-full-job-lifecycle.test.ts
├── 03-quote-to-payment.test.ts
├── 04-technician-dispatch.test.ts
├── 05-automation-rules.test.ts
├── 06-two-way-messaging.test.ts
├── 07-customer-portal.test.ts
├── 08-service-agreements.test.ts
├── 09-analytics-reporting.test.ts
└── 10-full-e2e-showcase.test.ts ← ★ Grand Finale
```

---

## Using for Client Demos

**Recommended demo flow:**

1. Open a terminal with a large font and clear background
2. Run `npm run test:showcase` (Flow 10 — tells the complete story)
3. Talk through the output as it scrolls — each `📌 FACT` line is a talking point
4. If the client wants to see a specific feature in detail, run that individual flow

**Pro tip:** Run `npm test` and scroll back to the summary tables. Each flow
shows a clean checklist of what was demonstrated — great for a PDF export or
follow-up email to the client.

---

*Built for T&S Services CRM — the field service management platform for trade businesses.*

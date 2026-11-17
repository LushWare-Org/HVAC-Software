# T&S CRM — AI Chatbot Feature

## Overview

Two AI assistant bots embedded in the system — one for the customer portal, one for the admin dashboard. Same underlying infrastructure, different system prompts and different tool access per role. Built on OpenAI SDK (no LangChain), with tool use / function calling for live data queries and a rich system prompt for help/flow questions.

---

## Bot Summary

| | Customer Portal Bot | Admin Dashboard Bot |
|---|---|---|
| Help scope | Customer portal flows (pay invoice, view jobs, messaging, equipment, statuses) | Full admin feature set (dispatch, marketing, import, technicians, analytics, campaigns, agreements) |
| Data scope | Their own jobs, invoices, equipment — scoped to `customerId` | Revenue, jobs, customers — scoped to `companyId` |
| Primary model | `gpt-4o-mini` | `gpt-4o-mini` (help) + `gpt-4o` (data tools) |
| Auth source | Customer JWT (`customerId` enforced server-side) | Company JWT (`companyId` enforced server-side, role-gated) |

---

## Architecture

```
Frontend (admin-dashboard / customer-portal)
  └── ChatWidget component (floating bubble, bottom-right corner)
        └── POST /chat/message  { message, history: last 10 turns }  + JWT
              │
        agent-service  (new NestJS service, port 3008)
              ├── ChatController   — receives request, streams SSE response
              ├── ChatService      — builds messages array, calls OpenAI, handles tool loop
              ├── ToolRegistry     — defines tools per bot type (customer / admin)
              ├── ToolExecutor     — executes tool calls, proxies to existing services
              └── LLMProvider      — thin OpenAI SDK wrapper, model via env var
```

### Key principles
- **No LangChain.** Raw `openai` npm SDK — full control, easy debugging, no abstraction leakage.
- **Model is config-driven.** `OPENAI_MODEL_HELP` and `OPENAI_MODEL_DATA` env vars. Swap model without code changes.
- **No new DB tables.** Chat history is ephemeral — last 10 turns in React state, sent with each request.
- **No new data sources.** Agent-service proxies to existing analytics-service, crm-service, finance-service endpoints that already exist, are cached, and are auth-guarded.
- **botType derived server-side** from JWT role — client never controls which tool set it gets.

---

## Tool Definitions

### Customer bot tools (all hard-scoped to `customerId` from JWT)

| Tool | Description | Proxies to |
|---|---|---|
| `get_my_jobs(status?)` | List the customer's jobs, optionally filtered by status | `GET /jobs?customerId=...` |
| `get_my_invoices(status?)` | List the customer's invoices, optionally filtered by status | `GET /finance/invoices?customerId=...` |
| `get_my_equipment()` | List equipment registered under the customer | `GET /crm/customers/:id/equipment` |
| `get_my_next_appointment()` | Next scheduled job for this customer | derived from `get_my_jobs(SCHEDULED)` |

### Admin bot tools (all hard-scoped to `companyId` from JWT)

| Tool | Description | Proxies to |
|---|---|---|
| `get_revenue_summary(period)` | Revenue total for a period (today/week/month/year) | `GET /analytics/revenue/series` |
| `get_job_stats(status?, date_range?)` | Job counts by status or date range | `GET /analytics/jobs-analytics/by-status` |
| `get_customer_stats()` | KPIs — total customers, new this month, retention | `GET /analytics/dashboard/kpis` |
| `get_top_technicians(n?)` | Top N technicians by jobs completed / rating | `GET /analytics/technician-metrics` |
| `list_overdue_invoices()` | All overdue invoices with amounts | `GET /finance/invoices?status=OVERDUE` |
| `get_new_customers(period)` | New customers in a given period | `GET /crm/customers?since=...` |

`super_admin` role bypasses `companyId` scoping — gets cross-company data.

---

## System Prompts

Two prompts, written once, versioned in code as constants. Loaded at service startup.

**Customer prompt (~1500 tokens):**
Describes the customer portal: how to view and pay invoices, how to view job history and statuses, how to send messages, how to view registered equipment, what each job/invoice status means, how to update profile. Friendly tone, non-technical.

**Admin prompt (~3000 tokens):**
Describes every admin dashboard section: customers, leads, jobs, dispatch, agreements, finance, analytics, communications, marketing (campaigns, audiences, templates), data import wizard, technician management, inventory, settings. Includes common workflows: approving a technician, dispatching a job, launching a campaign, reading the analytics dashboard, running an import.

When the model detects a help question → answers from its knowledge, no tools called.
When the model detects a data question → calls the relevant tool, gets the result, formats a plain-English answer.

---

## Frontend — ChatWidget

A single shared React component (`ChatWidget`) parameterised by `botType: 'customer' | 'admin'`.

- **Trigger:** Floating bubble button, bottom-right corner, on all pages of both portals
- **Panel:** Expands to ~380px wide × 520px tall chat panel
- **Streaming:** Responses arrive via SSE — text appears word by word
- **History:** Last 10 turns stored in React `useState`, sent with every request, cleared on page refresh
- **States:** Loading spinner while waiting for first token, error state with retry, empty state with suggested starter questions
- **Starter prompts:** 3 tappable example questions shown when chat is empty (different per botType)

---

## Auth Layer

- `agent-service` sits behind `JwtAuthGuard` — same pattern as every other NestJS service
- `botType` resolved server-side: `role === 'customer'` → customer bot, any staff role → admin bot
- Customer tools: `customerId` extracted from JWT, hard-injected into every tool call — user input cannot override it
- Admin tools: `companyId` extracted from JWT, hard-injected — an admin cannot query another company's data
- `super_admin`: admin tools without `companyId` restriction

---

## Streaming

`agent-service` uses Server-Sent Events (SSE) to stream OpenAI token-by-token responses back to the frontend. The OpenAI SDK's streaming API yields chunks; the controller pipes them directly to the SSE response. Tool call results are awaited mid-stream, then the model continues generating with the result.

---

## Environment Variables (new)

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL_HELP=gpt-4o-mini
OPENAI_MODEL_DATA=gpt-4o
CHAT_HISTORY_TURNS=10
```

---

## What is NOT in scope (v1)

- Chat history persisted to DB
- Multi-turn tool use (chained tool calls in one turn — not needed for these queries)
- Voice input
- File/image upload to chat
- Admin bot querying inventory-service or comms-service (can add later as new tools)
- Technician app chatbot (mobile — separate effort)

---

## Implementation Status

| Phase | Status | Notes |
|---|---|---|
| 0 — Bootstrap chat-service | ✅ Done | `apps/chat-service/` NestJS service, port 3008, nginx wired |
| 1 — LLMProvider + ChatService + SSE | ✅ Done | Streaming with tool call loop |
| 2 — System prompts | ✅ Done | Customer (~1500 tokens) + Admin (~3000 tokens) |
| 3 — Customer tools | ✅ Done | 4 tools: jobs, invoices, equipment, next appointment |
| 4 — Admin tools | ✅ Done | 6 tools: revenue, job stats, customer stats, technicians, overdue invoices, new customers |
| 5 — Frontend ChatWidget | ✅ Done | Floating bubble in admin-dashboard + customer-portal |
| 6 — Polish | ⏳ Pending | Rate limiting, edge case testing |

**To start the service:** Add your `OPENAI_API_KEY` to `.env`, then run:
```bash
pnpm --filter chat-service dev
```

---

## Implementation Plan

### Phase 0 — Infrastructure setup (agent-service bootstrap)
- [ ] Bootstrap `agent-service` as a NestJS app in `apps/agent-service/` (port 3008)
- [ ] Add `openai` npm package
- [ ] Wire `JwtAuthGuard` from `@tscrm/auth-client`
- [ ] Add nginx route: `/agent/*` → `localhost:3008`
- [ ] Add to `pnpm dev` Turborepo pipeline
- [ ] Add env vars to `.env.example`

### Phase 1 — LLMProvider + ChatService core
- [ ] `LLMProvider` class — wraps OpenAI SDK, reads model from env, exposes `streamChat(messages, tools?)` returning an async iterable
- [ ] `ChatService` — builds the messages array (system prompt + history + current message), runs the OpenAI streaming call, handles tool call loop (call tool → append result → continue generation)
- [ ] `ChatController` — `POST /agent/chat` endpoint, streams SSE response back

### Phase 2 — System prompts
- [ ] Write `CUSTOMER_SYSTEM_PROMPT` constant (customer portal flows, friendly tone)
- [ ] Write `ADMIN_SYSTEM_PROMPT` constant (all admin features, all workflows)
- [ ] `PromptService` — returns correct prompt based on JWT role

### Phase 3 — Tool registry + executor (customer tools)
- [ ] `ToolRegistry` — defines OpenAI tool schemas for customer tools (4 tools)
- [ ] `ToolExecutor` — executes tool calls by name, proxies to crm-service + finance-service with `customerId` from JWT
- [ ] Integration test: ask "do I have any open invoices?" → tool called → result returned

### Phase 4 — Admin tools
- [ ] Add 6 admin tools to `ToolRegistry`
- [ ] Add admin tool execution to `ToolExecutor` — proxies to analytics-service + finance-service + crm-service with `companyId` from JWT
- [ ] Integration test: ask "how much revenue this month?" → `get_revenue_summary(month)` called → plain English answer

### Phase 5 — Frontend ChatWidget
- [ ] `ChatWidget.tsx` shared component — floating bubble + expandable panel
- [ ] SSE streaming hook (`useChatStream`) — connects to `/agent/chat`, accumulates streamed tokens into message state
- [ ] Starter prompts per `botType`
- [ ] Add `<ChatWidget botType="customer" />` to customer-portal layout
- [ ] Add `<ChatWidget botType="admin" />` to admin-dashboard layout

### Phase 6 — Polish + edge cases
- [ ] Error handling — OpenAI API down → graceful fallback message
- [ ] Rate limiting — max 20 requests per user per minute (simple in-memory, not Redis)
- [ ] Empty/unclear questions → bot asks for clarification rather than hallucinating
- [ ] Test: customer cannot get another customer's data even if they craft a clever prompt
- [ ] Test: admin cannot get another company's data

---

## Files to create / modify

### New files
```
apps/agent-service/
  src/
    main.ts
    app.module.ts
    chat/
      chat.controller.ts
      chat.service.ts
      chat.module.ts
    llm/
      llm.provider.ts
      llm.module.ts
    prompts/
      customer.prompt.ts
      admin.prompt.ts
      prompt.service.ts
    tools/
      tool.registry.ts
      tool.executor.ts
      customer.tools.ts
      admin.tools.ts
  package.json
  tsconfig.json

apps/admin-dashboard/src/
  components/chat/
    ChatWidget.tsx
    useChatStream.ts

apps/customer-portal/src/
  components/chat/
    ChatWidget.tsx      (shared or symlinked)
    useChatStream.ts
```

### Modified files
```
infrastructure/nginx/nginx.conf          — add /agent/* proxy route
infrastructure/nginx/nginx.conf.template — same for prod
.env.example                             — add OPENAI_* vars
turbo.json                               — add agent-service to pipeline
pnpm-workspace.yaml                      — already covers apps/*
```

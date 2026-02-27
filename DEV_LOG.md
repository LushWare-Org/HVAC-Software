# T&S CRM — Development Log

> **Purpose:** Chronological log of what was built each session. Append new entries at the top.
> **Format:** Date → What was done → What's next → Any blockers or decisions made

---

## Session 2 — Feb 2026 (Week 1: Foundation)

**Status: ✅ Foundation complete — ready for first `pnpm install`**

### What was built

**Monorepo scaffold (Turborepo + pnpm workspaces):**
- `package.json` — root monorepo config, Node 20 / pnpm 9 enforced
- `pnpm-workspace.yaml` — points to `apps/*` and `packages/*`
- `turbo.json` — build/dev/lint/test/type-check tasks defined
- `tsconfig.base.json` — strict TS 5.4 config inherited by all packages
- `.gitignore` — covers node_modules, dist, .env, .docker-data, *.docx
- `.env.example` — full template with all service env vars documented
- `README.md` — quick start guide

**Docker Compose (infrastructure only):**
- PostgreSQL 16 + PostGIS (port 5432, healthcheck)
- Redis 7 (port 6379, AOF persistence, healthcheck)
- MongoDB 7 (port 27017, for comms-service)
- MinIO S3-compatible storage (port 9000/9001)
- Nginx API gateway (port 80, routes by /api/<service>/ prefix)

**Infrastructure configs:**
- `infrastructure/nginx/nginx.conf` — 6 upstreams to host.docker.internal, WebSocket support for Socket.IO
- `infrastructure/postgres/init.sql` — creates PostGIS, pg_trgm extensions + 5 schemas (crm, jobs, scheduling, finance, analytics) + grants

**Shared packages:**
- `packages/types` — Role enum, JwtPayload, AuthUser, JobStatus, TradeType, InvoiceStatus, QuoteStatus, BullMQ payload types, pagination helpers
- `packages/auth-client` — JwtStrategy (Auth0 RS256 JWKS), JwtAuthGuard, RolesGuard, @Roles() decorator, @CurrentUser() decorator, AuthModule (NestJS importable)
- `packages/queue` — QueueName enum (9 queues), createRedisConnection(), createQueue() factory, BullMQ re-exports

**CRM Service (apps/crm-service) — FULL SCAFFOLD:**
- `prisma/schema.prisma` — Company, Customer (RESIDENTIAL/COMMERCIAL), Contact, Lead (full pipeline), ServiceAgreement, Booking, Review
- `prisma/seed.ts` — demo company + demo customer
- `src/main.ts` — NestJS bootstrap, global ValidationPipe, CORS, Swagger on /docs
- `src/app.module.ts` — wires ConfigModule, AuthModule, PrismaModule, HealthModule, CustomersModule, ContactsModule, LeadsModule, BookingsModule
- `src/prisma/` — PrismaService (connect/disconnect lifecycle) + PrismaModule (global)
- `src/health/` — HealthController using @nestjs/terminus (Prisma ping)
- `src/customers/` — full CRUD: CreateCustomerDto, UpdateCustomerDto, CustomersService (paginated search, stats, soft-delete), CustomersController (role-gated)
- `src/contacts/` — list/create/delete contacts per customer
- `src/leads/` — list, create, update status, pipeline summary
- `src/bookings/` — list, create, confirm, convert-to-job

**Service stubs (apps/<service>) — minimal boot + /health:**
- `job-service` (port 3002) — TODO Week 3
- `scheduling-service` (port 3003) — Go, README only, TODO Week 4
- `finance-service` (port 3004) — TODO Week 5
- `comms-service` (port 3005) — TODO Week 6
- `analytics-service` (port 3006) — TODO Week 7

### Decisions confirmed this session
- **Auth provider:** Auth0 (not Keycloak) — RS256, JWKS endpoint
- **Dev OS:** macOS — `host.docker.internal` used in Nginx config
- **Production host:** Decide later (Docker Swarm vs AWS ECS Fargate)

### What's next (Week 1 completion)
1. ✅ **YOU (Ravishan):** `git init && git add . && git commit -m "feat: Week 1 foundation"` — tell me when done
2. **YOU:** Set up Auth0 (see AUTH0_SETUP.md)
3. **YOU:** Run `pnpm install && docker compose up -d`
4. **YOU:** `cd apps/crm-service && pnpm prisma:generate && pnpm prisma:migrate`
5. Then we build **Job Management Service** (Week 2/3)

---

## Session 1 — Feb 2026 (Architecture & Planning)

**Status: ✅ Architecture complete, all decisions documented**

- PDF-to-architecture conversation: 14 → 8 → 6 services final
- All 67 features mapped to 6 services
- Database strategy: single PG + separate schemas
- Trade template system designed (DB-driven, no code changes for new trades)
- AI scheduling: Phase 1 rule-based Go, Phase 2 ML post-launch
- Frontend: React 18 Admin + Next.js 14 Customer Portal + React Native Technician App
- Removed customer mobile app (saves 2-3 weeks)
- Auth: Auth0 (RS256), 6 RBAC roles, multi-tenant via company_id
- API Gateway: Nginx dev, Kong prod
- Documents created: Architecture Final.docx, Quick Reference.docx, PROJECT_STATUS.md

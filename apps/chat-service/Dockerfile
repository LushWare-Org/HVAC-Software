# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/chat-service/ ./apps/chat-service/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter=@tscrm/types build 2>/dev/null || true
RUN pnpm --filter=@tscrm/auth-client build 2>/dev/null || true

RUN pnpm --filter=chat-service build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/chat-service/package.json ./apps/chat-service/package.json

RUN pnpm install --frozen-lockfile --prod --filter=chat-service...

WORKDIR /app/apps/chat-service

COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/chat-service/dist ./dist
COPY --from=builder /repo/apps/chat-service/package.json ./

EXPOSE 3008
CMD ["node", "dist/main"]

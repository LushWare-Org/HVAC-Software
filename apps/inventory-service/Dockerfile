# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS builder
WORKDIR /repo

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests (for layer caching — only reinstall when these change)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/inventory-service/ ./apps/inventory-service/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first (required by services)
RUN pnpm --filter=@tscrm/types build 2>/dev/null || true
RUN pnpm --filter=@tscrm/auth-client build 2>/dev/null || true

# Build the service
RUN pnpm --filter=inventory-service build

# Generate Prisma client
RUN cd apps/inventory-service && npx prisma generate

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/inventory-service/package.json ./apps/inventory-service/package.json

RUN pnpm install --frozen-lockfile --prod --filter=inventory-service...

WORKDIR /app/apps/inventory-service

COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/inventory-service/dist ./dist
COPY --from=builder /repo/apps/inventory-service/src/prisma/generated ./dist/prisma/generated
COPY --from=builder /repo/apps/inventory-service/prisma ./prisma
COPY --from=builder /repo/apps/inventory-service/package.json ./

EXPOSE 3007
CMD ["node", "dist/main.js"]
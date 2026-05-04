# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Prisma needs the openssl CLI available to detect the correct engine target.
RUN apk add --no-cache openssl

# Copy workspace manifests (for layer caching — only reinstall when these change)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/crm-service/ ./apps/crm-service/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first (required by services)
RUN pnpm --filter=@tscrm/types build 2>/dev/null || true
RUN pnpm --filter=@tscrm/auth-client build 2>/dev/null || true

# Build the service
RUN pnpm --filter=crm-service build

# Generate Prisma client
RUN cd apps/crm-service && npx prisma generate

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Keep the runtime image able to detect the Alpine OpenSSL version for Prisma.
RUN apk add --no-cache openssl

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/crm-service/package.json ./apps/crm-service/package.json

RUN pnpm install --frozen-lockfile --prod --filter=crm-service...

WORKDIR /app/apps/crm-service

COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/crm-service/dist ./dist
COPY --from=builder /repo/apps/crm-service/src/prisma/generated ./dist/prisma/generated
COPY --from=builder /repo/apps/crm-service/prisma ./prisma
COPY --from=builder /repo/apps/crm-service/package.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]
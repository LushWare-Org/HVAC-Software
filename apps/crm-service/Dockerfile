# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS builder
WORKDIR /repo

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

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
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Shared runtime libraries the prebuilt `canvas` binary dynamically links against
# (pulled in via pdf-to-img, used by document-templates). Without these the
# process crashes on boot the moment anything require()s canvas, since it's an
# eager NestJS provider import, not a lazily-loaded one.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libpixman-1-0 \
    && rm -rf /var/lib/apt/lists/*

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
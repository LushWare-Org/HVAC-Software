# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests (for layer caching — only reinstall when these change)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/finance-service/ ./apps/finance-service/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first (required by services)
RUN pnpm --filter=@tscrm/types build 2>/dev/null || true
RUN pnpm --filter=@tscrm/auth-client build 2>/dev/null || true

# Build the service
RUN pnpm --filter=finance-service build

# Generate Prisma client
RUN cd apps/finance-service && npx prisma generate

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/finance-service/package.json ./apps/finance-service/package.json

RUN pnpm install --frozen-lockfile --prod --filter=finance-service...

WORKDIR /app/apps/finance-service

COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/finance-service/dist ./dist
COPY --from=builder /repo/apps/finance-service/prisma ./prisma
COPY --from=builder /repo/apps/finance-service/src/prisma/generated ./dist/prisma/generated
COPY --from=builder /repo/apps/finance-service/package.json ./

# Puppeteer requires Chromium on the runtime image.
#
# Bookworm, not bullseye. Debian 11 moved to LTS and its security pool no
# longer carries the exact point-release versions its index advertises, so
# this install started failing with 404s on libglx-mesa0 and
# libavahi-common-data. Not a cache problem: it fails identically with
# --no-cache and a freshly pulled base.
#
# /usr/bin/chromium is the same path on bookworm, so PUPPETEER_EXECUTABLE_PATH
# below is unchanged.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
    
EXPOSE 3004
CMD ["node", "dist/main.js"]
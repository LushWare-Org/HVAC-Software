FROM node:20-bullseye-slim

WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/

COPY apps/crm-service/package.json ./apps/crm-service/package.json
COPY apps/crm-service/prisma ./apps/crm-service/prisma
COPY apps/job-service/package.json ./apps/job-service/package.json
COPY apps/job-service/prisma ./apps/job-service/prisma
COPY apps/finance-service/package.json ./apps/finance-service/package.json
COPY apps/finance-service/prisma ./apps/finance-service/prisma
COPY apps/analytics-service/package.json ./apps/analytics-service/package.json
COPY apps/analytics-service/prisma ./apps/analytics-service/prisma
COPY apps/inventory-service/package.json ./apps/inventory-service/package.json
COPY apps/inventory-service/prisma ./apps/inventory-service/prisma

RUN pnpm install --frozen-lockfile

COPY infrastructure/prisma-migrate/run-prisma-migration.sh /usr/local/bin/run-prisma-migration.sh
RUN chmod +x /usr/local/bin/run-prisma-migration.sh

ENTRYPOINT ["/usr/local/bin/run-prisma-migration.sh"]
/**
 * Onboard (or update settings of) a tenant company. Idempotent on company email.
 *
 * Run from repo root:
 *   CRM_DIRECT_DATABASE_URL="postgresql://..." pnpm tsx scripts/seed-tenant.ts scripts/tenants/kase.example.json
 * or source it from apps/crm-service/.env:
 *   export $(grep '^CRM_DIRECT_DATABASE_URL' apps/crm-service/.env | tr -d '"') && pnpm tsx scripts/seed-tenant.ts <config.json>
 *
 * Settings (currency/timezone/features) are seed-only by design — this script
 * is the ONLY supported way to change them (PATCH /crm/company rejects them).
 */
import { PrismaClient } from '../apps/crm-service/src/prisma/generated'
import * as bcrypt from '../apps/crm-service/node_modules/bcrypt'
import * as fs from 'fs'

interface TenantConfig {
  name: string
  email: string
  country: string
  currency: string
  timezone: string
  features: Record<string, boolean>
  logoUrl?: string
  phone?: string
  admin: { name: string; email: string; tempPassword: string; mustResetPassword?: boolean }
}

async function main() {
  const configPath = process.argv[2]
  if (!configPath) throw new Error('Usage: pnpm tsx scripts/seed-tenant.ts <config.json>')
  if (!process.env.CRM_DIRECT_DATABASE_URL) {
    throw new Error('CRM_DIRECT_DATABASE_URL env var is required (session-mode Supabase URL)')
  }
  const cfg: TenantConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.CRM_DIRECT_DATABASE_URL } },
  })

  const data = {
    name: cfg.name,
    email: cfg.email,
    country: cfg.country,
    currency: cfg.currency,
    timezone: cfg.timezone,
    features: cfg.features,
    ...(cfg.logoUrl ? { logoUrl: cfg.logoUrl } : {}),
    ...(cfg.phone ? { phone: cfg.phone } : {}),
  }

  const existing = await prisma.company.findUnique({ where: { email: cfg.email } })
  const company = existing
    ? await prisma.company.update({ where: { id: existing.id }, data })
    : await prisma.company.create({ data })
  console.log(`${existing ? 'Updated' : 'Created'} company ${company.id} (${company.name})`)
  console.log(`  currency=${company.currency} timezone=${company.timezone} features=${JSON.stringify(company.features)}`)

  const adminExisting = await prisma.companyUser.findFirst({
    where: { companyId: company.id, email: cfg.admin.email },
  })
  if (!adminExisting) {
    const passwordHash = await bcrypt.hash(cfg.admin.tempPassword, 12) // same rounds as crm auth.service
    const admin = await prisma.companyUser.create({
      data: {
        companyId: company.id,
        name: cfg.admin.name,
        email: cfg.admin.email,
        passwordHash,
        role: 'company_admin',
        isActive: true,
        mustResetPassword: cfg.admin.mustResetPassword ?? true,
      },
    })
    console.log(`Created admin ${admin.id} (${admin.email})${(cfg.admin.mustResetPassword ?? true) ? ' — temp password, must reset at first login' : ''}`)
  } else {
    console.log(`Admin ${cfg.admin.email} already exists — skipped`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

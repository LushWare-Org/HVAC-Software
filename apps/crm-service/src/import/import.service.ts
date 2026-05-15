import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuthUser } from '@tscrm/types'
import { parse } from 'csv-parse/sync'
import { detectPlatform, getPlatformMap, autoMapGenericHeaders, TARGET_FIELDS, type Platform, type ColumnMap } from './platform-maps'

export interface DetectResult {
  batchId: string
  platform: Platform
  columnMap: ColumnMap[]
  headers: string[]
  preview: Record<string, string>[]
  totalRows: number
}

export interface ValidationResult {
  totalRows: number
  willImport: number
  willSkip: number
  willFail: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  rowNumber: number
  field: string
  message: string
  rawData: Record<string, string>
}

export interface ValidationWarning {
  type: string
  message: string
  count: number
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  async detect(companyId: string, fileBuffer: Buffer, filename: string, user: AuthUser): Promise<DetectResult> {
    const rows: Record<string, string>[] = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    })

    if (rows.length === 0) throw new Error('CSV file is empty or has no data rows')

    const headers = Object.keys(rows[0])
    const platform = detectPlatform(headers)
    const columnMap = platform === 'generic'
      ? autoMapGenericHeaders(headers, 'customer')
      : getPlatformMap(platform)
    const preview = rows.slice(0, 5)

    // Strip transform functions — they're not JSON-serialisable and aren't needed in storage
    const columnMapForDb = columnMap.map(({ csvHeader, targetField }) => ({ csvHeader, targetField }))

    const batch = await this.prisma.importBatch.create({
      data: {
        companyId,
        source: platform,
        status: 'VALIDATING',
        totalRows: rows.length,
        createdBy: user.email ?? user.userId,
        rawData: rows as any,
        columnMap: columnMapForDb as any,
      },
    })

    return { batchId: batch.id, platform, columnMap, headers, preview, totalRows: rows.length }
  }

  async validate(batchId: string, companyId: string, columnMap: ColumnMap[]): Promise<ValidationResult> {
    const batch = await this.prisma.importBatch.findFirst({ where: { id: batchId, companyId } })
    if (!batch) throw new NotFoundException('Import session not found')

    const rows = batch.rawData as Record<string, string>[]
    const isEquipment = batch.source === 'equipment'
    const fields = isEquipment ? TARGET_FIELDS.equipment : TARGET_FIELDS.customer
    const requiredFields = fields.filter(f => f.required).map(f => f.field)

    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let willSkip = 0
    let noEmail = 0

    // Duplicate detection — find existing emails in this company
    const existingEmails = new Set<string>()
    if (!isEquipment) {
      const existing = await this.prisma.customer.findMany({
        where: { companyId, isActive: true },
        select: { email: true },
      })
      existing.forEach(c => { if (c.email) existingEmails.add(c.email.toLowerCase()) })
    }

    const enrichedColumnMap = enrichWithTransforms(columnMap, batch.source as Platform)

    rows.forEach((row, i) => {
      const mapped = applyColumnMap(row, enrichedColumnMap)

      // Check required fields
      for (const field of requiredFields) {
        const val = mapped[field]?.trim()
        if (!val) {
          errors.push({ rowNumber: i + 2, field, message: `Missing required field: ${field}`, rawData: row })
        }
      }

      // Duplicate check for customers
      if (!isEquipment && mapped.email) {
        if (existingEmails.has(mapped.email.toLowerCase())) {
          willSkip++
        }
      }

      if (!isEquipment && !mapped.email) noEmail++
    })

    if (noEmail > 0) warnings.push({ type: 'no_email', message: `${noEmail} rows have no email — they will be imported but cannot receive marketing messages`, count: noEmail })

    const hardErrorRows = new Set(errors.map(e => e.rowNumber))
    const willFail = hardErrorRows.size

    return {
      totalRows: rows.length,
      willImport: rows.length - willSkip - willFail,
      willSkip,
      willFail,
      errors,
      warnings,
    }
  }

  async start(batchId: string, companyId: string, columnMap: ColumnMap[]): Promise<{ batchId: string }> {
    const batch = await this.prisma.importBatch.findFirst({ where: { id: batchId, companyId } })
    if (!batch) throw new NotFoundException('Import session not found')

    const columnMapForDb = columnMap.map(({ csvHeader, targetField }) => ({ csvHeader, targetField }))
    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'IMPORTING', columnMap: columnMapForDb as any },
    })

    // Fire-and-forget — do not await
    this.runImport(batchId, companyId, columnMap, batch.source as Platform).catch(async (err) => {
      await this.prisma.importBatch.update({
        where: { id: batchId },
        data: { status: 'FAILED', completedAt: new Date() },
      })
    })

    return { batchId }
  }

  private async runImport(batchId: string, companyId: string, columnMap: ColumnMap[], platform: Platform) {
    const batch = await this.prisma.importBatch.findUnique({ where: { id: batchId } })
    if (!batch) return

    // Re-attach transform functions stripped during DB serialisation
    columnMap = enrichWithTransforms(columnMap, platform)

    const rows = batch.rawData as Record<string, string>[]
    const isEquipment = platform === 'equipment'

    // Build existing email → customerId map for equipment linking
    const emailToCustomerId = new Map<string, string>()
    if (isEquipment) {
      const customers = await this.prisma.customer.findMany({
        where: { companyId, isActive: true },
        select: { id: true, email: true },
      })
      customers.forEach(c => { if (c.email) emailToCustomerId.set(c.email.toLowerCase(), c.id) })
    }

    const existingEmails = new Set<string>()
    if (!isEquipment) {
      const existing = await this.prisma.customer.findMany({
        where: { companyId, isActive: true },
        select: { email: true },
      })
      existing.forEach(c => { if (c.email) existingEmails.add(c.email.toLowerCase()) })
    }

    let imported = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const mapped = applyColumnMap(row, columnMap)

      try {
        if (isEquipment) {
          const customerEmail = mapped.customerEmail?.toLowerCase()
          const customerId = customerEmail ? emailToCustomerId.get(customerEmail) : null
          if (!customerId) {
            await this.prisma.importError.create({
              data: { batchId, rowNumber: i + 2, entityType: 'equipment', rawData: row as any, error: `No customer found with email: ${mapped.customerEmail}` },
            })
            failed++
          } else {
            await this.prisma.equipment.create({
              data: {
                companyId,
                customerId,
                type: mapped.type || 'Unknown',
                brand: mapped.brand || null,
                model: mapped.model || null,
                serialNo: mapped.serialNo || null,
                installDate: parseDate(mapped.installDate),
                warrantyEnd: parseDate(mapped.warrantyEnd),
                notes: mapped.notes || null,
                importBatchId: batchId,
              },
            })
            imported++
          }
        } else {
          const email = mapped.email?.toLowerCase()
          if (email && existingEmails.has(email)) {
            skipped++
          } else {
            if (!mapped.firstName) { failed++; continue }
            await this.prisma.customer.create({
              data: {
                companyId,
                firstName: mapped.firstName.trim(),
                lastName: (mapped.lastName || '').trim(),
                email: email || null,
                phone: mapped.phone || null,
                mobile: mapped.mobile || null,
                address: mapped.address || null,
                city: mapped.city || null,
                state: mapped.state || null,
                zipCode: mapped.zipCode || null,
                notes: mapped.notes || null,
                type: (mapped.type as any) === 'COMMERCIAL' ? 'COMMERCIAL' : 'RESIDENTIAL',
                source: 'import',
                importBatchId: batchId,
              },
            })
            if (email) existingEmails.add(email)
            imported++
          }
        }
      } catch (err) {
        await this.prisma.importError.create({
          data: { batchId, rowNumber: i + 2, entityType: isEquipment ? 'equipment' : 'customer', rawData: row as any, error: (err as Error).message },
        })
        failed++
      }

      // Update progress every 5 rows so the frontend bar moves visibly
      if ((i + 1) % 5 === 0 || i === rows.length - 1) {
        await this.prisma.importBatch.update({
          where: { id: batchId },
          data: { imported, skipped, failed },
        })
      }
    }

    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'DONE', imported, skipped, failed, completedAt: new Date() },
    })
  }

  async getBatch(batchId: string, companyId: string) {
    const batch = await this.prisma.importBatch.findFirst({
      where: { id: batchId, companyId },
      select: { id: true, source: true, status: true, totalRows: true, imported: true, skipped: true, failed: true, createdAt: true, completedAt: true, createdBy: true },
    })
    if (!batch) throw new NotFoundException('Batch not found')
    return batch
  }

  async listBatches(companyId: string) {
    return this.prisma.importBatch.findMany({
      where: { companyId },
      select: { id: true, source: true, status: true, totalRows: true, imported: true, skipped: true, failed: true, createdAt: true, completedAt: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  async rollback(batchId: string, companyId: string) {
    const batch = await this.prisma.importBatch.findFirst({ where: { id: batchId, companyId } })
    if (!batch) throw new NotFoundException('Batch not found')
    if (batch.status === 'ROLLED_BACK') throw new Error('Already rolled back')

    const [customers, equipment] = await Promise.all([
      this.prisma.customer.deleteMany({ where: { importBatchId: batchId, companyId } }),
      this.prisma.equipment.deleteMany({ where: { importBatchId: batchId, companyId } }),
    ])

    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'ROLLED_BACK', completedAt: new Date() },
    })

    return { customersDeleted: customers.count, equipmentDeleted: equipment.count }
  }

  async getErrors(batchId: string, companyId: string) {
    await this.getBatch(batchId, companyId) // auth check
    return this.prisma.importError.findMany({
      where: { batchId },
      orderBy: { rowNumber: 'asc' },
    })
  }

  // ── Super-admin: cross-company view ──────────────────────────────────────

  async listAllBatches(page: number, limit: number, companyId?: string) {
    const where = companyId ? { companyId } : {}
    const [batches, total] = await Promise.all([
      this.prisma.importBatch.findMany({
        where,
        select: {
          id: true, companyId: true, source: true, status: true,
          totalRows: true, imported: true, skipped: true, failed: true,
          createdAt: true, completedAt: true, createdBy: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.importBatch.count({ where }),
    ])

    // Enrich with company names
    const companyIds = [...new Set(batches.map(b => b.companyId))]
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    })
    const companyMap = new Map(companies.map(c => [c.id, c.name]))

    return {
      data: batches.map(b => ({ ...b, companyName: companyMap.get(b.companyId) ?? b.companyId })),
      total,
      page,
      limit,
    }
  }

  async listCompanies() {
    // Only companies that have at least one import batch
    const batches = await this.prisma.importBatch.findMany({
      select: { companyId: true },
      distinct: ['companyId'],
    })
    const ids = batches.map(b => b.companyId)
    if (ids.length === 0) return []
    return this.prisma.company.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  async adminRollback(batchId: string) {
    const batch = await this.prisma.importBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new NotFoundException('Batch not found')
    if (batch.status === 'ROLLED_BACK') throw new Error('Already rolled back')

    const [customers, equipment] = await Promise.all([
      this.prisma.customer.deleteMany({ where: { importBatchId: batchId } }),
      this.prisma.equipment.deleteMany({ where: { importBatchId: batchId } }),
    ])

    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'ROLLED_BACK', completedAt: new Date() },
    })

    return { customersDeleted: customers.count, equipmentDeleted: equipment.count }
  }

  async getAdminStats() {
    const [total, byStatus, recentActivity] = await Promise.all([
      this.prisma.importBatch.count(),
      this.prisma.importBatch.groupBy({ by: ['status'], _count: true }),
      this.prisma.importBatch.aggregate({
        _sum: { imported: true, skipped: true, failed: true },
      }),
    ])
    return {
      totalBatches: total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      totalImported: recentActivity._sum.imported ?? 0,
      totalSkipped:  recentActivity._sum.skipped  ?? 0,
      totalFailed:   recentActivity._sum.failed   ?? 0,
    }
  }
}

/**
 * Re-attach transform functions from the platform's canonical map.
 * Transforms are stripped before DB storage (functions aren't JSON-serialisable),
 * so validate/runImport must call this to get name-splitting etc. working.
 */
function enrichWithTransforms(columnMap: ColumnMap[], platform: Platform): ColumnMap[] {
  const platformMap = getPlatformMap(platform)
  return columnMap.map(cm => {
    const canonical = platformMap.find(
      pm => pm.csvHeader === cm.csvHeader && pm.targetField === cm.targetField,
    )
    return canonical ?? cm
  })
}

function applyColumnMap(row: Record<string, string>, map: ColumnMap[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const mapping of map) {
    const raw = row[mapping.csvHeader] ?? ''
    const value = mapping.transform ? mapping.transform(raw) : raw
    if (value === undefined || value === '') continue

    if (mapping.targetField === 'fullName') {
      // Auto-split "First Last" → firstName + lastName
      const parts = value.trim().split(/\s+/)
      result['firstName'] = parts[0] ?? value
      result['lastName']  = parts.slice(1).join(' ') || ''
    } else {
      result[mapping.targetField] = value
    }
  }
  return result
}

function parseDate(val: string | undefined): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

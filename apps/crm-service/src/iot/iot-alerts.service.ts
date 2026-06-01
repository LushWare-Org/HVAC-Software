import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { JobsClient } from './jobs.client'
import type { IotDeviceSnapshot } from './iot.service'

const OFFLINE_THRESHOLD_MS = 2 * 60 * 60 * 1000 // 2 hours

// Performance detection thresholds
const PERFORMANCE_MIN_SAMPLES = 4               // need ≥4 history rows
const PERFORMANCE_DELTA_F = 4                    // off-target by ≥4°F
const PERFORMANCE_WINDOW_HOURS = 2               // over the last 2h

type AlertType = 'EMERGENCY_HEAT' | 'OFFLINE' | 'UNDERPERFORMING'

@Injectable()
export class IotAlertsService {
  private readonly logger = new Logger(IotAlertsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsClient,
  ) {}

  // Runs every 15 minutes — check for emergency heat, offline, and underperformance
  @Cron('0 */15 * * * *')
  async checkAlerts() {
    const devices = await this.prisma.customerIotDevice.findMany({
      where: { lastSyncedAt: { not: null } },
      include: { connection: { select: { companyId: true, customerId: true, provider: true } } },
    })

    for (const device of devices) {
      const snapshot = device.lastSnapshot as unknown as IotDeviceSnapshot | null
      if (!snapshot) continue
      const { companyId, customerId } = device.connection

      // ── Emergency heat ──────────────────────────────────────────────────────
      if (snapshot.emergencyHeat === true) {
        const added = await this.upsertIotFlag(companyId, customerId, device.id, 'EMERGENCY_HEAT',
          `Emergency heat active on "${device.name}" — heat pump may have failed`)
        if (added) {
          await this.createIotJob(companyId, customerId, device.name, 'EMERGENCY', {
            title: `🚨 Emergency Heat — ${device.name}`,
            description:
              `Auto-detected: emergency heat is active on the customer's "${device.name}" thermostat. ` +
              `This usually means the heat pump has failed and the auxiliary heat strips are running. ` +
              `Dispatch a technician immediately — the customer may not yet be aware.`,
            tag: 'iot:emergency_heat',
          })
        }
      }

      // ── Offline > 2 hours ───────────────────────────────────────────────────
      if (snapshot.online === false && device.lastSyncedAt) {
        const offlineMs = Date.now() - device.lastSyncedAt.getTime()
        if (offlineMs > OFFLINE_THRESHOLD_MS) {
          await this.upsertIotFlag(companyId, customerId, device.id, 'OFFLINE',
            `Thermostat "${device.name}" has been offline for ${Math.floor(offlineMs / 3600000)}h — check connectivity`)
        }
      }

      // ── Underperformance (requires history) ─────────────────────────────────
      if (snapshot.online && (snapshot.hvacState === 'HEATING' || snapshot.hvacState === 'COOLING')) {
        const underperforming = await this.detectUnderperformance(device.id)
        if (underperforming) {
          const added = await this.upsertIotFlag(companyId, customerId, device.id, 'UNDERPERFORMING',
            `${device.name} cannot reach setpoint — system may be failing`)
          if (added) {
            await this.createIotJob(companyId, customerId, device.name, 'HIGH', {
              title: `⚠ HVAC Underperforming — ${device.name}`,
              description:
                `Auto-detected: the customer's "${device.name}" thermostat has been actively ${snapshot.hvacState.toLowerCase()} ` +
                `for the past ${PERFORMANCE_WINDOW_HOURS}h but still cannot reach the setpoint ` +
                `(off by ≥${PERFORMANCE_DELTA_F}°F across ${PERFORMANCE_MIN_SAMPLES}+ readings). ` +
                `Likely causes: low refrigerant, clogged filter, failing compressor, or duct leak. ` +
                `Schedule a diagnostic visit.`,
              tag: 'iot:underperforming',
            })
          }
        }
      }
    }
  }

  // ── Performance detection ─────────────────────────────────────────────────
  // Look at last N history rows; if HVAC was actively running but the gap between
  // current temp and setpoint never closed below threshold, system is underperforming.
  private async detectUnderperformance(deviceRowId: string): Promise<boolean> {
    const since = new Date(Date.now() - PERFORMANCE_WINDOW_HOURS * 60 * 60 * 1000)
    const rows = await this.prisma.iotDeviceHistory.findMany({
      where: { deviceId: deviceRowId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'desc' },
      take: 12,
    })
    if (rows.length < PERFORMANCE_MIN_SAMPLES) return false

    let consecutiveBad = 0
    for (const row of rows) {
      const s = row.snapshot as unknown as IotDeviceSnapshot
      if (!s) continue
      const isHeating = s.hvacState === 'HEATING'
      const isCooling = s.hvacState === 'COOLING'
      if (!isHeating && !isCooling) {
        consecutiveBad = 0
        continue
      }
      const target = isHeating ? s.heatSetpointF : s.coolSetpointF
      const gap = isHeating ? target - s.currentTempF : s.currentTempF - target
      if (gap >= PERFORMANCE_DELTA_F) {
        consecutiveBad++
        if (consecutiveBad >= PERFORMANCE_MIN_SAMPLES) return true
      } else {
        consecutiveBad = 0
      }
    }
    return false
  }

  // ── Job auto-creation ─────────────────────────────────────────────────────
  private async createIotJob(
    companyId: string,
    customerId: string,
    deviceName: string,
    priority: 'EMERGENCY' | 'HIGH',
    info: { title: string; description: string; tag: string },
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        firstName: true, lastName: true, email: true, phone: true,
        address: true, city: true, state: true, zipCode: true,
      },
    })
    if (!customer) return

    const customerName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer'
    const serviceAddress = customer.address
      || `${customer.city ?? ''} ${customer.state ?? ''} ${customer.zipCode ?? ''}`.trim()
      || 'Address on file'

    await this.jobs.createJob({
      companyId,
      customerId,
      customerName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      serviceAddress,
      title: info.title,
      description: info.description,
      priority,
      internalNotes: `Auto-created by IoT alerts cron from device "${deviceName}". Tag: ${info.tag}`,
      tags: ['iot-alert', info.tag],
    })
  }

  // ── Tag management ────────────────────────────────────────────────────────
  // Returns true if the tag was newly added (not already present) — caller uses
  // this to fire one-shot actions like job creation without duplicating per cron tick.
  private async upsertIotFlag(
    companyId: string,
    customerId: string,
    deviceId: string,
    type: AlertType,
    notes: string,
  ): Promise<boolean> {
    const tag = `iot:${type.toLowerCase()}:${deviceId}`
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { tags: true },
    })
    if (!customer) return false
    if (customer.tags.includes(tag)) return false

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { tags: { push: tag } },
    })
    this.logger.warn(`IoT alert [${type}] flagged on customer ${customerId} — ${notes}`)
    return true
  }

  // Call this when a device comes back online / emergency heat clears
  async clearIotFlag(customerId: string, deviceId: string, type: AlertType) {
    const tag = `iot:${type.toLowerCase()}:${deviceId}`
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { tags: true },
    })
    if (!customer || !customer.tags.includes(tag)) return
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { tags: customer.tags.filter(t => t !== tag) },
    })
    this.logger.log(`IoT alert [${type}] cleared for customer ${customerId}`)
  }
}

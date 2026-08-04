import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HoneywellClient, HoneywellDevice } from './honeywell.client';
import { NestClient, NestDevice } from './nest.client';
import { encryptToken, decryptToken } from './token-crypto';
import { EmailService } from '../email/email.service';

export interface IotDeviceSnapshot {
  deviceId: string;
  name: string;
  provider: 'honeywell' | 'nest';
  online: boolean;
  currentTempF: number;
  humidity: number;
  hvacMode: 'HEAT' | 'COOL' | 'AUTO' | 'OFF';
  hvacState: 'HEATING' | 'COOLING' | 'IDLE' | 'OFF';
  heatSetpointF: number;
  coolSetpointF: number;
  emergencyHeat: boolean;
  lastSyncedAt: string;
}

export interface ConnectedDevicesResponse {
  provider: string;
  connected: boolean;
  devices: IotDeviceSnapshot[];
}

// ── Mock data for dev seed ───────────────────────────────────────────────────

const MOCK_HONEYWELL_1: IotDeviceSnapshot = {
  deviceId: 'mock-honeywell-001',
  name: 'Main Floor Thermostat',
  provider: 'honeywell',
  online: true,
  currentTempF: 71,
  humidity: 45,
  hvacMode: 'COOL',
  hvacState: 'COOLING',
  heatSetpointF: 68,
  coolSetpointF: 73,
  emergencyHeat: false,
  lastSyncedAt: new Date().toISOString(),
};

const MOCK_HONEYWELL_2: IotDeviceSnapshot = {
  deviceId: 'mock-honeywell-002',
  name: 'Upstairs Thermostat',
  provider: 'honeywell',
  online: false,
  currentTempF: 0,
  humidity: 0,
  hvacMode: 'OFF',
  hvacState: 'OFF',
  heatSetpointF: 70,
  coolSetpointF: 75,
  emergencyHeat: false,
  lastSyncedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
};

const MOCK_NEST_1: IotDeviceSnapshot = {
  deviceId: 'mock-nest-001',
  name: 'Living Room Nest',
  provider: 'nest',
  online: true,
  currentTempF: 69,
  humidity: 42,
  hvacMode: 'HEAT',
  hvacState: 'HEATING',
  heatSetpointF: 70,
  coolSetpointF: 76,
  emergencyHeat: false,
  lastSyncedAt: new Date().toISOString(),
};

// 🚨 Triggers Feature 1: auto-create EMERGENCY job
const MOCK_HONEYWELL_EMERGENCY: IotDeviceSnapshot = {
  deviceId: 'mock-honeywell-emergency',
  name: 'Basement Thermostat (Emergency)',
  provider: 'honeywell',
  online: true,
  currentTempF: 58,
  humidity: 40,
  hvacMode: 'HEAT',
  hvacState: 'HEATING',
  heatSetpointF: 70,
  coolSetpointF: 75,
  emergencyHeat: true,  // ← heat pump failed, aux strips running
  lastSyncedAt: new Date().toISOString(),
};

// ⚠ Triggers Feature 3: HEATING for 2h+ but stuck 12°F below setpoint
const MOCK_NEST_UNDERPERFORMING: IotDeviceSnapshot = {
  deviceId: 'mock-nest-underperforming',
  name: 'Master Bedroom Nest (Failing)',
  provider: 'nest',
  online: true,
  currentTempF: 60,           // 12°F below setpoint
  humidity: 38,
  hvacMode: 'HEAT',
  hvacState: 'HEATING',       // actively running
  heatSetpointF: 72,
  coolSetpointF: 76,
  emergencyHeat: false,
  lastSyncedAt: new Date().toISOString(),
};

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly honeywell: HoneywellClient,
    private readonly nest: NestClient,
    private readonly email: EmailService,
  ) {}

  // ── Honeywell OAuth ──────────────────────────────────────────────────────────

  buildHoneywellAuthUrl(companyId: string, customerId: string, source: 'admin' | 'portal' = 'admin'): string {
    const state = Buffer.from(JSON.stringify({ companyId, customerId, source, provider: 'honeywell' })).toString('base64');
    return this.honeywell.buildAuthUrl(state);
  }

  async handleHoneywellCallback(code: string, state: string): Promise<{ customerId: string; source: string }> {
    const { companyId, customerId, source = 'admin' } = JSON.parse(
      Buffer.from(state, 'base64').toString(),
    ) as { companyId: string; customerId: string; source?: string };

    const tokens = await this.honeywell.exchangeCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const existing = await this.prisma.customerIotConnection.findUnique({
      where: { customerId_provider: { customerId, provider: 'honeywell' } },
    });

    let connectionId: string;
    if (existing) {
      await this.prisma.customerIotConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptToken(tokens.access_token),
          refreshToken: encryptToken(tokens.refresh_token),
          tokenExpiresAt: expiresAt,
        },
      });
      connectionId = existing.id;
    } else {
      const conn = await this.prisma.customerIotConnection.create({
        data: {
          companyId,
          customerId,
          provider: 'honeywell',
          accessToken: encryptToken(tokens.access_token),
          refreshToken: encryptToken(tokens.refresh_token),
          tokenExpiresAt: expiresAt,
        },
      });
      connectionId = conn.id;
    }

    await this.syncHoneywellDevices(connectionId, tokens.access_token);
    return { customerId, source };
  }

  // ── Google Nest OAuth ────────────────────────────────────────────────────────

  buildNestAuthUrl(companyId: string, customerId: string, source: 'admin' | 'portal' = 'admin'): string {
    const state = Buffer.from(JSON.stringify({ companyId, customerId, source, provider: 'nest' })).toString('base64');
    return this.nest.buildAuthUrl(state);
  }

  async handleNestCallback(code: string, state: string): Promise<{ customerId: string; source: string }> {
    const { companyId, customerId, source = 'admin' } = JSON.parse(
      Buffer.from(state, 'base64').toString(),
    ) as { companyId: string; customerId: string; source?: string };

    const tokens = await this.nest.exchangeCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const existing = await this.prisma.customerIotConnection.findUnique({
      where: { customerId_provider: { customerId, provider: 'nest' } },
    });

    let connectionId: string;
    if (existing) {
      await this.prisma.customerIotConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: encryptToken(tokens.access_token),
          refreshToken: encryptToken(tokens.refresh_token),
          tokenExpiresAt: expiresAt,
        },
      });
      connectionId = existing.id;
    } else {
      const conn = await this.prisma.customerIotConnection.create({
        data: {
          companyId,
          customerId,
          provider: 'nest',
          accessToken: encryptToken(tokens.access_token),
          refreshToken: encryptToken(tokens.refresh_token),
          tokenExpiresAt: expiresAt,
        },
      });
      connectionId = conn.id;
    }

    await this.syncNestDevices(connectionId, tokens.access_token);
    return { customerId, source };
  }

  // ── Device sync ──────────────────────────────────────────────────────────────

  private async syncHoneywellDevices(connectionId: string, accessToken: string) {
    const locations = await this.honeywell.getLocations(accessToken);
    for (const loc of locations) {
      for (const device of loc.devices ?? []) {
        const snapshot = this.normalizeHoneywell(device);
        const saved = await this.prisma.customerIotDevice.upsert({
          where: { connectionId_deviceId: { connectionId, deviceId: device.deviceID } },
          create: {
            connectionId,
            deviceId: device.deviceID,
            locationId: String(loc.locationID),
            name: device.userDefinedDeviceName || device.name || 'Thermostat',
            type: 'thermostat',
            lastSnapshot: snapshot as any,
            lastSyncedAt: new Date(),
          },
          update: { lastSnapshot: snapshot as any, lastSyncedAt: new Date() },
        });
        await this.recordHistory(saved.id, connectionId, snapshot);
      }
    }
  }

  private async syncNestDevices(connectionId: string, accessToken: string) {
    const devices = await this.nest.listDevices(accessToken);
    for (const device of devices) {
      const snapshot = this.normalizeNest(device);
      const deviceId = this.nest.deviceIdFromName(device.name);
      const saved = await this.prisma.customerIotDevice.upsert({
        where: { connectionId_deviceId: { connectionId, deviceId } },
        create: {
          connectionId,
          deviceId,
          locationId: device.parentRelations[0]?.displayName ?? null,
          name: device.traits['sdm.devices.traits.Info']?.customName || 'Nest Thermostat',
          type: 'thermostat',
          lastSnapshot: snapshot as any,
          lastSyncedAt: new Date(),
        },
        update: { lastSnapshot: snapshot as any, lastSyncedAt: new Date() },
      });
      await this.recordHistory(saved.id, connectionId, snapshot);
    }
  }

  // ── Time-series history recorder ───────────────────────────────────────────
  // Called from every sync path so we build a continuous timeline of snapshots.
  private async recordHistory(deviceRowId: string, connectionId: string, snapshot: IotDeviceSnapshot) {
    const conn = await this.prisma.customerIotConnection.findUnique({
      where: { id: connectionId },
      select: { companyId: true, customerId: true },
    });
    if (!conn) return;
    await this.prisma.iotDeviceHistory.create({
      data: {
        deviceId: deviceRowId,
        companyId: conn.companyId,
        customerId: conn.customerId,
        snapshot: snapshot as any,
      },
    });
  }

  // ── Public: fetch recent history for a device (by external deviceId) ───────
  async getDeviceHistory(companyId: string, externalDeviceId: string, hours = 24) {
    // Look up the internal device row by external id, scoped to the company.
    const device = await this.prisma.customerIotDevice.findFirst({
      where: {
        deviceId: externalDeviceId,
        connection: { companyId },
      },
      select: { id: true },
    });
    if (!device) throw new NotFoundException('Device not found');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const rows = await this.prisma.iotDeviceHistory.findMany({
      where: { deviceId: device.id, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
      select: { recordedAt: true, snapshot: true },
    });
    return rows.map(r => ({
      recordedAt: r.recordedAt.toISOString(),
      snapshot: r.snapshot as unknown as IotDeviceSnapshot,
    }));
  }

  // ── Get devices for a customer (live API) ────────────────────────────────────

  async getCustomerDevices(companyId: string, customerId: string): Promise<ConnectedDevicesResponse[]> {
    const connections = await this.prisma.customerIotConnection.findMany({
      where: { companyId, customerId },
      include: { devices: true },
    });

    if (connections.length === 0) return [];

    const results: ConnectedDevicesResponse[] = [];

    for (const conn of connections) {
      let accessToken = decryptToken(conn.accessToken);
      const isNest = conn.provider === 'nest';

      // Refresh if expiring within 2 minutes
      if (conn.tokenExpiresAt.getTime() - Date.now() < 2 * 60 * 1000) {
        try {
          const refreshed = isNest
            ? await this.nest.refreshToken(decryptToken(conn.refreshToken))
            : await this.honeywell.refreshToken(decryptToken(conn.refreshToken));
          const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
          await this.prisma.customerIotConnection.update({
            where: { id: conn.id },
            data: {
              accessToken: encryptToken(refreshed.access_token),
              refreshToken: encryptToken(refreshed.refresh_token),
              tokenExpiresAt: expiresAt,
            },
          });
          accessToken = refreshed.access_token;
        } catch (err) {
          this.logger.warn(`Token refresh failed for ${conn.id}: ${(err as Error).message}`);
        }
      }

      const snapshots: IotDeviceSnapshot[] = [];

      if (isNest) {
        // Nest: re-list all devices from the API and match by deviceId
        const nestDevices = await this.nest.listDevices(accessToken);
        for (const device of conn.devices) {
          const fresh = nestDevices.find(d => this.nest.deviceIdFromName(d.name) === device.deviceId);
          if (fresh) {
            const snapshot = this.normalizeNest(fresh);
            await this.prisma.customerIotDevice.update({
              where: { id: device.id },
              data: { lastSnapshot: snapshot as any, lastSyncedAt: new Date() },
            });
            await this.recordHistory(device.id, conn.id, snapshot);
            snapshots.push(snapshot);
          } else {
            snapshots.push({
              ...((device.lastSnapshot as any) ?? {}),
              lastSyncedAt: device.lastSyncedAt?.toISOString() ?? new Date().toISOString(),
            });
          }
        }
      } else {
        // Honeywell: fetch each device by ID
        for (const device of conn.devices) {
          const fresh = device.locationId
            ? await this.honeywell.getDevice(accessToken, device.deviceId, device.locationId)
            : null;
          if (fresh) {
            const snapshot = this.normalizeHoneywell(fresh);
            await this.prisma.customerIotDevice.update({
              where: { id: device.id },
              data: { lastSnapshot: snapshot as any, lastSyncedAt: new Date() },
            });
            await this.recordHistory(device.id, conn.id, snapshot);
            snapshots.push(snapshot);
          } else {
            snapshots.push({
              ...((device.lastSnapshot as any) ?? {}),
              lastSyncedAt: device.lastSyncedAt?.toISOString() ?? new Date().toISOString(),
            });
          }
        }
      }

      results.push({ provider: conn.provider, connected: true, devices: snapshots });
    }

    return results;
  }

  // ── Get cached snapshots only (dev / BYPASS_AUTH mode) ───────────────────────

  async getCachedDevices(companyId: string, customerId: string): Promise<ConnectedDevicesResponse[]> {
    const connections = await this.prisma.customerIotConnection.findMany({
      where: { companyId, customerId },
      include: { devices: true },
    });

    return connections.map(conn => ({
      provider: conn.provider,
      connected: true,
      devices: conn.devices.map(d => ({
        ...((d.lastSnapshot as any) ?? {}),
        lastSyncedAt: d.lastSyncedAt?.toISOString() ?? new Date().toISOString(),
      })),
    }));
  }

  // ── Disconnect ───────────────────────────────────────────────────────────────

  async disconnect(companyId: string, customerId: string, provider: string) {
    const conn = await this.prisma.customerIotConnection.findUnique({
      where: { customerId_provider: { customerId, provider } },
    });
    if (!conn || conn.companyId !== companyId) throw new NotFoundException('IoT connection not found');
    await this.prisma.customerIotConnection.delete({ where: { id: conn.id } });
  }

  // ── Dev seed — creates both Honeywell + Nest mock devices ───────────────────

  async devSeed(companyId: string, customerId: string): Promise<void> {
    await this.seedProvider(companyId, customerId, 'honeywell',
      [MOCK_HONEYWELL_1, MOCK_HONEYWELL_2, MOCK_HONEYWELL_EMERGENCY]);
    await this.seedProvider(companyId, customerId, 'nest',
      [MOCK_NEST_1, MOCK_NEST_UNDERPERFORMING]);
    this.logger.log(`Dev seed: Honeywell + Nest mock connections created for customer ${customerId}`);
  }

  private async seedProvider(
    companyId: string,
    customerId: string,
    provider: string,
    snapshots: IotDeviceSnapshot[],
  ) {
    const existing = await this.prisma.customerIotConnection.findUnique({
      where: { customerId_provider: { customerId, provider } },
    });
    if (existing) return;

    const conn = await this.prisma.customerIotConnection.create({
      data: {
        companyId,
        customerId,
        provider,
        accessToken: `mock-access-${provider}`,
        refreshToken: `mock-refresh-${provider}`,
        tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.customerIotDevice.createMany({
      data: snapshots.map((s, i) => ({
        connectionId: conn.id,
        deviceId: s.deviceId,
        locationId: `mock-loc-${i + 1}`,
        name: s.name,
        type: 'thermostat',
        lastSnapshot: s as any,
        lastSyncedAt: s.online ? new Date() : new Date(Date.now() - 4 * 60 * 60 * 1000),
      })),
    });

    // Seed 24h of synthetic history so the chart has shape on first load
    const created = await this.prisma.customerIotDevice.findMany({
      where: { connectionId: conn.id },
      select: { id: true, deviceId: true, lastSnapshot: true },
    });
    const historyRows: any[] = [];
    for (const d of created) {
      const baseSnap = snapshots.find(s => s.deviceId === d.deviceId);
      if (!baseSnap) continue;
      for (let h = 24; h >= 0; h--) {
        const wave = Math.sin((h / 24) * Math.PI * 2) * 2.5;
        const jitter = (Math.random() - 0.5) * 1.2;
        const temp = Math.round((baseSnap.currentTempF + wave + jitter) * 10) / 10;
        historyRows.push({
          deviceId: d.id,
          companyId,
          customerId,
          recordedAt: new Date(Date.now() - h * 60 * 60 * 1000),
          snapshot: {
            ...baseSnap,
            currentTempF: temp,
            humidity: Math.max(20, Math.min(70, Math.round(baseSnap.humidity + (Math.random() - 0.5) * 4))),
            lastSyncedAt: new Date(Date.now() - h * 60 * 60 * 1000).toISOString(),
          },
        });
      }
    }
    if (historyRows.length) {
      await this.prisma.iotDeviceHistory.createMany({ data: historyRows });
    }
  }

  // ── Admin: send customer a connect link via email ────────────────────────────

  async sendConnectLink(companyId: string, customerId: string): Promise<{ sent: boolean }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { firstName: true, email: true },
    });
    if (!customer || !customer.email) throw new NotFoundException('Customer email not found');

    const base = process.env.API_GATEWAY_URL ?? 'http://localhost:80';
    const honeywellUrl = `${base}/api/crm/iot/honeywell/connect-portal`;
    const nestUrl = `${base}/api/crm/iot/nest/connect-portal`;

    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    const appName = company?.name ?? process.env.APP_NAME ?? 'HVACtor.ai';

    await this.email.sendMail({
      to: customer.email,
      subject: `Connect your thermostat — ${appName}`,
      companyName: appName,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);letter-spacing:0.5px;text-transform:uppercase;">
              ${appName}
            </p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
              Connect Your Smart Thermostat
            </h1>
          </td>
        </tr>

        <!-- Body card -->
        <tr>
          <td style="background:#ffffff;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

            <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">
              Hi <strong>${customer.firstName ?? 'there'}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">
              Your service team has invited you to link your smart thermostat to your service account.
              Once connected, your technicians can monitor your system remotely and respond faster
              when something needs attention — without you having to call.
            </p>

            <!-- Benefits -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
              <tr>
                <td style="font-size:13px;color:#475569;line-height:1.8;">
                  <div style="margin-bottom:6px;">✅ &nbsp;Live temperature &amp; humidity monitoring</div>
                  <div style="margin-bottom:6px;">✅ &nbsp;Instant emergency heat alerts</div>
                  <div style="margin-bottom:6px;">✅ &nbsp;Offline device detection</div>
                  <div>✅ &nbsp;Faster response from your service team</div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
              Choose your thermostat brand
            </p>

            <!-- Honeywell button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td style="background:#1d4ed8;border-radius:8px;text-align:center;">
                  <a href="${honeywellUrl}"
                    style="display:block;padding:14px 24px;text-decoration:none;color:#ffffff;font-size:14px;font-weight:600;">
                    🌡️ &nbsp;Connect Honeywell Home
                  </a>
                </td>
              </tr>
            </table>

            <!-- Nest button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#16a34a;border-radius:8px;text-align:center;">
                  <a href="${nestUrl}"
                    style="display:block;padding:14px 24px;text-decoration:none;color:#ffffff;font-size:14px;font-weight:600;">
                    🍃 &nbsp;Connect Google Nest
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              Each link is unique to your account. You can disconnect at any time from your
              customer portal under <strong>My Devices</strong>.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
              You received this because your service provider sent you a thermostat connection invite.<br>
              If you did not expect this, you can safely ignore it — no action is required.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
      `,
    });

    this.logger.log(`Connect link emailed to customer ${customerId} (${customer.email})`);
    return { sent: true };
  }

  // ── Refresh token helper (used by IotTokenRefreshService) ───────────────────

  async refreshConnectionToken(connId: string, provider: string, encryptedRefreshToken: string): Promise<void> {
    const plainRefresh = decryptToken(encryptedRefreshToken);
    const refreshed = provider === 'nest'
      ? await this.nest.refreshToken(plainRefresh)
      : await this.honeywell.refreshToken(plainRefresh);

    await this.prisma.customerIotConnection.update({
      where: { id: connId },
      data: {
        accessToken: encryptToken(refreshed.access_token),
        refreshToken: encryptToken(refreshed.refresh_token),
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    });
  }

  // ── Normalization ────────────────────────────────────────────────────────────

  private normalizeHoneywell(d: HoneywellDevice): IotDeviceSnapshot {
    const modeMap: Record<string, IotDeviceSnapshot['hvacMode']> = {
      Heat: 'HEAT', Cool: 'COOL', Off: 'OFF', Auto: 'AUTO', EmergencyHeat: 'HEAT',
    };
    const stateMap: Record<string, IotDeviceSnapshot['hvacState']> = {
      Heat: 'HEATING', Cool: 'COOLING', Off: 'OFF',
    };
    return {
      deviceId: d.deviceID,
      name: d.userDefinedDeviceName || d.name || 'Thermostat',
      provider: 'honeywell',
      online: d.isAlive,
      currentTempF: d.indoorTemperature,
      humidity: d.indoorHumidity,
      hvacMode: modeMap[d.changeableValues?.mode] ?? 'OFF',
      hvacState: stateMap[d.operationStatus?.mode] ?? 'OFF',
      heatSetpointF: d.changeableValues?.heatSetpoint ?? 68,
      coolSetpointF: d.changeableValues?.coolSetpoint ?? 76,
      emergencyHeat: d.changeableValues?.emergencyHeatActive ?? false,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  private normalizeNest(d: NestDevice): IotDeviceSnapshot {
    const traits = d.traits;
    const connectivity = traits['sdm.devices.traits.Connectivity']?.status ?? 'OFFLINE';
    const tempC = traits['sdm.devices.traits.Temperature']?.ambientTemperatureCelsius ?? 0;
    const humidity = traits['sdm.devices.traits.Humidity']?.ambientHumidityPercent ?? 0;
    const nestMode = traits['sdm.devices.traits.ThermostatMode']?.mode ?? 'OFF';
    const hvacStatus = traits['sdm.devices.traits.ThermostatHvac']?.status ?? 'OFF';
    const setpoints = traits['sdm.devices.traits.ThermostatTemperatureSetpoint'];

    const cToF = (c: number) => Math.round(c * 9 / 5 + 32);

    const modeMap: Record<string, IotDeviceSnapshot['hvacMode']> = {
      HEAT: 'HEAT', COOL: 'COOL', HEATCOOL: 'AUTO', OFF: 'OFF',
    };
    const stateMap: Record<string, IotDeviceSnapshot['hvacState']> = {
      HEATING: 'HEATING', COOLING: 'COOLING', OFF: 'OFF',
    };

    return {
      deviceId: this.nest.deviceIdFromName(d.name),
      name: traits['sdm.devices.traits.Info']?.customName || d.parentRelations[0]?.displayName || 'Nest Thermostat',
      provider: 'nest',
      online: connectivity === 'ONLINE',
      currentTempF: cToF(tempC),
      humidity: Math.round(humidity),
      hvacMode: modeMap[nestMode] ?? 'OFF',
      hvacState: stateMap[hvacStatus] ?? 'IDLE',
      heatSetpointF: setpoints?.heatCelsius ? cToF(setpoints.heatCelsius) : 68,
      coolSetpointF: setpoints?.coolCelsius ? cToF(setpoints.coolCelsius) : 76,
      emergencyHeat: false, // Nest SDM API does not expose emergency heat state
      lastSyncedAt: new Date().toISOString(),
    };
  }
}

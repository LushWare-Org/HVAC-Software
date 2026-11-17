# IoT Device Integration — Phase 1 (Honeywell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live "IoT Devices" tab to the Customer Details Sidebar showing Honeywell thermostat data (temp, mode, humidity, emergency heat, online/offline), with OAuth connect flow and dev mock fixtures.

**Architecture:** New `IotModule` in `crm-service` handles OAuth tokens, Honeywell API polling, and exposes normalized device snapshots via REST. Frontend adds an `IotDevicesTab` component and `useIot` hook. In dev (`BYPASS_AUTH=true`) a seed endpoint injects mock data so no real Honeywell credentials are needed.

**Tech Stack:** NestJS + Prisma (crm schema), Honeywell Home REST API (developer.honeywellhome.com), React + TanStack Query, existing CSS design system (`--blue`, `--t1`, `--t2`, Poppins).

---

## File Map

| Action | File |
|---|---|
| Modify | `apps/crm-service/prisma/schema.prisma` |
| Create | `apps/crm-service/src/iot/iot.module.ts` |
| Create | `apps/crm-service/src/iot/iot.controller.ts` |
| Create | `apps/crm-service/src/iot/iot.service.ts` |
| Create | `apps/crm-service/src/iot/honeywell.client.ts` |
| Modify | `apps/crm-service/src/app.module.ts` |
| Create | `apps/admin-dashboard/src/hooks/useIot.ts` |
| Create | `apps/admin-dashboard/src/pages/customers/IotDevicesTab.tsx` |
| Modify | `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx` |

---

## Task 1: Prisma Schema — Add IoT Models

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma`

- [ ] **Step 1: Add models to schema**

Append to the end of `apps/crm-service/prisma/schema.prisma`:

```prisma
// ---- IoT Device Connections ----
model CustomerIotConnection {
  id             String   @id @default(uuid())
  companyId      String
  customerId     String
  provider       String   // "honeywell" | "nest"
  accessToken    String   @db.Text
  refreshToken   String   @db.Text
  tokenExpiresAt DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  devices  CustomerIotDevice[]

  @@unique([customerId, provider])
  @@index([companyId])
  @@map("customer_iot_connections")
}

model CustomerIotDevice {
  id           String   @id @default(uuid())
  connectionId String
  deviceId     String
  locationId   String?
  name         String
  type         String   @default("thermostat")
  lastSnapshot Json?
  lastSyncedAt DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  connection CustomerIotConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@unique([connectionId, deviceId])
  @@index([connectionId])
  @@map("customer_iot_devices")
}
```

Also add the relation to the `Customer` model (find the `equipment Equipment[]` line and add below it):
```prisma
  iotConnections CustomerIotConnection[]
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/ravishan/Desktop/Lush/T&SBCRM
pnpm --filter crm-service prisma:migrate
# When prompted for migration name: iot_device_connections
```

Expected: Migration created and applied. `customer_iot_connections` and `customer_iot_devices` tables created in the `crm` schema.

- [ ] **Step 3: Regenerate Prisma client**

```bash
pnpm --filter crm-service exec prisma generate
```

Expected: `apps/crm-service/src/prisma/generated/` updated with new model types.

- [ ] **Step 4: Commit**

```bash
git add apps/crm-service/prisma/
git commit -m "feat(iot): add CustomerIotConnection and CustomerIotDevice prisma models"
```

---

## Task 2: HoneywellClient — API Calls

**Files:**
- Create: `apps/crm-service/src/iot/honeywell.client.ts`

- [ ] **Step 1: Create the client**

```typescript
// apps/crm-service/src/iot/honeywell.client.ts
import { Injectable, Logger } from '@nestjs/common';

export interface HoneywellTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
}

export interface HoneywellDevice {
  deviceID: string;
  name: string;
  userDefinedDeviceName: string;
  locationId: number;
  indoorTemperature: number;
  indoorHumidity: number;
  outdoorTemperature?: number;
  outdoorHumidity?: number;
  operationStatus: { mode: string };
  changeableValues: {
    mode: string;
    heatSetpoint: number;
    coolSetpoint: number;
    emergencyHeatActive?: boolean;
  };
  scheduleStatus: string;
  isAlive: boolean;
}

export interface HoneywellLocation {
  locationID: number;
  name: string;
  devices: HoneywellDevice[];
}

@Injectable()
export class HoneywellClient {
  private readonly logger = new Logger(HoneywellClient.name);
  private readonly baseUrl = 'https://api.honeywell.com';
  private readonly clientId = process.env.RESIDEO_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.RESIDEO_CLIENT_SECRET ?? '';
  private readonly redirectUri = process.env.RESIDEO_REDIRECT_URI ?? '';

  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
    });
    return `${this.baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<HoneywellTokenResponse> {
    const creds = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Honeywell token exchange failed: ${err}`);
    }
    return res.json() as Promise<HoneywellTokenResponse>;
  }

  async refreshToken(refreshToken: string): Promise<HoneywellTokenResponse> {
    const creds = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Honeywell token refresh failed: ${err}`);
    }
    return res.json() as Promise<HoneywellTokenResponse>;
  }

  async getLocations(accessToken: string): Promise<HoneywellLocation[]> {
    const res = await fetch(
      `${this.baseUrl}/v2/locations?apikey=${this.clientId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      this.logger.warn(`Honeywell locations fetch failed: ${res.status}`);
      return [];
    }
    return res.json() as Promise<HoneywellLocation[]>;
  }

  async getDevice(accessToken: string, deviceId: string, locationId: string): Promise<HoneywellDevice | null> {
    const res = await fetch(
      `${this.baseUrl}/v2/devices/thermostats/${deviceId}?apikey=${this.clientId}&locationId=${locationId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      this.logger.warn(`Honeywell device fetch failed: ${res.status} for device ${deviceId}`);
      return null;
    }
    return res.json() as Promise<HoneywellDevice>;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/crm-service/src/iot/honeywell.client.ts
git commit -m "feat(iot): add HoneywellClient for Resideo API calls"
```

---

## Task 3: IotService — Token Management & Data Normalization

**Files:**
- Create: `apps/crm-service/src/iot/iot.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// apps/crm-service/src/iot/iot.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HoneywellClient, HoneywellDevice } from './honeywell.client';

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

// Mock snapshot for dev/demo mode
const MOCK_SNAPSHOT: IotDeviceSnapshot = {
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

const MOCK_SNAPSHOT_2: IotDeviceSnapshot = {
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

@Injectable()
export class IotService {
  private readonly logger = new Logger(IotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly honeywell: HoneywellClient,
  ) {}

  // ── OAuth ────────────────────────────────────────────────────────────────────

  buildHoneywellAuthUrl(companyId: string, customerId: string): string {
    const state = Buffer.from(JSON.stringify({ companyId, customerId })).toString('base64');
    return this.honeywell.buildAuthUrl(state);
  }

  async handleHoneywellCallback(code: string, state: string): Promise<string> {
    const { companyId, customerId } = JSON.parse(Buffer.from(state, 'base64').toString());
    const tokens = await this.honeywell.exchangeCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const existing = await this.prisma.customerIotConnection.findUnique({
      where: { customerId_provider: { customerId, provider: 'honeywell' } },
    });

    if (existing) {
      await this.prisma.customerIotConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: expiresAt,
        },
      });
      // Re-sync devices after reconnect
      await this.syncHoneywellDevices(existing.id, tokens.access_token, companyId, customerId);
    } else {
      const conn = await this.prisma.customerIotConnection.create({
        data: {
          companyId,
          customerId,
          provider: 'honeywell',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: expiresAt,
        },
      });
      await this.syncHoneywellDevices(conn.id, tokens.access_token, companyId, customerId);
    }

    return customerId;
  }

  // ── Device sync ──────────────────────────────────────────────────────────────

  private async syncHoneywellDevices(connectionId: string, accessToken: string, companyId: string, customerId: string) {
    const locations = await this.honeywell.getLocations(accessToken);
    for (const loc of locations) {
      for (const device of (loc.devices ?? [])) {
        const snapshot = this.normalizeHoneywell(device);
        await this.prisma.customerIotDevice.upsert({
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
          update: {
            lastSnapshot: snapshot as any,
            lastSyncedAt: new Date(),
          },
        });
      }
    }
  }

  // ── Get devices for a customer ───────────────────────────────────────────────

  async getCustomerDevices(companyId: string, customerId: string): Promise<ConnectedDevicesResponse[]> {
    const connections = await this.prisma.customerIotConnection.findMany({
      where: { companyId, customerId },
      include: { devices: true },
    });

    if (connections.length === 0) return [];

    const results: ConnectedDevicesResponse[] = [];

    for (const conn of connections) {
      // Refresh token if near expiry (within 2 minutes)
      let accessToken = conn.accessToken;
      if (conn.tokenExpiresAt.getTime() - Date.now() < 2 * 60 * 1000) {
        try {
          const refreshed = await this.honeywell.refreshToken(conn.refreshToken);
          const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
          await this.prisma.customerIotConnection.update({
            where: { id: conn.id },
            data: {
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
              tokenExpiresAt: expiresAt,
            },
          });
          accessToken = refreshed.access_token;
        } catch (err) {
          this.logger.warn(`Token refresh failed for connection ${conn.id}: ${(err as Error).message}`);
        }
      }

      // Fetch fresh data from Honeywell and update snapshots
      const freshSnapshots: IotDeviceSnapshot[] = [];
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
          freshSnapshots.push(snapshot);
        } else {
          // Use cached snapshot
          freshSnapshots.push({
            ...(device.lastSnapshot as any),
            lastSyncedAt: device.lastSyncedAt?.toISOString() ?? new Date().toISOString(),
          });
        }
      }

      results.push({
        provider: conn.provider,
        connected: true,
        devices: freshSnapshots,
      });
    }

    return results;
  }

  // ── Disconnect ───────────────────────────────────────────────────────────────

  async disconnect(companyId: string, customerId: string, provider: string) {
    const conn = await this.prisma.customerIotConnection.findUnique({
      where: { customerId_provider: { customerId, provider } },
    });
    if (!conn || conn.companyId !== companyId) throw new NotFoundException('Connection not found');
    await this.prisma.customerIotConnection.delete({ where: { id: conn.id } });
  }

  // ── Dev seed (BYPASS_AUTH=true only) ────────────────────────────────────────

  async devSeed(companyId: string, customerId: string): Promise<void> {
    const existing = await this.prisma.customerIotConnection.findUnique({
      where: { customerId_provider: { customerId, provider: 'honeywell' } },
    });
    if (existing) return; // already seeded

    const conn = await this.prisma.customerIotConnection.create({
      data: {
        companyId,
        customerId,
        provider: 'honeywell',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year (never actually refreshed in mock mode)
      },
    });

    await this.prisma.customerIotDevice.createMany({
      data: [
        {
          connectionId: conn.id,
          deviceId: MOCK_SNAPSHOT.deviceId,
          locationId: 'mock-loc-001',
          name: MOCK_SNAPSHOT.name,
          type: 'thermostat',
          lastSnapshot: MOCK_SNAPSHOT as any,
          lastSyncedAt: new Date(),
        },
        {
          connectionId: conn.id,
          deviceId: MOCK_SNAPSHOT_2.deviceId,
          locationId: 'mock-loc-001',
          name: MOCK_SNAPSHOT_2.name,
          type: 'thermostat',
          lastSnapshot: MOCK_SNAPSHOT_2 as any,
          lastSyncedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ],
    });

    this.logger.log(`Dev seed: created mock Honeywell connection for customer ${customerId}`);
  }

  // ── Get cached snapshots only (no live API call) — used in mock mode ─────────

  async getCachedDevices(companyId: string, customerId: string): Promise<ConnectedDevicesResponse[]> {
    const connections = await this.prisma.customerIotConnection.findMany({
      where: { companyId, customerId },
      include: { devices: true },
    });
    return connections.map(conn => ({
      provider: conn.provider,
      connected: true,
      devices: conn.devices.map(d => ({
        ...(d.lastSnapshot as any),
        lastSyncedAt: d.lastSyncedAt?.toISOString() ?? new Date().toISOString(),
      })),
    }));
  }

  // ── Normalize Honeywell → shared snapshot shape ──────────────────────────────

  private normalizeHoneywell(d: HoneywellDevice): IotDeviceSnapshot {
    const modeMap: Record<string, IotDeviceSnapshot['hvacMode']> = {
      Heat: 'HEAT', Cool: 'COOL', Off: 'OFF', Auto: 'AUTO',
      EmergencyHeat: 'HEAT',
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
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/crm-service/src/iot/iot.service.ts
git commit -m "feat(iot): add IotService with Honeywell token management and device normalization"
```

---

## Task 4: IotController — HTTP Endpoints

**Files:**
- Create: `apps/crm-service/src/iot/iot.controller.ts`

- [ ] **Step 1: Create the controller**

```typescript
// apps/crm-service/src/iot/iot.controller.ts
import {
  Controller, Get, Delete, Post,
  Param, Query, Res, HttpCode, HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@tscrm/auth-client';
import { CurrentUser } from '@tscrm/auth-client';
import type { AuthUser } from '@tscrm/types';
import { IotService } from './iot.service';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

@ApiTags('IoT Devices')
@Controller('iot')
export class IotController {
  constructor(private readonly iot: IotService) {}

  // ── Honeywell OAuth ──────────────────────────────────────────────────────────

  @Get('honeywell/connect')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start Honeywell OAuth flow for a customer' })
  connectHoneywell(
    @Query('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    if (!customerId) throw new NotFoundException('customerId is required');
    const url = this.iot.buildHoneywellAuthUrl(user.companyId, customerId);
    return res.redirect(url);
  }

  @Get('honeywell/callback')
  @ApiOperation({ summary: 'Honeywell OAuth callback' })
  async honeywellCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const customerId = await this.iot.handleHoneywellCallback(code, state);
      return res.redirect(`${FRONTEND_URL}/customers?iot_connected=${customerId}`);
    } catch {
      return res.redirect(`${FRONTEND_URL}/customers?iot_error=true`);
    }
  }

  // ── Device data ──────────────────────────────────────────────────────────────

  @Get('customers/:customerId/devices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all connected IoT devices with latest data' })
  async getDevices(
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
  ) {
    // In mock/dev mode use cached snapshots (no real API calls against mock tokens)
    const isMock = process.env.BYPASS_AUTH === 'true';
    if (isMock) {
      return this.iot.getCachedDevices(user.companyId, customerId);
    }
    return this.iot.getCustomerDevices(user.companyId, customerId);
  }

  @Delete('customers/:customerId/connections/:provider')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect an IoT provider for a customer' })
  async disconnect(
    @Param('customerId') customerId: string,
    @Param('provider') provider: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.iot.disconnect(user.companyId, customerId, provider);
  }

  // ── Dev-only seed ────────────────────────────────────────────────────────────

  @Post('dev-seed/:customerId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEV] Seed mock Honeywell data for a customer' })
  async devSeed(
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (process.env.NODE_ENV === 'production' || process.env.BYPASS_AUTH !== 'true') {
      throw new NotFoundException();
    }
    await this.iot.devSeed(user.companyId, customerId);
    return { seeded: true };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/crm-service/src/iot/iot.controller.ts
git commit -m "feat(iot): add IotController with OAuth, device endpoints, and dev seed"
```

---

## Task 5: IotModule + Register in AppModule

**Files:**
- Create: `apps/crm-service/src/iot/iot.module.ts`
- Modify: `apps/crm-service/src/app.module.ts`

- [ ] **Step 1: Create the module**

```typescript
// apps/crm-service/src/iot/iot.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IotController } from './iot.controller';
import { IotService } from './iot.service';
import { HoneywellClient } from './honeywell.client';

@Module({
  imports: [PrismaModule],
  controllers: [IotController],
  providers: [IotService, HoneywellClient],
  exports: [IotService],
})
export class IotModule {}
```

- [ ] **Step 2: Register in AppModule**

In `apps/crm-service/src/app.module.ts`, add:
```typescript
import { IotModule } from './iot/iot.module';
```
And add `IotModule` to the `imports` array after `ImportModule`.

- [ ] **Step 3: Verify it compiles**

```bash
cd /Users/ravishan/Desktop/Lush/T&SBCRM
pnpm --filter crm-service build 2>&1 | tail -20
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add apps/crm-service/src/iot/ apps/crm-service/src/app.module.ts
git commit -m "feat(iot): register IotModule in crm-service AppModule"
```

---

## Task 6: Frontend Hook — useIot.ts

**Files:**
- Create: `apps/admin-dashboard/src/hooks/useIot.ts`

- [ ] **Step 1: Create the hook**

```typescript
// apps/admin-dashboard/src/hooks/useIot.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export interface IotDeviceSnapshot {
  deviceId: string
  name: string
  provider: 'honeywell' | 'nest'
  online: boolean
  currentTempF: number
  humidity: number
  hvacMode: 'HEAT' | 'COOL' | 'AUTO' | 'OFF'
  hvacState: 'HEATING' | 'COOLING' | 'IDLE' | 'OFF'
  heatSetpointF: number
  coolSetpointF: number
  emergencyHeat: boolean
  lastSyncedAt: string
}

export interface ConnectedDevicesResponse {
  provider: string
  connected: boolean
  devices: IotDeviceSnapshot[]
}

export function useCustomerIotDevices(customerId: string | undefined) {
  return useQuery<ConnectedDevicesResponse[]>({
    queryKey: ['iot-devices', customerId],
    queryFn: async () => {
      const res = await api.get(`/crm/iot/customers/${customerId}/devices`)
      return res.data
    },
    enabled: !!customerId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min (matches Honeywell rate limit)
    staleTime: 4 * 60 * 1000,
  })
}

export function useDisconnectIot(customerId: string) {
  return useMutation({
    mutationFn: async (provider: string) => {
      await api.delete(`/crm/iot/customers/${customerId}/connections/${provider}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices', customerId] })
    },
  })
}

export function useDevSeedIot(customerId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/crm/iot/dev-seed/${customerId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices', customerId] })
    },
  })
}

export function useConnectHoneywell(customerId: string) {
  return () => {
    // Opens the OAuth flow in the current tab (redirects to Honeywell, comes back)
    window.location.href = `/api/crm/iot/honeywell/connect?customerId=${customerId}`
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-dashboard/src/hooks/useIot.ts
git commit -m "feat(iot): add useIot hooks for device data, connect, disconnect, dev seed"
```

---

## Task 7: IotDevicesTab Component

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/IotDevicesTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/admin-dashboard/src/pages/customers/IotDevicesTab.tsx
import React from 'react'
import { Wifi, WifiOff, Thermometer, Droplets, AlertTriangle, RefreshCw, Plug, Trash2 } from 'lucide-react'
import {
  useCustomerIotDevices,
  useDisconnectIot,
  useDevSeedIot,
  useConnectHoneywell,
  type IotDeviceSnapshot,
} from '../../hooks/useIot'

interface Props {
  customerId: string
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return `${Math.floor(mins / 60)}h ago`
}

function HvacStateBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; color: string }> = {
    HEATING: { label: 'Heating', color: '#F97316' },
    COOLING: { label: 'Cooling', color: '#3B82F6' },
    IDLE: { label: 'Idle', color: '#6B7280' },
    OFF: { label: 'Off', color: '#9CA3AF' },
  }
  const cfg = map[state] ?? map.OFF
  return (
    <span
      style={{ background: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}40` }}
      className="text-[10px] font-700 px-2 py-0.5 rounded-full"
    >
      {cfg.label}
    </span>
  )
}

function DeviceCard({ device, onDisconnect }: { device: IotDeviceSnapshot; onDisconnect?: () => void }) {
  const isOffline = !device.online
  const hasEmergencyHeat = device.emergencyHeat

  return (
    <div
      className="rounded-xl border p-4 mb-3"
      style={{
        borderColor: hasEmergencyHeat ? '#EF4444' : isOffline ? 'var(--bd)' : 'var(--bd)',
        background: hasEmergencyHeat ? '#FEF2F2' : 'var(--bg-card)',
        boxShadow: hasEmergencyHeat ? '0 0 0 2px #EF444440' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Thermometer size={14} style={{ color: 'var(--blue-light)' }} />
          <span className="font-700 text-sm" style={{ color: 'var(--t1)' }}>
            {device.name}
          </span>
          <span className="text-[10px] font-500 px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--t3)' }}>
            {device.provider === 'honeywell' ? 'Honeywell' : 'Nest'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <span className="flex items-center gap-1 text-[11px] font-600 text-red-500">
              <WifiOff size={12} /> Offline
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-600 text-green-600">
              <Wifi size={12} /> Online
            </span>
          )}
        </div>
      </div>

      {/* Emergency heat alert */}
      {hasEmergencyHeat && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-red-100 border border-red-200">
          <AlertTriangle size={13} className="text-red-600 shrink-0" />
          <span className="text-[11px] font-600 text-red-700">
            Emergency heat active — heat pump may have failed
          </span>
        </div>
      )}

      {/* Offline state */}
      {isOffline ? (
        <p className="text-[12px]" style={{ color: 'var(--t3)' }}>
          Last seen {formatTime(device.lastSyncedAt)}
        </p>
      ) : (
        <>
          {/* Temps row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] font-500 mb-0.5" style={{ color: 'var(--t3)' }}>Current</p>
              <p className="text-2xl font-700" style={{ color: 'var(--t1)' }}>
                {device.currentTempF}°F
              </p>
            </div>
            <div>
              <p className="text-[10px] font-500 mb-0.5" style={{ color: 'var(--t3)' }}>Setpoint</p>
              <p className="text-2xl font-700" style={{ color: 'var(--t2)' }}>
                {device.hvacMode === 'HEAT' ? device.heatSetpointF : device.coolSetpointF}°F
              </p>
            </div>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <HvacStateBadge state={device.hvacState} />
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
              <Droplets size={11} /> {device.humidity}% humidity
            </span>
            <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
              Mode: {device.hvacMode}
            </span>
          </div>

          {/* Footer */}
          <p className="text-[10px]" style={{ color: 'var(--t3)' }}>
            Synced {formatTime(device.lastSyncedAt)}
          </p>
        </>
      )}
    </div>
  )
}

export function IotDevicesTab({ customerId }: Props) {
  const { data, isLoading, refetch, isRefetching } = useCustomerIotDevices(customerId)
  const disconnect = useDisconnectIot(customerId)
  const devSeed = useDevSeedIot(customerId)
  const connectHoneywell = useConnectHoneywell(customerId)

  const isDev = import.meta.env.DEV
  const allConnections = data ?? []
  const hasAnyDevices = allConnections.some(c => c.devices.length > 0)

  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        {[1, 2].map(i => (
          <div key={i} className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-600" style={{ color: 'var(--t3)' }}>
          {hasAnyDevices ? `${allConnections.reduce((s, c) => s + c.devices.length, 0)} device(s) connected` : 'No devices connected'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1 rounded hover:bg-gray-100"
            title="Refresh"
          >
            <RefreshCw size={13} className={isRefetching ? 'animate-spin' : ''} style={{ color: 'var(--t3)' }} />
          </button>
          <button
            onClick={connectHoneywell}
            className="flex items-center gap-1 text-[11px] font-600 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'var(--blue)', color: '#fff' }}
          >
            <Plug size={11} /> Connect Honeywell
          </button>
        </div>
      </div>

      {/* Dev seed button */}
      {isDev && (
        <div className="mb-3 p-2 rounded-lg border border-dashed border-yellow-400 bg-yellow-50">
          <p className="text-[10px] font-600 text-yellow-700 mb-1">Dev mode — no real Honeywell credentials needed</p>
          <button
            onClick={() => devSeed.mutate()}
            disabled={devSeed.isPending}
            className="text-[11px] font-600 px-2 py-1 rounded bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
          >
            {devSeed.isPending ? 'Seeding...' : 'Seed Mock Thermostat Data'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!hasAnyDevices && !isLoading && (
        <div
          className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--bd)', color: 'var(--t3)' }}
        >
          <Thermometer size={28} className="mb-2 opacity-40" />
          <p className="text-[12px] font-600 mb-1">No IoT devices connected</p>
          <p className="text-[11px] opacity-70 text-center max-w-[200px]">
            Connect a Honeywell thermostat to see live temperature and system data
          </p>
        </div>
      )}

      {/* Device cards */}
      {allConnections.map(conn =>
        conn.devices.map(device => (
          <DeviceCard
            key={device.deviceId}
            device={device}
            onDisconnect={() => disconnect.mutate(conn.provider)}
          />
        ))
      )}

      {/* Disconnect buttons */}
      {allConnections.map(conn =>
        conn.devices.length > 0 ? (
          <button
            key={conn.provider}
            onClick={() => { if (confirm(`Disconnect ${conn.provider}?`)) disconnect.mutate(conn.provider) }}
            className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 mt-1"
          >
            <Trash2 size={11} /> Disconnect {conn.provider}
          </button>
        ) : null
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin-dashboard/src/pages/customers/IotDevicesTab.tsx
git commit -m "feat(iot): add IotDevicesTab component with device cards, status badges, dev seed"
```

---

## Task 8: Wire Tab into CustomerDetailsSidebar

**Files:**
- Modify: `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx`

- [ ] **Step 1: Add "iot" to TabType** (line 35–44, after `"reasoning"`)

Change:
```typescript
type TabType =
  | "contact"
  | "addresses"
  | "equipment"
  | "jobs"
  | "agreements"
  | "reviews"
  | "activity"
  | "reasoning";
```
To:
```typescript
type TabType =
  | "contact"
  | "addresses"
  | "equipment"
  | "jobs"
  | "agreements"
  | "reviews"
  | "activity"
  | "reasoning"
  | "iot";
```

- [ ] **Step 2: Add import for IotDevicesTab and Wifi icon**

At the top of the file, after the existing lucide imports, add:
```typescript
import { Wifi } from "lucide-react";
import { IotDevicesTab } from "./IotDevicesTab";
```

- [ ] **Step 3: Add tab definition** (in the `tabs` array, after the `reasoning` entry)

```typescript
{ id: "iot", label: "IoT", icon: <Wifi size={14} /> },
```

- [ ] **Step 4: Add tab panel** (after the `reasoning` tab `&&` block, before the closing `</div>`)

Search for `activeTab === "reasoning"` block end and add after it:
```tsx
{activeTab === "iot" && customerId && (
  <IotDevicesTab customerId={customerId} />
)}
```

- [ ] **Step 5: Check for TypeScript errors**

```bash
cd /Users/ravishan/Desktop/Lush/T&SBCRM
pnpm --filter admin-dashboard build 2>&1 | tail -30
```

Expected: Build succeeds (or only pre-existing errors, no new ones).

- [ ] **Step 6: Commit**

```bash
git add apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx
git commit -m "feat(iot): add IoT tab to CustomerDetailsSidebar"
```

---

## Task 9: Test Endpoints & UI

- [ ] **Step 1: Start services**

```bash
# Terminal 1
pnpm --filter crm-service dev

# Terminal 2
pnpm dev:admin
```

- [ ] **Step 2: Test dev seed endpoint**

```bash
# Get a customer ID first
curl -s http://localhost:3001/crm/customers?companyId=co-demo-001 \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: company_admin" | python3 -m json.tool | grep '"id"' | head -3

# Seed mock IoT data for first customer
curl -s -X POST http://localhost:3001/iot/dev-seed/<CUSTOMER_ID> \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: company_admin" \
  -H "x-test-user-id: test-user-001"
# Expected: {"seeded":true}
```

- [ ] **Step 3: Test device fetch**

```bash
curl -s http://localhost:3001/iot/customers/<CUSTOMER_ID>/devices \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: company_admin" \
  -H "x-test-user-id: test-user-001" | python3 -m json.tool
# Expected: array with 1 connection, 2 devices (one online, one offline)
```

- [ ] **Step 4: Test disconnect**

```bash
curl -s -X DELETE http://localhost:3001/iot/customers/<CUSTOMER_ID>/connections/honeywell \
  -H "x-test-company-id: co-demo-001" \
  -H "x-test-user-role: company_admin" \
  -H "x-test-user-id: test-user-001" -w "%{http_code}"
# Expected: 204
```

- [ ] **Step 5: Test in UI**

1. Open http://localhost:5173
2. Navigate to Customers page
3. Click any customer → Customer Details Sidebar opens
4. Click the "IoT" tab
5. Click "Seed Mock Thermostat Data" (yellow dev banner)
6. Verify 2 device cards appear:
   - "Main Floor Thermostat": Online, 71°F, Cooling, 45% humidity
   - "Upstairs Thermostat": Offline, last seen 4h ago
7. Click the refresh button (↺) — data reloads
8. Click "Disconnect honeywell" → confirm dialog → cards disappear

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(iot): Phase 1 complete — Honeywell IoT tab with mock dev fixtures"
```

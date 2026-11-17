# IoT Device Integration Spec
## T&S CRM — Customer Thermostat Panel

**Goal:** Show live thermostat data (temperature, mode, humidity, connectivity, emergency heat) in the Customer Details Sidebar, sourced from the customer's Honeywell Home or Google Nest account.

---

## What We're Building

A new **IoT Devices** section in `CustomerDetailsSidebar.tsx` that shows:
- Live thermostat status (online/offline, current temp, setpoint, HVAC mode, humidity)
- Emergency heat alert if active
- Offline badge if thermostat goes dark
- A "Connect Device" button → OAuth flow → token stored per customer
- Connect can be initiated by **admin** (sends customer a link) or **customer** (from portal)

---

## APIs Used

### 1. Resideo / Honeywell Home API
**Portal:** developer.honeywellhome.com — free registration, instant API key

**OAuth flow:**
```
GET https://api.honeywell.com/oauth2/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &state=<customerId>

POST https://api.honeywell.com/oauth2/token
  Body: grant_type=authorization_code, code=<code>, redirect_uri=...
  Auth: Basic base64(clientId:clientSecret)
  → returns: access_token, refresh_token, expires_in (600 seconds = 10 min)
```

**Token refresh (every 10 min):**
```
POST https://api.honeywell.com/oauth2/token
  Body: grant_type=refresh_token&refresh_token=<token>
  Auth: Basic base64(clientId:clientSecret)
```

**Get thermostats for a location:**
```
GET https://api.honeywell.com/v2/locations?apikey=YOUR_CLIENT_ID
Authorization: Bearer <access_token>
→ returns array of locations, each with devices[]
```

**Get thermostat state:**
```
GET https://api.honeywell.com/v2/devices/thermostats/{deviceId}?apikey=CLIENT_ID&locationId={locationId}
Authorization: Bearer <access_token>
→ key fields:
  indoorTemperature      // current temp °F
  indoorHumidity         // %
  operationStatus.mode   // Heat | Cool | Off
  changeableValues.mode  // HEAT | COOL | OFF | AUTO
  changeableValues.heatSetpoint / coolSetpoint
  changeableValues.emergencyHeatActive  // true = heat pump failed
  scheduleStatus         // TemporaryHold | PermanentHold | NoHold
  isAlive                // online/offline boolean
```
**Rate limit:** Poll no faster than every 5 minutes per device.

---

### 2. Google Nest SDM API
**Portal:** developers.google.com/nest/device-access — $5 one-time fee
**Requires:** GCP project with Pub/Sub topic for event delivery

**OAuth flow:**
```
GET https://nestservices.google.com/partnerconnections/{project-id}/auth
  ?redirect_uri=YOUR_REDIRECT_URI
  &access_type=offline
  &response_type=code
  &scope=https://www.googleapis.com/auth/sdm.service

POST https://oauth2.googleapis.com/token
  Body: grant_type=authorization_code, code=<code>, redirect_uri=...
  → returns: access_token, refresh_token, expires_in (3600 = 1 hr)
```

**Token refresh (every 1 hr):**
```
POST https://oauth2.googleapis.com/token
  Body: grant_type=refresh_token&refresh_token=<token>
```

**List devices:**
```
GET https://smartdevicemanagement.googleapis.com/v1/enterprises/{project-id}/devices
Authorization: Bearer <access_token>
→ returns devices[], each with traits{}
```

**Key traits on a thermostat:**
```
sdm.devices.traits.Temperature         → ambientTemperatureCelsius
sdm.devices.traits.Humidity            → ambientHumidityPercent
sdm.devices.traits.ThermostatHvac      → status: HEATING | COOLING | OFF
sdm.devices.traits.ThermostatMode      → mode: HEAT | COOL | HEATCOOL | OFF
sdm.devices.traits.ThermostatTemperatureSetpoint → heatCelsius, coolCelsius
sdm.devices.traits.Connectivity        → status: ONLINE | OFFLINE
```
**Rate limit:** 5 QPM per device, 100 QPH per device.
**Events:** GCP Pub/Sub delivers trait-change events in real time (no polling needed for updates).

---

## Env Vars to Add

```env
# Resideo / Honeywell Home
RESIDEO_CLIENT_ID=
RESIDEO_CLIENT_SECRET=
RESIDEO_REDIRECT_URI=https://nginx-gateway-.../api/crm/iot/honeywell/callback

# Google Nest SDM
NEST_CLIENT_ID=
NEST_CLIENT_SECRET=
NEST_PROJECT_ID=
NEST_REDIRECT_URI=https://nginx-gateway-.../api/crm/iot/nest/callback
NEST_PUBSUB_SUBSCRIPTION=  # GCP Pub/Sub subscription name
```

---

## Data Model (crm-service Prisma)

```prisma
model CustomerIotConnection {
  id             String   @id @default(cuid())
  companyId      String
  customerId     String
  provider       String   // "honeywell" | "nest"
  accessToken    String   @db.Text
  refreshToken   String   @db.Text
  tokenExpiresAt DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id])
  devices  CustomerIotDevice[]

  @@unique([customerId, provider])
}

model CustomerIotDevice {
  id           String   @id @default(cuid())
  connectionId String
  deviceId     String   // provider's device ID
  locationId   String?  // Honeywell locationId
  name         String
  type         String   // "thermostat"
  lastSnapshot Json?    // cached latest reading
  lastSyncedAt DateTime?

  connection CustomerIotConnection @relation(fields: [connectionId], references: [id])
}
```

---

## Backend (crm-service)

New module: `apps/crm-service/src/iot/`

```
iot/
  iot.module.ts
  iot.controller.ts        # OAuth endpoints + data fetch endpoints
  iot.service.ts           # token management, device fetch, data normalization
  honeywell.client.ts      # Resideo API calls
  nest.client.ts           # SDM API calls + Pub/Sub listener
```

**Endpoints:**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/iot/honeywell/connect` | JWT (admin or customer) | Redirect to Honeywell OAuth |
| `GET` | `/iot/honeywell/callback` | None | Handle OAuth code, store tokens |
| `GET` | `/iot/nest/connect` | JWT | Redirect to Google OAuth |
| `GET` | `/iot/nest/callback` | None | Handle OAuth code, store tokens |
| `GET` | `/iot/customers/:id/devices` | JWT | Get all connected devices + latest data |
| `DELETE` | `/iot/customers/:id/connections/:provider` | JWT (admin) | Disconnect a provider |
| `POST` | `/iot/customers/:id/connect-link` | JWT (admin) | Generate a magic link for customer to self-connect |

**Data normalization** — both APIs normalized to one shape:
```typescript
interface IotDeviceSnapshot {
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
  emergencyHeat: boolean;   // Honeywell only
  lastSyncedAt: string;     // ISO timestamp
}
```

**Token refresh:** A BullMQ job refreshes tokens 5 minutes before expiry. Honeywell tokens expire in 10 minutes; Nest in 1 hour.

---

## Frontend

### Admin Dashboard — CustomerDetailsSidebar.tsx
New collapsible section **"IoT Devices"** added below the equipment section.

**States:**
- `not_connected` → shows "Connect Device" dropdown (Honeywell / Nest)
- `loading` → skeleton cards
- `connected` → device cards with live data
- `offline` → red badge on device card + alert banner

**Device card layout:**
```
┌──────────────────────────────────────────────┐
│ 🌡️  Main Floor — Honeywell T6 Pro   ● Online │
│                                              │
│  72°F current    →    73°F setpoint          │
│  Mode: COOLING        Humidity: 46%          │
│  Equipment: Cooling active                   │
│  Emergency Heat: Off ✅                      │
│                       Synced 3 min ago  ↺   │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 🌡️  Upstairs — Honeywell T9        ● OFFLINE │
│  Last seen: 4 hours ago                      │
│  ⚠️  Check thermostat connectivity           │
└──────────────────────────────────────────────┘
```

If `emergencyHeat = true` → red card border + "⚠️ Emergency heat active — heat pump may have failed"

### Customer Portal
New **"My Devices"** section on the customer dashboard.
- Shows connected thermostats (same device card, read-only)
- "Connect Thermostat" button → OAuth flow

### Admin "Send Connect Link"
In the customer modal, admin can click **"Send connect link"** → generates a signed JWT link (24hr expiry) → sends via email → customer clicks it → goes directly to the OAuth consent screen → token stored against their customer record.

---

## Implementation Phases

### Phase 1 — Honeywell Only (Core)
- [ ] Prisma models + migration
- [ ] `IotModule` with Honeywell OAuth flow (connect + callback)
- [ ] `HoneywellClient` — token refresh, fetch thermostats, fetch device state
- [ ] `GET /iot/customers/:id/devices` → normalized snapshot
- [ ] Admin dashboard IoT section in `CustomerDetailsSidebar.tsx`
- [ ] Token refresh BullMQ job

### Phase 2 — Customer Self-Connect
- [ ] Customer portal "My Devices" page
- [ ] Admin "Send connect link" endpoint + email template (comms-service)
- [ ] Magic link handler (signed JWT, 24hr TTL)

### Phase 3 — Google Nest
- [ ] GCP project + Pub/Sub topic setup
- [ ] `NestClient` — OAuth, device list, Pub/Sub listener
- [ ] Same normalized snapshot shape, plug into existing UI

### Phase 4 — Alerts
- [ ] Emergency heat active → flag on customer record
- [ ] Thermostat offline > 2hrs → create a CRM follow-up task automatically
- [ ] Dispatch Map badge for customers with offline/emergency-heat devices

---

## Key Constraints

- **Multi-tenancy:** `CustomerIotConnection` always scoped by `companyId`. One customer can connect multiple providers.
- **Token security:** `accessToken` and `refreshToken` stored encrypted at rest (AES-256 via a `ENCRYPTION_KEY` env var).
- **Rate limits:** Honeywell — poll max every 5 min. Nest — poll max every 12 min (100 QPH / 8 devices). Use cached `lastSnapshot` for API calls within the window.
- **No real-time requirement:** Polling every 5 min is fine for this use case. Nest Pub/Sub adds real-time updates optionally in Phase 3.
- **Graceful degradation:** If token is expired and refresh fails, show "Reconnect required" state — don't show stale data.
- **BYPASS_AUTH:** In dev, the OAuth callback must handle the `BYPASS_AUTH=true` mode — skip token validation, use a test device fixture.

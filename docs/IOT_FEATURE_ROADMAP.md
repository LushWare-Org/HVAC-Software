# IoT Feature Roadmap

> What we can build from the thermostat data we already collect.

**Current data per device (every 15 min sync):**
`currentTempF` · `humidity` · `online` · `hvacMode` · `hvacState` · `heatSetpointF` · `coolSetpointF` · `emergencyHeat` · `lastSyncedAt`

**Current use:** display in sidebar + tag customer on emergency heat / offline.

---

## Features — Ranked by Value

### 🔴 1. Auto-create Emergency Jobs
**When emergency heat fires → automatically create a high-priority job in job-service**, not just a tag.

- Right now the tag sits there until someone notices it. With auto-job creation, it lands directly in the dispatch queue with pre-filled notes (device name, alert type, customer).
- **Feasibility: Easy** — `IotAlertsService` already has the customer/company context. One HTTP call to `job-service POST /jobs` with `priority: URGENT`.
- **Impact: Very High** — turns a passive tag into an active work order with zero admin effort.

---

### 🔴 2. Temperature History (Time-Series Snapshots)
**Store each sync as a row** in a new `IotDeviceHistory` table instead of overwriting `lastSnapshot`.

- Unlocks everything below (trending, anomaly detection, predictive maintenance). Without history, the data is basically wasted — we read it and throw it away.
- **Feasibility: Easy** — add `IotDeviceHistory` Prisma model (`deviceId`, `snapshotData`, `recordedAt`), write on every sync. No API changes needed immediately.
- **Impact: Very High** — foundational. All advanced features depend on this.

---

### 🟡 3. System Performance Detection
**Flag customers whose HVAC isn't reaching setpoint** — e.g. heat mode running for 2h+ but temp still 5°F below heatSetpoint.

- Requires history (Feature 2). Cron checks last N snapshots: if `hvacState=HEATING` and `currentTemp < heatSetpoint - 4` for consecutive readings → system underperforming → create a maintenance job or flag.
- **Feasibility: Medium** — needs history + new alert type in `IotAlertsService`.
- **Impact: High** — catches failing systems before the customer notices. Huge service differentiator.

---

### 🟡 4. Smart Upsell Trigger
**Auto-launch a replacement/upgrade campaign** when a device shows repeated emergency heat events or chronic underperformance.

- Cross-reference with `Equipment` record (age, model). If device is 8+ years old and struggling → trigger the "system replacement" email campaign via `comms-service`.
- **Feasibility: Medium** — connects `IotAlertsService` → `comms-service` campaign queue. Pattern already exists in the equipment automation worker.
- **Impact: High** — direct revenue. The signal (struggling old system) is a natural sales moment.

---

### 🟡 5. Seasonal Proactive Outreach
**Before summer/winter, find all connected customers** whose device hasn't had service in 12 months → auto-send tune-up campaign.

- Query: customers with IoT connection + no completed job in 365 days + hvacMode used in past 30 days. Send "time for your annual tune-up" campaign.
- **Feasibility: Medium** — new scheduled job in the equipment automation worker. Needs cross-query of `CustomerIotConnection` + `jobs` schema.
- **Impact: High** — predictable recurring revenue, especially pre-season.

---

### 🟢 6. Customer Portal — My Devices Page
**Let customers see their own device status** (temp, mode, online state) in the customer portal.

- Current IoT endpoints are admin-only. Expose a read-only `GET /iot/my-devices` route gated to `role=CUSTOMER` with `customerId` from JWT.
- **Feasibility: Easy** — IoT service already has `getCachedDevices()`. Add a customer-facing controller endpoint + a new page in `apps/customer-portal`.
- **Impact: Medium** — improves customer trust and stickiness. They can see their system is being watched.

---

### 🟢 7. Humidity Alerts
**High indoor humidity (>60%)** is a mold/air quality risk. Flag it and offer dehumidifier or IAQ service.

- Add a third alert type to `IotAlertsService`. Tag: `iot:high_humidity:<deviceId>`. Can also auto-trigger an IAQ upsell campaign.
- **Feasibility: Easy** — 10-line addition to existing `checkAlerts()` cron.
- **Impact: Medium** — opens a new upsell category (IAQ / dehumidifiers) with zero new infrastructure.

---

### 🔵 8. Technician Pre-Arrival Briefing
**Show the tech the customer's live device state** when they open a job in the technician app.

- Dispatched tech sees current temp, mode, HVAC state, and any active alerts before arriving. No surprises.
- **Feasibility: Hard** — needs technician app integration (new tab or panel in `apps/technician-app/app/job/[id].tsx`). That file is already 1,812 lines.
- **Impact: High** — better service quality, faster diagnosis, fewer callback trips.

---

## Summary Table

| Feature | Feasibility | Revenue Impact | Effort |
|---------|-------------|----------------|--------|
| 1. Auto-create emergency job | Easy | Very High | ~2h |
| 2. Temperature history | Easy | Foundational | ~3h |
| 3. System performance detection | Medium | High | ~1 day |
| 4. Smart upsell trigger | Medium | High | ~1 day |
| 5. Seasonal proactive outreach | Medium | High | ~1 day |
| 6. Customer portal devices page | Easy | Medium | ~4h |
| 7. Humidity alerts | Easy | Medium | ~1h |
| 8. Technician pre-arrival briefing | Hard | High | ~2 days |

---

## Recommended Build Order

```
Phase 1 (Quick wins):  7 → 1 → 6
Phase 2 (Foundational): 2 (history) → 3 (performance detection)
Phase 3 (Revenue):      4 (upsell) → 5 (seasonal outreach)
Phase 4 (Field):        8 (tech app)
```

Start with humidity alerts (1h), emergency job auto-creation (2h), and customer portal devices page (4h) — all easy, high visible value, no new dependencies. Then unlock the history-dependent features.

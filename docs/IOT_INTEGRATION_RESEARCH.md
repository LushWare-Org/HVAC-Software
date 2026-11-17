# IoT & Smart Device Integration Research
## T&S CRM — HVAC Field Service Platform

> **Purpose:** Evaluate 8 IoT/smart-home API categories for integration into the T&S CRM.
> Each section covers what the API provides, access requirements, signals available,
> and how useful it is for an HVAC field-service business.
> **Research date:** May 2026. All data verified against primary developer documentation.

---

## Table of Contents

1. [Google Nest Device Access (SDM API)](#1-google-nest-device-access-sdm-api)
2. [ecobee API](#2-ecobee-api)
3. [Honeywell Home / Resideo API](#3-honeywell-home--resideo-api)
4. [Home Assistant API](#4-home-assistant-api)
5. [Matter / SmartThings / Apple Home / Google Home](#5-matter--smartthings--apple-home--google-home)
6. [Sense & Emporia Energy Monitoring APIs](#6-sense--emporia-energy-monitoring-apis)
7. [IAQ Sensor APIs — Airthings, Awair, uHoo, PurpleAir](#7-iaq-sensor-apis--airthings-awair-uhoo-purpleair)
8. [Weather APIs — NWS, OpenWeatherMap, Tomorrow.io](#8-weather-apis--nws-openweathermap-tomorrowio)
9. [Master Comparison Table](#master-comparison-table)
10. [Key Findings & Recommendations](#key-findings--recommendations)
11. [Suggested Use Cases for T&S CRM](#suggested-use-cases-for-ts-crm)

---

## 1. Google Nest Device Access (SDM API)

### What It Is
**Maker:** Google
**Official name:** Smart Device Management (SDM) API / Device Access
**Access model:** Two-tier
- **Sandbox:** Any developer, $5 one-time fee, limited to 25 users total across all projects
- **Commercial:** Requires Google partner certification (undocumented process; contact Google)

### Signals Available
All data exposed via device "traits":

| Trait | Fields | Writable? |
|---|---|---|
| `Temperature` | `ambientTemperatureCelsius` | No |
| `Humidity` | `ambientHumidityPercent` | No |
| `ThermostatHvac` | `status`: HEATING / COOLING / OFF | No |
| `ThermostatMode` | `mode`: HEAT / COOL / HEATCOOL / OFF | Yes |
| `ThermostatEco` | `mode`: MANUAL_ECO or OFF; eco setpoints | Yes |
| `ThermostatTemperatureSetpoint` | `heatCelsius`, `coolCelsius` | Yes |
| `Fan` | `timerMode` (ON/OFF), `timerTimeout` | Yes |
| `Connectivity` | `status`: ONLINE or OFFLINE | No |
| `Settings` | `temperatureScale` | No |

**Notably absent:** No fault codes, no runtime hours, no compressor stage data, no energy consumption.

### Authentication & Access
- OAuth 2.0 — every homeowner must individually authorize your app via Google
- $5 non-refundable registration fee
- Must use a consumer Gmail (not Workspace)
- **Post-January 2025:** New projects must self-host a GCP Pub/Sub topic (Google no longer provisions it)

### Delivery Model & Rate Limits
- **Push via Google Cloud Pub/Sub** — not polling. Events fire on every trait change.
- Per device: 5 QPM or 100 QPH
- Per project: 10 QPM per user

### B2B SaaS Complexity
**High.** Structurally consumer-centric — each customer must individually OAuth into your app. No batch/service-account model. Sandbox cap of 25 users hits immediately; Commercial requires undocumented Google certification. GCP Pub/Sub self-hosting adds infrastructure overhead per tenant.

### Best HVAC Use Cases
- Verify thermostat is online before dispatching a tech
- Confirm setpoint changes after a service call
- Pre-visit ambient temperature check
- Post-install connectivity verification
- Real-time HVAC state (HEATING/COOLING/OFF) correlation with job records

### Verdict
**Viable but limited.** Good for verifying equipment is online and in the right mode — not for diagnostics or runtime analysis. Worth integrating if your customer base has Nest thermostats. Requires significant OAuth UX work per customer.

---

## 2. ecobee API

### What It Is
**Maker:** ecobee (acquired by Generac Power Systems)
**Access model:** **CLOSED — program shut down in 2024.** No new API keys being issued. Existing developers with previously issued tokens can continue; all new registrations are rejected.

> Developer portal still shows: *"Sorry, we are not currently accepting new developer registrations at this time."*

### Signals That Were Available (for reference)
This was the richest thermostat API for HVAC field service before closure:

**Runtime Reports (5-minute granularity):**
- Equipment runtime by stage: `auxHeat1/2/3`, `compHeat1/2`, `compCool1/2`, `fan`, `humidifier`, `dehumidifier`, `economizer`, `ventilator`
- Environmental: `outdoorTemp`, `outdoorHumidity`, `zoneAveTemp`, `zoneHumidity`
- HVAC mode, demand offsets, sky condition, wind speed — all per 5-min interval
- Up to 31 days lookback, 25 thermostats per request

**Real-time Thermostat Status:**
- Current equipment state (CSV of running equipment: `heatPump`, `compCool1`, `auxHeat1`, `fan`, etc.)
- Remote sensor temperature and occupancy (per-room)
- Alert objects: filter alerts, service reminders (closest thing to fault codes)

### Verdict
**DO NOT BUILD ON THIS.** Program is closed to new developers. Listed here only so you understand what the gold standard for HVAC thermostat data looks like — the signals ecobee exposed (equipment-stage runtime, aux vs compressor ratio) are what every HVAC tech actually wants. No other public thermostat API comes close.

---

## 3. Honeywell Home / Resideo API

### What It Is
**Maker:** Resideo Technologies (consumer spinoff of Honeywell — owns the "Honeywell Home" brand)
**Developer portal:** developer.honeywellhome.com
**Access model:** Open registration, free API key. No partner approval for basic access. Higher rate limits require emailing `developerinfo@resideo.com`.

> Note: The separate "Honeywell" portal at devportal.prod.honeywell.com is for Honeywell Building Technologies (commercial/enterprise) — a different company/division.

### Signals Available
From `GET /v2/devices/thermostats/{deviceId}`:

| Field | Description |
|---|---|
| `indoorTemperature` | Current indoor temp |
| `outdoorTemperature` | Outdoor temp (if module installed) |
| `indoorHumidity` | Indoor humidity % |
| `outdoorHumidity` | Outdoor humidity |
| `humiditySensorStatus` | `Measured` / `NotAvailable` / **`SensorFault`** |
| `operationStatus.mode` | Current equipment relay: Heat / Cool / Off |
| `changeableValues.mode` | Thermostat mode setting |
| `changeableValues.heatSetpoint` / `coolSetpoint` | Active setpoints |
| `changeableValues.emergencyHeatActive` | **Emergency heat active (equipment failure signal)** |
| `scheduleStatus` | TemporaryHold / PermanentHold / VacationHold / NoHold |
| `isAlive` | Device connectivity boolean |
| `fanRequest` / `circulationFanRequest` | Fan state |

**Notably absent:** No fault codes, no runtime hours, no compressor staging.

### Authentication & Access
- OAuth 2.0 per customer
- Free developer registration at developer.honeywellhome.com
- Push events require an **Azure Event Hub** (connection string + Event Hub name) — not a standard webhook URL

### Delivery Model & Rate Limits
- **Polling:** 5-minute minimum interval; ~20 devices/hour design intent
- **Push events:** Azure Event Hub only (online/offline events; thermostat state changes not in the event list)
- No device simulator — requires real hardware for testing

### B2B SaaS Complexity
**High.** Per-customer OAuth. Azure Event Hub infrastructure for push events (not a simple webhook). Rate limits (5-min minimum) are conservative for large fleets. No fault codes or runtime diagnostics.

### Best HVAC Use Cases
- Monitor customer thermostat connectivity (`isAlive`) for proactive outreach
- Detect emergency heat activation (system failure indicator)
- Identify `SensorFault` on humidity sensor
- Verify setpoints are as-configured post-service
- Pre-visit check: is system in correct mode?

### Verdict
**Good alternative to Nest for Honeywell customers.** Free access, accessible signup. The `emergencyHeatActive` field is a real diagnostic signal — if a customer's heat pump is stuck and running on emergency heat, you know before they call you. The Azure Event Hub requirement for push is annoying but workable.

---

## 4. Home Assistant API

### What It Is
**Maker:** Home Assistant (open source, backed by Nabu Casa)
**Access model:** Self-hosted by the customer. No central cloud API. Each customer runs their own instance (typically on a Raspberry Pi behind residential NAT). Optional Nabu Casa cloud subscription ($7.50/month) adds a remote access URL.

### Signals Available
**Depends entirely on what the customer has integrated.** Home Assistant is an aggregation platform that can connect to virtually any smart device protocol. If the customer has it set up:

- Any thermostat entity: `hvac_mode`, `hvac_action` (heating/cooling/idle/off), `current_temperature`, setpoints, `fan_mode`, `preset_mode`
- Room-level temperature and humidity from any sensor
- Energy monitoring from any connected monitor, plug, or panel sensor
- Equipment state from water heaters, HVAC accessories
- Historical state: 31 days via the `/api/history/period/<timestamp>` endpoint

**WebSocket push:** Subscribe to `state_changed` events for real-time push on any entity state change. Payload includes old state, new state, entity ID, timestamp, and context. Zero polling required.

### Authentication & Access
- Long-Lived Access Token from the customer's `/profile` page
- `Authorization: Bearer <TOKEN>` header
- Local: port 8123. Remote: Nabu Casa URL or customer-configured port forwarding

### Rate Limits
- None imposed externally — it's the customer's own hardware
- WebSocket push is real-time; REST calls return immediately

### B2B SaaS Complexity
**Very High.** No central API — each customer is a separate isolated instance, often behind NAT. No multi-tenant partner model. Remote access options all require customer action:
1. Customer enables Nabu Casa and shares the remote URL + API token with you
2. Customer self-configures port forwarding (security risk)
3. Customer installs a custom HA integration (outbound agent) that calls your SaaS — requires building and maintaining a custom HA component

Additionally, available signals vary per home depending on what integrations the customer has installed.

### Best HVAC Use Cases
- Richest possible integration — access every sensor in a customer's smart home
- Correlate HVAC runtime with multi-room temperature data from remote sensors
- Access energy monitoring from any connected smart device
- Full historical state analysis (31 days)
- Automate post-service verification scripts

### Verdict
**Best signals, worst scalability.** Great for a power-user program (tech-savvy customers who already use Home Assistant and are willing to set it up), but not viable as a standard product feature for typical homeowners. Consider as an optional "advanced integration" feature rather than a core offering.

---

## 5. Matter / SmartThings / Apple Home / Google Home

### What It Is
**Matter** is an open-source local-network communication protocol (formerly Project CHIP), maintained by the Connectivity Standards Alliance (CSA). It is NOT a cloud REST API — it is a local protocol running over Thread, Wi-Fi, or Ethernet. To access Matter devices remotely, you must go through a cloud bridge: SmartThings, Apple Home, or Google Home.

**SmartThings API:** Samsung's cloud-based API wrapping Matter and other connected devices.
**Apple HomeKit:** iOS SDK only — no cloud REST API exists.
**Google Home Developer APIs:** Separate from Device Access; focused on automations, not data retrieval.

### Matter Thermostat Cluster Signals

| Attribute | Description | Writable? |
|---|---|---|
| `LocalTemperature` | Current measured temperature (x100, so 2150 = 21.5°C) | No |
| `OutdoorTemperature` | Outdoor temp if available | No |
| `OccupiedCoolingSetpoint` | Cooling target (occupied) | Yes |
| `OccupiedHeatingSetpoint` | Heating target (occupied) | Yes |
| `UnoccupiedCooling/HeatingSetpoint` | Unoccupied setpoints | Yes |
| `SystemMode` | Off / Auto / Cool / Heat / EmergencyHeat | Yes |
| `ThermostatRunningMode` | Current active mode | No |
| `PIHeatingDemand` | Heating demand % (system strain) | No |
| `PICoolingDemand` | Cooling demand % (system strain) | No |
| `Occupancy` | Occupancy status bitmap | No |

### SmartThings API Access
- OAuth 2.0 (consumer) or **Service Account (enterprise — must contact Samsung: st.matter@samsung.com)**
- Rate limits (enterprise service account): List Devices 1,000 req/15min; Execute Command 120 req/min; Device Health 40 req/min

### Apple HomeKit
- **iOS SDK only.** No public cloud REST API. Cannot be integrated without a native iOS app distributed via the App Store. Not feasible for a web-based CRM.

### B2B SaaS Complexity
**High.** Matter is local-first — remote access requires going through a cloud hub (SmartThings, etc.) each with their own OAuth, rate limits, and access controls. SmartThings enterprise service accounts require emailing Samsung. Apple HomeKit is practically inaccessible. No unified "Matter cloud API" exists.

### Best HVAC Use Cases (via SmartThings)
- Read thermostat state and setpoints post-install
- Send setpoint adjustments remotely
- `PIHeatingDemand`/`PICoolingDemand` indicates how hard the system is working
- Device health monitoring (online/offline events)

### Verdict
**Future-oriented, currently complex.** Matter will eventually become the universal standard, but today the cloud access story is fragmented. SmartThings is the most viable bridge for a B2B integration, but requires Samsung enterprise contact and isn't self-serve. Watch this space for 2027+.

---

## 6. Sense & Emporia Energy Monitoring APIs

### Sense Energy Monitor

**Maker:** Sense Labs (acquired by Schneider Electric, 2024)
**What it does:** Whole-home current-sensing clamps on the electrical panel; uses ML to disaggregate total power draw into individual detected appliances.

**Official API status:** ❌ **NO OFFICIAL API EXISTS.**
- Community forum requests for an official API date back to 2018 with no commitments
- **Sense has announced it will stop selling consumer home monitors (hardware sales end December 31, 2025)** — pivoting to utility smart meter partnerships
- Unofficial community-reverse-engineered API (Python `sense` library, Go client) exists but can break at any time

**Available via unofficial API:**
- Real-time total house power draw (watts) via WebSocket
- Per-device power for ML-detected appliances
- Solar production (if enabled)

**Verdict:** ❌ **DO NOT BUILD ON THIS.** No official API, consumer hardware being discontinued, no partner program. Dead end.

---

### Emporia Energy

**Maker:** Emporia Energy
**Devices:** Vue whole-home energy monitor, Gen3 smart plugs, EV chargers

**Official API status:** ❌ **NO OFFICIAL PUBLIC API.**
> Emporia explicitly states: *"Emporia Energy does not currently offer a public API for direct programmatic access to device or account data. An official API remains a long-term goal."*

**Available via unofficial API (`PyEmVue`):**
- Whole-home power consumption (kWh per channel)
- Per-circuit breakdown (with whole-home monitor)
- Individual outlet monitoring (smart plugs)
- Historical energy data

**Verdict:** ❌ **DO NOT BUILD ON THIS.** No official API, no partner program, no committed timeline. Unofficial access is fragile.

---

### What To Use Instead for Energy Monitoring

| Option | Status | Notes |
|---|---|---|
| **Utility Green Button Connect** | Official, per-utility | Billing-level kWh, not real-time |
| **Shelly Energy monitoring smart plugs** | Official REST API | Per-circuit monitoring for individual HVAC units |
| **Sense/Emporia unofficial** | Unofficial, fragile | Alpha/internal tools only, never customer-facing |

---

## 7. IAQ Sensor APIs — Airthings, Awair, uHoo, PurpleAir

### Airthings for Business API

**Maker:** Airthings (Norway, publicly traded)
**Devices:** Wave Plus, View Plus, Wave Enhance — residential and commercial IAQ + radon monitors
**Access model:** Two APIs — Consumer API (developer.airthings.com) and **Business API** (developer-business.airthings.com). Business API requires an Airthings for Business subscription (contact sales).

#### Signals Available (View Plus sensor suite)

| Sensor | Range / Accuracy |
|---|---|
| Radon | Long-term and short-term averages (Bq/m³ or pCi/L) |
| CO₂ | 400–5,000 ppm (±50 ppm ±3%) — NDIR sensor |
| TVOC | ppb |
| PM1.0, PM2.5 | 0–1,000 µg/m³ |
| Temperature | °C / °F |
| Relative Humidity | % |
| Air Pressure | hPa |
| Light Level | lux (some models) |

#### Authentication
- **OAuth 2.0** (Authorization Code for user-facing apps; **Client Credentials / M2M for backend automation**)
- Token URL: `https://accounts-api.airthings.com/v1/token`
- Scopes: `read:device`, `write:device`

#### Delivery Model
- **REST API** — historical or latest samples per device or location
- **Webhooks** — device samples and events in real time
- **MQTT** — subscribe to device samples (for BMS/BAS integration)
- "Using a combination of integration services is highly recommended"

#### Rate Limits
- Default: **5,000 requests/hour** per client
- IP: **2,000 requests per 5-minute window** per IP
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### B2B Complexity
**Low-Medium.** Cleanest B2B API model on this list. OAuth 2.0 with client credentials for backend M2M is the ideal multi-tenant pattern. Main challenge: customers need Airthings for Business subscription (not consumer devices); radon data is long-term averaged (not useful for real-time dispatch). Main use is diagnostic reports and upsell triggers.

#### Best HVAC Use Cases
- Validate ventilation improvements post-service (CO₂ and VOC trending down after ERV/HRV install)
- **Radon mitigation verification** — measure pre and post mitigation system install
- IAQ reports as upsell material: "Your home CO₂ peaks at 1,800 ppm at 2pm — a ventilation upgrade could fix this"
- Humidity trending to correlate with HVAC dehumidification performance
- Alert customers when CO₂ or humidity is out of range → triggers a service upsell

#### Verdict
**Best IAQ integration option.** Clean B2B API, webhooks, MQTT, solid sensor lineup. Radon monitoring is a genuine differentiator for HVAC companies offering indoor air quality services.

---

### Awair API

**Maker:** Awair (acquired by Faurecia in 2021)
**Devices:** Element, Omni — commercial/prosumer IAQ monitors

#### Signals Available
- Temperature, Relative Humidity, CO₂ (ppm), TVOC (ppb), PM2.5 (µg/m³)
- Composite "Awair Score" (0–100)
- Per-pollutant index scores

#### Authentication
- Bearer token (from Awair developer console — free, up to 24-hour wait)
- OAuth 2.0 for user-facing integrations

#### Rate Limits
Tier-based (undisclosed publicly). Restrictive on consumer tier.

#### B2B Complexity
**Medium.** API is accessible but post-acquisition developer community activity has slowed. Primarily office/commercial-focused — residential HVAC customers unlikely to have an Awair device.

#### Best HVAC Use Cases
- Post-service IAQ verification in **commercial** HVAC buildings
- Filter effectiveness monitoring (PM2.5 trending after filter change)
- Ventilation adequacy via CO₂ proxy

#### Verdict
**Limited residential relevance.** Better suited for commercial HVAC customers. Developer program uncertain post-acquisition.

---

### uHoo API

**Maker:** uHoo (Singapore, B2B focus)
**Devices:** uHoo Aura — 13-sensor commercial-grade IAQ monitor

#### Signals Available (13 standard sensors)
Temperature, Relative Humidity, Air Pressure, CO₂, TVOC, **CO (Carbon Monoxide)**, PM1/PM2.5/PM4/PM10, **Formaldehyde (HCHO)**, Light (lux), Sound (dB), Virus Index™

#### Authentication
- POST to generate a bearer token — **valid for only 10 minutes**
- Must implement aggressive token refresh logic

#### Delivery Model
Polling only (no webhooks documented). Short token TTL (10 min) compounds the polling complexity.

#### B2B Complexity
**Medium-High.** 10-minute token expiry is operationally painful. API documentation hosted on Postman rather than a proper developer portal. B2B/commercial-only devices — not in residential homes.

#### Best HVAC Use Cases (commercial only)
- **CO detection pre-screening** — dangerous gas level detection before dispatch
- Formaldehyde detection (new construction/renovation commissioning)
- Multi-pollutant IAQ verification post-HVAC service
- Temperature/humidity variance across zones for HVAC balancing diagnostics

#### Verdict
**Niche use for commercial HVAC.** CO and Formaldehyde monitoring are genuinely useful for HVAC commissioning in commercial buildings. Not relevant for residential.

---

### PurpleAir API

**Maker:** PurpleAir
**What it is:** Network of 50,000+ outdoor (and some indoor) crowdsourced air quality sensors. Primarily an **outdoor** AQI network.

#### Signals Available
PM1.0, PM2.5, PM10 (dual-channel), Temperature*, Relative Humidity*, Pressure (hPa), particle counts by size bin (6 bins, 0.3–10 µm)

> ⚠️ Temperature runs 2.7–5.3°C warmer than ambient (internal heat). Humidity runs 9.7–24.3% lower. **Not accurate for HVAC use.**

#### Authentication
- Free API key from develop.purpleair.com (Google account required)
- 1 million complimentary points on signup; additional points purchasable

#### Rate Limits
Points-based system; community guidance: poll no more than every 1–10 minutes per sensor. Data updated every 2 minutes.

#### B2B Complexity
**Low.** This is a data service, not a customer-device integration. You query for a location's outdoor AQI — no per-customer OAuth required. Simple API key integration.

#### Best HVAC Use Cases
- **Wildfire smoke alerts** → proactive outreach for air filtration upgrades
- Local outdoor AQI displayed on customer portal
- Outdoor PM2.5 as input to "should we open windows?" or ERV/HRV recommendations
- Neighborhood-level air quality context for filter change recommendations

#### Verdict
**Easy, free, useful as background context.** Not a customer-device integration — just query outdoor AQI by lat/lon for any customer address. Wildfire smoke events are a real HVAC sales trigger ("your filters are getting clogged faster right now").

---

## 8. Weather APIs — NWS, OpenWeatherMap, Tomorrow.io

### National Weather Service (NWS / weather.gov)

**Maker:** NOAA / US federal government
**Access model:** Completely free. No API key. No registration. Just include a `User-Agent` header.

#### Signals Available
- Current conditions: temperature, humidity, wind, dew point, visibility, sky cover, barometric pressure
- 7-day forecast (hourly and 12-hour periods)
- **Official weather alerts** (watches, warnings, advisories) — authoritative source
- Gridded forecast data (raw NWS model output, ~2.5km resolution)
- Observation data from METAR stations

**Limitations:** US only. No geocoding — must supply lat/lon. No historical data (use Climate Data Online separately).

#### Rate Limits
Informal; no official rate limit published. Community guidance: ≤1 request/minute/endpoint/location.

#### Best HVAC Use Cases
- **Free official severe weather alerts** — freeze warnings, heat advisories, extreme cold
- Auto-postpone scheduled outdoor work when storm warnings are active
- Temperature forecasts for demand surge prediction
- "First freeze of the season" trigger for winter maintenance reminders

#### Verdict
**Use this for alerts — it's the authoritative source and costs nothing.** Not suitable as your primary weather data source due to resolution and polling limitations.

---

### OpenWeatherMap

**Maker:** OpenWeather Ltd (UK)
**Access model:** Free tier with self-service API key. Paid plans for higher limits and historical data.

#### Signals Available
All plans: temperature (feels-like, min, max), humidity, atmospheric pressure, wind, cloud cover, visibility, UV index, precipitation intensity/accumulation, weather condition codes.

Paid additions:
- Historical data lookback (1 month–1 year): Developer plan+
- Hourly forecasts (4 days): Developer plan+
- 16-day daily forecast: All paid plans
- Heating/cooling degree days: Professional/Expert only
- Air pollution data (PM2.5, CO, NO₂, SO₂, O₃): Free tier included

#### Rate Limits

| Plan | Monthly Cost | Calls/min |
|---|---|---|
| Free | $0 | 60 |
| Startup | Paid | 600 |
| Developer | Paid | 3,000 |
| Professional | Paid | 30,000 |

#### Best HVAC Use Cases
- Daily weather context for every customer address
- Seasonal maintenance triggers (heat index thresholds, first freeze alerts)
- Air quality data during wildfire/pollution events (free tier)
- Historical weather data for correlating service call spikes with weather events

#### Verdict
**Good general-purpose weather API.** Free tier (60/min, 1,000/day) is tight for a fleet but workable at startup scale. Degree-day data (the most HVAC-relevant metric) is on Professional/Expert tier only.

---

### Tomorrow.io

**Maker:** Tomorrow.io (formerly ClimaCell, Boston)
**Access model:** Free tier with self-service API key. Paid plans for precision and volume.

#### Signals Available
Temperature, apparent/feels-like temperature, **dew point**, humidity, wind speed/direction/gust, precipitation intensity + type (rain/snow/sleet/freezing rain), cloud cover/base/ceiling, visibility, pressure, UV index, sunrise/sunset, moon phase, snow depth, growing degree days, evapotranspiration, precipitation probability.

#### Temporal Resolution
- Minutely (next 60 min): Premium tier
- Hourly (up to 120 hours): Paid plans
- Daily (5 days+): All paid plans

#### Rate Limits
Free tier: ~25 req/hour. Paid tiers: tier-specific. `X-RateLimit-*` response headers provided.

#### Best HVAC Use Cases
- **Hyper-local per-address forecasting** — more precise than NWS for customer-specific weather
- Dew point and humidity trending for dehumidification load prediction
- Severe weather alerts to proactively postpone jobs
- Storm tracking for post-storm service call surge prediction
- Snow/ice accumulation for outdoor unit access planning

#### Verdict
**Best precision weather API for per-address use cases.** Dew point data (comfort/humidity control) and apparent temperature (system load estimation) are directly HVAC-relevant. Tomorrow.io + NWS (for official alerts) is the recommended combo.

---

## Master Comparison Table

| API | New Dev Access | Auth Model | Push/Webhook | Key HVAC Signals | Rate Limit | B2B Complexity |
|---|---|---|---|---|---|---|
| **Google Nest SDM** | Open ($5 fee) | OAuth 2.0 per user | GCP Pub/Sub required | Temp, humidity, HVAC state, connectivity | 5 QPM/device | High |
| **ecobee** | **CLOSED** | N/A | N/A | Equipment runtime, stages, sensors | N/A | N/A |
| **Resideo/Honeywell** | Open (free) | OAuth 2.0 per user | Azure Event Hub only | Temp, humidity, mode, relay, emergency heat | 5-min poll | High |
| **Home Assistant** | Self-hosted | Token per instance | WebSocket push | Everything (depends on customer's setup) | None | Very High |
| **SmartThings** | Enterprise by approval | OAuth / Service Account | Webhooks | Matter thermostat cluster, device health | 120 req/min | High |
| **Sense Energy** | **NO OFFICIAL API** | Scraped credentials | Unofficial WebSocket | Whole-home power, device detection | Fragile | Not suitable |
| **Emporia Energy** | **NO OFFICIAL API** | Scraped Cognito | Unofficial polling | Per-circuit energy | Fragile | Not suitable |
| **Airthings Business** | Open (business sub required) | OAuth 2.0 + M2M | Webhooks + MQTT | Radon, CO₂, VOC, PM2.5, temp, humidity | 5,000 req/hr | Low-Medium |
| **Awair** | Open (free registration) | Bearer / OAuth | Polling | CO₂, VOC, PM2.5, temp, humidity | Tier-based | Medium |
| **uHoo** | Business account | Short-lived bearer (10 min) | Polling only | 13 sensors: CO, HCHO, PM, CO₂, VOC | Undisclosed | Medium |
| **PurpleAir** | Open (free API key) | API key | Polling (2-min data) | Outdoor PM1/PM2.5/PM10, AQI | Points-based | Low |
| **OpenWeatherMap** | Open (free key) | API key | Polling | Temp, humidity, precip, UV, air quality | 60/min free | Low |
| **Tomorrow.io** | Open (free key) | API key | Polling | Temp, dew point, humidity, precip, cloud | ~25 req/hr free | Low |
| **NWS** | Open (no key needed) | User-Agent header | Polling | Temp, humidity, official alerts | Informal | Low (US only) |

---

## Key Findings & Recommendations

### 1. No API Gives You True Equipment Diagnostics
The most valuable data for HVAC field service — fault codes, compressor runtime hours, refrigerant pressure, equipment cycle counts — is **not available from any consumer thermostat API**. That data lives in the equipment's control board, accessible only via manufacturer proprietary service tools (Carrier ComfortLink, Trane Diagnostics, etc.) or on-premises hardware (like an iComfort Wi-Fi module with dealer access). This is the gap that separates "smart home" APIs from true HVAC service diagnostics.

The closest proxy was ecobee's equipment runtime reports (compressor vs aux heat ratio, stage tracking), but that program is now closed.

### 2. The Best Accessible Signals Are Still Useful
Even without fault codes, the available signals enable real value:

| Signal | What It Tells You | Source |
|---|---|---|
| HVAC state (HEATING/COOLING/OFF) | Is the system actually running? | Nest, Resideo, SmartThings |
| Emergency heat active | Heat pump failed, running on backup | Resideo |
| Connectivity (online/offline) | Customer's thermostat is offline | Nest, Resideo |
| Outdoor temperature | Is the HVAC load normal for the weather? | Any weather API |
| Humidity + CO₂ | Is the HVAC system conditioning the air effectively? | Airthings |
| Radon levels | Pre/post mitigation verification | Airthings |
| Outdoor AQI | Filter change recommendations, wildfire events | PurpleAir |
| Freeze alerts | Proactive winterization calls | NWS |

### 3. Immediate Actionable Integrations (ranked by value/effort)

| Rank | Integration | Effort | Value | Recommendation |
|---|---|---|---|---|
| 1 | **Weather APIs (NWS + Tomorrow.io)** | Low | High | Build first — free, no customer OAuth, immediate value |
| 2 | **PurpleAir (outdoor AQI)** | Low | Medium | Easy background data enrichment |
| 3 | **Airthings for Business** | Medium | High | Best IAQ integration; radon is a unique differentiator |
| 4 | **Resideo/Honeywell** | Medium-High | Medium | Good for Honeywell thermostat customers |
| 5 | **Google Nest SDM** | High | Medium | Good for Nest customers; GCP infrastructure required |
| 6 | **Home Assistant** | Very High | High | Optional "power user" integration only |

### 4. Avoid Completely
- ❌ ecobee — closed program
- ❌ Sense Energy — no official API, hardware discontinued
- ❌ Emporia Energy — no official API, no timeline
- ❌ Apple HomeKit — no cloud API, iOS only
- ❌ uHoo — residential irrelevant, painful auth

---

## Suggested Use Cases for T&S CRM

### Use Case A: Smart Dispatch Pre-Check (Nest / Resideo)
Before dispatching a tech, automatically check:
- Is the customer's thermostat online?
- What is the current HVAC mode and ambient temperature?
- Is emergency heat active?

Display on the Job detail panel and Dispatch Map. If thermostat is offline → add note to tech's job. If emergency heat is active → flag as priority call.

**Fits into:** `DispatchMap.tsx`, `JobDetailModal.tsx`, crm-service equipment module

---

### Use Case B: Weather-Driven Campaign Triggers (NWS + Tomorrow.io)
Already have the marketing module. Add weather triggers:
- First freeze warning in customer's county → auto-trigger winter maintenance campaign
- Extreme heat advisory → "Is your AC ready for the heat wave?" campaign
- Post-storm → "Storm damage check" campaign

Zero customer device setup required — just geocode addresses and query NWS alerts.

**Fits into:** `EquipmentAutomationService`, comms-service marketing automation

---

### Use Case C: Indoor Air Quality Upsell Reports (Airthings)
For customers who have Airthings devices (or as a device-sell bundle):
- Pull CO₂, humidity, radon, PM2.5 data monthly
- Generate an "IAQ Report" PDF (already have Puppeteer PDF generation in finance-service)
- If CO₂ > 1,000 ppm regularly → recommend ERV/HRV installation
- If humidity > 60% → recommend dehumidifier service
- If radon elevated → recommend mitigation system check
- Auto-trigger follow-up emails via marketing module

**Fits into:** crm-service (new equipment module), comms-service (automation templates), finance-service (PDF generation)

---

### Use Case D: Wildfire / Air Quality Alert Push (PurpleAir)
When outdoor PM2.5 spikes in a customer's ZIP code (wildfire event):
- Push notification to customer portal: "Air quality in your area is poor — your filters may need changing sooner"
- Trigger a campaign for HEPA filter upgrades, air purifier sales

**Fits into:** marketing module automation, customer portal push notifications

---

### Use Case E: Post-Service Comfort Verification (Airthings / Resideo / Nest)
After a service job is marked COMPLETED:
- Pull thermostat data 30 minutes post-completion: is setpoint being reached? Is system running?
- Pull IAQ data 24 hours post-completion: is CO₂ trending down after a ventilation fix?
- Auto-send "How is your comfort?" follow-up if targets not being met within 2 hours

**Fits into:** job-service (job completion hook), comms-service (review request flow), crm-service (equipment module)

---

## Recommended First Integration

**Start with Use Case B: Weather-Driven Campaign Triggers.**

**Why:**
- Zero customer device setup required
- No per-customer OAuth flow
- NWS alerts are free and authoritative
- Tomorrow.io free tier covers small fleet
- Directly augments the marketing module already built
- Measurable outcome: track campaign open rates and service bookings triggered by weather alerts
- Can be built in 1–2 sprints

**Second integration: Resideo/Honeywell** — opens up real thermostat signals for pre-dispatch checks, and Honeywell thermostats are extremely common in residential HVAC. Free developer access, no GCP infrastructure needed.

---

*Report generated from primary developer documentation sources. All API status information current as of May 2026.*
*Sources: Google SDM docs, ecobee developer portal, Resideo developer.honeywellhome.com, Home Assistant developers.home-assistant.io, SmartThings developer portal, Sense/Emporia community forums, Airthings developer-business.airthings.com, Awair docs.developer.getawair.com, uHoo Postman docs, PurpleAir api.purpleair.com, OpenWeatherMap, Tomorrow.io, weather.gov*

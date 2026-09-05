#!/usr/bin/env node
/**
 * simulate-technician-gps.mjs
 *
 * Drives a technician along a route by POSTing to /scheduling/gps, exactly as
 * the mobile app does. Everything downstream of that endpoint is the real
 * production path: the gps_tracking insert, the technician.current_location
 * update, the Redis publish, the WebSocket fan-out and the dispatch map
 * marker. Only the phone's GPS chip is substituted.
 *
 * Why this exists: verifying live tracking otherwise means putting a person in
 * a car. This makes it repeatable, time-compressible, and runnable for several
 * technicians at once.
 *
 * Usage
 * -----
 *   node scripts/simulate-technician-gps.mjs --email tech@kase.lk --password secret
 *   node scripts/simulate-technician-gps.mjs --token "$JWT" --speed 10
 *   node scripts/simulate-technician-gps.mjs --bypass --user-id user-tech-001
 *   node scripts/simulate-technician-gps.mjs --list-routes
 *
 * Options
 * -------
 *   --api <url>        Gateway base URL          (default http://localhost/api)
 *                      Point it straight at the Go service instead
 *                      (http://localhost:3003) and the /scheduling prefix is
 *                      dropped automatically, since that prefix is nginx's.
 *   --path <p>         Override the GPS path outright, e.g. /gps
 *   --email <e>        Technician login email
 *   --password <p>     Technician password
 *   --token <jwt>      Use a JWT directly instead of logging in
 *   --bypass           Use dev x-test-* headers instead of a JWT.
 *                      Requires BYPASS_AUTH=true and GIN_MODE != release.
 *   --company <id>     Company for --bypass          (default co-demo-001)
 *   --user-id <id>     CompanyUser id for --bypass. Must map to a technician.
 *   --route <name>     Built-in route name, or a path to a JSON file holding
 *                      [[lat,lng], ...]             (default colombo-fort-dehiwala)
 *   --interval <s>     Seconds of simulated time between fixes    (default 30)
 *   --speed <n>        Replay speed multiplier. 10 = 10x faster    (default 1)
 *   --kmh <n>          Driving speed along the route in km/h      (default 32)
 *   --loop             Restart at the beginning on arrival
 *   --dry-run          Print the points without sending them
 *
 * Trial mode (live demo)
 * ----------------------
 * Waits for the technician to tap "En Route" in the app, then drives them to
 * that job's address along real roads while the operator watches the map.
 *
 *   --watch-tech <id>  CompanyUser id of the technician to watch. Polls their
 *                      jobs and starts driving when one turns EN_ROUTE.
 *   --to-job <jobId>   Skip waiting; drive to this job now.
 *   --to <lat,lng>     Skip waiting; drive to a fixed point now.
 *   --from <lat,lng>   Where to start (default: the tech's last known
 *                      position, else Colombo Fort).
 *   --poll <s>         Seconds between EN_ROUTE checks           (default 5)
 *   --hold             After arriving, keep sending the final position every
 *                      30s so the marker does not go stale during the demo.
 *   --osrm <url>       OSRM base URL      (default router.project-osrm.org)
 *
 *   node scripts/simulate-technician-gps.mjs \
 *     --api https://nginx-gateway-srkxrd2xka-uc.a.run.app/api \
 *     --email tech@kase.lk --password ... \
 *     --watch-tech user-tech-001 --hold
 */

import { readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

// ── Routes ───────────────────────────────────────────────────────────────────
// Waypoints follow real roads. The simulator interpolates between them, so a
// handful of corner points is enough to produce a smooth track.

const ROUTES = {
  'colombo-fort-dehiwala': {
    label: 'Colombo Fort to Dehiwala along Galle Road (about 11 km)',
    points: [
      [6.9344, 79.8428], [6.9271, 79.8447], [6.9218, 79.8467], [6.9165, 79.8489],
      [6.9101, 79.8514], [6.9037, 79.8546], [6.8968, 79.8578], [6.8894, 79.8608],
      [6.8812, 79.8637], [6.8734, 79.8657], [6.8651, 79.8672], [6.8567, 79.8684],
    ],
  },
  'colombo-loop': {
    label: 'Short loop around Colombo 7 (about 4 km, good for quick checks)',
    points: [
      [6.9061, 79.8612], [6.9078, 79.8674], [6.9034, 79.8712], [6.8988, 79.8681],
      [6.9002, 79.8621], [6.9061, 79.8612],
    ],
  },
  'kandy-run': {
    label: 'Kandy town to Peradeniya (about 6 km)',
    points: [
      [7.2906, 80.6337], [7.2861, 80.6248], [7.2812, 80.6154], [7.2743, 80.6041],
      [7.2685, 80.5951], [7.2599, 80.5975],
    ],
  },
}

// ── Args ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      out[key] = true
    } else {
      out[key] = next
      i++
    }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))

if (args['list-routes']) {
  console.log('\nBuilt-in routes:\n')
  for (const [name, r] of Object.entries(ROUTES)) {
    console.log(`  ${name.padEnd(24)} ${r.label}`)
  }
  console.log('\nOr pass --route path/to/points.json holding [[lat,lng], ...]\n')
  process.exit(0)
}

const API = String(args.api ?? 'http://localhost/api').replace(/\/$/, '')

// The /scheduling segment belongs to the nginx gateway, not to the Go service.
// Pointed straight at :3003 the endpoint is plain /gps, and getting this wrong
// yields a bare "404 page not found" that looks like a missing technician.
const VIA_GATEWAY = /\/api$/.test(API)
const GPS_PATH =
  args.path && args.path !== true
    ? String(args.path)
    : VIA_GATEWAY
      ? '/scheduling/gps'
      : '/gps'
const INTERVAL_S = Number(args.interval ?? 30)
const SPEED_MULT = Number(args.speed ?? 1)
const KMH = Number(args.kmh ?? 32)
const LOOP = Boolean(args.loop)
const DRY_RUN = Boolean(args['dry-run'])

if (!Number.isFinite(INTERVAL_S) || INTERVAL_S <= 0) fail('--interval must be a positive number')
if (!Number.isFinite(SPEED_MULT) || SPEED_MULT <= 0) fail('--speed must be a positive number')
if (!Number.isFinite(KMH) || KMH <= 0) fail('--kmh must be a positive number')

function fail(msg) {
  console.error(`\n  ${msg}\n`)
  process.exit(1)
}

// ── Geometry ─────────────────────────────────────────────────────────────────

const R_EARTH_M = 6_371_000
const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI

function haversineM([lat1, lng1], [lat2, lng2]) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH_M * Math.asin(Math.sqrt(a))
}

function bearingDeg([lat1, lng1], [lat2, lng2]) {
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lng2 - lng1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/**
 * Walk the polyline emitting a point every `stepM` metres.
 *
 * Interpolating by distance rather than replaying raw waypoints is what makes
 * the track look like a vehicle: speed stays constant, corners are rounded by
 * the sampling rate, and the fix count is independent of how carefully the
 * route was drawn.
 */
function densify(points, stepM) {
  if (points.length < 2) return points.map((p) => ({ pos: p, heading: 0 }))

  const out = []
  let carry = 0

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    const segM = haversineM(from, to)
    if (segM === 0) continue
    const heading = bearingDeg(from, to)

    for (let d = carry; d < segM; d += stepM) {
      const t = d / segM
      out.push({
        pos: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t],
        heading,
      })
    }
    // Carry the leftover into the next segment so spacing stays even across
    // corners instead of resetting at every waypoint.
    carry = (stepM - ((segM - carry) % stepM)) % stepM
  }

  out.push({ pos: points[points.length - 1], heading: out.at(-1)?.heading ?? 0 })
  return out
}

// ── Route loading ────────────────────────────────────────────────────────────

function loadRoute(nameOrPath = 'colombo-fort-dehiwala') {
  if (ROUTES[nameOrPath]) return ROUTES[nameOrPath]
  let raw
  try {
    raw = readFileSync(nameOrPath, 'utf8')
  } catch {
    fail(
      `Unknown route "${nameOrPath}". Run with --list-routes to see the built-ins, ` +
        'or pass a path to a JSON file holding [[lat,lng], ...].',
    )
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    fail(`${nameOrPath} is not valid JSON: ${err.message}`)
  }
  // Accept either a bare array or { points: [...] }.
  const points = Array.isArray(parsed) ? parsed : parsed.points
  if (!Array.isArray(points) || points.length < 2) {
    fail(`${nameOrPath} must hold at least 2 points shaped [[lat,lng], ...]`)
  }
  for (const p of points) {
    if (!Array.isArray(p) || p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
      fail(`${nameOrPath} contains a point that is not [lat, lng]: ${JSON.stringify(p)}`)
    }
  }
  return { label: `custom route from ${nameOrPath}`, points }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

async function login(email, password) {
  // Login lives in crm-service, which is only reachable through the gateway.
  if (!VIA_GATEWAY) {
    fail(
      `--api ${API} points straight at a service, so /crm/auth/login is not reachable.\n` +
        '  Either use the gateway (--api http://localhost/api), or pass --token / --bypass.',
    )
  }
  const res = await fetch(`${API}/crm/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.text()
  if (!res.ok) fail(`Login failed (HTTP ${res.status}): ${body}`)
  let parsed
  try {
    parsed = JSON.parse(body)
  } catch {
    fail(`Login returned non-JSON. Is --api correct? Got: ${body.slice(0, 200)}`)
  }
  const token = parsed.access_token
  if (!token) fail(`Login succeeded but returned no access_token: ${body.slice(0, 200)}`)
  const role = parsed.user?.role
  if (role && String(role).toLowerCase() !== 'technician') {
    console.warn(
      `  Warning: ${email} has role "${role}", not technician. ` +
        'The GPS endpoint needs a user with a technician profile.',
    )
  }
  return { token, name: parsed.user?.name ?? email }
}

async function buildAuth() {
  if (args.bypass) {
    const companyId = String(args.company ?? 'co-demo-001')
    const userId = args['user-id']
    if (!userId || userId === true) {
      fail('--bypass needs --user-id <CompanyUser id that maps to a technician>')
    }
    return {
      headers: {
        'x-test-company-id': companyId,
        'x-test-user-id': String(userId),
        'x-test-user-role': 'technician',
      },
      who: `${userId} (dev bypass, company ${companyId})`,
    }
  }

  if (args.token && args.token !== true) {
    return { headers: { Authorization: `Bearer ${args.token}` }, who: 'token supplied on the command line' }
  }

  const email = args.email
  const password = args.password
  if (!email || email === true || !password || password === true) {
    fail(
      'Provide credentials one of three ways:\n' +
        '    --email <e> --password <p>      log in as the technician\n' +
        '    --token <jwt>                   use an existing token\n' +
        '    --bypass --user-id <id>         dev headers (needs BYPASS_AUTH=true)',
    )
  }
  const { token, name } = await login(String(email), String(password))
  return { headers: { Authorization: `Bearer ${token}` }, who: name }
}

// ── Send ─────────────────────────────────────────────────────────────────────

async function sendPoint(headers, point) {
  const res = await fetch(`${API}${GPS_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(point),
  })
  const body = await res.text()
  return { ok: res.ok, status: res.status, body }
}

// ── Trial mode: drive to a real job when the technician goes EN_ROUTE ────────
//
// During a live demo nobody knows the job id in advance — the customer creates
// it minutes earlier. So instead of naming a job, name the technician and wait
// for one of their jobs to flip to EN_ROUTE, then drive to wherever it is.

async function apiGet(headers, path) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...headers } })
  const text = await res.text()
  if (!res.ok) throw new Error(`GET ${path} → HTTP ${res.status} ${text.slice(0, 200)}`)
  try { return JSON.parse(text) } catch { throw new Error(`GET ${path} returned non-JSON`) }
}

function jobCoords(job) {
  const lat = job?.serviceLatitude != null ? Number(job.serviceLatitude) : NaN
  const lng = job?.serviceLongitude != null ? Number(job.serviceLongitude) : NaN
  // 0,0 is the Gulf of Guinea, not Colombo — treat it as unset like the
  // dashboard's own parseCoords does.
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null
  return [lat, lng]
}

/** Poll until one of this technician's jobs is EN_ROUTE. Returns that job. */
async function waitForEnRoute(headers, techUserId, pollSeconds) {
  console.log(`  Waiting for a job of ${techUserId} to go EN_ROUTE (checking every ${pollSeconds}s)...`)
  console.log('  Ctrl-C to stop.\n')
  let announcedNoCoords = null
  for (;;) {
    let jobs = []
    try {
      // crewUserId, not assignedToId: assignedToId matches only the LEAD, so
      // watching a crew member who is not leading would never fire.
      const res = await apiGet(headers, `/jobs/jobs?status=EN_ROUTE&crewUserId=${encodeURIComponent(techUserId)}&limit=5`)
      jobs = Array.isArray(res?.data) ? res.data : []
    } catch (err) {
      console.log(`  poll failed: ${err.message}`)
    }

    const withCoords = jobs.find((j) => jobCoords(j))
    if (withCoords) return withCoords

    if (jobs.length && announcedNoCoords !== jobs[0].id) {
      // A job went EN_ROUTE but has no pin. Say so loudly: the operator's map
      // shows no job marker and no route line either, so this looks like a
      // tracking failure when it is really missing job data.
      announcedNoCoords = jobs[0].id
      console.log(`  ${jobs[0].jobNumber ?? jobs[0].id} is EN_ROUTE but has NO service coordinates.`)
      console.log('  The dashboard cannot draw a job pin or a route line for it. Set a map')
      console.log('  pin on the job, or pass --to <lat,lng> to drive to a fixed point.\n')
    }
    await sleep(pollSeconds * 1000)
  }
}

/**
 * Road-following route between two points via OSRM.
 *
 * A straight line between two Colombo points cuts across the lake and the
 * rail yard, which reads as obviously fake on the operator's map. OSRM returns
 * the actual driving geometry. Falls back to the straight line if the service
 * is unreachable, because a demo that still runs beats one that aborts.
 */
async function roadRoute(from, to) {
  const base = (args.osrm && args.osrm !== true ? String(args.osrm) : 'https://router.project-osrm.org')
    .replace(/\/$/, '')
  const url = `${base}/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    const coords = j?.routes?.[0]?.geometry?.coordinates
    if (!Array.isArray(coords) || coords.length < 2) throw new Error('no geometry in response')
    return { points: coords.map(([lng, lat]) => [lat, lng]), source: 'OSRM road route' }
  } catch (err) {
    console.log(`  OSRM unavailable (${err.message}) — falling back to a straight line.`)
    return { points: [from, to], source: 'straight line (OSRM unavailable)' }
  }
}

function parseLatLng(value, label) {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(String(value))
  if (!m) fail(`${label} must be "lat,lng", got "${value}"`)
  return [Number(m[1]), Number(m[2])]
}

/** Where the technician starts from: --from, else their last known position. */
async function resolveStart(headers, techUserId) {
  if (args.from && args.from !== true) return parseLatLng(args.from, '--from')
  try {
    const res = await apiGet(headers, '/scheduling/technicians')
    const list = Array.isArray(res?.data) ? res.data : []
    const tech = list.find((t) => t.userId === techUserId || t.id === techUserId)
    const loc = tech?.currentLocation
    if (loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))) {
      return [Number(loc.lat), Number(loc.lng)]
    }
  } catch { /* fall through to the default */ }
  // Colombo Fort — a sane default so the demo never stalls on a missing start.
  return [6.9344, 79.8428]
}

/**
 * Drive a densified track, sending one fix per step. Shared by both modes.
 * Returns { sent, failed }.
 */
async function driveTrack(track, headers, opts = {}) {
  const wallGapMs = (INTERVAL_S / SPEED_MULT) * 1000
  let sent = 0
  let failed = 0

  for (let i = 0; i < track.length; i++) {
    if (opts.isStopping?.()) break
    const { pos, heading } = track[i]
    const point = {
      lat: Number(pos[0].toFixed(6)),
      lng: Number(pos[1].toFixed(6)),
      accuracyM: 5 + Math.random() * 8,
      speedKmh: KMH + (Math.random() * 8 - 4),
      headingDeg: heading,
      batteryPct: Math.max(15, Math.round(95 - (i / track.length) * 40)),
    }

    const label = `${String(i + 1).padStart(3)}/${track.length}  ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}  ${Math.round(point.headingDeg)}deg`

    if (DRY_RUN) {
      console.log(`  ${label}`)
    } else {
      const res = await sendPoint(headers, point)
      if (res.ok) {
        sent++
        console.log(`  ${label}  ok`)
      } else {
        failed++
        console.log(`  ${label}  HTTP ${res.status} ${res.body.slice(0, 160)}`)
        if ([401, 403, 404].includes(res.status)) {
          console.error('\n  Stopping: that status will not recover.\n')
          process.exit(1)
        }
      }
    }
    if (i < track.length - 1 && !opts.isStopping?.()) await sleep(wallGapMs)
  }
  return { sent, failed }
}

/**
 * Trial mode — the live-demo path.
 *
 * Waits for the technician to tap "En Route" in the app, then drives them to
 * that job's address along real roads while the operator watches the map.
 */
async function trialMode() {
  const auth = DRY_RUN ? { headers: {}, who: 'dry run' } : await buildAuth()
  const pollSeconds = Number(args.poll ?? 5)

  console.log('')
  console.log(`  Mode       trial (waiting for En Route)`)
  console.log(`  Technician ${auth.who}`)
  console.log(`  Endpoint   ${API}${GPS_PATH}`)
  console.log('')

  let stopping = false
  process.on('SIGINT', () => { stopping = true; console.log('\n  Stopping.') })

  // Destination: an explicit point, a named job, or whatever the technician
  // goes en route to.
  let destination
  let label
  if (args.to && args.to !== true) {
    destination = parseLatLng(args.to, '--to')
    label = `fixed point ${destination[0]}, ${destination[1]}`
  } else if (args['to-job'] && args['to-job'] !== true) {
    const job = await apiGet(auth.headers, `/jobs/jobs/${args['to-job']}`)
    destination = jobCoords(job)
    if (!destination) fail(`Job ${args['to-job']} has no service coordinates to drive to.`)
    label = `${job.jobNumber ?? job.id} — ${job.serviceAddress ?? 'no address'}`
  } else {
    const techUserId = String(args['watch-tech'])
    const job = await waitForEnRoute(auth.headers, techUserId, pollSeconds)
    destination = jobCoords(job)
    label = `${job.jobNumber ?? job.id} — ${job.serviceAddress ?? 'no address'}`
    console.log(`  EN ROUTE detected: ${label}`)
  }

  const techUserId = args['watch-tech'] && args['watch-tech'] !== true
    ? String(args['watch-tech']) : null
  const start = await resolveStart(auth.headers, techUserId)

  // Sanity check before generating a track. Seeded demo jobs carry US
  // coordinates (Austin, TX), so an unlucky pick would silently start a
  // 15,000 km drive with 60,000 fixes. A real service call is not 300 km.
  const directKm = haversineM(start, destination) / 1000
  const MAX_SANE_KM = Number(args['max-km'] ?? 300)
  if (directKm > MAX_SANE_KM) {
    fail(
      `Destination is ${directKm.toFixed(0)} km from the start — that is not a service call.\n` +
      `    start:       ${start[0]}, ${start[1]}\n` +
      `    destination: ${destination[0]}, ${destination[1]}\n` +
      `    ${label}\n\n` +
      '  Most likely the job carries seeded US coordinates rather than real ones.\n' +
      '  Fix the job\'s map pin, pass --to <lat,lng>, or raise --max-km to override.',
    )
  }

  const route = await roadRoute(start, destination)
  const stepM = (KMH * 1000 / 3600) * INTERVAL_S
  const track = densify(route.points, stepM)
  const km = (route.points.slice(1)
    .reduce((s, p, i) => s + haversineM(route.points[i], p), 0) / 1000).toFixed(1)

  console.log('')
  console.log(`  Destination ${label}`)
  console.log(`  Start       ${start[0].toFixed(5)}, ${start[1].toFixed(5)}`)
  console.log(`  Path        ${route.source}, ${km} km`)
  console.log(`  Driving     ${track.length} fixes at ${KMH} km/h, ${SPEED_MULT}x real time`)
  console.log('')

  const { sent, failed } = await driveTrack(track, auth.headers, { isStopping: () => stopping })

  console.log(`\n  Arrived. ${sent} sent, ${failed} failed.`)
  console.log('  The technician can now tap "Arrived" in the app.\n')

  // Hold position so the marker does not go stale mid-demo while the operator
  // is still looking at it.
  if (args.hold && !stopping) {
    console.log('  Holding position (Ctrl-C to stop)...')
    const last = track.at(-1).pos
    while (!stopping) {
      await sleep(30000)
      if (stopping) break
      await sendPoint(auth.headers, {
        lat: Number(last[0].toFixed(6)), lng: Number(last[1].toFixed(6)),
        accuracyM: 6, speedKmh: 0, headingDeg: 0, batteryPct: 55,
      })
      console.log(`  holding ${last[0].toFixed(5)}, ${last[1].toFixed(5)}`)
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Trial mode short-circuits the built-in routes entirely.
  if (args['watch-tech'] || args['to-job'] || args.to) {
    return trialMode()
  }

  const route = loadRoute(args.route === true ? undefined : args.route)

  // Metres covered between fixes at the configured driving speed.
  const stepM = (KMH * 1000 / 3600) * INTERVAL_S
  const track = densify(route.points, stepM)
  const totalKm = (
    route.points.slice(1).reduce((sum, p, i) => sum + haversineM(route.points[i], p), 0) / 1000
  ).toFixed(1)

  const wallGapMs = (INTERVAL_S / SPEED_MULT) * 1000
  const simMinutes = ((track.length * INTERVAL_S) / 60).toFixed(0)
  const wallMinutes = ((track.length * wallGapMs) / 60000).toFixed(1)

  const auth = DRY_RUN ? { headers: {}, who: 'dry run' } : await buildAuth()

  console.log('')
  console.log(`  Route      ${route.label}`)
  console.log(`  Distance   ${totalKm} km at ${KMH} km/h`)
  console.log(`  Fixes      ${track.length}, one every ${INTERVAL_S}s of simulated time`)
  console.log(`  Duration   ${simMinutes} min simulated, ${wallMinutes} min real at ${SPEED_MULT}x`)
  console.log(`  Technician ${auth.who}`)
  console.log(`  Endpoint   ${API}${GPS_PATH}`)
  if (LOOP) console.log('  Looping    on')
  if (DRY_RUN) console.log('  Dry run    nothing will be sent')
  console.log('')

  let sent = 0
  let failed = 0
  let stopping = false
  process.on('SIGINT', () => {
    stopping = true
    console.log('\n  Stopping after the current fix.')
  })

  do {
    for (let i = 0; i < track.length; i++) {
      if (stopping) break
      const { pos, heading } = track[i]
      const point = {
        lat: Number(pos[0].toFixed(6)),
        lng: Number(pos[1].toFixed(6)),
        accuracyM: 5 + Math.random() * 8,
        speedKmh: KMH + (Math.random() * 8 - 4),
        headingDeg: heading,
        // Drains gently across the run so the dispatch panel's battery
        // readout has something realistic to show.
        batteryPct: Math.max(15, Math.round(95 - (i / track.length) * 40)),
      }

      const label = `${String(i + 1).padStart(3)}/${track.length}  ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}  ${Math.round(point.headingDeg)}deg`

      if (DRY_RUN) {
        console.log(`  ${label}`)
      } else {
        const res = await sendPoint(auth.headers, point)
        if (res.ok) {
          sent++
          console.log(`  ${label}  ok`)
        } else {
          failed++
          console.log(`  ${label}  HTTP ${res.status} ${res.body.slice(0, 160)}`)
          // A 401/403/404 will not fix itself on the next tick, and silently
          // spamming a broken endpoint hides the real problem.
          if ([401, 403, 404].includes(res.status)) {
            console.error(
              '\n  Stopping: that status will not recover.\n' +
                '  404 "no technician profile" means the user has no technician record.\n' +
                '  401/403 means the token or bypass headers were rejected.\n',
            )
            process.exit(1)
          }
        }
      }

      if (i < track.length - 1 && !stopping) await sleep(wallGapMs)
    }
  } while (LOOP && !stopping)

  console.log(`\n  Done. ${sent} sent, ${failed} failed.\n`)
}

main().catch((err) => {
  console.error(`\n  ${err.message}\n`)
  process.exit(1)
})

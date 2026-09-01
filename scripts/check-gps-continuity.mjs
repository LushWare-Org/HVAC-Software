#!/usr/bin/env node
/**
 * check-gps-continuity.mjs
 *
 * Answers one question: did the technician's phone keep reporting its position
 * while nobody was looking at it?
 *
 * This is the verification for background location tracking. Sending a few
 * fixes with the app open proves nothing — the failure mode is that the OS
 * suspends the app's timers once the screen locks, so pings stop silently and
 * the dispatch map quietly freezes on a stale position. That only shows up as
 * a GAP in scheduling.gps_tracking, which is what this reads.
 *
 * Usage
 * -----
 *   node scripts/check-gps-continuity.mjs --tech "David Chen" --minutes 15
 *   node scripts/check-gps-continuity.mjs --list
 *   node scripts/check-gps-continuity.mjs --tech user-tech-001 --from 14:05 --to 14:20
 *
 * Options
 * -------
 *   --tech <who>     Technician name (partial, case-insensitive), technician id,
 *                    or userId. Omit to report on every technician.
 *   --minutes <n>    Look back this many minutes                 (default 15)
 *   --from <HH:MM>   Start of the window, local time. Overrides --minutes.
 *   --to <HH:MM>     End of the window, local time               (default now)
 *   --gap <s>        Seconds without a fix that counts as a gap  (default 150)
 *                    Default allows one missed ping at the 60s balanced
 *                    cadence plus slack, so only real stalls are flagged.
 *   --company <id>   Company to scope to                (default co-demo-001)
 *   --db <url>       Postgres URL. Defaults to DATABASE_URL in
 *                    apps/scheduling-service/.env
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ── Args ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue
    const key = argv[i].slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) out[key] = true
    else { out[key] = next; i++ }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))

function fail(msg) {
  console.error(`\n  ${msg}\n`)
  process.exit(1)
}

const COMPANY = String(args.company ?? 'co-demo-001')
const GAP_S = Number(args.gap ?? 150)
const MINUTES = Number(args.minutes ?? 15)

if (!Number.isFinite(GAP_S) || GAP_S <= 0) fail('--gap must be a positive number of seconds')
if (!Number.isFinite(MINUTES) || MINUTES <= 0) fail('--minutes must be a positive number')

/** "14:05" on today's date, in the machine's local timezone. */
function parseClock(value, label) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value))
  if (!m) fail(`${label} must look like HH:MM (24 hour), got "${value}"`)
  const [h, min] = [Number(m[1]), Number(m[2])]
  if (h > 23 || min > 59) fail(`${label} is not a valid time: "${value}"`)
  const d = new Date()
  d.setHours(h, min, 0, 0)
  return d
}

const to = args.to && args.to !== true ? parseClock(args.to, '--to') : new Date()
const from =
  args.from && args.from !== true
    ? parseClock(args.from, '--from')
    : new Date(to.getTime() - MINUTES * 60_000)

if (from >= to) fail('The window is empty: --from must be earlier than --to')

// ── DB ───────────────────────────────────────────────────────────────────────

function databaseUrl() {
  if (args.db && args.db !== true) return String(args.db)
  const envPath = resolve(REPO_ROOT, 'apps/scheduling-service/.env')
  let env
  try {
    env = readFileSync(envPath, 'utf8')
  } catch {
    fail(`Could not read ${envPath}. Pass --db <postgres url> instead.`)
  }
  const m = /^DATABASE_URL=(.*)$/m.exec(env)
  if (!m) fail(`No DATABASE_URL in ${envPath}. Pass --db <postgres url> instead.`)
  return m[1].trim().replace(/^["']|["']$/g, '')
}

function connect() {
  const raw = databaseUrl()
  // Supabase presents a chain Node does not trust out of the box, and
  // sslmode=require in the URL makes node-postgres verify it. Strip the
  // parameter and configure TLS explicitly: this is a read-only local
  // diagnostic against a database we already hold the password for.
  const url = raw.replace(/[?&]sslmode=[^&]*/g, (match) => (match[0] === '?' ? '?' : ''))
  return new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })
}

// ── Formatting ───────────────────────────────────────────────────────────────

const clock = (d) =>
  d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

function humanGap(seconds) {
  if (seconds < 90) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s ? `${m}m ${s}s` : `${m}m`
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = connect()
  try {
    await client.connect()
  } catch (err) {
    fail(`Could not connect to Postgres: ${err.message}`)
  }

  try {
    const techs = await client.query(
      `SELECT id, user_id, name FROM scheduling.technicians
        WHERE company_id = $1 ORDER BY name`,
      [COMPANY],
    )

    if (args.list) {
      console.log(`\n  Technicians in ${COMPANY}:\n`)
      for (const t of techs.rows) {
        console.log(`  ${t.name.padEnd(22)} ${t.id}  ${t.user_id ?? ''}`)
      }
      console.log('')
      return
    }

    let targets = techs.rows
    if (args.tech && args.tech !== true) {
      const needle = String(args.tech).toLowerCase()
      targets = techs.rows.filter(
        (t) =>
          t.id === args.tech ||
          t.user_id === args.tech ||
          (t.name ?? '').toLowerCase().includes(needle),
      )
      if (!targets.length) {
        fail(`No technician in ${COMPANY} matches "${args.tech}". Run with --list to see them.`)
      }
    }

    console.log('')
    console.log(`  Window     ${clock(from)} to ${clock(to)}  (${Math.round((to - from) / 60000)} min)`)
    console.log(`  Gap flag   more than ${humanGap(GAP_S)} without a fix`)
    console.log(`  Company    ${COMPANY}`)
    console.log('')

    let anyGap = false
    let anyPoints = false

    for (const tech of targets) {
      const res = await client.query(
        `SELECT captured_at FROM scheduling.gps_tracking
          WHERE technician_id = $1 AND captured_at >= $2 AND captured_at <= $3
          ORDER BY captured_at ASC`,
        [tech.id, from, to],
      )
      const times = res.rows.map((r) => new Date(r.captured_at))

      console.log(`  ${tech.name}`)

      if (times.length === 0) {
        console.log('    no fixes at all in this window')
        console.log('    the app was not reporting. Check it is signed in and location is')
        console.log('    set to Allow all the time, not While using the app.')
        console.log('')
        continue
      }

      anyPoints = true

      // Gaps include the run-up from the window start and the tail to its end:
      // tracking that dies two minutes in looks perfect if you only measure
      // between the fixes that did arrive.
      const edges = [from, ...times, to]
      const gaps = []
      for (let i = 0; i < edges.length - 1; i++) {
        const seconds = (edges[i + 1] - edges[i]) / 1000
        if (seconds > GAP_S) gaps.push({ start: edges[i], end: edges[i + 1], seconds })
      }

      const spanText = humanGap((times.at(-1) - times[0]) / 1000)
      const cadence = times.length > 1 ? (times.at(-1) - times[0]) / 1000 / (times.length - 1) : null

      console.log(
        `    ${times.length} fixes, ${clock(times[0])} to ${clock(times.at(-1))}` +
          (cadence ? `, about one every ${humanGap(cadence)}` : ''),
      )

      if (gaps.length === 0) {
        console.log(`    no gaps. Tracking was continuous across the full ${spanText}.`)
      } else {
        anyGap = true
        console.log(`    ${gaps.length} gap${gaps.length > 1 ? 's' : ''}:`)
        for (const g of gaps) {
          console.log(`      ${clock(g.start)} to ${clock(g.end)}   ${humanGap(g.seconds)} silent`)
        }
      }
      console.log('')
    }

    // Verdict, so the result is not left to interpretation.
    if (!anyPoints) {
      console.log('  RESULT: no data. Nothing reported in this window.\n')
      process.exitCode = 1
    } else if (anyGap) {
      console.log('  RESULT: gaps found. If the screen was locked during a gap, background')
      console.log('  tracking is not working on that device.\n')
      process.exitCode = 1
    } else {
      console.log('  RESULT: continuous. Tracking survived the whole window.\n')
    }
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(`\n  ${err.message}\n`)
  process.exit(1)
})

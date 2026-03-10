/**
 * Jest Global Setup — runs once before all test suites
 *
 * Seeds the CRM database so that the demo company (id: 'co-demo-001') exists
 * in the DB before any test suite runs. Without this the CRM service throws FK
 * constraint violations on every write (Leads, Customers, Contacts, etc. all
 * reference the Company table).
 *
 * This file is plain JS (not TS) so Jest can require it without any transform.
 */

const { execSync } = require('child_process');
const path         = require('path');
const http         = require('http');

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Quick TCP-level reachability check — faster than a full HTTP round-trip.
 * Returns true if host:port is accepting connections within `timeoutMs`.
 */
function isReachable(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    let resolved = false;
    const done = (val) => { if (!resolved) { resolved = true; socket.destroy(); resolve(val); } };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error',   () => done(false));
    socket.connect(port, host);
  });
}

// ── main ───────────────────────────────────────────────────────────────────

module.exports = async function globalSetup() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(  '║  🌱 Global Setup — seeding test database             ║');
  console.log(  '╚══════════════════════════════════════════════════════╝\n');

  // 1. Check that PostgreSQL is reachable before attempting the seed
  const pgUp = await isReachable('127.0.0.1', 5432);
  if (!pgUp) {
    console.warn('  ⚠️  PostgreSQL is not reachable on port 5432.');
    console.warn('      Make sure Docker Compose is running: docker compose up -d\n');
    return; // Let tests run and fail with descriptive messages
  }
  console.log('  ✅ PostgreSQL reachable\n');

  // 2. Run the CRM prisma seed to upsert company id='co-demo-001'
  //    The seed is idempotent — safe to run on every test start.
  const crmServiceDir = path.resolve(__dirname, '../../../apps/crm-service');

  try {
    console.log('  🌱 Running CRM seed (npx prisma db seed)...');
    execSync('npx prisma db seed', {
      cwd:     crmServiceDir,
      stdio:   'pipe',          // capture output so it doesn't pollute Jest header
      timeout: 60_000,          // 60 s max
      env: {
        ...process.env,
        // Ensure dotenv vars from apps/crm-service/.env are picked up
        // (dotenv in the seed script handles this, but just in case):
      },
    });
    console.log('  ✅ CRM seeded — company "co-demo-001" ready\n');
  } catch (err) {
    // Non-fatal: let tests run so we get descriptive per-test errors
    console.warn('  ⚠️  CRM seed failed:', err.message || err);
    console.warn('      To fix manually: cd apps/crm-service && npx prisma db seed\n');
  }

  // 3. Brief status line
  console.log('  🚀 Starting flow tests...\n');
};

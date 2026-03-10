/**
 * Quick health-check script — verifies all 6 services are reachable.
 * Run with:  npx ts-node health-check.ts
 *            (or)  npm run health
 */

import axios from 'axios';

const SERVICES: Record<string, string> = {
  crm:        process.env.CRM_URL        ?? 'http://localhost:3001',
  jobs:       process.env.JOBS_URL       ?? 'http://localhost:3002',
  scheduling: process.env.SCHEDULING_URL ?? 'http://localhost:3003',
  finance:    process.env.FINANCE_URL    ?? 'http://localhost:3004',
  comms:      process.env.COMMS_URL      ?? 'http://localhost:3005',
  analytics:  process.env.ANALYTICS_URL  ?? 'http://localhost:3006',
};

async function check(name: string, baseUrl: string): Promise<boolean> {
  try {
    const res = await axios.get(`${baseUrl}/health`, { timeout: 3000, validateStatus: () => true });
    const ok = res.status === 200;
    const status = ok ? '✅' : '⚠️ ';
    console.log(`  ${status}  ${name.padEnd(12)}  ${baseUrl}/health  →  HTTP ${res.status}`);
    return ok;
  } catch {
    console.log(`  ❌  ${name.padEnd(12)}  ${baseUrl}/health  →  UNREACHABLE`);
    return false;
  }
}

async function main() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  🏥  T&S CRM — SERVICE HEALTH CHECK');
  console.log('════════════════════════════════════════════════════════\n');

  const results = await Promise.all(
    Object.entries(SERVICES).map(([name, url]) => check(name, url))
  );

  const passed = results.filter(Boolean).length;
  const total  = results.length;

  console.log('\n────────────────────────────────────────────────────────');
  if (passed === total) {
    console.log(`  ✅  All ${total}/${total} services are UP and healthy.\n`);
  } else {
    console.log(`  ❌  ${passed}/${total} services reachable. Check Docker Compose is running:\n`);
    console.log('       docker compose up -d\n');
  }
  console.log('════════════════════════════════════════════════════════\n');

  process.exit(passed === total ? 0 : 1);
}

main();

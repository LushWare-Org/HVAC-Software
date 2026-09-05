/**
 * seed-orrix-demo-phase2.mjs — follow-up to seed-orrix-demo.mjs:
 *   - backfills serviceLatitude/serviceLongitude (random Sri Lankan spots
 *     around Colombo) on every job from the phase-1 manifest, so they show
 *     up on the Dispatch/Day Planner maps
 *   - adds a second technician near Kaduwela, Sri Lanka
 *
 * Extends (not replaces) scripts/seed-orrix-demo.manifest.json — unseed-orrix-demo.mjs
 * already knows to clean up the added technician2 + jobs are removed as part of
 * the same job-id list either way (lat/lng backfill needs no separate undo).
 *
 * Run: node scripts/seed-orrix-demo-phase2.mjs   (needs crm/job/scheduling-service running)
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import pg from 'pg';

const CRM = 'http://localhost:3001';
const SCHED = 'http://localhost:3003';
const ORRIX_ID = '77e13f25-3e1f-4920-a21f-933642d82a50';
const DEMO_PASSWORD = 'Orrix@Demo2026';
// Kaduwela, Sri Lanka
const KADUWELA = { lat: 6.9344, lng: 79.9833 };
// Gampaha, Sri Lanka — inland (~15km from the coast in every direction), so a
// jitter here stays on land. Colombo itself is coastal on its west side;
// jittering around the Colombo city center previously put some points in the sea.
const JOB_AREA_CENTER = { lat: 7.0917, lng: 79.9997 };

const MANIFEST_PATH = new URL('./seed-orrix-demo.manifest.json', import.meta.url);

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'x-test-company-id': ORRIX_ID, 'x-test-user-role': 'company_admin' };
}
async function post(base, path, headers, body) {
  const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

/** Random point within ~±0.05deg (~5-6km) of Gampaha center — stays on land. */
function randomJobSpot() {
  const jitter = () => (Math.random() - 0.5) * 0.1;
  return { lat: +(JOB_AREA_CENTER.lat + jitter()).toFixed(6), lng: +(JOB_AREA_CENTER.lng + jitter()).toFixed(6) };
}

async function connect(schema) {
  const src = readFileSync(new URL('./apply-migrations.mjs', import.meta.url), 'utf8');
  const BASE_URL = src.match(/const BASE_URL = '([^']+)'/)[1];
  const client = new pg.Client({ connectionString: `${BASE_URL}?schema=${schema}`, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function setKnownPassword(companyUserId) {
  const bcryptModule = await import('../apps/crm-service/node_modules/bcrypt/bcrypt.js');
  const bcrypt = bcryptModule.default ?? bcryptModule;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const client = await connect('crm');
  await client.query(`UPDATE "crm"."company_users" SET "passwordHash" = $1, "mustResetPassword" = false WHERE id = $2`, [hash, companyUserId]);
  await client.end();
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) throw new Error('seed-orrix-demo.manifest.json not found — run seed-orrix-demo.mjs first.');
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  console.log('=== 1. Backfilling job GPS (random Gampaha-area spots) ===');
  const jobsClient = await connect('jobs');
  const geocoded = [];
  for (const jobId of manifest.jobs ?? []) {
    const spot = randomJobSpot();
    await jobsClient.query(`UPDATE "jobs"."jobs" SET "serviceLatitude" = $1, "serviceLongitude" = $2 WHERE id = $3`, [spot.lat, spot.lng, jobId]);
    geocoded.push({ jobId, ...spot });
    console.log(`  ✓ ${jobId} -> ${spot.lat}, ${spot.lng}`);
  }
  await jobsClient.end();

  console.log('=== 2. Second technician — near Kaduwela ===');
  const techRes = await post(CRM, '/auth/provision-technician', adminHeaders(), {
    name: 'Kasun Fernando', email: 'kasunfernando.demo@gmail.com',
    skills: ['HVAC', 'Refrigeration'],
    latitude: KADUWELA.lat, longitude: KADUWELA.lng, maxDailyJobs: 6,
  });
  await setKnownPassword(techRes.userId);
  const schedTechRes = await post(SCHED, '/technicians', adminHeaders(), {
    userId: techRes.userId4Scheduling, name: 'Kasun Fernando',
    skills: ['HVAC', 'Refrigeration'], maxDailyJobs: 6,
    latitude: KADUWELA.lat, longitude: KADUWELA.lng,
  });
  console.log(`  ✓ Kasun Fernando -> companyUserId=${techRes.userId}, schedulingId=${schedTechRes.id}, GPS set to Kaduwela`);

  manifest.jobGeoBackfill = geocoded;
  manifest.technician2 = {
    email: 'kasunfernando.demo@gmail.com', companyUserId: techRes.userId,
    schedulingTechnicianId: schedTechRes.id, userId4Scheduling: techRes.userId4Scheduling,
  };
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log('\n=== DONE — manifest updated ===');
  console.log(`Second technician login: kasunfernando.demo@gmail.com / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error('\nPHASE 2 SEED FAILED:', err.message);
  process.exit(1);
});

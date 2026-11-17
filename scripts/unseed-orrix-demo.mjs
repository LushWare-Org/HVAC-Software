/**
 * unseed-orrix-demo.mjs — precisely removes everything created by
 * seed-orrix-demo.mjs, reading the exact ids from its manifest file.
 * Safe to run any time after seeding; does nothing outside what's listed.
 *
 * Run: node scripts/unseed-orrix-demo.mjs
 */
import { readFileSync, existsSync, unlinkSync } from 'fs';
import pg from 'pg';

const MANIFEST_PATH = new URL('./seed-orrix-demo.manifest.json', import.meta.url);

async function connect(schema) {
  const src = readFileSync(new URL('./apply-migrations.mjs', import.meta.url), 'utf8');
  const BASE_URL = src.match(/const BASE_URL = '([^']+)'/)[1];
  const client = new pg.Client({ connectionString: `${BASE_URL}?schema=${schema}`, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.log('No seed-orrix-demo.manifest.json found — nothing to undo.');
    return;
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  console.log('=== Removing jobs (job-service) ===');
  if (manifest.jobs?.length) {
    const jobsClient = await connect('jobs');
    const r = await jobsClient.query(`DELETE FROM "jobs"."jobs" WHERE id = ANY($1)`, [manifest.jobs]);
    console.log(`  ✓ deleted ${r.rowCount} jobs`);
    await jobsClient.end();
  }

  console.log('=== Removing scheduling technician(s) (scheduling-service) ===');
  const technicianIds = [
    manifest.technician?.schedulingTechnicianId,
    manifest.technician2?.schedulingTechnicianId, // added by seed-orrix-demo-phase2.mjs, may not exist
  ].filter(Boolean);
  if (technicianIds.length) {
    const schedClient = await connect('scheduling');
    const r = await schedClient.query(`DELETE FROM "scheduling"."technicians" WHERE id = ANY($1)`, [technicianIds]);
    console.log(`  ✓ deleted ${r.rowCount} technician row(s)`);
    await schedClient.end();
  }

  console.log('=== Removing crm-service rows (issues, equipment, houses, project, leads, customers, company_users) ===');
  const crmClient = await connect('crm');
  try {
    await crmClient.query('BEGIN');

    const issueIds = manifest.houses?.flatMap(h => h.issueReportId ? [h.issueReportId] : []) ?? [];
    if (issueIds.length) {
      const r = await crmClient.query(`DELETE FROM "crm"."house_issue_reports" WHERE id = ANY($1)`, [issueIds]);
      console.log(`  ✓ deleted ${r.rowCount} issue reports`);
    }

    const equipmentIds = manifest.houses?.flatMap(h => h.equipmentIds ?? []) ?? [];
    if (equipmentIds.length) {
      const r = await crmClient.query(`DELETE FROM "crm"."equipment" WHERE id = ANY($1)`, [equipmentIds]);
      console.log(`  ✓ deleted ${r.rowCount} equipment rows`);
    }

    const houseIds = manifest.houses?.map(h => h.id) ?? [];
    if (houseIds.length) {
      const r = await crmClient.query(`DELETE FROM "crm"."houses" WHERE id = ANY($1)`, [houseIds]);
      console.log(`  ✓ deleted ${r.rowCount} houses`);
    }

    if (manifest.project?.id) {
      const r = await crmClient.query(`DELETE FROM "crm"."projects" WHERE id = $1`, [manifest.project.id]);
      console.log(`  ✓ deleted ${r.rowCount} project ("${manifest.project.name}")`);
    }

    const leadIds = manifest.customers?.map(c => c.leadId).filter(Boolean) ?? [];
    if (leadIds.length) {
      const r = await crmClient.query(`DELETE FROM "crm"."leads" WHERE id = ANY($1)`, [leadIds]);
      console.log(`  ✓ deleted ${r.rowCount} leads`);
    }

    const customerIds = manifest.customers?.map(c => c.customerId) ?? [];
    if (customerIds.length) {
      const r = await crmClient.query(`DELETE FROM "crm"."customers" WHERE id = ANY($1)`, [customerIds]);
      console.log(`  ✓ deleted ${r.rowCount} customers`);
    }

    const companyUserIds = [
      ...(manifest.customers?.map(c => c.companyUserId) ?? []),
      ...(manifest.technician?.companyUserId ? [manifest.technician.companyUserId] : []),
      ...(manifest.technician2?.companyUserId ? [manifest.technician2.companyUserId] : []),
    ];
    if (companyUserIds.length) {
      const r = await crmClient.query(`DELETE FROM "crm"."company_users" WHERE id = ANY($1)`, [companyUserIds]);
      console.log(`  ✓ deleted ${r.rowCount} company_users`);
    }

    await crmClient.query('COMMIT');
  } catch (err) {
    await crmClient.query('ROLLBACK');
    throw err;
  } finally {
    await crmClient.end();
  }

  unlinkSync(MANIFEST_PATH);
  console.log('\n=== DONE — all seeded Orrix demo data removed, manifest deleted ===');
}

main().catch((err) => {
  console.error('\nUNSEED FAILED:', err.message);
  console.error('Manifest left in place — fix the issue and re-run.');
  process.exit(1);
});

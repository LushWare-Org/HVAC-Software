/**
 * seed-orrix-demo.mjs — demo data for Orrix Engineering (tomorrow's demo).
 *
 * Creates (via the real local APIs — crm-service:3001, job-service:3002,
 * scheduling-service:3003 — so all business logic/validations apply):
 *   - 2 customer portal accounts (pasinduravishan88@gmail.com, pasinduravishan.22@cse.mrt.ac.lk)
 *   - 1 technician (nisalkalhara10@gmail.com), GPS set to Colombo
 *   - 1 Housing Scheme project, client = existing customer pravishan88@gmail.com
 *   - 2 houses in that project, owned by the two new customers, each with equipment
 *   - 1 open issue report (demo "alert" scenario)
 *   - Housing-scheme service jobs + standalone dispatch jobs (some unassigned) +
 *     a Day Planner "pull forward" scenario: technician has a 9-10am / 2-3pm
 *     booking 3 days out (gap in between) plus a separate unassigned job that
 *     day, positioned as the pull-forward candidate.
 *
 * Every created row's id is written to seed-orrix-demo.manifest.json so
 * `unseed-orrix-demo.mjs` can remove exactly this data, precisely, on command.
 *
 * Run: node scripts/seed-orrix-demo.mjs   (needs crm/job/scheduling-service running locally)
 */
import { writeFileSync } from 'fs';
import pg from 'pg';
import { readFileSync } from 'fs';

const CRM = 'http://localhost:3001';
const JOBS = 'http://localhost:3002';
const SCHED = 'http://localhost:3003';
const ORRIX_ID = '77e13f25-3e1f-4920-a21f-933642d82a50';
const PRAVISHAN_CUSTOMER_ID = '20d26dad-e1d0-48ef-9bd2-5ed591438788'; // existing, pravishan88@gmail.com
const DEMO_PASSWORD = 'Orrix@Demo2026';
const COLOMBO = { lat: 6.9271, lng: 79.8612 };

const manifest = {
  seededAt: new Date().toISOString(),
  companyId: ORRIX_ID,
  demoPassword: DEMO_PASSWORD,
  customers: [],
  technician: null,
  project: null,
  houses: [],
  jobs: [],
};

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-test-company-id': ORRIX_ID,
    'x-test-user-role': 'company_admin',
  };
}
function customerHeaders(customerId) {
  return {
    'Content-Type': 'application/json',
    'x-test-company-id': ORRIX_ID,
    'x-test-user-role': 'customer',
    'x-test-customer-id': customerId,
  };
}

async function post(base, path, headers, body) {
  const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}
async function patch(base, path, headers, body) {
  const res = await fetch(`${base}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function daysFromNow(n, hh = 9, mm = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

async function setKnownPassword(companyUserId) {
  const src = readFileSync(new URL('./apply-migrations.mjs', import.meta.url), 'utf8');
  const BASE_URL = src.match(/const BASE_URL = '([^']+)'/)[1];
  const client = new pg.Client({ connectionString: `${BASE_URL}?schema=crm`, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const bcryptModule = await import('../apps/crm-service/node_modules/bcrypt/bcrypt.js');
  const bcrypt = bcryptModule.default ?? bcryptModule;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await client.query(
    `UPDATE "crm"."company_users" SET "passwordHash" = $1, "mustResetPassword" = false WHERE id = $2`,
    [hash, companyUserId],
  );
  await client.end();
}

async function main() {
  console.log('=== 1. Provisioning customer accounts ===');
  const customerDefs = [
    { email: 'pasinduravishan88@gmail.com', firstName: 'Pasindu', lastName: 'Ravishan' },
    { email: 'pasinduravishan.22@cse.mrt.ac.lk', firstName: 'Pasindu', lastName: 'Perera' },
  ];
  for (const def of customerDefs) {
    const res = await post(CRM, '/auth/provision-lead', adminHeaders(), {
      firstName: def.firstName, lastName: def.lastName, email: def.email,
      source: 'demo-seed',
    });
    await setKnownPassword(res.userId);
    manifest.customers.push({
      email: def.email, name: `${def.firstName} ${def.lastName}`,
      customerId: res.customerId, companyUserId: res.userId, leadId: res.leadId,
    });
    console.log(`  ✓ ${def.email} -> customerId=${res.customerId}`);
  }

  console.log('=== 2. Provisioning technician ===');
  const techRes = await post(CRM, '/auth/provision-technician', adminHeaders(), {
    name: 'Nisal Kalhara', email: 'nisalkalhara10@gmail.com',
    skills: ['HVAC', 'Electrical', 'Plumbing'],
    latitude: COLOMBO.lat, longitude: COLOMBO.lng, maxDailyJobs: 6,
  });
  await setKnownPassword(techRes.userId);
  const schedTechRes = await post(SCHED, '/technicians', adminHeaders(), {
    userId: techRes.userId4Scheduling, name: 'Nisal Kalhara',
    skills: ['HVAC', 'Electrical', 'Plumbing'], maxDailyJobs: 6,
    latitude: COLOMBO.lat, longitude: COLOMBO.lng,
  });
  manifest.technician = {
    email: 'nisalkalhara10@gmail.com', companyUserId: techRes.userId,
    schedulingTechnicianId: schedTechRes.id, userId4Scheduling: techRes.userId4Scheduling,
  };
  console.log(`  ✓ Nisal Kalhara -> companyUserId=${techRes.userId}, schedulingId=${schedTechRes.id}, GPS set to Colombo`);

  console.log('=== 3. Housing Scheme project ===');
  const project = await post(CRM, '/projects', adminHeaders(), {
    customerId: PRAVISHAN_CUSTOMER_ID,
    name: 'Cinnamon Gardens Villas',
    category: 'Residential HVAC retrofit',
    templateType: 'HOUSING_SCHEME',
    status: 'ACTIVE',
    description: 'Housing scheme demo project — multi-house HVAC service & monitoring.',
    siteAddress: 'Cinnamon Gardens, Colombo 07, Sri Lanka',
    latitude: COLOMBO.lat, longitude: COLOMBO.lng,
    workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    baseTeamUserIds: [manifest.technician.userId4Scheduling],
  });
  manifest.project = { id: project.id, name: project.name };
  console.log(`  ✓ Project "${project.name}" -> ${project.id}`);

  console.log('=== 4. Houses + owners + equipment ===');
  const houseDefs = [
    { label: 'Villa 12', address: 'No. 12, Horton Place, Colombo 07', owner: manifest.customers[0] },
    { label: 'Villa 14', address: 'No. 14, Horton Place, Colombo 07', owner: manifest.customers[1] },
  ];
  for (const hd of houseDefs) {
    const house = await post(CRM, `/projects/${project.id}/houses`, adminHeaders(), {
      label: hd.label, address: hd.address, tags: ['Phase 1'],
    });
    await patch(CRM, `/houses/${house.id}/owner`, adminHeaders(), { customerId: hd.owner.customerId });

    const eq1 = await post(CRM, `/houses/${house.id}/equipment`, adminHeaders(), {
      type: 'Thermostat', brand: 'Honeywell', model: 'T6 Pro', serialNo: `HW-${Math.floor(Math.random() * 90000 + 10000)}`,
      installDate: '2025-11-01',
    });
    const eq2 = await post(CRM, `/houses/${house.id}/equipment`, adminHeaders(), {
      type: 'AC Unit', brand: 'Daikin', model: 'Inverter 18000BTU', serialNo: `DK-${Math.floor(Math.random() * 90000 + 10000)}`,
      installDate: '2025-11-01', warrantyEnd: '2027-11-01',
    });

    manifest.houses.push({ id: house.id, label: hd.label, ownerCustomerId: hd.owner.customerId, equipmentIds: [eq1.id, eq2.id] });
    console.log(`  ✓ ${hd.label} -> owner ${hd.owner.email}, equipment [Thermostat, AC Unit]`);
  }

  console.log('=== 5. Demo issue report (open alert) ===');
  const firstHouse = manifest.houses[0];
  const issue = await post(CRM, `/houses/${firstHouse.id}/issues`, customerHeaders(firstHouse.ownerCustomerId), {
    equipmentId: firstHouse.equipmentIds[0],
    errorCode: 'E5',
    description: 'Thermostat screen shows E5, no heat since this morning.',
  });
  firstHouse.issueReportId = issue.id;
  console.log(`  ✓ Issue report on ${firstHouse.label} -> ${issue.id}`);

  console.log('=== 6. Jobs — housing scheme service visits ===');
  for (const h of manifest.houses) {
    const job = await post(JOBS, '/jobs', adminHeaders(), {
      customerId: h.ownerCustomerId, customerName: manifest.customers.find(c => c.customerId === h.ownerCustomerId)?.name ?? 'Owner',
      serviceAddress: houseDefs.find(hd => hd.label === h.label).address,
      title: `Thermostat check — ${h.label}`,
      description: 'Routine thermostat + AC inspection',
      priority: 'NORMAL',
      projectId: project.id,
      houseId: h.id,
      equipmentId: h.equipmentIds[0],
      scheduledStart: daysFromNow(1, 10, 0),
      assignedToId: manifest.technician.userId4Scheduling,
      assignedToName: 'Nisal Kalhara',
    });
    manifest.jobs.push(job.id);
    console.log(`  ✓ Job "${job.title}" -> ${job.id}`);
  }

  console.log('=== 7. Standalone dispatch jobs (unassigned, smart-assign demo) ===');
  const dispatchDefs = [
    { title: 'AC not cooling — urgent', address: 'No. 45, Duplication Road, Colombo 04', priority: 'HIGH', day: 1, hh: 13 },
    { title: 'Annual HVAC maintenance', address: 'No. 8, Ward Place, Colombo 07', priority: 'NORMAL', day: 2, hh: 9 },
    { title: 'New AC installation quote visit', address: 'No. 23, Flower Road, Colombo 07', priority: 'NORMAL', day: 2, hh: 15 },
  ];
  for (const d of dispatchDefs) {
    const job = await post(JOBS, '/jobs', adminHeaders(), {
      customerId: PRAVISHAN_CUSTOMER_ID, customerName: 'Ravishan',
      serviceAddress: d.address, title: d.title, priority: d.priority,
      scheduledStart: daysFromNow(d.day, d.hh, 0),
    });
    manifest.jobs.push(job.id);
    console.log(`  ✓ (unassigned) "${d.title}" -> ${job.id}`);
  }

  console.log('=== 8. Day Planner "pull forward" scenario (3 days out) ===');
  const gapJob1 = await post(JOBS, '/jobs', adminHeaders(), {
    customerId: PRAVISHAN_CUSTOMER_ID, customerName: 'Ravishan',
    serviceAddress: 'No. 5, Barnes Place, Colombo 07', title: 'Morning filter replacement',
    priority: 'NORMAL', scheduledStart: daysFromNow(3, 9, 0),
    assignedToId: manifest.technician.userId4Scheduling, assignedToName: 'Nisal Kalhara',
  });
  const gapJob2 = await post(JOBS, '/jobs', adminHeaders(), {
    customerId: PRAVISHAN_CUSTOMER_ID, customerName: 'Ravishan',
    serviceAddress: 'No. 19, Independence Avenue, Colombo 07', title: 'Afternoon AC service',
    priority: 'NORMAL', scheduledStart: daysFromNow(3, 14, 0),
    assignedToId: manifest.technician.userId4Scheduling, assignedToName: 'Nisal Kalhara',
  });
  const pullForwardCandidate = await post(JOBS, '/jobs', adminHeaders(), {
    customerId: PRAVISHAN_CUSTOMER_ID, customerName: 'Ravishan',
    serviceAddress: 'No. 11, Rosmead Place, Colombo 07 (5 min from Nisal\'s 9am job)',
    title: 'Thermostat replacement — flexible timing',
    priority: 'NORMAL', scheduledStart: daysFromNow(3, 9, 0), // deliberately unassigned/same-day, nearby, sits in the 10am–2pm gap
  });
  manifest.jobs.push(gapJob1.id, gapJob2.id, pullForwardCandidate.id);
  console.log(`  ✓ Nisal: 9–10am + 2–3pm booked (day+3), gap 10am–2pm`);
  console.log(`  ✓ Unassigned pull-forward candidate nearby, same day -> ${pullForwardCandidate.id}`);

  writeFileSync(new URL('./seed-orrix-demo.manifest.json', import.meta.url), JSON.stringify(manifest, null, 2));
  console.log('\n=== DONE — manifest written to scripts/seed-orrix-demo.manifest.json ===');
  console.log(`\nDemo login password for all seeded accounts: ${DEMO_PASSWORD}`);
  console.log(`Customer logins: ${manifest.customers.map(c => c.email).join(', ')}`);
  console.log(`Technician login: ${manifest.technician.email}`);
}

main().catch((err) => {
  console.error('\nSEED FAILED:', err.message);
  writeFileSync(new URL('./seed-orrix-demo.manifest.json', import.meta.url), JSON.stringify(manifest, null, 2));
  console.error('Partial manifest written — run unseed-orrix-demo.mjs to clean up what succeeded so far.');
  process.exit(1);
});

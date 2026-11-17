/**
 * Seed demo Jobs + recurring ServiceAgreements for the Day Planner / pull-forward
 * demo, all scoped to the T&S Brothers demo company (co-demo-001, Austin TX).
 *
 * All rows created by this script carry a recognizable id prefix
 * (`seed-planner-job-*` / `seed-planner-agr-*`) and the job tag
 * `demo-seed-planner`, so they can be cleanly reverted with the `undo` command.
 *
 * Run from repo root (needs both DB URLs — pooled is fine, these are plain inserts):
 *   export $(grep -E '^JOBS_DATABASE_URL' apps/job-service/.env | tr -d '"')
 *   export $(grep -E '^CRM_DATABASE_URL' apps/crm-service/.env | tr -d '"')
 *   pnpm tsx scripts/seed-demo-planner-data.ts seed
 *   pnpm tsx scripts/seed-demo-planner-data.ts undo
 */
import { PrismaClient as JobPrismaClient } from '../apps/job-service/src/prisma/generated'
import { PrismaClient as CrmPrismaClient } from '../apps/crm-service/src/prisma/generated'

const JOB_ID_PREFIX = 'seed-planner-job-'
const AGREEMENT_ID_PREFIX = 'seed-planner-agr-'
const JOB_TAG = 'demo-seed-planner'

// Business-hours starts in Austin (America/Chicago, CDT = UTC-5 in July)
function austinTime(dateStr: string, hour: number, minute = 0) {
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  return new Date(`${dateStr}T${hh}:${mm}:00-05:00`)
}

// Scattered points around central/north Austin, TX
const AUSTIN_POINTS = [
  { lat: 30.2672, lng: -97.7431 }, // downtown
  { lat: 30.2986, lng: -97.7186 }, // Mueller
  { lat: 30.3078, lng: -97.7551 }, // Allandale
  { lat: 30.2503, lng: -97.7635 }, // Zilker
  { lat: 30.3322, lng: -97.7091 }, // North Loop
  { lat: 30.2211, lng: -97.7929 }, // South Lamar
  { lat: 30.4013, lng: -97.7195 }, // Domain
  { lat: 30.1988, lng: -97.8494 }, // Southwest
]

async function main() {
  const mode = process.argv[2] ?? 'seed'
  if (!['seed', 'undo'].includes(mode)) {
    throw new Error('Usage: pnpm tsx scripts/seed-demo-planner-data.ts [seed|undo]')
  }
  if (!process.env.JOBS_DATABASE_URL) throw new Error('JOBS_DATABASE_URL env var is required')
  if (!process.env.CRM_DATABASE_URL) throw new Error('CRM_DATABASE_URL env var is required')

  const jobsDb = new JobPrismaClient({ datasources: { db: { url: process.env.JOBS_DATABASE_URL } } })
  const crmDb = new CrmPrismaClient({ datasources: { db: { url: process.env.CRM_DATABASE_URL } } })

  if (mode === 'undo') {
    const deletedJobs = await jobsDb.job.deleteMany({ where: { tags: { has: JOB_TAG } } })
    const deletedAgreements = await crmDb.serviceAgreement.deleteMany({
      where: { id: { startsWith: AGREEMENT_ID_PREFIX } },
    })
    console.log(`Removed ${deletedJobs.count} demo planner job(s), ${deletedAgreements.count} demo agreement(s).`)
    await jobsDb.$disconnect()
    await crmDb.$disconnect()
    return
  }

  const company = await crmDb.company.findFirst({
    where: { OR: [{ id: 'co-demo-001' }, { name: { contains: 'T&S Brothers' } }] },
  })
  if (!company) throw new Error('T&S Brothers demo company (co-demo-001) not found')
  console.log(`Company: ${company.name} (${company.id})`)

  const customers = await crmDb.customer.findMany({
    where: { companyId: company.id, isActive: true },
    orderBy: { createdAt: 'asc' },
    take: 8,
  })
  if (customers.length < 8) throw new Error(`Need at least 8 active customers, found ${customers.length}`)

  const technicians = await crmDb.companyUser.findMany({
    where: { companyId: company.id, role: 'technician' },
    orderBy: { createdAt: 'asc' },
    take: 3,
  })
  if (technicians.length < 2) throw new Error(`Need at least 2 technicians, found ${technicians.length}`)

  const admin = await crmDb.companyUser.findFirst({
    where: { companyId: company.id, role: { in: ['super_admin', 'company_admin'] } },
    orderBy: { createdAt: 'asc' },
  })
  if (!admin) throw new Error('No admin/company_admin user found to attribute createdByUserId')

  const [techA, techB, techC] = technicians
  console.log(`Technicians: ${technicians.map(t => t.name).join(', ')}`)
  console.log(`Customers: ${customers.map(c => `${c.firstName} ${c.lastName}`).join(', ')}`)

  type JobSeed = {
    n: string
    customer: (typeof customers)[number]
    point: { lat: number; lng: number }
    start: Date
    durationMins: number
    title: string
    status: 'PENDING' | 'SCHEDULED' | 'EN_ROUTE' | 'ON_SITE'
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'
    assignedTo?: (typeof technicians)[number]
    isAgreementJob?: boolean
    agreementIdRef?: string
  }

  const jobDefs: JobSeed[] = [
    // Jul 14 — mix of assigned/unassigned, one agreement-linked job
    { n: '01', customer: customers[0], point: AUSTIN_POINTS[0], start: austinTime('2026-07-14', 8), durationMins: 90, title: 'AC not cooling — diagnostic', status: 'SCHEDULED', priority: 'HIGH', assignedTo: techA },
    { n: '02', customer: customers[1], point: AUSTIN_POINTS[1], start: austinTime('2026-07-14', 10), durationMins: 60, title: 'Water heater flush', status: 'SCHEDULED', priority: 'NORMAL', assignedTo: techB },
    { n: '03', customer: customers[2], point: AUSTIN_POINTS[2], start: austinTime('2026-07-14', 11, 30), durationMins: 45, title: 'Leaking kitchen faucet', status: 'PENDING', priority: 'NORMAL' }, // unassigned
    { n: '04', customer: customers[3], point: AUSTIN_POINTS[3], start: austinTime('2026-07-14', 13), durationMins: 120, title: 'Quarterly HVAC maintenance visit', status: 'SCHEDULED', priority: 'NORMAL', assignedTo: techC, isAgreementJob: true, agreementIdRef: `${AGREEMENT_ID_PREFIX}already-01` },
    { n: '05', customer: customers[4], point: AUSTIN_POINTS[4], start: austinTime('2026-07-14', 15), durationMins: 60, title: 'Circuit breaker tripping repeatedly', status: 'EN_ROUTE', priority: 'HIGH', assignedTo: techA },

    // Jul 15 — mix of assigned/unassigned, one agreement-linked job
    { n: '06', customer: customers[5], point: AUSTIN_POINTS[5], start: austinTime('2026-07-15', 8, 30), durationMins: 90, title: 'No hot water — troubleshoot', status: 'SCHEDULED', priority: 'HIGH', assignedTo: techB },
    { n: '07', customer: customers[6], point: AUSTIN_POINTS[6], start: austinTime('2026-07-15', 9), durationMins: 60, title: 'Annual filter replacement visit', status: 'SCHEDULED', priority: 'NORMAL', assignedTo: techC, isAgreementJob: true, agreementIdRef: `${AGREEMENT_ID_PREFIX}already-02` },
    { n: '08', customer: customers[7], point: AUSTIN_POINTS[7], start: austinTime('2026-07-15', 11), durationMins: 45, title: 'Ceiling fan installation', status: 'PENDING', priority: 'LOW' }, // unassigned
    { n: '09', customer: customers[0], point: AUSTIN_POINTS[0], start: austinTime('2026-07-15', 13, 30), durationMins: 90, title: 'AC unit second opinion', status: 'SCHEDULED', priority: 'NORMAL', assignedTo: techA },
    { n: '10', customer: customers[1], point: AUSTIN_POINTS[1], start: austinTime('2026-07-15', 15, 30), durationMins: 60, title: 'Outdoor spigot replacement', status: 'ON_SITE', priority: 'NORMAL', assignedTo: techB },
  ]

  for (const j of jobDefs) {
    const id = `${JOB_ID_PREFIX}${j.n}`
    await jobsDb.job.upsert({
      where: { id },
      update: {},
      create: {
        id,
        companyId: company.id,
        jobNumber: `SEED-PLN-${j.n}`,
        customerId: j.customer.id,
        customerName: `${j.customer.firstName} ${j.customer.lastName}`,
        customerPhone: j.customer.phone,
        customerEmail: j.customer.email,
        serviceAddress: j.customer.address ?? '',
        serviceCity: j.customer.city,
        serviceState: j.customer.state,
        serviceZip: j.customer.zipCode,
        serviceLatitude: j.point.lat,
        serviceLongitude: j.point.lng,
        title: j.title,
        status: j.status,
        priority: j.priority,
        assignedToId: j.assignedTo?.id,
        assignedToName: j.assignedTo?.name,
        scheduledStart: j.start,
        scheduledEnd: new Date(j.start.getTime() + j.durationMins * 60_000),
        estimatedDurationMins: j.durationMins,
        estimatedValue: 150 + Math.round(Math.random() * 350),
        isAgreementJob: j.isAgreementJob ?? false,
        agreementId: j.agreementIdRef,
        tags: [JOB_TAG],
        createdByUserId: admin.id,
      },
    })
    console.log(`Job ${id}: ${j.title} — ${j.start.toISOString()} (${j.status}${j.assignedTo ? ', ' + j.assignedTo.name : ', unassigned'})`)
  }

  // Agreements already "used" by the two agreement-linked jobs above — nextServiceDate
  // pushed out to next cycle so they don't also show as pull-forward opportunities.
  const usedAgreementDefs = [
    { idSuffix: 'already-01', customer: customers[3], serviceType: 'HVAC Maintenance', interval: 'QUARTERLY', next: austinTime('2026-10-14', 9) },
    { idSuffix: 'already-02', customer: customers[6], serviceType: 'Filter Replacement', interval: 'ANNUAL', next: austinTime('2027-07-15', 9) },
  ]

  // Upcoming agreements due Jul 16–19 — land within the 5-day pull-forward window
  // when viewing the Jul 14 or Jul 15 planner day. Reuse customers[3..6]'s existing
  // job coordinates so the opportunity pin can locate them on the map.
  const opportunityAgreementDefs = [
    { idSuffix: '01', customer: customers[2], serviceType: 'Plumbing Inspection', interval: 'BI_ANNUAL', next: austinTime('2026-07-16', 9) },
    { idSuffix: '02', customer: customers[4], serviceType: 'Electrical Safety Check', interval: 'ANNUAL', next: austinTime('2026-07-17', 9) },
    { idSuffix: '03', customer: customers[5], serviceType: 'Water Heater Service', interval: 'ANNUAL', next: austinTime('2026-07-18', 9) },
    { idSuffix: '04', customer: customers[7], serviceType: 'HVAC Maintenance', interval: 'QUARTERLY', next: austinTime('2026-07-19', 9) },
  ]

  for (const a of [...usedAgreementDefs, ...opportunityAgreementDefs]) {
    const id = `${AGREEMENT_ID_PREFIX}${a.idSuffix}`
    await crmDb.serviceAgreement.upsert({
      where: { id },
      update: {},
      create: {
        id,
        companyId: company.id,
        customerId: a.customer.id,
        name: `${a.serviceType} — ${a.customer.firstName} ${a.customer.lastName}`,
        status: 'ACTIVE',
        startDate: austinTime('2026-01-01', 9),
        serviceType: a.serviceType,
        serviceInterval: a.interval,
        nextServiceDate: a.next,
        lastServiceDate: austinTime('2026-04-14', 9),
        autoCreateJobs: true,
        leadDays: 5,
      },
    })
    console.log(`Agreement ${id}: ${a.serviceType} for ${a.customer.firstName} ${a.customer.lastName} — next ${a.next.toISOString()}`)
  }

  console.log('\nDone. To undo: pnpm tsx scripts/seed-demo-planner-data.ts undo')
  await jobsDb.$disconnect()
  await crmDb.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

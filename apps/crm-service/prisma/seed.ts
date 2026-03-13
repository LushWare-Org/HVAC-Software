import { PrismaClient } from '../src/prisma/generated';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPw(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding CRM database...');

  // ── Company ─────────────────────────────────────────────────────────────────
  // ID must match DEV_COMPANY_ID used in frontend and all service seeds
  await prisma.company.updateMany({
    where: { email: 'demo@acmeplumbing.com', NOT: { id: 'co-demo-001' } },
    data: { email: `old-demo-${Date.now()}@acmeplumbing.com` },
  });

  const demoCompany = await prisma.company.upsert({
    where: { id: 'co-demo-001' },
    update: {},
    create: {
      id: 'co-demo-001',
      name: 'T&S Brothers Plumbing & HVAC',
      email: 'info@tsbrothers.com',
      phone: '(555) 100-0001',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'US',
      website: 'https://tsbrothers.com',
    },
  });
  console.log(`✓ Company: ${demoCompany.name} (${demoCompany.id})`);

  // ── Admin Accounts ──────────────────────────────────────────────────────────
  const adminPw = await hashPw('Admin@2024!');
  const managerPw = await hashPw('Manager@2024!');
  const techPw = await hashPw('Tech@2024!');
  const dispatchPw = await hashPw('Dispatch@2024!');

  // Admin 1 — Primary Super Admin
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'admin@tsbrothers.com' } },
    update: { passwordHash: adminPw, name: 'Tom Sanders', role: 'company_admin' },
    create: {
      id: 'user-admin-001',
      companyId: demoCompany.id,
      name: 'Tom Sanders',
      email: 'admin@tsbrothers.com',
      phone: '(555) 100-0010',
      role: 'company_admin',
      passwordHash: adminPw,
    },
  });
  console.log('✓ Admin 1: admin@tsbrothers.com / Admin@2024!');

  // Admin 2 — Second Admin
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'sam@tsbrothers.com' } },
    update: { passwordHash: adminPw, name: 'Sam Brothers', role: 'company_admin' },
    create: {
      id: 'user-admin-002',
      companyId: demoCompany.id,
      name: 'Sam Brothers',
      email: 'sam@tsbrothers.com',
      phone: '(555) 100-0011',
      role: 'company_admin',
      passwordHash: adminPw,
    },
  });
  console.log('✓ Admin 2: sam@tsbrothers.com / Admin@2024!');

  // Admin 3 — Lushware Admin
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'admin@lushware.com' } },
    update: { passwordHash: adminPw, name: 'Lushware Admin', role: 'company_admin' },
    create: {
      id: 'user-admin-003',
      companyId: demoCompany.id,
      name: 'Lushware Admin',
      email: 'admin@lushware.com',
      phone: '(555) 100-0012',
      role: 'company_admin',
      passwordHash: adminPw,
    },
  });
  console.log('✓ Admin 3: admin@lushware.com / Admin@2024!');

  // Office Manager
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'jessica@tsbrothers.com' } },
    update: { passwordHash: managerPw, name: 'Jessica Miller', role: 'office_manager' },
    create: {
      id: 'user-manager-001',
      companyId: demoCompany.id,
      name: 'Jessica Miller',
      email: 'jessica@tsbrothers.com',
      phone: '(555) 100-0020',
      role: 'office_manager',
      passwordHash: managerPw,
    },
  });
  console.log('✓ Office Manager: jessica@tsbrothers.com / Manager@2024!');

  // Dispatcher
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'mike@tsbrothers.com' } },
    update: { passwordHash: dispatchPw, name: 'Mike Johnson', role: 'dispatcher' },
    create: {
      id: 'user-dispatch-001',
      companyId: demoCompany.id,
      name: 'Mike Johnson',
      email: 'mike@tsbrothers.com',
      phone: '(555) 100-0030',
      role: 'dispatcher',
      passwordHash: dispatchPw,
    },
  });
  console.log('✓ Dispatcher: mike@tsbrothers.com / Dispatch@2024!');

  // Technician 1
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'david@tsbrothers.com' } },
    update: { passwordHash: techPw, name: 'David Chen', role: 'technician' },
    create: {
      id: 'user-tech-001',
      companyId: demoCompany.id,
      name: 'David Chen',
      email: 'david@tsbrothers.com',
      phone: '(555) 100-0040',
      role: 'technician',
      passwordHash: techPw,
    },
  });
  console.log('✓ Technician 1: david@tsbrothers.com / Tech@2024!');

  // Technician 2
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'carlos@tsbrothers.com' } },
    update: { passwordHash: techPw, name: 'Carlos Rivera', role: 'technician' },
    create: {
      id: 'user-tech-002',
      companyId: demoCompany.id,
      name: 'Carlos Rivera',
      email: 'carlos@tsbrothers.com',
      phone: '(555) 100-0041',
      role: 'technician',
      passwordHash: techPw,
    },
  });
  console.log('✓ Technician 2: carlos@tsbrothers.com / Tech@2024!');

  // Technician 3
  await prisma.companyUser.upsert({
    where: { companyId_email: { companyId: demoCompany.id, email: 'rachel@tsbrothers.com' } },
    update: { passwordHash: techPw, name: 'Rachel Kim', role: 'technician' },
    create: {
      id: 'user-tech-003',
      companyId: demoCompany.id,
      name: 'Rachel Kim',
      email: 'rachel@tsbrothers.com',
      phone: '(555) 100-0042',
      role: 'technician',
      passwordHash: techPw,
    },
  });
  console.log('✓ Technician 3: rachel@tsbrothers.com / Tech@2024!');

  // ── Demo Customers ──────────────────────────────────────────────────────────
  await prisma.customer.upsert({
    where: { id: 'demo-customer-001' },
    update: {},
    create: {
      id: 'demo-customer-001',
      companyId: demoCompany.id,
      type: 'RESIDENTIAL',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '(555) 200-0001',
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78702',
    },
  });

  await prisma.customer.upsert({
    where: { id: 'demo-customer-002' },
    update: {},
    create: {
      id: 'demo-customer-002',
      companyId: demoCompany.id,
      type: 'COMMERCIAL',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@acmecorp.com',
      phone: '(555) 200-0002',
      address: '789 Business Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78703',
    },
  });

  await prisma.customer.upsert({
    where: { id: 'demo-customer-003' },
    update: {},
    create: {
      id: 'demo-customer-003',
      companyId: demoCompany.id,
      type: 'RESIDENTIAL',
      firstName: 'Robert',
      lastName: 'Davis',
      email: 'robert.davis@gmail.com',
      phone: '(555) 200-0003',
      address: '321 Elm St',
      city: 'Round Rock',
      state: 'TX',
      zipCode: '78664',
    },
  });

  console.log('✓ Demo customers seeded');
  console.log('\nSeeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '../src/prisma/generated';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPw(password: string) {
  return bcrypt.hash(password, 12);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
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
    update: { passwordHash: adminPw, name: 'Tom Sanders', role: 'super_admin' },
    create: {
      id: 'user-admin-001',
      companyId: demoCompany.id,
      name: 'Tom Sanders',
      email: 'admin@tsbrothers.com',
      phone: '(555) 100-0010',
      role: 'super_admin',
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
    update: {
      isActive: true,
      automaticFollowupEnabled: true,
      engagementStatus: 'ACTIVE',
      createdAt: daysAgo(1),
      mobile: '(555) 200-0101',
    },
    create: {
      id: 'demo-customer-001',
      companyId: demoCompany.id,
      type: 'RESIDENTIAL',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '(555) 200-0001',
      mobile: '(555) 200-0101',
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78702',
      isActive: true,
      automaticFollowupEnabled: true,
      engagementStatus: 'ACTIVE',
      createdAt: daysAgo(1),
    },
  });

  await prisma.customer.upsert({
    where: { id: 'demo-customer-002' },
    update: {
      isActive: true,
      automaticFollowupEnabled: true,
      engagementStatus: 'ACTIVE',
      createdAt: daysAgo(2),
      mobile: '(555) 200-0102',
    },
    create: {
      id: 'demo-customer-002',
      companyId: demoCompany.id,
      type: 'COMMERCIAL',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@acmecorp.com',
      phone: '(555) 200-0002',
      mobile: '(555) 200-0102',
      address: '789 Business Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78703',
      isActive: true,
      automaticFollowupEnabled: true,
      engagementStatus: 'ACTIVE',
      createdAt: daysAgo(2),
    },
  });

  await prisma.customer.upsert({
    where: { id: 'demo-customer-003' },
    update: {
      isActive: true,
      automaticFollowupEnabled: false,
      engagementStatus: 'INACTIVE',
      createdAt: daysAgo(3),
      mobile: null,
    },
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
      isActive: true,
      automaticFollowupEnabled: false,
      engagementStatus: 'INACTIVE',
      createdAt: daysAgo(3),
    },
  });

  await seedCustomerSignals(demoCompany.id);
  await seedAdditionalMockCustomers(demoCompany.id);

  console.log('✓ Demo customers and prediction signals seeded');
  console.log('\nSeeding complete.');
}

async function seedCustomerSignals(companyId: string) {
  const agreements = [
    {
      id: 'demo-agreement-001',
      customerId: 'demo-customer-001',
      name: 'Residential comfort plan',
      description: 'Twice-yearly preventive maintenance for a newer residential system.',
      status: 'ACTIVE' as const,
      startDate: daysAgo(320),
      endDate: daysAgo(-45),
      value: '1800.00',
      billingCycle: 'annual',
      autoRenew: true,
      signedAt: daysAgo(320),
      signedByName: 'John Smith',
    },
    {
      id: 'demo-agreement-002',
      customerId: 'demo-customer-002',
      name: 'Commercial priority maintenance',
      description: 'High-value commercial maintenance agreement for multiple rooftop units.',
      status: 'ACTIVE' as const,
      startDate: daysAgo(250),
      endDate: daysAgo(-115),
      value: '7200.00',
      billingCycle: 'annual',
      autoRenew: true,
      signedAt: daysAgo(250),
      signedByName: 'Sarah Williams',
    },
    {
      id: 'demo-agreement-003',
      customerId: 'demo-customer-003',
      name: 'Expired seasonal tune-up plan',
      description: 'Expired plan used to create a churn-prone, inactive customer profile.',
      status: 'EXPIRED' as const,
      startDate: daysAgo(760),
      endDate: daysAgo(395),
      value: '900.00',
      billingCycle: 'annual',
      autoRenew: false,
      signedAt: daysAgo(760),
      signedByName: 'Robert Davis',
    },
  ];

  for (const agreement of agreements) {
    await prisma.serviceAgreement.upsert({
      where: { id: agreement.id },
      update: { ...agreement, companyId },
      create: { ...agreement, companyId },
    });
  }

  const equipment = [
    {
      id: 'demo-equipment-001',
      customerId: 'demo-customer-001',
      type: 'Heat Pump',
      brand: 'Carrier',
      model: 'Infinity 24',
      serialNo: 'HP-DEMO-001',
      installDate: daysAgo(760),
      warrantyEnd: daysAgo(-1065),
      notes: 'Newer residential system with low failure risk.',
    },
    {
      id: 'demo-equipment-002',
      customerId: 'demo-customer-002',
      type: 'Rooftop Unit',
      brand: 'Trane',
      model: 'Voyager 12.5 Ton',
      serialNo: 'RTU-DEMO-002',
      installDate: daysAgo(4100),
      warrantyEnd: daysAgo(450),
      notes: 'Older high-usage commercial unit with repeat issues.',
    },
    {
      id: 'demo-equipment-003',
      customerId: 'demo-customer-003',
      type: 'AC Unit',
      brand: 'Goodman',
      model: 'GSX16',
      serialNo: 'AC-DEMO-003',
      installDate: daysAgo(920),
      warrantyEnd: daysAgo(-900),
      notes: 'Moderate equipment risk, but customer is inactive.',
    },
  ];

  for (const item of equipment) {
    await prisma.equipment.upsert({
      where: { id: item.id },
      update: { ...item, companyId },
      create: { ...item, companyId },
    });
  }

  const bookings = [
    { id: 'demo-booking-001-a', customerId: 'demo-customer-001', serviceType: 'Preventive maintenance', preferredDate: daysAgo(22), status: 'CONVERTED' as const },
    { id: 'demo-booking-001-b', customerId: 'demo-customer-001', serviceType: 'Spring tune-up', preferredDate: daysAgo(145), status: 'CONVERTED' as const },
    { id: 'demo-booking-001-c', customerId: 'demo-customer-001', serviceType: 'Fall tune-up', preferredDate: daysAgo(310), status: 'CONFIRMED' as const },
    { id: 'demo-booking-002-a', customerId: 'demo-customer-002', serviceType: 'Emergency cooling repair', preferredDate: daysAgo(38), status: 'CONVERTED' as const },
    { id: 'demo-booking-002-b', customerId: 'demo-customer-002', serviceType: 'Compressor diagnosis', preferredDate: daysAgo(84), status: 'CONVERTED' as const },
    { id: 'demo-booking-002-c', customerId: 'demo-customer-002', serviceType: 'Quarterly commercial service', preferredDate: daysAgo(172), status: 'CONVERTED' as const },
    { id: 'demo-booking-002-d', customerId: 'demo-customer-002', serviceType: 'Filter and belt replacement', preferredDate: daysAgo(290), status: 'CONFIRMED' as const },
    { id: 'demo-booking-003-a', customerId: 'demo-customer-003', serviceType: 'No-cool diagnostic', preferredDate: daysAgo(260), status: 'CONVERTED' as const },
  ];

  for (const booking of bookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        ...booking,
        companyId,
        guestName: null,
        guestEmail: null,
        guestPhone: null,
        description: `${booking.serviceType} mock history`,
      },
      create: {
        ...booking,
        companyId,
        description: `${booking.serviceType} mock history`,
      },
    });
  }

  const reviews = [
    { id: 'demo-review-001-a', customerId: 'demo-customer-001', rating: 5, comment: 'Technician was on time and system is running quietly.', platform: 'google', isPublished: true, createdAt: daysAgo(20) },
    { id: 'demo-review-001-b', customerId: 'demo-customer-001', rating: 4, comment: 'Good preventive visit and clear explanation.', platform: 'internal', isPublished: true, createdAt: daysAgo(140) },
    { id: 'demo-review-002-a', customerId: 'demo-customer-002', rating: 2, comment: 'Recurring cooling issue returned after repair.', platform: 'internal', isPublished: false, createdAt: daysAgo(35) },
    { id: 'demo-review-002-b', customerId: 'demo-customer-002', rating: 1, comment: 'Production floor was too warm again.', platform: 'internal', isPublished: false, createdAt: daysAgo(80) },
    { id: 'demo-review-002-c', customerId: 'demo-customer-002', rating: 2, comment: 'Need a more permanent solution for the rooftop unit.', platform: 'google', isPublished: true, createdAt: daysAgo(160) },
    { id: 'demo-review-003-a', customerId: 'demo-customer-003', rating: 4, comment: 'Last visit was fine, but customer has not booked again.', platform: 'internal', isPublished: false, createdAt: daysAgo(480) },
  ];

  for (const review of reviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: { ...review, companyId },
      create: { ...review, companyId },
    });
  }
}

async function seedAdditionalMockCustomers(companyId: string) {
  const customers = [
    {
      id: 'demo-customer-010',
      type: 'RESIDENTIAL' as const,
      firstName: 'Nina',
      lastName: 'Patel',
      email: 'nina.patel@example.com',
      phone: '(555) 210-0010',
      mobile: '(555) 210-1010',
      address: '18 Cedar Bend',
      city: 'Austin',
      state: 'TX',
      zipCode: '78704',
      createdDaysAgo: 4,
      engagementStatus: 'ACTIVE' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'ACTIVE' as const, value: '2400.00', name: 'Residential plus maintenance' },
      equipment: { type: 'Heat Pump', brand: 'Lennox', model: 'XP25', ageDays: 1200 },
      bookings: [16, 185],
      ratings: [5, 5],
    },
    {
      id: 'demo-customer-011',
      type: 'COMMERCIAL' as const,
      firstName: 'Marcus',
      lastName: 'Lee',
      email: 'marcus.lee@riverfrontfoods.com',
      phone: '(555) 210-0011',
      mobile: '(555) 210-1011',
      address: '920 Warehouse Row',
      city: 'Austin',
      state: 'TX',
      zipCode: '78744',
      createdDaysAgo: 5,
      engagementStatus: 'ACTIVE' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'ACTIVE' as const, value: '9600.00', name: 'Commercial critical systems plan' },
      equipment: { type: 'Rooftop Unit', brand: 'York', model: 'Predator 15 Ton', ageDays: 4300 },
      bookings: [45, 95, 210, 330],
      ratings: [2, 2, 3],
    },
    {
      id: 'demo-customer-012',
      type: 'RESIDENTIAL' as const,
      firstName: 'Olivia',
      lastName: 'Garcia',
      email: 'olivia.garcia@example.com',
      phone: '(555) 210-0012',
      mobile: null,
      address: '77 Willow Creek Dr',
      city: 'Round Rock',
      state: 'TX',
      zipCode: '78665',
      createdDaysAgo: 6,
      engagementStatus: 'ACTIVE' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'DRAFT' as const, value: '0.00', name: 'Draft seasonal maintenance proposal' },
      equipment: { type: 'AC Unit', brand: 'Rheem', model: 'RA16', ageDays: 650 },
      bookings: [35],
      ratings: [4],
    },
    {
      id: 'demo-customer-013',
      type: 'COMMERCIAL' as const,
      firstName: 'Priya',
      lastName: 'Shah',
      email: 'priya.shah@northstarclinic.com',
      phone: '(555) 210-0013',
      mobile: '(555) 210-1013',
      address: '310 Medical Plaza',
      city: 'Austin',
      state: 'TX',
      zipCode: '78731',
      createdDaysAgo: 7,
      engagementStatus: 'JOB_BOOKED' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'ACTIVE' as const, value: '5400.00', name: 'Clinic HVAC compliance plan' },
      equipment: { type: 'Air Handler', brand: 'Daikin', model: 'Rebel', ageDays: 2500 },
      bookings: [8, 130, 260],
      ratings: [5, 4],
    },
    {
      id: 'demo-customer-014',
      type: 'RESIDENTIAL' as const,
      firstName: 'Ethan',
      lastName: 'Brooks',
      email: 'ethan.brooks@example.com',
      phone: '(555) 210-0014',
      mobile: '(555) 210-1014',
      address: '502 Pecan Hollow',
      city: 'Georgetown',
      state: 'TX',
      zipCode: '78628',
      createdDaysAgo: 8,
      engagementStatus: 'INACTIVE' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'EXPIRED' as const, value: '1200.00', name: 'Expired home tune-up plan' },
      equipment: { type: 'Furnace', brand: 'Bryant', model: 'Legacy', ageDays: 3400 },
      bookings: [230],
      ratings: [3],
    },
    {
      id: 'demo-customer-015',
      type: 'COMMERCIAL' as const,
      firstName: 'Camila',
      lastName: 'Torres',
      email: 'camila.torres@hotelverde.com',
      phone: '(555) 210-0015',
      mobile: '(555) 210-1015',
      address: '45 Lakeview Hotel Way',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      createdDaysAgo: 9,
      engagementStatus: 'ACTIVE' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'ACTIVE' as const, value: '15000.00', name: 'Hotel multi-system maintenance' },
      equipment: { type: 'Chiller', brand: 'Carrier', model: 'AquaSnap', ageDays: 5200 },
      bookings: [18, 54, 118, 190, 310],
      ratings: [1, 2, 2, 4],
    },
    {
      id: 'demo-customer-016',
      type: 'RESIDENTIAL' as const,
      firstName: 'Noah',
      lastName: 'Kim',
      email: 'noah.kim@example.com',
      phone: '(555) 210-0016',
      mobile: null,
      address: '8 Magnolia Ct',
      city: 'Cedar Park',
      state: 'TX',
      zipCode: '78613',
      createdDaysAgo: 10,
      engagementStatus: 'QUOTE_SENT' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'SENT' as const, value: '2100.00', name: 'Sent maintenance agreement' },
      equipment: { type: 'Mini Split', brand: 'Mitsubishi', model: 'MSZ-FS', ageDays: 450 },
      bookings: [74],
      ratings: [5],
    },
    {
      id: 'demo-customer-017',
      type: 'COMMERCIAL' as const,
      firstName: 'Grace',
      lastName: 'Morgan',
      email: 'grace.morgan@oakridgeoffice.com',
      phone: '(555) 210-0017',
      mobile: '(555) 210-1017',
      address: '612 Office Park Loop',
      city: 'Austin',
      state: 'TX',
      zipCode: '78759',
      createdDaysAgo: 11,
      engagementStatus: 'ACTIVE' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'ACTIVE' as const, value: '4800.00', name: 'Office park maintenance plan' },
      equipment: { type: 'Split System', brand: 'Goodman', model: 'GSXC18', ageDays: 1800 },
      bookings: [28, 220],
      ratings: [4, 3],
    },
    {
      id: 'demo-customer-018',
      type: 'RESIDENTIAL' as const,
      firstName: 'Liam',
      lastName: 'Anderson',
      email: 'liam.anderson@example.com',
      phone: '(555) 210-0018',
      mobile: '(555) 210-1018',
      address: '1440 Hill Country Rd',
      city: 'Dripping Springs',
      state: 'TX',
      zipCode: '78620',
      createdDaysAgo: 12,
      engagementStatus: 'ACTIVE' as const,
      automaticFollowupEnabled: false,
      agreement: { status: 'ACTIVE' as const, value: '3000.00', name: 'Premium residential agreement' },
      equipment: { type: 'AC Unit', brand: 'American Standard', model: 'Platinum 20', ageDays: 2900 },
      bookings: [105, 240],
      ratings: [2, 5],
    },
    {
      id: 'demo-customer-019',
      type: 'COMMERCIAL' as const,
      firstName: 'Hannah',
      lastName: 'Nguyen',
      email: 'hannah.nguyen@capitolretail.com',
      phone: '(555) 210-0019',
      mobile: null,
      address: '233 Market Center',
      city: 'Austin',
      state: 'TX',
      zipCode: '78745',
      createdDaysAgo: 13,
      engagementStatus: 'INACTIVE' as const,
      automaticFollowupEnabled: true,
      agreement: { status: 'CANCELLED' as const, value: '6600.00', name: 'Cancelled retail maintenance plan' },
      equipment: { type: 'Rooftop Unit', brand: 'Lennox', model: 'Landmark', ageDays: 3900 },
      bookings: [280],
      ratings: [1],
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {
        type: customer.type,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        isActive: true,
        engagementStatus: customer.engagementStatus,
        automaticFollowupEnabled: customer.automaticFollowupEnabled,
        createdAt: daysAgo(customer.createdDaysAgo),
      },
      create: {
        id: customer.id,
        companyId,
        type: customer.type,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        isActive: true,
        engagementStatus: customer.engagementStatus,
        automaticFollowupEnabled: customer.automaticFollowupEnabled,
        createdAt: daysAgo(customer.createdDaysAgo),
      },
    });

    await prisma.serviceAgreement.upsert({
      where: { id: `${customer.id}-agreement` },
      update: {
        companyId,
        customerId: customer.id,
        name: customer.agreement.name,
        status: customer.agreement.status,
        startDate: daysAgo(380),
        endDate: customer.agreement.status === 'ACTIVE' ? daysAgo(-120) : daysAgo(45),
        value: customer.agreement.value,
        billingCycle: 'annual',
        autoRenew: customer.agreement.status === 'ACTIVE',
        signedAt: daysAgo(380),
        signedByName: `${customer.firstName} ${customer.lastName}`,
      },
      create: {
        id: `${customer.id}-agreement`,
        companyId,
        customerId: customer.id,
        name: customer.agreement.name,
        status: customer.agreement.status,
        startDate: daysAgo(380),
        endDate: customer.agreement.status === 'ACTIVE' ? daysAgo(-120) : daysAgo(45),
        value: customer.agreement.value,
        billingCycle: 'annual',
        autoRenew: customer.agreement.status === 'ACTIVE',
        signedAt: daysAgo(380),
        signedByName: `${customer.firstName} ${customer.lastName}`,
      },
    });

    await prisma.equipment.upsert({
      where: { id: `${customer.id}-equipment` },
      update: {
        companyId,
        customerId: customer.id,
        type: customer.equipment.type,
        brand: customer.equipment.brand,
        model: customer.equipment.model,
        serialNo: `${customer.id.toUpperCase()}-EQ`,
        installDate: daysAgo(customer.equipment.ageDays),
        warrantyEnd: daysAgo(customer.equipment.ageDays - 3650),
      },
      create: {
        id: `${customer.id}-equipment`,
        companyId,
        customerId: customer.id,
        type: customer.equipment.type,
        brand: customer.equipment.brand,
        model: customer.equipment.model,
        serialNo: `${customer.id.toUpperCase()}-EQ`,
        installDate: daysAgo(customer.equipment.ageDays),
        warrantyEnd: daysAgo(customer.equipment.ageDays - 3650),
      },
    });

    for (const [index, bookingAge] of customer.bookings.entries()) {
      await prisma.booking.upsert({
        where: { id: `${customer.id}-booking-${index + 1}` },
        update: {
          companyId,
          customerId: customer.id,
          serviceType: index === 0 ? 'Diagnostic service' : 'Preventive maintenance',
          description: 'Generated mock booking history',
          preferredDate: daysAgo(bookingAge),
          status: 'CONVERTED',
        },
        create: {
          id: `${customer.id}-booking-${index + 1}`,
          companyId,
          customerId: customer.id,
          serviceType: index === 0 ? 'Diagnostic service' : 'Preventive maintenance',
          description: 'Generated mock booking history',
          preferredDate: daysAgo(bookingAge),
          status: 'CONVERTED',
        },
      });
    }

    for (const [index, rating] of customer.ratings.entries()) {
      await prisma.review.upsert({
        where: { id: `${customer.id}-review-${index + 1}` },
        update: {
          companyId,
          customerId: customer.id,
          rating,
          comment: rating <= 2 ? 'Customer reported recurring comfort issues.' : 'Customer reported a good service experience.',
          platform: index % 2 === 0 ? 'internal' : 'google',
          isPublished: rating >= 4,
          createdAt: daysAgo(20 + (index * 45)),
        },
        create: {
          id: `${customer.id}-review-${index + 1}`,
          companyId,
          customerId: customer.id,
          rating,
          comment: rating <= 2 ? 'Customer reported recurring comfort issues.' : 'Customer reported a good service experience.',
          platform: index % 2 === 0 ? 'internal' : 'google',
          isPublished: rating >= 4,
          createdAt: daysAgo(20 + (index * 45)),
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

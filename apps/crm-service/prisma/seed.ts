import { PrismaClient } from '../src/prisma/generated';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CRM database...');

  // Seed a demo company (tenant)
  // IMPORTANT: ID must match TEST_COMPANY_ID used in flow tests ('co-demo-001')
  // If an old seed created a company with this email but a random UUID, rename its email
  // to free the unique constraint — we cannot delete it because FK'd customers may reference it.
  await prisma.company.updateMany({
    where: { email: 'demo@acmeplumbing.com', NOT: { id: 'co-demo-001' } },
    data: { email: `old-demo-${Date.now()}@acmeplumbing.com` },
  });

  const demoCompany = await prisma.company.upsert({
    where: { id: 'co-demo-001' },
    update: {},
    create: {
      id: 'co-demo-001',
      name: 'Acme Plumbing & HVAC',
      email: 'demo@acmeplumbing.com',
      phone: '555-0100',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'US',
    },
  });
  console.log(`Company created: ${demoCompany.name} (${demoCompany.id})`);

  // Seed demo customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'demo-customer-001' },
    update: {},
    create: {
      id: 'demo-customer-001',
      companyId: demoCompany.id,
      type: 'RESIDENTIAL',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-0101',
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zipCode: '78702',
    },
  });
  console.log(`Customer created: ${customer1.firstName} ${customer1.lastName}`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

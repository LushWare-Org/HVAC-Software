"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generated_1 = require("../src/prisma/generated");
const prisma = new generated_1.PrismaClient();
async function main() {
    console.log('Seeding CRM database...');
    // Seed a demo company (tenant)
    const demoCompany = await prisma.company.upsert({
        where: { email: 'demo@acmeplumbing.com' },
        update: {},
        create: {
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
//# sourceMappingURL=seed.js.map
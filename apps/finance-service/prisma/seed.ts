/**
 * Finance Service — Seed Script
 * Creates demo quotes and invoices for local development / testing.
 *
 * Run with:  npx prisma db seed
 */

import { PrismaClient, QuoteStatus, InvoiceStatus } from '../src/prisma/generated';

const prisma = new PrismaClient();

const DEMO_COMPANY_ID = 'demo-company-id';
const DEMO_CUSTOMER_ID = 'demo-customer-id';
const DEMO_USER_ID = 'demo-user-id';

async function main() {
  console.log('🌱  Seeding finance schema…');

  // ---- 1. Draft Quote --------------------------------------------------------
  const draftQuote = await prisma.quote.upsert({
    where: { companyId_quoteNumber: { companyId: DEMO_COMPANY_ID, quoteNumber: 'QUOTE-2024-0001' } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      quoteNumber: 'QUOTE-2024-0001',
      customerId: DEMO_CUSTOMER_ID,
      customerName: 'Acme HVAC Corp',
      customerEmail: 'billing@acme-hvac.example.com',
      title: 'Annual HVAC Maintenance Package',
      description: 'Includes 2 preventive maintenance visits + priority dispatch',
      status: QuoteStatus.DRAFT,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      subtotal: 1200.00,
      taxRate: 0.0825,
      taxAmount: 99.00,
      total: 1299.00,
      createdByUserId: DEMO_USER_ID,
      lineItems: {
        create: [
          {
            description: 'Spring AC tune-up & coil cleaning',
            category: 'LABOUR',
            quantity: 1,
            unitPrice: 350.00,
            lineTotal: 350.00,
            taxable: true,
            sortOrder: 1,
          },
          {
            description: 'Fall furnace inspection & filter replacement',
            category: 'LABOUR',
            quantity: 1,
            unitPrice: 350.00,
            lineTotal: 350.00,
            taxable: true,
            sortOrder: 2,
          },
          {
            description: '16x20x1 MERV-13 air filters (6-pack)',
            category: 'PARTS',
            quantity: 2,
            unitPrice: 45.00,
            lineTotal: 90.00,
            taxable: true,
            sortOrder: 3,
          },
          {
            description: 'Refrigerant top-up (if required, up to 1 lb)',
            category: 'MATERIALS',
            quantity: 1,
            unitPrice: 410.00,
            lineTotal: 410.00,
            taxable: true,
            sortOrder: 4,
          },
        ],
      },
    },
    include: { lineItems: true },
  });
  console.log(`  ✅  Quote  ${draftQuote.quoteNumber}`);

  // ---- 2. Accepted Quote → Paid Invoice ---------------------------------------
  const sentQuote = await prisma.quote.upsert({
    where: { companyId_quoteNumber: { companyId: DEMO_COMPANY_ID, quoteNumber: 'QUOTE-2024-0002' } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      quoteNumber: 'QUOTE-2024-0002',
      customerId: DEMO_CUSTOMER_ID,
      customerName: 'Acme HVAC Corp',
      customerEmail: 'billing@acme-hvac.example.com',
      title: 'Emergency Boiler Repair',
      status: QuoteStatus.ACCEPTED,
      approvedAt: new Date(),
      approvedByName: 'John Smith',
      approvedByEmail: 'billing@acme-hvac.example.com',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subtotal: 875.00,
      taxRate: 0.0825,
      taxAmount: 72.19,
      total: 947.19,
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      viewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdByUserId: DEMO_USER_ID,
      lineItems: {
        create: [
          {
            description: 'Emergency call-out fee',
            category: 'LABOUR',
            quantity: 1,
            unitPrice: 150.00,
            lineTotal: 150.00,
            taxable: true,
            sortOrder: 1,
          },
          {
            description: 'Boiler pressure relief valve replacement',
            category: 'PARTS',
            quantity: 1,
            unitPrice: 225.00,
            lineTotal: 225.00,
            taxable: true,
            sortOrder: 2,
          },
          {
            description: 'Labour — boiler repair (3.5 hrs @ $140/hr)',
            category: 'LABOUR',
            quantity: 3.5,
            unitPrice: 140.00,
            lineTotal: 490.00,
            taxable: true,
            sortOrder: 3,
          },
          {
            description: 'Travel allowance',
            category: 'TRAVEL',
            quantity: 1,
            unitPrice: 10.00,
            lineTotal: 10.00,
            taxable: false,
            sortOrder: 4,
          },
        ],
      },
    },
    include: { lineItems: true },
  });

  // Corresponding paid invoice
  const paidInvoice = await prisma.invoice.upsert({
    where: { companyId_invoiceNumber: { companyId: DEMO_COMPANY_ID, invoiceNumber: 'INV-2024-0001' } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      invoiceNumber: 'INV-2024-0001',
      quoteId: sentQuote.id,
      customerId: DEMO_CUSTOMER_ID,
      customerName: 'Acme HVAC Corp',
      customerEmail: 'billing@acme-hvac.example.com',
      status: InvoiceStatus.PAID,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 875.00,
      taxRate: 0.0825,
      taxAmount: 72.19,
      total: 947.19,
      amountPaid: 947.19,
      balanceDue: 0,
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      paidAt: new Date(),
      createdByUserId: DEMO_USER_ID,
      lineItems: {
        create: [
          {
            description: 'Emergency call-out fee',
            category: 'LABOUR',
            quantity: 1,
            unitPrice: 150.00,
            lineTotal: 150.00,
            taxable: true,
            sortOrder: 1,
          },
          {
            description: 'Boiler pressure relief valve replacement',
            category: 'PARTS',
            quantity: 1,
            unitPrice: 225.00,
            lineTotal: 225.00,
            taxable: true,
            sortOrder: 2,
          },
          {
            description: 'Labour — boiler repair (3.5 hrs @ $140/hr)',
            category: 'LABOUR',
            quantity: 3.5,
            unitPrice: 140.00,
            lineTotal: 490.00,
            taxable: true,
            sortOrder: 3,
          },
          {
            description: 'Travel allowance',
            category: 'TRAVEL',
            quantity: 1,
            unitPrice: 10.00,
            lineTotal: 10.00,
            taxable: false,
            sortOrder: 4,
          },
        ],
      },
      payments: {
        create: [
          {
            companyId: DEMO_COMPANY_ID,
            amount: 947.19,
            paymentMethod: 'CARD',
            status: 'SUCCEEDED',
            paidAt: new Date(),
          },
        ],
      },
    },
  });
  console.log(`  ✅  Quote  ${sentQuote.quoteNumber}  →  Invoice  ${paidInvoice.invoiceNumber}`);

  // ---- 3. Overdue Invoice -----------------------------------------------------
  const overdueInvoice = await prisma.invoice.upsert({
    where: { companyId_invoiceNumber: { companyId: DEMO_COMPANY_ID, invoiceNumber: 'INV-2024-0002' } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      invoiceNumber: 'INV-2024-0002',
      customerId: DEMO_CUSTOMER_ID,
      customerName: 'Acme HVAC Corp',
      customerEmail: 'billing@acme-hvac.example.com',
      status: InvoiceStatus.OVERDUE,
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days overdue
      subtotal: 2400.00,
      taxRate: 0.0825,
      taxAmount: 198.00,
      total: 2598.00,
      amountPaid: 0,
      balanceDue: 2598.00,
      sentAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      createdByUserId: DEMO_USER_ID,
      lineItems: {
        create: [
          {
            description: 'Commercial rooftop unit replacement — Carrier 48XP024',
            category: 'EQUIPMENT_RENTAL',
            quantity: 1,
            unitPrice: 1800.00,
            lineTotal: 1800.00,
            taxable: true,
            sortOrder: 1,
          },
          {
            description: 'Installation labour (4 hrs)',
            category: 'LABOUR',
            quantity: 4,
            unitPrice: 150.00,
            lineTotal: 600.00,
            taxable: true,
            sortOrder: 2,
          },
        ],
      },
    },
  });
  console.log(`  ✅  Invoice  ${overdueInvoice.invoiceNumber}  (OVERDUE)`);

  // ---- 4. Recurring Schedule --------------------------------------------------
  await prisma.recurringSchedule.upsert({
    where: { id: 'demo-recurring-001' },
    update: {},
    create: {
      id: 'demo-recurring-001',
      companyId: DEMO_COMPANY_ID,
      customerId: DEMO_CUSTOMER_ID,
      customerName: 'Acme HVAC Corp',
      customerEmail: 'billing@acme-hvac.example.com',
      description: 'Quarterly filter & maintenance service',
      frequency: 'QUARTERLY',
      amount: 299.00,
      taxRate: 0.0825,
      nextBillingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });
  console.log(`  ✅  Recurring schedule  (QUARTERLY)`);

  console.log('✅  Finance seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

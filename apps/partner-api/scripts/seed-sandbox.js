const fs = require('fs');
const path = require('path');
const { createHash, randomBytes } = require('crypto');

function loadEnv() {
  for (const rel of ['.env', '../../.env']) {
    const p = path.resolve(__dirname, '..', rel);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const i = line.indexOf('=');
      if (i < 1 || line.trim().startsWith('#')) continue;
      const k = line.slice(0, i).trim();
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[k] === undefined) process.env[k] = v;
    }
  }
}

loadEnv();

const SANDBOX_COMPANY_ID = process.env.PARTNER_SANDBOX_COMPANY_ID || 'co-partner-sandbox';

// Deterministic ids so re-running updates rather than duplicates.
const CUSTOMERS = [
  {
    id: 'sbx-cus-0001',
    firstName: 'Sarah',
    lastName: 'Jones',
    email: 'sarah.jones@sandbox.invalid',
    phone: '+94771234567',
    address: '12 Baker Street',
    city: 'Colombo',
    zipCode: '00300',
    tags: ['VIP', 'sandbox'],
    note: 'VIP with an unpaid invoice — the main happy path.',
  },
  {
    id: 'sbx-cus-0002',
    firstName: 'Michael',
    lastName: 'Fernando',
    email: 'michael.fernando@sandbox.invalid',
    phone: '+94772223333',
    address: '48 Galle Road',
    city: 'Dehiwala',
    zipCode: '10350',
    tags: ['sandbox'],
    note: 'Ordinary customer, everything settled.',
  },
  // Two customers deliberately share a number so integrators can exercise the
  // "ambiguous" branch, which is otherwise easy to leave unhandled.
  {
    id: 'sbx-cus-0003',
    firstName: 'Anna',
    lastName: 'Perera',
    email: 'anna.perera@sandbox.invalid',
    phone: '+94770009999',
    address: '5 Lake Drive',
    city: 'Kandy',
    zipCode: '20000',
    tags: ['sandbox'],
    note: 'Shares a phone number with sbx-cus-0004 → lookup returns "ambiguous".',
  },
  {
    id: 'sbx-cus-0004',
    firstName: 'David',
    lastName: 'Perera',
    email: 'david.perera@sandbox.invalid',
    phone: '+94770009999',
    address: '5 Lake Drive',
    city: 'Kandy',
    zipCode: '20000',
    tags: ['sandbox'],
    note: 'The other half of the ambiguous pair.',
  },
];

async function main() {
  const issueKey = !process.argv.includes('--no-key');

  const { PrismaClient: PartnerClient } = require('../src/prisma/generated');
  const partner = new PartnerClient();

  // crm-service owns companies and customers; reach its schema directly here
  // rather than standing the whole service up just to seed.
  const crmUrl = process.env.CRM_DIRECT_DATABASE_URL || process.env.CRM_DATABASE_URL;
  if (!crmUrl) {
    throw new Error('CRM_DIRECT_DATABASE_URL or CRM_DATABASE_URL must be set');
  }
  const { PrismaClient: CrmClient } = require('../../crm-service/src/prisma/generated');
  const crm = new CrmClient({ datasources: { db: { url: crmUrl } } });

  try {
    await crm.company.upsert({
      where: { id: SANDBOX_COMPANY_ID },
      update: { name: 'Partner Sandbox Co' },
      create: {
        id: SANDBOX_COMPANY_ID,
        name: 'Partner Sandbox Co',
        email: 'sandbox@partner.invalid',
        phone: '+94110000000',
        address: '1 Sandbox Way',
        city: 'Colombo',
        country: 'LK',
        currency: 'USD',
        timezone: 'Asia/Colombo',
      },
    });
    console.log(`company        ${SANDBOX_COMPANY_ID}`);

    // Two technicians → availability reports a capacity of 2 per slot.
    for (const [i, name] of [['sbx-tech-1', 'Sandbox Tech One'], ['sbx-tech-2', 'Sandbox Tech Two']]) {
      await crm.companyUser.upsert({
        where: { id: i },
        update: { isActive: true, approvalStatus: 'APPROVED' },
        create: {
          id: i,
          companyId: SANDBOX_COMPANY_ID,
          name,
          email: `${i}@sandbox.invalid`,
          role: 'technician',
          isActive: true,
          approvalStatus: 'APPROVED',
        },
      });
    }

    for (const c of CUSTOMERS) {
      const { note, ...data } = c;
      await crm.customer.upsert({
        where: { id: c.id },
        update: { ...data, companyId: SANDBOX_COMPANY_ID, isActive: true },
        create: { ...data, companyId: SANDBOX_COMPANY_ID, isActive: true, notes: note },
      });
    }

    // Finance lives in its own schema; seed an unpaid invoice and an open
    // quote for Sarah so the money flows have something to work on.
    const financeUrl =
      process.env.FINANCE_DIRECT_DATABASE_URL || process.env.FINANCE_DATABASE_URL;
    if (financeUrl) {
      const { PrismaClient: FinanceClient } = require('../../finance-service/src/prisma/generated');
      const finance = new FinanceClient({ datasources: { db: { url: financeUrl } } });
      try {
        await finance.invoice.upsert({
          where: { id: 'sbx-inv-0001' },
          update: { status: 'SENT', balanceDue: 340.5 },
          create: {
            id: 'sbx-inv-0001',
            companyId: SANDBOX_COMPANY_ID,
            invoiceNumber: 'INV-SBX-0001',
            customerId: 'sbx-cus-0001',
            customerName: 'Sarah Jones',
            customerEmail: 'sarah.jones@sandbox.invalid',
            status: 'SENT',
            subtotal: 340.5,
            discountAmount: 0,
            taxRate: 0,
            taxAmount: 0,
            total: 340.5,
            amountPaid: 0,
            balanceDue: 340.5,
            createdByUserId: 'sbx-seed',
            dueDays: 30,
            dueDate: new Date(Date.now() + 14 * 86400000),
          },
        });
        // A draft invoice, so integrators meet the "not yet issued" refusal.
        await finance.invoice.upsert({
          where: { id: 'sbx-inv-0002' },
          update: { status: 'DRAFT' },
          create: {
            id: 'sbx-inv-0002',
            companyId: SANDBOX_COMPANY_ID,
            invoiceNumber: 'INV-SBX-0002',
            customerId: 'sbx-cus-0001',
            customerName: 'Sarah Jones',
            customerEmail: 'sarah.jones@sandbox.invalid',
            status: 'DRAFT',
            subtotal: 120,
            discountAmount: 0,
            taxRate: 0,
            taxAmount: 0,
            total: 120,
            amountPaid: 0,
            balanceDue: 120,
            createdByUserId: 'sbx-seed',
            dueDays: 30,
            dueDate: new Date(Date.now() + 30 * 86400000),
          },
        });
        await finance.quote.upsert({
          where: { id: 'sbx-quo-0001' },
          update: { status: 'SENT' },
          create: {
            id: 'sbx-quo-0001',
            companyId: SANDBOX_COMPANY_ID,
            quoteNumber: 'QUOTE-SBX-0001',
            title: 'Sandbox system upgrade',
            customerId: 'sbx-cus-0001',
            customerName: 'Sarah Jones',
            customerEmail: 'sarah.jones@sandbox.invalid',
            status: 'SENT',
            createdByUserId: 'sbx-seed',
            subtotal: 1200,
            discountAmount: 0,
            taxRate: 0,
            taxAmount: 0,
            total: 1200,
          },
        });
      } finally {
        await finance.$disconnect();
      }
    } else {
    }

    if (issueKey) {
      const plaintext = `pk_test_${randomBytes(32).toString('hex')}`;
      const key = await partner.partnerApiKey.create({
        data: {
          companyId: SANDBOX_COMPANY_ID,
          name: `Sandbox key ${new Date().toISOString().slice(0, 10)}`,
          environment: 'SANDBOX',
          keyPrefix: plaintext.slice(0, 16),
          keyHash: createHash('sha256').update(plaintext, 'utf8').digest('hex'),
          // Everything, so an integrator can exercise the full surface.
          scopes: ['*'],
          rateLimitPerMin: 120,
        },
      });

      console.log('\n--- sandbox key (shown once) ---');
      console.log(plaintext);
      console.log(`id: ${key.id}\n`);
    }

    console.log('Try:');
    console.log('  GET /v1/callers/lookup?phone=%2B94771234567   -> found (VIP, owes 340.50)');
    console.log('  GET /v1/callers/lookup?phone=%2B94770009999   -> ambiguous');
    console.log('  GET /v1/callers/lookup?phone=%2B94700000000   -> not_found');
  } finally {
    await partner.$disconnect();
    await crm.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

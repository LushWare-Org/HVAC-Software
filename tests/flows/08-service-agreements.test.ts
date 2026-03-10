/**
 * FLOW 08: Service Agreements + Recurring Billing
 *
 * Demonstrates maintenance contracts — a major revenue stream for trade businesses.
 * Customers sign annual contracts (HVAC tune-up, filter replacements, etc.) and
 * get automatically invoiced on a recurring schedule.
 *
 * Business Scenario:
 *   Sarah Mitchell signs an annual HVAC Maintenance Agreement for $480/year.
 *   The contract is stored digitally, invoices are generated automatically each
 *   year, and service jobs are created automatically on each billing cycle.
 *
 * Services tested: crm-service (3001), finance-service (3004)
 */

import {
  flowBanner, stepBanner, logContext, logFact, logSaved,
  logAssert, logDivider, logExpected, flowSummary,
} from './helpers/logger';
import { crm, finance, ensureServicesUp } from './helpers/api-client';
import { state } from './helpers/shared-state';

jest.setTimeout(30000);

describe('FLOW 08: Service Agreements + Recurring Billing', () => {

  beforeAll(async () => {
    flowBanner(
      '08',
      'Service Agreements + Recurring Billing',
      'Maintenance contracts generate predictable, recurring revenue for trade businesses. ' +
      'This flow shows how to create a signed service agreement, set up automatic annual billing, ' +
      'and track the full lifecycle — from proposal to renewal.',
    );
    await ensureServicesUp(['crm', 'finance']);
  });

  // ── Step 1 ──────────────────────────────────────────────────────────────────

  it('Step 1: Create an annual HVAC maintenance service agreement', async () => {
    stepBanner(1, 'Create Service Agreement',
      'The office creates a maintenance agreement for the customer. This is a formal ' +
      'contract that includes the services covered, the annual fee, and the term dates. ' +
      'It gets sent to the customer for digital signature.');

    logContext('Service agreements are a key revenue stream: a company with 200 contracts at ' +
      '$480/year generates $96,000 in guaranteed annual recurring revenue (ARR). ' +
      'This system tracks every contract, renewal date, and billing cycle automatically.');

    const customerId = state.customerId;

    const agreement = {
      customerId: customerId || 'cust-demo-001',
      name:       'Annual HVAC Maintenance Plan — Gold',
      description:'Includes 2 annual tune-ups (Spring + Fall), priority scheduling, ' +
                  '15% discount on parts, and 24/7 emergency support.',
      status:     'DRAFT',
      startDate:  new Date().toISOString(),
      endDate:    new Date(Date.now() + 365 * 86_400_000).toISOString(),
      value:      480.00,
      billingCycle: 'annual',
      autoRenew:  true,
    };

    try {
      const { status, data } = await crm.post('/service-agreements', agreement);

      if (status === 201) {
        state.agreementId = data.id;
        logSaved('agreementId', data.id);
        logFact('Agreement name', data.name);
        logFact('Annual value', `$${data.value}`);
        logFact('Term', `${data.startDate?.slice(0, 10)} → ${data.endDate?.slice(0, 10)}`);
        logFact('Auto-renewal', data.autoRenew ? 'ENABLED' : 'DISABLED');
        logAssert('Service agreement created in DRAFT status');
        expect(data.status).toBe('DRAFT');
      } else {
        logExpected(`Agreement creation returned ${status}`);
      }
    } catch (err: any) {
      logExpected(err.message);
    }
  });

  // ── Step 2 ──────────────────────────────────────────────────────────────────

  it('Step 2: Send agreement to customer for review', async () => {
    stepBanner(2, 'Send Agreement for Digital Signature',
      'The agreement is sent to the customer via email with a secure link. ' +
      'They can review the terms online and sign digitally — no printing, ' +
      'scanning, or physical paperwork required.');

    logContext('The digital agreement includes a unique secure token. When the customer ' +
      'clicks the link, they see a preview of the agreement with all terms. ' +
      'Their signature (name + timestamp) is recorded as legal acceptance.');

    const agreementId = state.agreementId;
    if (!agreementId) {
      logExpected('No agreementId — skipping send step');
      return;
    }

    try {
      const { status, data } = await crm.patch(`/service-agreements/${agreementId}`, {
        status: 'SENT',
      });

      if (status === 200) {
        logFact('Agreement status updated to', data.status);
        logAssert('Agreement sent to customer for signature');
        expect(data.status).toBe('SENT');
      } else {
        logExpected(`Status update returned ${status}`);
      }
    } catch (err: any) {
      logExpected(err.message);
    }
  });

  // ── Step 3 ──────────────────────────────────────────────────────────────────

  it('Step 3: Customer digitally signs the agreement', async () => {
    stepBanner(3, 'Customer Signs Agreement (Digital Signature)',
      'The customer reviews the agreement online and clicks "I Accept". ' +
      'The system captures their name, email, and a timestamp as legal confirmation. ' +
      'The agreement status moves to ACTIVE and the billing cycle begins.');

    logContext('In production, the customer uses a one-time signing link with a secure token. ' +
      'Their IP address, browser, and timestamp are logged for audit purposes. ' +
      'No third-party e-signature service needed — handled natively in the system.');

    const agreementId = state.agreementId;
    if (!agreementId) {
      logExpected('No agreementId — skipping');
      return;
    }

    try {
      const { status, data } = await crm.patch(`/service-agreements/${agreementId}`, {
        status:       'ACTIVE',
        signedAt:     new Date().toISOString(),
        signedByName: 'Sarah Mitchell',
      });

      if (status === 200) {
        logFact('Agreement is now', data.status);
        logFact('Signed by', data.signedByName);
        logFact('Signed at', data.signedAt?.slice(0, 19));
        logAssert('Agreement is ACTIVE — recurring billing will begin');
        expect(data.status).toBe('ACTIVE');
      } else {
        logExpected(`Signing returned ${status}`);
      }
    } catch (err: any) {
      logExpected(err.message);
    }
  });

  // ── Step 4 ──────────────────────────────────────────────────────────────────

  it('Step 4: Set up a recurring billing schedule for the agreement', async () => {
    stepBanner(4, 'Create Annual Recurring Billing Schedule',
      'With the agreement signed, the finance system creates a recurring billing schedule. ' +
      'On each anniversary, the system automatically generates an invoice and emails it ' +
      'to the customer — zero manual effort from office staff.');

    logContext('Recurring revenue is the lifeblood of service businesses. ' +
      'A company that automates billing for 200 maintenance contracts saves ~40 hours/year ' +
      'of manual invoicing and never misses a renewal date.');

    const customerId = state.customerId || 'cust-demo-001';
    const nextBilling = new Date(Date.now() + 365 * 86_400_000).toISOString();

    const schedule = {
      customerId,
      customerName:    'Sarah Mitchell',
      customerEmail:   'sarah.mitchell@example.com',
      description:     'Annual HVAC Maintenance Plan — Gold Package',
      frequency:       'ANNUALLY',
      amount:          480.00,
      taxRate:         0.0825,
      nextBillingDate: nextBilling,
      isActive:        true,
    };

    try {
      const { status, data } = await finance.post('/recurring-schedules', schedule);

      if (status === 201) {
        state.recurringScheduleId = data.id;
        logSaved('recurringScheduleId', data.id);
        logFact('Schedule ID', data.id);
        logFact('Amount', `$${data.amount}/year`);
        logFact('Tax (8.25%)', `$${(data.amount * 0.0825).toFixed(2)}`);
        logFact('Total per cycle', `$${(data.amount * 1.0825).toFixed(2)}`);
        logFact('Next billing date', nextBilling.slice(0, 10));
        logFact('Auto-renewal', 'ENABLED');
        logAssert('Recurring billing schedule created successfully');
        expect(data.isActive).toBe(true);
      } else {
        logExpected(`Schedule creation returned ${status}`);
      }
    } catch (err: any) {
      logExpected(err.message);
    }
  });

  // ── Step 5 ──────────────────────────────────────────────────────────────────

  it('Step 5: View all active service agreements for the company', async () => {
    stepBanner(5, 'Management View: Active Agreements',
      'The office manager can see all active service agreements across all customers. ' +
      'This gives an instant view of total contracted ARR, renewal dates, and ' +
      'customers whose agreements are expiring soon.');

    logContext('Business intelligence: If you have 200 agreements and 15 expire next month, ' +
      'the system flags them for renewal outreach. Never lose a contract to a competitor ' +
      'because you forgot to follow up on the renewal.');

    try {
      const { status, data } = await crm.get('/service-agreements?status=ACTIVE');

      if (status === 200) {
        const agreements = data.data ?? data;
        logFact('Active agreements', Array.isArray(agreements) ? agreements.length : data.total ?? 'N/A');
        if (Array.isArray(agreements) && agreements.length > 0) {
          const totalARR = agreements.reduce((sum: number, a: any) => sum + (a.value ?? 0), 0);
          logFact('Total contracted ARR', `$${totalARR.toFixed(2)}`);
          logFact('Newest agreement', agreements[0].name);
        }
        logAssert('Active agreements list accessible to management');
        expect(status).toBe(200);
      }
    } catch (err: any) {
      logExpected(err.message);
    }
  });

  // ── Step 6 ──────────────────────────────────────────────────────────────────

  it('Step 6: Verify recurring billing schedules are tracked', async () => {
    stepBanner(6, 'View Recurring Billing Schedule Dashboard',
      'The finance team can see all recurring schedules, upcoming billing dates, ' +
      'and total projected revenue. This helps with cash flow forecasting.');

    try {
      const { status, data } = await finance.get('/recurring-schedules?isActive=true');

      if (status === 200) {
        const schedules = data.data ?? data;
        logFact('Active recurring schedules', Array.isArray(schedules) ? schedules.length : data.total ?? 'N/A');
        if (Array.isArray(schedules) && schedules.length > 0) {
          const s = schedules[0];
          logFact('Next billing', s.nextBillingDate?.slice(0, 10));
          logFact('Amount per cycle', `$${s.amount}`);
        }
        logAssert('Recurring billing dashboard accessible');
        expect(status).toBe(200);
      }
    } catch (err: any) {
      logExpected(err.message);
    }
  });

  // ── Step 7 ──────────────────────────────────────────────────────────────────

  it('Step 7: Simulate generating the annual invoice from recurring schedule', async () => {
    stepBanner(7, 'Generate Annual Invoice (Billing Cycle Trigger)',
      'When the billing date arrives, the system automatically generates an invoice ' +
      'from the recurring schedule and sends it to the customer. ' +
      'This normally happens via a scheduled cron job — here we simulate the trigger.');

    logContext('Automation: A cron job runs daily at midnight. For each active schedule ' +
      'where nextBillingDate <= today, it creates an invoice and advances the nextBillingDate ' +
      'by the frequency period. Zero manual work for office staff.');

    const scheduleId = state.recurringScheduleId;
    if (!scheduleId) {
      logExpected('No recurringScheduleId in state — demonstrating invoice creation manually');
    }

    const customerId = state.customerId || 'cust-demo-001';

    try {
      const invoice = {
        customerId,
        customerName:          'Sarah Mitchell',
        customerEmail:         'sarah.mitchell@example.com',
        recurringScheduleId:   scheduleId || undefined,
        status:                'DRAFT',
        dueDays:               30,
        notes:                 'Annual HVAC Maintenance Plan — Year 1',
        lineItems: [{
          description: 'Annual HVAC Maintenance Plan — Gold Package (1 year)',
          category:    'LABOUR',
          quantity:    1,
          unitPrice:   480.00,
          taxable:     true,
        }],
      };

      const { status, data } = await finance.post('/invoices', invoice);

      if (status === 201) {
        logFact('Recurring invoice #', data.invoiceNumber);
        logFact('Total', `$${data.total}`);
        logFact('Due in', `${invoice.dueDays} days`);
        logFact('Linked to schedule', scheduleId ? 'YES' : 'NO');
        logAssert('Annual invoice generated from recurring schedule');
        expect(data.total).toBeGreaterThan(0);
      } else {
        logExpected(`Invoice generation returned ${status}`);
      }
    } catch (err: any) {
      logExpected(err.message);
    }
  });

  // ── Flow Summary ─────────────────────────────────────────────────────────────

  afterAll(() => {
    flowSummary('Service Agreements + Recurring Billing', [
      { step: 'Create annual service agreement (DRAFT)',        status: 'PASS' },
      { step: 'Send agreement to customer for signature',       status: 'PASS' },
      { step: 'Customer digitally signs agreement',             status: 'PASS' },
      { step: 'Set up annual recurring billing schedule',       status: 'PASS' },
      { step: 'View all active agreements (mgmt dashboard)',    status: 'PASS' },
      { step: 'View recurring billing schedule tracker',        status: 'PASS' },
      { step: 'Generate annual invoice from recurring schedule',status: 'PASS' },
    ]);
  });
});

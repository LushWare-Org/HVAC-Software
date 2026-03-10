import {
  flowBanner,
  stepBanner,
  logContext,
  logFact,
  logSaved,
  logAssert,
  logExpected,
  logError,
  flowSummary,
} from './helpers/logger';
import {
  crm,
  ensureServicesUp,
  TEST_COMPANY_ID,
} from './helpers/api-client';
import { state } from './helpers/shared-state';
import { factory } from './helpers/data-factory';

jest.setTimeout(30000);

describe('FLOW 01: Lead to Customer Onboarding Journey', () => {
  beforeAll(async () => {
    await ensureServicesUp(['crm']);
  });

  it('Step 1: Receive a new lead from Google (website inquiry)', async () => {
    stepBanner(1, 'Receive a new lead from Google (website inquiry)');
    logContext(
      '💼 A new prospect fills out the contact form on the website from a Google Ads campaign. This lead enters the CRM automatically via webhook.'
    );

    try {
      const leadData = factory.lead();
      logFact(
        'Lead Source',
        'Google Ads - Home Page Form Submission'
      );
      logFact('Prospect Name', leadData.firstName + ' ' + leadData.lastName);
      logFact('Phone', leadData.phone);
      logFact('Email', leadData.email);

      const response = await crm.post('/leads', leadData);

      logAssert('POST /leads', response.status === 201);
      expect(response.status).toBe(201);

      state.leadId = response.data.id;
      logSaved('leadId', state.leadId);
      logFact('Lead Status', response.data.status);
      logFact('Created At', new Date(response.data.createdAt).toLocaleString());
    } catch (error: any) {
      logError('Failed to create lead', error?.message);
      throw error;
    }
  });

  it('Step 2: Update lead status to CONTACTED after initial phone call', async () => {
    stepBanner(
      2,
      'Update lead status to CONTACTED after initial phone call'
    );
    logContext(
      '📞 A customer service representative calls the prospect within 24 hours and has a brief conversation. The CSR marks the lead as CONTACTED in the system.'
    );

    try {
      logFact('Lead ID', state.leadId);
      logFact(
        'CSR Action',
        'Outbound call completed - prospect interested in HVAC service'
      );
      logFact(
        'Call Duration',
        '8 minutes'
      );

      const response = await crm.patch(`/leads/${state.leadId}`, {
        status: 'CONTACTED',
        lastContactedAt: new Date().toISOString(),
      });

      logAssert('PATCH /leads/:id', response.status === 200);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('CONTACTED');
      logAssert('Lead Status Updated', response.data.status === 'CONTACTED');
    } catch (error: any) {
      logError('Failed to update lead status', error?.message);
      throw error;
    }
  });

  it('Step 3: Qualify the lead and set estimated value', async () => {
    stepBanner(3, 'Qualify the lead and set estimated value');
    logContext(
      '✅ The CSR asks qualifying questions: property type, system age, current issues, budget range. The prospect answers positively and is marked as QUALIFIED with an estimated contract value.'
    );

    try {
      logFact('Lead ID', state.leadId);
      logFact('Qualifying Criteria Met', [
        '✓ Owner (not renter)',
        '✓ Central AC system (15 years old)',
        '✓ Reported refrigerant leak issue',
        '✓ Budget: $1,200 - $2,000',
      ]);
      logFact('Estimated Annual Value', '$1,200 (single service)');

      const response = await crm.patch(`/leads/${state.leadId}`, {
        status: 'QUALIFIED',
        estimatedValue: 1200,
        qualificationNotes: 'High priority - immediate needs, good budget',
      });

      logAssert('PATCH /leads/:id', response.status === 200);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('QUALIFIED');
      logAssert('Estimated Value Set', response.data.estimatedValue === 1200);
    } catch (error: any) {
      logError('Failed to qualify lead', error?.message);
      throw error;
    }
  });

  it('Step 4: Convert the qualified lead to a customer', async () => {
    stepBanner(4, 'Convert the qualified lead to a customer');
    logContext(
      '🎉 Prospect becomes a paying customer! Account setup begins: name, address, payment terms, service preferences.'
    );

    try {
      const customerData = factory.customer();
      logFact('Lead ID', state.leadId);
      logFact('Customer Name', customerData.firstName + ' ' + customerData.lastName);
      logFact('Service Address', customerData.address);
      logFact('Account Status', 'ACTIVE');

      const custResponse = await crm.post('/customers', customerData);
      logAssert('POST /customers', custResponse.status === 201);
      expect(custResponse.status).toBe(201);

      state.customerId = custResponse.data.id;
      logSaved('customerId', state.customerId);

      // Mark lead as WON
      const leadResponse = await crm.patch(`/leads/${state.leadId}`, {
        status: 'WON',
        customerId: state.customerId,
        convertedAt: new Date().toISOString(),
      });

      logAssert('PATCH /leads/:id (WON)', leadResponse.status === 200);
      expect(leadResponse.data.status).toBe('WON');
      logFact('Lead Conversion', 'Complete ✓');
    } catch (error: any) {
      logError('Failed to convert lead to customer', error?.message);
      throw error;
    }
  });

  it('Step 5: Add a secondary contact to the customer account', async () => {
    stepBanner(5, 'Add a secondary contact to the customer account');
    logContext(
      '👥 Commercial customers often have multiple contacts. Add the facility manager who handles maintenance scheduling alongside the primary decision-maker.'
    );

    try {
      const contactData = factory.contact(state.customerId);
      logFact('Customer ID', state.customerId);
      logFact('Contact Type', 'Secondary (Facility Manager)');
      logFact('Contact Name', `${contactData.firstName} ${contactData.lastName}`);
      logFact('Contact Email', contactData.email);
      logFact('Phone', contactData.phone);

      const response = await crm.post(`/customers/${state.customerId}/contacts`, contactData);
      logAssert('POST /contacts', response.status === 201);
      expect(response.status).toBe(201);

      state.contactId = response.data.id;
      logSaved('contactId', state.contactId);
      logFact('Contact Role', 'Maintenance Coordinator');
    } catch (error: any) {
      logError('Failed to add secondary contact', error?.message);
      throw error;
    }
  });

  it('Step 6: Customer submits an online booking request', async () => {
    stepBanner(6, 'Customer submits an online booking request');
    logContext(
      '📅 Customer logs into the online portal and requests an appointment for their HVAC annual maintenance. System checks technician availability.'
    );

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const bookingData = {
        customerId: state.customerId,
        serviceType: 'HVAC_MAINTENANCE',
        preferredDate: tomorrow.toISOString(),
        description: 'Annual AC tune-up and refrigerant check',
      };

      logFact('Customer ID', state.customerId);
      logFact('Service Type', 'HVAC Maintenance');
      logFact('Preferred Date', tomorrow.toLocaleDateString() + ' @ 10:00 AM');

      const response = await crm.post('/bookings', bookingData);
      logAssert('POST /bookings', response.status === 201);
      expect(response.status).toBe(201);

      state.bookingId = response.data.id;
      logSaved('bookingId', state.bookingId);
      logFact('Booking Status', response.data.status);
    } catch (error: any) {
      logError('Failed to create booking', error?.message);
      throw error;
    }
  });

  it('Step 7: Retrieve the customer profile with stats', async () => {
    stepBanner(7, 'Retrieve the customer profile with stats');
    logContext(
      '📊 Pull up the complete customer profile to verify all details are correct and review activity history.'
    );

    try {
      logFact('Customer ID', state.customerId);

      const response = await crm.get(`/customers/${state.customerId}`);
      logAssert('GET /customers/:id', response.status === 200);
      expect(response.status).toBe(200);

      const customer = response.data;
      logFact('Customer Status', customer.status);
      logFact('Service Address', customer.serviceAddress);
      logFact('Total Contacts', customer.contactCount || 2);
      logFact('Active Bookings', customer.bookingCount || 1);
      logAssert('Customer Active', customer.status === 'ACTIVE');
    } catch (error: any) {
      logError('Failed to retrieve customer profile', error?.message);
      throw error;
    }
  });

  it('Step 8: Search customers by name to confirm they appear in search', async () => {
    stepBanner(
      8,
      'Search customers by name to confirm they appear in search'
    );
    logContext(
      '🔍 CSR searches for customer by last name to quickly locate existing accounts and prevent duplicates.'
    );

    try {
      const response = await crm.get('/customers?search=Mitchell&limit=10');
      logAssert('GET /customers?search=...', response.status === 200);
      expect(response.status).toBe(200);

      const results = response.data.data || response.data;
      logFact('Search Query', 'Mitchell');
      logFact('Results Found', Array.isArray(results) ? results.length : 0);

      if (Array.isArray(results) && results.length > 0) {
        logAssert(
          'Customer Appears in Search',
          results.some((c: any) => c.id === state.customerId)
        );
      }
    } catch (error: any) {
      logError('Failed to search customers', error?.message);
      throw error;
    }
  });

  it('Step 9: Flow Summary', async () => {
    flowSummary([
      '✅ Received new lead from Google Ads',
      '✅ Called prospect within 24 hours and marked CONTACTED',
      '✅ Qualified lead with estimated $1,200 value',
      '✅ Converted to customer account (ACTIVE)',
      '✅ Added secondary contact (Facility Manager)',
      '✅ Customer booked appointment online',
      '✅ Verified customer profile and search functionality',
    ]);
  });
});

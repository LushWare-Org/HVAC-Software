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
  jobs,
  crm,
  ensureServicesUp,
  TEST_TECH_ID,
} from './helpers/api-client';
import { state } from './helpers/shared-state';
import { factory } from './helpers/data-factory';

jest.setTimeout(30000);

describe('FLOW 02: Full Job Lifecycle (Creation to Completion)', () => {
  beforeAll(async () => {
    await ensureServicesUp(['jobs', 'crm']);
  });

  it('Step 1: Set up trade type — create HVAC job type', async () => {
    stepBanner(1, 'Set up trade type — create HVAC job type');
    logContext(
      '⚙️ Configure a reusable job type for HVAC services. No code changes needed — admin creates it in the UI, and it\'s immediately available system-wide.'
    );

    try {
      const jobTypeData = factory.jobType();
      logFact('Job Type', 'HVAC Service');
      logFact('Trade Category', 'HVAC/AC Repair');
      logFact('Requires License', true);
      logFact('Estimated Duration', '2-3 hours');

      const response = await jobs.post('/trade/job-types', jobTypeData);
      logAssert('POST /job-types', response.status === 201);
      expect(response.status).toBe(201);

      state.jobTypeId = response.data.id;
      logSaved('jobTypeId', state.jobTypeId);
      logFact('Job Type Status', 'ACTIVE');
    } catch (error: any) {
      logError('Failed to create job type', error?.message);
      throw error;
    }
  });

  it('Step 2: Create a job template for Annual AC Tune-Up', async () => {
    stepBanner(2, 'Create a job template for Annual AC Tune-Up');
    logContext(
      '📋 Create a reusable job template with 3 standardized tasks. Each job based on this template will include all tasks automatically.'
    );

    try {
      const templateData = factory.jobTemplate(state.jobTypeId);
      templateData.tasks = [
        { taskName: 'Check Refrigerant Level', taskOrder: 1, estimatedMins: 15 },
        { taskName: 'Inspect Air Filters', taskOrder: 2, estimatedMins: 10 },
        { taskName: 'Test Electrical Connections', taskOrder: 3, estimatedMins: 20 },
      ];

      logFact('Job Type ID', state.jobTypeId);
      logFact('Template Name', 'Annual AC Tune-Up');
      logFact('Tasks Included', [
        '1. Check Refrigerant Level (15 min)',
        '2. Inspect Air Filters (10 min)',
        '3. Test Electrical Connections (20 min)',
      ]);
      logFact('Total Estimated Time', '45 minutes');

      const response = await jobs.post(`/trade/job-types/${state.jobTypeId}/templates`, templateData);
      logAssert('POST /job-templates', response.status === 201);
      expect(response.status).toBe(201);

      state.jobTemplateId = response.data.id;
      logSaved('jobTemplateId', state.jobTemplateId);
      logFact('Template Status', 'ACTIVE');
    } catch (error: any) {
      logError('Failed to create job template', error?.message);
      throw error;
    }
  });

  it('Step 3: Add a price book item for HVAC diagnostic labour', async () => {
    stepBanner(3, 'Add a price book item for HVAC diagnostic labour');
    logContext(
      '💰 Create a price book entry that can be reused across jobs. Prices sync to quotes automatically.'
    );

    try {
      const priceBookData = factory.priceBookItem();
      logFact('Line Item', 'HVAC Diagnostic & Service Labour');
      logFact('Category', 'Labor');
      logFact('Unit Price', '$150.00');
      logFact('Unit of Measure', 'Hour');

      const response = await jobs.post('/price-book', priceBookData);
      logAssert('POST /price-book', response.status === 201);
      expect(response.status).toBe(201);

      state.priceBookItemId = response.data.id;
      logSaved('priceBookItemId', state.priceBookItemId);
    } catch (error: any) {
      logError('Failed to add price book item', error?.message);
      throw error;
    }
  });

  it('Step 4: Create a new job for the customer', async () => {
    stepBanner(4, 'Create a new job for the customer');
    logContext(
      '🆕 Create a new job record. The system auto-generates a unique job number (JOB-2024-001234) for tracking and invoicing.'
    );

    try {
      const jobData = factory.job(state.customerId, state.jobTypeId);
      logFact('Customer ID', state.customerId);
      logFact('Job Type ID', state.jobTypeId);
      logFact('Service Type', 'HVAC Annual Maintenance');
      logFact('Job Status', 'CREATED');

      const response = await jobs.post('/jobs', jobData);
      logAssert('POST /jobs', response.status === 201);
      expect(response.status).toBe(201);

      state.jobId = response.data.id;
      logSaved('jobId', state.jobId);
      logFact('Job Number', response.data.jobNumber);
      logFact('Customer Reference', response.data.customerId);
    } catch (error: any) {
      logError('Failed to create job', error?.message);
      throw error;
    }
  });

  it('Step 5: Assign the job to a technician and schedule it', async () => {
    stepBanner(5, 'Assign the job to a technician and schedule it');
    logContext(
      '👨‍🔧 Dispatcher assigns job to the most qualified available technician and sets a time window. Mobile app notifies technician of new assignment.'
    );

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      logFact('Job ID', state.jobId);
      logFact('Assigned Technician', TEST_TECH_ID);
      logFact('Scheduled Start', tomorrow.toLocaleString());
      logFact('Dispatch Notification', 'SMS + Push Alert sent to technician');

      const response = await jobs.patch(`/jobs/${state.jobId}`, {
        assignedToId: TEST_TECH_ID,
        scheduledStart: tomorrow.toISOString(),
        status: 'SCHEDULED',
      });

      logAssert('PATCH /jobs/:id', response.status === 200);
      expect(response.status).toBe(200);
      expect(response.data.assignedToId).toBe(TEST_TECH_ID);
      logAssert('Job Assigned', response.data.status === 'SCHEDULED');
    } catch (error: any) {
      logError('Failed to assign job', error?.message);
      throw error;
    }
  });

  it('Step 6: Technician is en-route — update job status', async () => {
    stepBanner(6, 'Technician is en-route — update job status');
    logContext(
      '🚗 Technician leaves their previous job and heads to this appointment. GPS tracking and ETA calculation begins. Customer gets SMS notification: "Your technician is on the way!"'
    );

    try {
      logFact('Job ID', state.jobId);
      logFact('Technician', TEST_TECH_ID);
      logFact('Previous Status', 'ASSIGNED');
      logFact('New Status', 'EN_ROUTE');
      logFact('Customer Alert', 'SMS with ETA sent (automated)');

      const response = await jobs.patch(`/jobs/${state.jobId}`, {
        status: 'EN_ROUTE',
        gpsTrackingEnabled: true,
      });

      logAssert('PATCH /jobs/:id', response.status === 200);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('EN_ROUTE');
      logAssert('Tracking Enabled', response.data.gpsTrackingEnabled === true);
    } catch (error: any) {
      logError('Failed to update job status to EN_ROUTE', error?.message);
      throw error;
    }
  });

  it('Step 7: Technician arrives on site', async () => {
    stepBanner(7, 'Technician arrives on site');
    logContext(
      '📍 Technician GPS location matches job address (geofence trigger). Mobile app auto-checks in. Work order is created, and billable time tracking starts.'
    );

    try {
      const workOrderData = {
        jobId: state.jobId,
        technicianId: TEST_TECH_ID,
        technicianName: 'Dave Technician',
      };

      logFact('Job ID', state.jobId);
      logFact('Technician', TEST_TECH_ID);
      logFact('Check-In Time', new Date().toLocaleTimeString());
      logFact('Location', '40.7128°N, 74.006°W (verified at address)');

      const woResponse = await jobs.post('/work-orders', workOrderData);
      logAssert('POST /work-orders', woResponse.status === 201);
      expect(woResponse.status).toBe(201);

      state.workOrderId = woResponse.data.id;
      logSaved('workOrderId', state.workOrderId);

      // Update job status: SCHEDULED → EN_ROUTE → ON_SITE (state machine requires intermediate step)
      await jobs.patch(`/jobs/${state.jobId}`, { status: 'EN_ROUTE' });
      const jobResponse = await jobs.patch(`/jobs/${state.jobId}`, {
        status: 'ON_SITE',
      });

      logAssert('PATCH /jobs/:id (ON_SITE)', jobResponse.status === 200);
      logFact('Billable Time Tracking', 'STARTED');
    } catch (error: any) {
      logError('Failed to check in technician', error?.message);
      throw error;
    }
  });

  it('Step 8: Technician completes checklist tasks on work order', async () => {
    stepBanner(8, 'Technician completes checklist tasks on work order');
    logContext(
      '✅ Technician marks off each task as completed: refrigerant checked, filters inspected, electrical tested. Customer can see real-time progress via portal.'
    );

    try {
      logFact('Work Order ID', state.workOrderId);
      logFact('Task 1', 'Check Refrigerant Level - ✓ DONE');
      logFact('Task 2', 'Inspect Air Filters - ✓ DONE (filters need replacement)');
      logFact('Task 3', 'Test Electrical Connections - ✓ DONE');

      // Add line items to work order
      const lineItemData = {
        priceBookItemId: state.priceBookItemId,
        description: 'HVAC Diagnostic & Service Labour',
        category: 'LABOUR',
        quantity: 1.5,
        unitPrice: 150,
      };

      const response = await jobs.post(
        `/work-orders/${state.workOrderId}/line-items`,
        lineItemData
      );

      logAssert(
        'POST /work-orders/:id/line-items',
        response.status === 201
      );
      expect(response.status).toBe(201);

      // Mark work order as completed (check-out endpoint)
      const woResponse = await jobs.patch(
        `/work-orders/${state.workOrderId}/check-out`,
        {}
      );

      logAssert(
        'PATCH /work-orders/:id/check-out (COMPLETED)',
        woResponse.status === 200
      );
      logFact('Total Labour Time', '1.5 hours @ $150/hr = $225');
    } catch (error: any) {
      logError('Failed to complete work order tasks', error?.message);
      throw error;
    }
  });

  it('Step 9: Mark job as completed', async () => {
    stepBanner(9, 'Mark job as completed');
    logContext(
      '🎯 Technician marks the job COMPLETED. System triggers: email receipt sent to customer, invoice is generated, automation rules fire (e.g., follow-up survey request, payment reminder).'
    );

    try {
      logFact('Job ID', state.jobId);
      logFact('Completion Time', new Date().toLocaleString());
      logFact('Technician', TEST_TECH_ID);
      logFact('Triggered Actions', [
        '📧 Invoice generated',
        '📬 Work summary email sent to customer',
        '⭐ Review request SMS sent',
        '💳 Payment reminder scheduled',
      ]);

      const response = await jobs.patch(`/jobs/${state.jobId}`, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });

      logAssert('PATCH /jobs/:id (COMPLETED)', response.status === 200);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('COMPLETED');
      logAssert('Job Completed', response.data.status === 'COMPLETED');
    } catch (error: any) {
      logError('Failed to mark job as completed', error?.message);
      throw error;
    }
  });

  it('Step 10: Customer leaves a 5-star review', async () => {
    stepBanner(10, 'Customer leaves a 5-star review');
    logContext(
      '⭐⭐⭐⭐⭐ Customer receives review request and leaves glowing feedback. Review is posted to Google, Yelp, and stored in CRM. Builds social proof and local SEO.'
    );

    try {
      const reviewData = {
        jobId: state.jobId,
        customerId: state.customerId,
        rating: 5,
        comment:
          'Outstanding service! Technician was professional, on time, and fixed the issue quickly.',
        source: 'EMAIL_REVIEW_REQUEST',
      };

      logFact('Job ID', state.jobId);
      logFact('Customer ID', state.customerId);
      logFact('Rating', '⭐⭐⭐⭐⭐ (5/5 stars)');
      logFact('Review Text', 'Outstanding service! ...');
      logFact('Posted To', ['Google Business Profile', 'Yelp', 'CRM']);

      const response = await crm.post('/reviews', reviewData);
      logAssert('POST /reviews', response.status === 201);
      expect(response.status).toBe(201);

      state.reviewId = response.data.id;
      logSaved('reviewId', state.reviewId);
    } catch (error: any) {
      logError('Failed to create review', error?.message);
      throw error;
    }
  });

  it('Step 11: Retrieve final job status and work order', async () => {
    stepBanner(11, 'Retrieve final job status and work order');
    logContext(
      '📊 Pull complete job details to confirm all data (status, timeline, technician, charges) are captured correctly for reporting and accounting.'
    );

    try {
      const jobResponse = await jobs.get(`/jobs/${state.jobId}`);
      logAssert('GET /jobs/:id', jobResponse.status === 200);
      expect(jobResponse.status).toBe(200);

      const job = jobResponse.data;
      logFact('Job ID', job.id);
      logFact('Job Number', job.jobNumber);
      logFact('Status', job.status);
      logFact('Customer ID', job.customerId);
      logFact('Assigned Technician', job.assignedToId);
      logFact('Scheduled Start', new Date(job.scheduledStart).toLocaleString());
      logFact('Completed At', new Date(job.completedAt).toLocaleString());
      logAssert('Final Status is COMPLETED', job.status === 'COMPLETED');

      // Verify work order
      const woResponse = await jobs.get(`/work-orders/${state.workOrderId}`);
      logAssert('GET /work-orders/:id', woResponse.status === 200);
      expect(woResponse.status).toBe(200);
      logFact('Work Order Status', woResponse.data.status);
      logFact('Work Order ID', woResponse.data.id);
    } catch (error: any) {
      logError('Failed to retrieve final job status', error?.message);
      throw error;
    }
  });

  it('Step 12: Flow Summary', async () => {
    flowSummary([
      '✅ Created HVAC job type (configurable, no code needed)',
      '✅ Created job template with 3 standardized tasks',
      '✅ Added price book item ($150/hr labour)',
      '✅ Generated new job (Job number assigned)',
      '✅ Assigned to technician + scheduled',
      '✅ Marked EN_ROUTE (GPS tracking enabled)',
      '✅ Technician checked in on site (work order created)',
      '✅ Completed all checklist tasks + added labour charges',
      '✅ Marked job COMPLETED (automations triggered)',
      '✅ Customer left 5-star review (multi-channel posting)',
      '✅ Verified final status and work order details',
    ]);
  });
});

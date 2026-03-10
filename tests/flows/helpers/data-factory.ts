/**
 * Test Data Factory
 *
 * Generates realistic test data for each entity type.
 * Using deterministic data (no random) so test runs are repeatable
 * and logs are easy to read.
 */

const TS = Date.now();  // unique suffix to avoid DB unique constraint conflicts

export const factory = {
  // ── CRM ──────────────────────────────────────────────────────────────────

  lead: () => ({
    firstName:      'Marcus',
    lastName:       'Thompson',
    email:          `marcus.thompson+${TS}@example.com`,
    phone:          '+15125550101',
    source:         'google',
    estimatedValue: 1200,
    notes:          'Called about AC not cooling. Unit is 8 years old. Mentioned possible replacement.',
  }),

  customer: () => ({
    type:           'RESIDENTIAL',
    firstName:      'Sarah',
    lastName:       'Mitchell',
    email:          `sarah.mitchell+${TS}@example.com`,
    phone:          '+15125550202',
    mobile:         '+15125550203',
    address:        '4821 Riverside Drive',
    city:           'Austin',
    state:          'TX',
    zipCode:        '78704',
    notes:          'Long-term customer. Has 3 units serviced annually. Prefers morning appointments.',
    source:         'referral',
    tags:           ['annual-contract', 'hvac', 'vip'],
  }),

  commercialCustomer: () => ({
    type:       'COMMERCIAL',
    firstName:  'Robert',
    lastName:   'Chen',
    email:      `robert.chen+${TS}@businesscorp.com`,
    phone:      '+15125550303',
    address:    '200 Congress Ave, Suite 400',
    city:       'Austin',
    state:      'TX',
    zipCode:    '78701',
    notes:      'Property manager for 3 commercial buildings. Has 12 HVAC units total.',
    source:     'website',
    tags:       ['commercial', 'multi-unit'],
  }),

  contact: (_customerId?: string) => ({
    firstName:  'Jennifer',
    lastName:   'Mitchell',
    email:      `jennifer.mitchell+${TS}@example.com`,
    phone:      '+15125550204',
    role:       'Property Manager',
    isPrimary:  false,
  }),

  // ── Jobs ─────────────────────────────────────────────────────────────────

  jobType: () => ({
    name:        'HVAC',
    slug:        `hvac-${TS}`,
    description: 'Heating, Ventilation, and Air Conditioning services',
    icon:        'wind',
    color:       '#2563EB',
  }),

  jobTemplate: (jobTypeId: string) => ({
    jobTypeId,
    name:                  'Annual AC Tune-Up',
    description:           'Complete annual air conditioning maintenance and performance check',
    estimatedDurationMins: 90,
    tasks:                 [] as { taskName: string; taskOrder: number; estimatedMins?: number }[],
  }),

  priceBookItem: () => ({
    category:   'LABOUR',
    name:       'HVAC Diagnostic',
    description:'Comprehensive system diagnostic and performance assessment',
    unit:       'hour',
    unitPrice:  125.00,
    taxable:    true,
  }),

  job: (customerId: string, jobTypeId: string) => ({
    customerId,
    customerName:   'Sarah Mitchell',
    customerPhone:  '+15125550202',
    customerEmail:  `sarah.mitchell+${TS}@example.com`,
    serviceAddress: '4821 Riverside Drive',
    serviceCity:    'Austin',
    serviceState:   'TX',
    serviceZip:     '78704',
    serviceLatitude:  30.2672,
    serviceLongitude: -97.7431,
    jobTypeId,
    title:          'Annual HVAC Tune-Up + Refrigerant Check',
    description:    'Customer reports AC is running but not cooling efficiently. Last service was 18 months ago.',
    priority:       'NORMAL',
    estimatedDurationMins: 90,
    notes:          'Gate code: 1234. Dog on premises — call before entering backyard.',
    tags:           ['annual-service', 'maintenance'],
  }),

  // ── Finance ───────────────────────────────────────────────────────────────

  quote: (customerId: string, jobId?: string) => ({
    customerId,
    customerName:   'Sarah Mitchell',
    customerEmail:  `sarah.mitchell+${TS}@example.com`,
    jobId,
    title:          'Annual HVAC Maintenance + Refrigerant Top-Up',
    description:    'Complete maintenance service including refrigerant check and top-up if needed.',
    validUntil:     new Date(Date.now() + 30 * 86400000).toISOString(),
    taxRate:        0.0825,
    notes:          'Price valid for 30 days from date of issue.',
    terms:          'Payment due upon job completion.',
    lineItems: [
      {
        description: 'Annual AC Tune-Up (Labour)',
        category:    'LABOUR',
        quantity:    1.5,
        unitPrice:   125.00,
        taxable:     true,
        total:       undefined as number | undefined,
      },
      {
        description: 'R-410A Refrigerant (per lb)',
        category:    'PARTS',
        quantity:    2,
        unitPrice:   45.00,
        taxable:     true,
        total:       undefined as number | undefined,
      },
      {
        description: 'System Diagnostic',
        category:    'LABOUR',
        quantity:    0.5,
        unitPrice:   125.00,
        taxable:     false,
        total:       undefined as number | undefined,
      },
    ],
  }),

  // ── Comms ─────────────────────────────────────────────────────────────────

  smsTemplate: () => ({
    name:     'Job Completion Thank You',
    type:     'JOB_STATUS',
    channel:  'SMS',
    body:     'Hi {{customerName}}, your {{serviceType}} service is complete! Technician {{techName}} finished at {{completedAt}}. To leave a review, visit {{reviewLink}}. — T&S Services',
    variables: ['customerName', 'serviceType', 'techName', 'completedAt', 'reviewLink'],
    isActive:  true,
  }),

  emailTemplate: () => ({
    name:     'Invoice Ready',
    type:     'PAYMENT',
    channel:  'EMAIL',
    subject:  'Your Invoice #{{invoiceNumber}} is Ready — T&S Services',
    body:     '<p>Hi {{customerName}},</p><p>Your invoice <strong>#{{invoiceNumber}}</strong> for {{serviceTitle}} is ready.</p><p>Amount Due: <strong>${{amount}}</strong></p><p><a href="{{paymentLink}}">Pay Now →</a></p><p>Thank you for choosing T&S Services!</p>',
    variables: ['customerName', 'invoiceNumber', 'serviceTitle', 'amount', 'paymentLink'],
    isActive:  true,
  }),

  automationRule: (templateId: string) => ({
    name:        'Notify customer when job is completed',
    description: 'Automatically sends a thank-you SMS to the customer when a technician marks a job as COMPLETED.',
    trigger:     'JOB_STATUS_CHANGED',
    isActive:    true,
    conditions:  [
      { field: 'newStatus', operator: 'eq', value: 'COMPLETED' },
    ],
    actions: [
      {
        channel:    'SMS',
        templateId,
        recipientType: 'CUSTOMER',
        delayMinutes: 0,
      },
    ],
  }),
};

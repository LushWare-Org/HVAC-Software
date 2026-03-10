/**
 * Shared State Store
 *
 * Holds IDs and data created during tests so later steps can reference them.
 * Because Jest runs flow tests with --runInBand (sequential), module-level
 * state persists across test files within the same process.
 *
 * Each flow that creates entities should populate the relevant fields here
 * so that the Full Showcase (Flow 10) can chain everything together.
 */

export const state: {
  // CRM
  leadId:             string;
  customerId:         string;
  contactId:          string;
  secondCustomerId:   string;
  bookingId:          string;
  reviewId:           string;
  agreementId:        string;

  // Jobs
  jobTypeId:          string;
  jobTemplateId:      string;
  jobId:              string;
  workOrderId:        string;
  priceBookItemId:    string;

  // Finance
  quoteId:            string;
  invoiceId:          string;
  paymentId:          string;
  recurringScheduleId:string;

  // Scheduling
  appointmentId:      string;

  // Comms
  automationRuleId:   string;
  automationRule1Id:  string;
  automationRule2Id:  string;
  notificationId:     string;
  messageThreadId:    string;
  templateId:         string;
  smsTemplateId:      string;
  emailTemplateId:    string;

  // Misc
  technicianId:       string;
  companyId:          string;
} = {
  leadId:              '',
  customerId:          '',
  contactId:           '',
  secondCustomerId:    '',
  bookingId:           '',
  reviewId:            '',
  agreementId:         '',
  jobTypeId:           '',
  jobTemplateId:       '',
  jobId:               '',
  workOrderId:         '',
  priceBookItemId:     '',
  quoteId:             '',
  invoiceId:           '',
  paymentId:           '',
  recurringScheduleId: '',
  appointmentId:       '',
  automationRuleId:    '',
  automationRule1Id:   '',
  automationRule2Id:   '',
  notificationId:      '',
  messageThreadId:     '',
  templateId:          '',
  smsTemplateId:       '',
  emailTemplateId:     '',
  technicianId:        'user-tech-001',
  companyId:           process.env.TEST_COMPANY_ID ?? 'co-demo-001',
};

import { describeAction } from './describe-action';

describe('describeAction', () => {
  it('matches a templated route and fills the description from the response body', () => {
    const result = describeAction('jobs', 'POST', '/jobs', {}, { id: 'j1', title: 'Fix AC unit' });
    expect(result.action).toBe('job.created');
    expect(result.description).toBe('Created job "Fix AC unit"');
  });

  it('names the customer and assigned technician on job creation when available', () => {
    const result = describeAction(
      'jobs', 'POST', '/jobs', {},
      { id: 'j1', title: 'Fix AC unit', customerName: 'Saman Perera', assignedToName: 'Kasun Silva' },
    );
    expect(result.description).toBe('Created job "Fix AC unit" for Saman Perera — assigned to Kasun Silva');
  });

  it('matches a templated route with a path param placeholder', () => {
    const result = describeAction('jobs', 'PATCH', '/jobs/:id/status', { status: 'COMPLETED' }, {});
    expect(result.action).toBe('job.status_changed');
    expect(result.description).toBe('Changed job status to COMPLETED');
  });

  it('narrates an EN_ROUTE status change with the technician and customer named', () => {
    const result = describeAction(
      'jobs', 'PATCH', '/jobs/:id/status', { status: 'EN_ROUTE' },
      { title: 'Fix AC unit', customerName: 'Saman Perera', assignedToName: 'Kasun Silva' },
    );
    expect(result.action).toBe('job.status_changed');
    expect(result.description).toBe('Kasun Silva is on the way to Saman Perera’s job "Fix AC unit"');
  });

  it('narrates a SCHEDULED status change', () => {
    const result = describeAction(
      'jobs', 'PATCH', '/jobs/:id/status', { status: 'SCHEDULED' },
      { title: 'Fix AC unit', customerName: 'Saman Perera', assignedToName: 'Kasun Silva' },
    );
    expect(result.description).toBe('Saman Perera’s job "Fix AC unit" was scheduled — assigned to Kasun Silva');
  });

  it('narrates the en-route customer notification with technician name and ETA', () => {
    const result = describeAction(
      'comms', 'POST', '/notifications/en-route', {
        jobTitle: 'Fix AC unit', customerName: 'Saman Perera', techName: 'Kasun Silva', etaStart: '2026-08-16T10:00:00Z',
      },
      { email: true, sms: true, deduped: false },
    );
    expect(result.action).toBe('technician.en_route_notified');
    expect(result.description).toBe(
      'Notified Saman Perera that Kasun Silva is on the way to "Fix AC unit" — email (with photo) and SMS sent',
    );
  });

  it('narrates a recorded manual payment with amount and method', () => {
    const result = describeAction('finance', 'POST', '/invoices/:id/payments', { amount: 250, method: 'CASH' }, {});
    expect(result.action).toBe('invoice.payment_recorded');
    expect(result.description).toBe('Recorded a $250 cash payment on an invoice');
  });

  it('falls back to a plain-English sentence for an untemplated route — never raw HTTP text', () => {
    const result = describeAction('inventory', 'GET', '/inventory/items/:id', {}, {});
    expect(result.action).toBe('http.request');
    expect(result.description).toBe('Viewed inventory items');
    expect(result.description).not.toMatch(/GET|POST|PATCH|DELETE|\//);
  });

  it('falls back gracefully when a matched template has no useful input', () => {
    const result = describeAction('crm', 'POST', '/customers', {}, {}); // no name in body
    expect(result.action).toBe('customer.created');
    expect(result.description).toBe('Created a new customer');
  });
});

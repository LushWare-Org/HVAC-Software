import { buildRescheduleEmail, type RescheduleEmailInput } from './reschedule-email';

// Not `as const` — that makes `slots` readonly, which the mutable
// RescheduleEmailSlot[] on the input type rejects.
const base: Omit<RescheduleEmailInput, 'event'> = {
  companyName: 'Acme HVAC',
  customerName: 'Alice',
  jobTitle: 'AC Maintenance',
  jobNumber: 'JOB-2026-0001',
  portalUrl: 'https://portal.test/jobs?reschedule=job-1',
  timeZone: 'America/Chicago',
  slots: [
    { id: 's1', startAt: '2026-08-12T13:00:00.000Z', endAt: '2026-08-12T17:00:00.000Z', window: 'morning' },
    { id: 's2', startAt: '2026-08-13T17:00:00.000Z', endAt: '2026-08-13T21:00:00.000Z', window: 'afternoon' },
  ],
};

describe('buildRescheduleEmail', () => {
  it('lists every proposed slot, rendered in the tenant timezone', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED' });
    expect(html).toContain('Morning');
    expect(html).toContain('Afternoon');
    // 13:00Z is 8:00 AM in Chicago (CDT). Rendering in UTC would say 1:00 PM.
    expect(html).toContain('8:00');
  });

  it('uses no gradients — the house rule for this email family', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED' });
    expect(html).not.toContain('gradient');
  });

  it('carries the tenant company name and the HVACtor.ai footer', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED' });
    expect(html).toContain('Acme HVAC');
    expect(html).toContain('Powered by HVACtor.ai');
    expect(html).toContain('JOB-2026-0001');
  });

  it('links to the portal so the customer can actually act', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED' });
    expect(html).toContain('https://portal.test/jobs?reschedule=job-1');
    expect(html).toContain('Choose a time');
  });

  it('an open ask with no slots asks for availability instead of listing times', () => {
    const { subject, html } = buildRescheduleEmail({ ...base, event: 'OPENED', slots: [] });
    expect(subject.toLowerCase()).toContain('reschedule');
    expect(html).toContain('what times work for you');
  });

  it('the applied email leads with the confirmed time', () => {
    const { subject, html } = buildRescheduleEmail({
      ...base, event: 'APPLIED', slots: [],
      appliedSlot: { startAt: '2026-08-12T13:00:00.000Z', endAt: '2026-08-12T17:00:00.000Z', window: 'morning' },
    });
    expect(subject.toLowerCase()).toContain('confirmed');
    expect(html).toContain('Confirmed for');
    expect(html).toContain('8:00');
    expect(html).toContain('View your booking');
  });

  it('the closed email has no call to action — there is nothing to do', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'CLOSED', slots: [] });
    expect(html).not.toContain('Choose a time');
    expect(html).toContain('still stands');
  });

  it('shows the reason when one was given', () => {
    const { html } = buildRescheduleEmail({ ...base, event: 'OPENED', reasonText: 'Parts delay' });
    expect(html).toContain('Parts delay');
  });

  it('escapes HTML in every user-supplied field', () => {
    const { html } = buildRescheduleEmail({
      ...base, event: 'OPENED',
      customerName: '<script>alert(1)</script>',
      jobTitle: '<img onerror=x>',
      reasonText: '<b>bold</b>',
      companyName: '<i>co</i>',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img onerror');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img onerror=x&gt;');
  });

  it('the nudge email says it is a reminder', () => {
    const { subject, html } = buildRescheduleEmail({ ...base, event: 'NUDGE' });
    expect(subject.toLowerCase()).toContain('reminder');
    expect(html).toContain('still waiting');
  });

  it('falls back to an exact time range for a slot with no window', () => {
    const { html } = buildRescheduleEmail({
      ...base, event: 'OPENED',
      slots: [{ startAt: '2026-08-12T14:30:00.000Z', endAt: '2026-08-12T16:30:00.000Z', window: null }],
    });
    expect(html).not.toContain('Morning');
    expect(html).toContain('9:30'); // 14:30Z → 9:30 AM Chicago
  });
});

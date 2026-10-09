import { jobScheduleEmail } from './job-schedule.email';
import { scheduleUpdateText, RESCHEDULE_HINT } from '../job-updates/job-updates.service';
import type { JobScheduleChangedEvent } from './dto/automation.dto';

const ev = (over: Partial<JobScheduleChangedEvent> = {}): JobScheduleChangedEvent => ({
  companyId: 'c1', jobId: 'job-123456', change: 'SCHEDULED', customerId: 'cu1', customerName: 'Hana',
  customerEmail: 'h@x.lk', jobTitle: 'AC repair', technicianName: 'Silva', jobAddress: '1 Main St', ...over,
});

describe('schedule message text', () => {
  const base = { companyId: 'c1', jobId: 'j1', jobTitle: 'AC repair', technicianName: 'Silva', whenLabel: 'Mon 12 Oct, 9:00 AM' };
  it('says when, who, and how to ask for another time', () => {
    const t = scheduleUpdateText({ ...base, change: 'SCHEDULED' });
    expect(t).toContain('booked for Mon 12 Oct, 9:00 AM');
    expect(t).toContain('Silva will be your technician');
    expect(t).toContain(RESCHEDULE_HINT);
  });
  it('shows what the time was before', () => {
    expect(scheduleUpdateText({ ...base, change: 'TIME_CHANGED', previousLabel: 'Sun 11 Oct, 2:00 PM' })).toContain('(it was Sun 11 Oct, 2:00 PM)');
  });
  it('uses the arrival window when the customer booked one', () => {
    expect(scheduleUpdateText({ ...base, change: 'SCHEDULED', windowLabel: 'Mon 12 Oct, between 8:00 AM and 12:00 PM' })).toContain('between 8:00 AM and 12:00 PM');
  });
  it('names the new technician', () => {
    expect(scheduleUpdateText({ ...base, change: 'TECH_CHANGED' })).toContain('Silva will now be your technician');
  });
});

describe('schedule email', () => {
  it('carries the time, the technician and a button to ask for another time', () => {
    const m = jobScheduleEmail({ event: ev(), brand: { name: 'Orrix' }, confirmUrl: 'https://p.example/jobs?confirm=job-123456', whenLabel: 'Mon 12 Oct, 9:00 AM', rescheduleUrl: 'https://p.example/jobs?reschedule=job-123456' });
    expect(m.subject).toBe('Your visit is booked: AC repair');
    expect(m.html).toContain('Confirm this time');
    expect(m.html).toContain('Orrix');
    expect(m.html).toContain('Mon 12 Oct, 9:00 AM');
    expect(m.html).toContain('Silva');
    expect(m.html).toContain('https://p.example/jobs?reschedule=job-123456');
    expect(m.html).toContain('Ask for another time');
  });
  it('escapes what customers and staff typed', () => {
    const m = jobScheduleEmail({ event: ev({ customerName: '<b>x</b>' }), brand: { name: 'O' }, confirmUrl: 'c', whenLabel: 'w', rescheduleUrl: 'u' });
    expect(m.html).not.toContain('<b>x</b>');
  });
  it('explains the arrival window', () => {
    const m = jobScheduleEmail({ event: ev(), brand: { name: 'O' }, confirmUrl: 'c', whenLabel: 'w', windowLabel: 'Mon 12 Oct, between 8:00 AM and 12:00 PM', rescheduleUrl: 'u' });
    expect(m.html).toContain('some time in this window');
  });
});

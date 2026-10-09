import { mapCustomerNotes } from './portal';

const now = new Date('2026-10-12T04:00:00Z'); // Mon 12 Oct, 9:30 am in Colombo
const tz = 'Asia/Colombo';
const job = (extra: Record<string, unknown>) => ({ id: 'j-1', jobNumber: 'JOB-0412', title: 'AC not cooling', status: 'SCHEDULED', assignedToName: 'Kasun Fernando', ...extra });

describe('mapCustomerNotes', () => {
  it('a technician on the way, or with them now, comes first', () => {
    const [n] = mapCustomerNotes({ jobs: [job({ status: 'EN_ROUTE' })] }, now, tz);
    expect(n).toMatchObject({ id: 'onway:j-1', urgency: 'urgent', title: 'Kasun is on the way', why: 'For JOB-0412, AC not cooling.' });
    expect(mapCustomerNotes({ jobs: [job({ status: 'ON_SITE' })] }, now, tz)[0].title).toBe('Kasun is with you now');
  });

  it('a visit in the next two days, with change and note buttons', () => {
    const [n] = mapCustomerNotes({ jobs: [job({ scheduledStart: '2026-10-13T03:30:00Z' }), job({ id: 'j-2', scheduledStart: '2026-10-20T03:30:00Z' })] }, now, tz);
    expect(n).toMatchObject({
      id: 'visit:j-1:2026-10-13T03:30:00Z', title: 'Your visit is tomorrow at 9:00 am', why: 'AC not cooling, with Kasun.',
      fixes: [{ label: 'Change time', request: 'I need to move my visit JOB-0412' }, { label: 'Note for the technician', request: 'I want to leave a note for the technician on JOB-0412' }],
    });
    expect(mapCustomerNotes({ jobs: [job({ scheduledStart: '2026-10-20T03:30:00Z' })] }, now, tz)).toEqual([]);
  });

  it('quotes waiting for them, with Accept and Decline', () => {
    const [n] = mapCustomerNotes({ quotes: [{ id: 'q-1', quoteNumber: 'Q-0042', title: 'Compressor replacement', status: 'SENT', total: '505', currency: 'USD', validUntil: '2026-10-20T00:00:00Z' }, { id: 'q-2', status: 'ACCEPTED' }] }, now, tz);
    expect(n).toMatchObject({
      id: 'quote:q-1', title: 'Quote Q-0042 is waiting for you', why: 'Compressor replacement, $505.00. Valid until Tue 20 Oct.',
      fixes: [{ label: 'Accept', request: 'Accept quote Q-0042' }, { label: 'Decline', request: 'I want to decline quote Q-0042' }],
    });
  });

  it('invoices overdue or due within a week link to paying them', () => {
    const notes = mapCustomerNotes({ invoices: [
      { id: 'i-1', invoiceNumber: 'INV-0042', status: 'OVERDUE', balanceDue: '450', currency: 'USD', dueDate: '2026-10-01T00:00:00Z' },
      { id: 'i-2', invoiceNumber: 'INV-0043', status: 'SENT', balanceDue: '120', currency: 'USD', dueDate: '2026-10-15T00:00:00Z' },
      { id: 'i-3', invoiceNumber: 'INV-0044', status: 'SENT', balanceDue: '90', currency: 'USD', dueDate: '2026-11-30T00:00:00Z' },
      { id: 'i-4', invoiceNumber: 'INV-0045', status: 'PAID', balanceDue: '0', currency: 'USD', dueDate: '2026-10-01T00:00:00Z' },
    ] }, now, tz);
    expect(notes.map((n) => [n.title, n.fixes[0]])).toEqual([
      ['INV-0042 is overdue: $450.00', { label: 'Pay now', href: '/invoices' }],
      ['INV-0043 is due in 3 days: $120.00', { label: 'Pay now', href: '/invoices' }],
    ]);
  });

  it('puts what is happening now first, and ignores missing parts', () => {
    const notes = mapCustomerNotes({ jobs: [job({ status: 'EN_ROUTE' })], quotes: [{ id: 'q-1', quoteNumber: 'Q-1', status: 'VIEWED', total: '1' }], invoices: undefined }, now, tz);
    expect(notes.map((n) => n.id)).toEqual(['onway:j-1', 'quote:q-1']);
  });
});

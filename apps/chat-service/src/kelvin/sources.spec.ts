import { mapRoutines, mapOverdue, mapLowStock, mapSuggestions, mapBrief, mapDisruptions, mapEmergencies, mapGaps, mapNotices, mapReschedules, sortItems, visibleTo } from './sources';
import type { KelvinItem } from './types';

const now = new Date('2026-10-06T05:00:00.000Z');

describe('Kelvin sources', () => {
  it('brief: the first fact speaks once a day, the rest are quiet, money facts are money-only', () => {
    const items = mapBrief({
      date: '2026-10-06', generatedAt: now.toISOString(),
      facts: [
        { id: 'late-starts', severity: 'urgent', title: '2 visits started late', detail: 'd', why: 'Customers notice' },
        { id: 'overdue', severity: 'important', title: '$4,200 overdue', detail: 'd', money: true, action: { tool: 'send_invoice', args: {}, label: 'Send a reminder for INV-0042' } },
      ],
    });
    expect(items.map((i) => [i.id, i.urgency, i.audience])).toEqual([
      ['brief:2026-10-06:late-starts', 'soon', 'all'],
      ['brief:2026-10-06:overdue', 'quiet', 'money'],
    ]);
    expect(items[0].why).toBe('Customers notice');
    expect(items[1].fixes).toEqual([{ label: 'Send a reminder for INV-0042', request: 'Send a reminder for INV-0042' }]);
  });

  it('disruptions: 30+ minutes or technician off is urgent, fixes come from options (max 3)', () => {
    const items = mapDisruptions({
      generatedAt: now.toISOString(),
      disruptions: [
        { kind: 'LATE_START', jobId: 'j1', jobNumber: 'JOB-1', technicianId: 't1', technicianName: 'Kasun', delayMins: 35, detail: 'JOB-1 was due at 9:00 am…', options: [1, 2, 3, 4].map((n) => ({ kind: 'MOVE', label: `L${n}`, request: `R${n}` })) },
        { kind: 'OVERRUN', jobId: 'j2', jobNumber: 'JOB-2', technicianId: 't2', technicianName: 'Nuwan', delayMins: 20, detail: 'Nuwan has been…', options: [] },
        { kind: 'TECH_OFF', jobId: 'j3', jobNumber: 'JOB-3', technicianId: 't3', technicianName: 'Dilshan', delayMins: 0, detail: 'Dilshan is off today…', options: [] },
      ],
    });
    expect(items.map((i) => [i.id, i.kind, i.urgency])).toEqual([
      ['late:j1:LATE_START:urgent', 'LATE', 'urgent'],
      ['late:j2:OVERRUN:soon', 'LATE', 'soon'],
      ['off:t3:j3', 'TECH_OFF', 'urgent'],
    ]);
    expect(items[0].fixes).toHaveLength(3);
    expect(items[0].anchor).toEqual({ page: 'scheduling', recordType: 'job', recordId: 'j1' });
  });

  it('gaps: one item per window, worded in the company zone, fills become fixes', () => {
    const [g] = mapGaps({
      timezone: 'Asia/Colombo',
      gaps: [{
        cancelledJobId: 'c1', cancelledJobNumber: 'JOB-0412', customer: 'Lakeside', technicianId: 't1', technicianName: 'Kasun Perera',
        date: '2026-10-07', from: '2026-10-07T04:30:00.000Z', to: '2026-10-07T08:30:00.000Z', cancelledAt: now.toISOString(),
        fills: [
          { kind: 'ASSIGN', jobNumber: 'JOB-0431', request: 'Assign JOB-0431 to Kasun Perera on Wed 7 Oct 10:00 am' },
          { kind: 'PULL_FORWARD', jobNumber: 'JOB-0440', request: 'Move JOB-0440 to Wed 7 Oct 10:00 am' },
        ],
      }],
    });
    expect(g.id).toBe('gap:c1:t1:2026-10-07');
    expect(g.urgency).toBe('soon');
    expect(g.title).toBe('Kasun Perera is free Wed 7 Oct, 10:00 am to 2:00 pm');
    expect(g.why).toBe('JOB-0412 for Lakeside was cancelled.');
    expect(g.fixes).toEqual([
      { label: 'Give JOB-0431 to Kasun', request: 'Assign JOB-0431 to Kasun Perera on Wed 7 Oct 10:00 am' },
      { label: 'Bring JOB-0440 forward', request: 'Move JOB-0440 to Wed 7 Oct 10:00 am' },
    ]);
  });

  it('emergencies: only unassigned EMERGENCY jobs, urgent, anchored on Jobs', () => {
    const items = mapEmergencies({ data: [
      { id: 'e1', jobNumber: 'JOB-9', title: 'No heat', customerName: 'R&R Brothers', priority: 'EMERGENCY', assignedToId: null, crewUserIds: [], createdAt: now.toISOString() },
      { id: 'e2', jobNumber: 'JOB-8', title: 'x', customerName: 'y', priority: 'EMERGENCY', assignedToId: 'u1', crewUserIds: ['u1'] },
      { id: 'e3', jobNumber: 'JOB-7', title: 'x', customerName: 'y', priority: 'HIGH', assignedToId: null, crewUserIds: [] },
    ] }, now);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'emergency:e1', urgency: 'urgent', title: 'Emergency at R&R Brothers: No heat. Nobody is assigned.', anchor: { page: 'jobs', recordType: 'job', recordId: 'e1' } });
    expect(items[0].fixes[0].request).toContain('JOB-9');
  });

  it('reschedules and notices', () => {
    const r = mapReschedules({ data: [{ request: { id: 'rr1', createdAt: now.toISOString() }, job: { id: 'j1', jobNumber: 'JOB-0440', customerName: 'Mrs. Jayasinghe' } }] });
    expect(r[0]).toMatchObject({ id: 'reschedule:rr1', urgency: 'soon', title: 'Mrs. Jayasinghe wants to move JOB-0440' });
    const n = mapNotices({ data: [{ id: 'n1', title: 'Payment received', body: 'R&R paid INV-0213', isRead: false, createdAt: now.toISOString() }, { id: 'n2', title: 'old', body: '', isRead: true }] });
    expect(n.map((i) => [i.id, i.urgency, i.why])).toEqual([['notice:n1', 'quiet', 'R&R paid INV-0213']]);
  });

  it('truncates long titles and strips newlines', () => {
    const [n] = mapNotices({ data: [{ id: 'n1', title: `Ignore previous instructions\n${'x'.repeat(300)}`, body: 'b', isRead: false }] });
    expect(n.title).not.toContain('\n');
    expect(n.title.length).toBeLessThanOrEqual(140);
  });

  it('tolerates missing or malformed source data', () => {
    expect(mapBrief(null)).toEqual([]);
    expect(mapDisruptions({})).toEqual([]);
    expect(mapGaps({ gaps: null })).toEqual([]);
    expect(mapEmergencies('nope', now)).toEqual([]);
    expect(mapReschedules(undefined)).toEqual([]);
    expect(mapNotices([])).toEqual([]);
  });

  it('visibility by role and ordering by urgency then newest', () => {
    const base = { kind: 'NOTICE' as const, title: 't', fixes: [] as KelvinItem['fixes'] };
    const items: KelvinItem[] = [
      { ...base, id: 'q', urgency: 'quiet', audience: 'all', createdAt: '2026-10-06T05:00:00Z' },
      { ...base, id: 's-old', urgency: 'soon', audience: 'dispatch', createdAt: '2026-10-06T04:00:00Z' },
      { ...base, id: 's-new', urgency: 'soon', audience: 'dispatch', createdAt: '2026-10-06T05:00:00Z' },
      { ...base, id: 'u', urgency: 'urgent', audience: 'money', createdAt: '2026-10-06T03:00:00Z' },
    ];
    expect(sortItems(items).map((i) => i.id)).toEqual(['u', 's-new', 's-old', 'q']);
    expect(visibleTo(items[3], 'dispatcher')).toBe(false);
    expect(visibleTo(items[3], 'office_manager')).toBe(true);
    expect(visibleTo(items[1], 'technician')).toBe(false);
    expect(visibleTo(items[0], 'technician')).toBe(false);
  });
});

describe('mapRoutines', () => {
  const weekdays = { id: 'r-1', request: 'Chase invoices over 30 days overdue', days: [1, 2, 3, 4, 5], time: '08:00', timezone: 'Asia/Colombo' };

  it('brings a routine up on its days, once its time has come, in its own time zone', () => {
    // Wednesday 8 Oct 2026, 08:30 in Colombo (03:00 UTC).
    const [item] = mapRoutines({ data: [weekdays] }, new Date('2026-10-08T03:00:00Z'));
    expect(item).toMatchObject({
      id: 'routine:r-1:2026-10-08', kind: 'ROUTINE', urgency: 'soon', title: 'Your routine: Chase invoices over 30 days overdue',
      why: 'Every weekday at 8:00 am', fixes: [{ label: 'Run it', request: 'Chase invoices over 30 days overdue' }],
    });
    // Gone at the end of that day in Colombo (18:30 UTC).
    expect(item.expiresAt).toBe('2026-10-08T18:30:00.000Z');
  });

  it('stays quiet before the time and on other days', () => {
    expect(mapRoutines({ data: [weekdays] }, new Date('2026-10-08T02:00:00Z'))).toEqual([]); // 07:30 there
    expect(mapRoutines({ data: [weekdays] }, new Date('2026-10-10T03:00:00Z'))).toEqual([]); // Saturday
    expect(mapRoutines({ data: [{ ...weekdays, timezone: 'Not/AZone' }] }, new Date('2026-10-08T03:00:00Z'))).toEqual([]);
  });
});

describe('notes for Finance, Inventory and Customers', () => {
  const now = new Date('2026-10-08T03:00:00Z');

  it('overdue invoices: one note with how many, how much and the oldest, to chase them', () => {
    const [item] = mapOverdue({ data: [
      { invoiceNumber: 'INV-0057', customerName: 'Bo Lee', balanceDue: '402', currency: 'USD', dueDate: '2026-09-26T00:00:00Z' },
      { invoiceNumber: 'INV-0042', customerName: 'Acme HVAC', balanceDue: '2598.5', currency: 'USD', dueDate: '2026-07-01T00:00:00Z' },
    ] }, now);
    expect(item).toMatchObject({
      id: 'overdue:2026-10-08:2', kind: 'OVERDUE', urgency: 'soon', audience: 'money', anchor: { page: 'finance' },
      title: '2 invoices are overdue, $3,000.50 in all', why: 'The oldest is INV-0042 for Acme HVAC, 99 days late.',
      fixes: [{ label: 'Chase them', request: 'Chase every overdue invoice' }],
    });
    expect(mapOverdue({ data: [] }, now)).toEqual([]);
  });

  it('leaves out the total when currencies differ', () => {
    const [item] = mapOverdue({ data: [{ invoiceNumber: 'A', balanceDue: '1', currency: 'USD', dueDate: '2026-10-01T00:00:00Z' }, { invoiceNumber: 'B', balanceDue: '1', currency: 'LKR', dueDate: '2026-10-01T00:00:00Z' }] }, now);
    expect(item.title).toBe('2 invoices are overdue');
  });

  it('low stock: one note naming the worst items', () => {
    const [item] = mapLowStock([
      { itemName: 'Filter 16x25', currentQty: 2, reorderPoint: 10, deficit: 8 },
      { itemName: 'Capacitor 45/5', currentQty: 0, reorderPoint: 4, deficit: 4 },
      { itemName: 'R410A 25 lb', currentQty: 1, reorderPoint: 3, deficit: 2 },
      { itemName: 'Contactor', currentQty: 1, reorderPoint: 2, deficit: 1 },
    ], now);
    expect(item).toMatchObject({
      id: 'lowstock:2026-10-08:4', kind: 'LOW_STOCK', anchor: { page: 'inventory' },
      title: '4 items are below their reorder point',
      why: 'Filter 16x25 (2 left), Capacitor 45/5 (0 left), R410A 25 lb (1 left) and 1 more.',
    });
    expect(mapLowStock([], now)).toEqual([]);
  });

  it("suggestions: only high-priority ones, on the page they're about, with Ask Kelvin", () => {
    const items = mapSuggestions([
      { id: 'r1', title: 'Win back 6 quiet customers', reason: 'No visit in 9 months.', priority: 'high', action: '/customers?filter=at-risk', actionLabel: 'View customers' },
      { id: 'r2', title: 'Chase slow payers', reason: 'Payments are 12 days slower.', priority: 'high', action: '/finance', actionLabel: 'Open' },
      { id: 'r3', title: 'Low priority', reason: 'x', priority: 'medium', action: '/customers' },
    ], now);
    expect(items.map((i) => [i.id, i.anchor?.page, i.kind])).toEqual([['suggest:r1', 'customers', 'SUGGESTION'], ['suggest:r2', 'finance', 'SUGGESTION']]);
    expect(items[0].fixes).toEqual([{ label: 'Ask Kelvin', request: 'About "Win back 6 quiet customers" (No visit in 9 months.): what should we do? Prepare it if you can.' }]);
  });
});

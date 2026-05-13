import { EquipmentAutomationService } from './equipment-automation.service';
import { EquipmentWithCustomer } from './crm.client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

function makeEq(overrides: Partial<EquipmentWithCustomer> = {}): EquipmentWithCustomer {
  return {
    id: 'eq-1',
    companyId: 'co-1',
    customerId: 'cust-1',
    type: 'AC Unit',
    brand: 'Carrier',
    model: 'Model X',
    serialNo: null,
    installDate: null,
    warrantyEnd: null,
    customer: {
      id: 'cust-1',
      companyId: 'co-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phone: '+15551234567',
      mobile: null,
      zipCode: '30301',
      state: 'GA',
      isActive: true,
    },
    ...overrides,
  };
}

function makeService() {
  const db = {
    sendJob: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'sj-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const suppression = { isSuppressed: jest.fn().mockResolvedValue(false) };
  const sms = { send: jest.fn().mockResolvedValue({ success: true }) };
  const email = { send: jest.fn() };
  const crmClient = { getEquipmentForAutomation: jest.fn(), getActiveCompanyIds: jest.fn() };
  const queue = { add: jest.fn().mockResolvedValue({}) };

  const service = new EquipmentAutomationService(
    db as any, suppression as any, sms as any, email as any, crmClient as any, queue as any,
  );
  return { service, db, suppression, sms, email, crmClient, queue };
}

// ── Template resolution ───────────────────────────────────────────────────────

describe('EquipmentAutomationService — template resolution', () => {
  let service: EquipmentAutomationService;

  beforeEach(() => {
    ({ service } = makeService());
  });

  // Access private method via bracket notation for unit testing the logic
  const resolve = (service: any, eq: EquipmentWithCustomer, today = new Date()) =>
    (service as any).resolveTemplate(eq, today);

  it('returns null when no installDate and no warrantyEnd', () => {
    expect(resolve(service, makeEq())).toBeNull();
  });

  it('returns null for inactive customer', async () => {
    const eq = makeEq({ installDate: daysAgo(200), customer: { ...makeEq().customer, isActive: false } });
    const result = await service.evaluateEquipment(eq);
    expect(result).toBeNull();
  });

  it('triggers hvac-tune-up-6mo at exactly 183 days', () => {
    const eq = makeEq({ installDate: daysAgo(183) });
    expect(resolve(service, eq)).toBe('hvac-tune-up-6mo');
  });

  it('triggers hvac-tune-up-6mo in the 7-day window (day 184)', () => {
    const eq = makeEq({ installDate: daysAgo(184) });
    expect(resolve(service, eq)).toBe('hvac-tune-up-6mo');
  });

  it('does NOT trigger tune-up outside the window (day 192)', () => {
    const eq = makeEq({ installDate: daysAgo(192) });
    // day 192 is past the 7-day window for the first period (183–189)
    // and before the second period (366)
    expect(resolve(service, eq)).toBeNull();
  });

  it('triggers hvac-tune-up-6mo again at the second period (day 366)', () => {
    const eq = makeEq({ installDate: daysAgo(366) });
    expect(resolve(service, eq)).toBe('hvac-tune-up-6mo');
  });

  it('triggers hvac-replacement-7yr at 2555 days', () => {
    const eq = makeEq({ installDate: daysAgo(2555) });
    expect(resolve(service, eq)).toBe('hvac-replacement-7yr');
  });

  it('triggers warranty-expiry-30d when warranty ends in 15 days', () => {
    const eq = makeEq({ warrantyEnd: daysFromNow(15) });
    expect(resolve(service, eq)).toBe('warranty-expiry-30d');
  });

  it('triggers warranty-expiry-30d at exactly 0 days (expiry day)', () => {
    const eq = makeEq({ warrantyEnd: daysFromNow(0) });
    expect(resolve(service, eq)).toBe('warranty-expiry-30d');
  });

  it('does NOT trigger warranty-expiry for already-expired warranty', () => {
    const eq = makeEq({ warrantyEnd: daysAgo(5) });
    expect(resolve(service, eq)).toBeNull();
  });

  it('warranty check takes priority over tune-up when both conditions are met', () => {
    const eq = makeEq({ installDate: daysAgo(183), warrantyEnd: daysFromNow(10) });
    expect(resolve(service, eq)).toBe('warranty-expiry-30d');
  });
});

// ── Idempotency ───────────────────────────────────────────────────────────────

describe('EquipmentAutomationService — idempotency', () => {
  it('skips equipment when same template was sent within 90 days', async () => {
    const { service, db, sms } = makeService();
    db.sendJob.count.mockResolvedValueOnce(1); // already sent
    const eq = makeEq({ installDate: daysAgo(183) });

    const result = await service.evaluateEquipment(eq);
    expect(result).toBeNull();
    expect(sms.send).not.toHaveBeenCalled();
  });
});

// ── Dispatch ──────────────────────────────────────────────────────────────────

describe('EquipmentAutomationService — dispatch', () => {
  it('sends SMS and queues email when not suppressed', async () => {
    const { service, db, sms, suppression, queue } = makeService();
    db.sendJob.count.mockResolvedValueOnce(0);
    const eq = makeEq({ installDate: daysAgo(183) });

    const result = await service.evaluateEquipment(eq);
    expect(result).not.toBeNull();
    expect(result!.smsSent).toBe(true);
    expect(result!.emailQueued).toBe(true);
    expect(sms.send).toHaveBeenCalledWith('+15551234567', expect.stringContaining('Alice'));
    expect(queue.add).toHaveBeenCalledWith('automation-email', expect.objectContaining({ to: 'alice@example.com' }), expect.any(Object));
  });

  it('skips SMS when phone is suppressed', async () => {
    const { service, db, suppression, sms, queue } = makeService();
    db.sendJob.count.mockResolvedValueOnce(0);
    (suppression.isSuppressed as jest.Mock)
      .mockResolvedValueOnce(true)   // SMS suppressed
      .mockResolvedValueOnce(false); // EMAIL not suppressed
    const eq = makeEq({ installDate: daysAgo(183) });

    const result = await service.evaluateEquipment(eq);
    expect(result!.smsSent).toBe(false);
    expect(result!.emailQueued).toBe(true);
    expect(sms.send).not.toHaveBeenCalled();
  });

  it('marks result as skipped when both channels are suppressed', async () => {
    const { service, db, suppression } = makeService();
    db.sendJob.count.mockResolvedValueOnce(0);
    (suppression.isSuppressed as jest.Mock).mockResolvedValue(true);
    const eq = makeEq({ installDate: daysAgo(183) });

    const result = await service.evaluateEquipment(eq);
    expect(result!.skipped).toBe(true);
    expect(result!.reason).toBe('no_reachable_address');
  });

  it('creates two SendJob rows (one SMS, one EMAIL) for tracking', async () => {
    const { service, db } = makeService();
    db.sendJob.count.mockResolvedValueOnce(0);
    const eq = makeEq({ installDate: daysAgo(183) });

    await service.evaluateEquipment(eq);
    expect(db.sendJob.create).toHaveBeenCalledTimes(2);
    const calls = (db.sendJob.create as jest.Mock).mock.calls;
    const channels = calls.map((c: any) => c[0].data.channel);
    expect(channels).toContain('SMS');
    expect(channels).toContain('EMAIL');
  });

  it('dedup key includes template key and equipment id', async () => {
    const { service, db } = makeService();
    db.sendJob.count.mockResolvedValueOnce(0);
    const eq = makeEq({ installDate: daysAgo(183) });

    await service.evaluateEquipment(eq);
    const createCall = (db.sendJob.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.automationTemplate).toBe('hvac-tune-up-6mo:eq-1');
  });
});

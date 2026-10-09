import { canAccessThread } from './messaging.service';

const officeThread = { customerId: 'c-1', participantIds: [], subject: null };
const techThread = { customerId: 'c-1', participantIds: ['u-rp'], subject: 'Tech: RP' };
const portalTechChat = { customerId: 'c-1', participantIds: [], subject: 'Chat with Technician: RP' };
const staffDm = { customerId: null, participantIds: ['u-admin', 'u-rp'], subject: null };

describe('old threads: who may see them', () => {
  it('office roles see office↔customer threads; technicians do not', () => {
    expect(canAccessThread(officeThread, { userId: 'u-disp', role: 'dispatcher' })).toBe(true);
    expect(canAccessThread(officeThread, { userId: 'u-rp', role: 'technician' })).toBe(false);
  });
  it("a technician's thread is theirs; the office can't open it", () => {
    expect(canAccessThread(techThread, { userId: 'u-rp', role: 'technician' })).toBe(true);
    expect(canAccessThread(techThread, { userId: 'u-admin', role: 'company_admin' })).toBe(false);
    expect(canAccessThread(portalTechChat, { userId: 'u-admin', role: 'company_admin' })).toBe(false);
  });
  it('customers see only their own threads; staff DMs only by their members', () => {
    expect(canAccessThread(officeThread, { userId: 'cu', role: 'customer', customerId: 'c-1' })).toBe(true);
    expect(canAccessThread(officeThread, { userId: 'cu', role: 'customer', customerId: 'c-2' })).toBe(false);
    expect(canAccessThread(staffDm, { userId: 'u-rp', role: 'technician' })).toBe(true);
    expect(canAccessThread(staffDm, { userId: 'u-disp', role: 'dispatcher' })).toBe(false);
  });
});

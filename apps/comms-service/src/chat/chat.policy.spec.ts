import { audienceRooms, canPost, canView, isMine, memberKeyFor, roomsForSocket, type ConvLike, type Viewer } from './chat.policy';

const admin: Viewer = { userId: 'u-admin', companyId: 'co', role: 'company_admin', name: 'Admin' };
const dispatcher: Viewer = { ...admin, userId: 'u-disp', role: 'dispatcher' };
const tech: Viewer = { userId: 'u-rp', companyId: 'co', role: 'technician', name: 'RP' };
const otherTech: Viewer = { userId: 'u-ot', companyId: 'co', role: 'technician', name: 'OT' };
const cust: Viewer = { userId: 'cu-1', companyId: 'co', role: 'customer', name: 'Aluthge', customerId: 'c-1' };
const otherCust: Viewer = { userId: 'cu-2', companyId: 'co', role: 'customer', name: 'Yumeth', customerId: 'c-2' };
const foreignAdmin: Viewer = { ...admin, companyId: 'other-co' };

const officeChat: ConvLike = { companyId: 'co', kind: 'CUSTOMER_OFFICE', customerId: 'c-1', members: [{ memberKey: 'office' }, { memberKey: 'customer:c-1' }] };
const techChat: ConvLike = { companyId: 'co', kind: 'CUSTOMER_TECH', customerId: 'c-1', members: [{ memberKey: 'u-rp' }, { memberKey: 'customer:c-1' }] };
const techOffice: ConvLike = { companyId: 'co', kind: 'TECH_OFFICE', members: [{ memberKey: 'office' }, { memberKey: 'u-rp' }] };
const dm: ConvLike = { companyId: 'co', kind: 'STAFF_DIRECT', members: [{ memberKey: 'u-admin' }, { memberKey: 'u-rp' }] };

describe('who can see what', () => {
  const cases: Array<[string, Viewer, ConvLike, boolean]> = [
    ['office sees the customer office chat', dispatcher, officeChat, true],
    ['the customer sees their office chat', cust, officeChat, true],
    ['another customer does not', otherCust, officeChat, false],
    ['a technician does not see office↔customer chats', tech, officeChat, false],
    ['the technician sees their private chat with the customer', tech, techChat, true],
    ['the customer sees it too', cust, techChat, true],
    ['the office does NOT see a customer↔technician chat', admin, techChat, false],
    ['another technician does not', otherTech, techChat, false],
    ['the office sees technician↔office chats', admin, techOffice, true],
    ['the technician sees their own office chat', tech, techOffice, true],
    ['another technician does not see it', otherTech, techOffice, false],
    ['a customer never sees technician↔office chats', cust, { ...techOffice, customerId: 'c-1' }, false],
    ['staff DMs: members only', tech, dm, true],
    ['staff DMs: not other office staff', dispatcher, dm, false],
    ['never another company', foreignAdmin, officeChat, false],
  ];
  it.each(cases)('%s', (_label, viewer, conv, expected) => expect(canView(viewer, conv)).toBe(expected));

  it('someone who left no longer sees it', () => {
    expect(canView(tech, { ...dm, members: [{ memberKey: 'u-admin' }, { memberKey: 'u-rp', leftAt: new Date() }] })).toBe(false);
  });

  it('archived conversations can be read but not posted to', () => {
    expect(canPost(cust, { ...officeChat, archivedAt: new Date() } as any)).toBe(false);
    expect(canView(cust, { ...officeChat, archivedAt: new Date() } as any)).toBe(true);
  });
});

describe('mine or theirs', () => {
  it('is decided by who sent it, not by in/out', () => {
    expect(isMine(admin, dm, { senderMemberKey: 'u-admin' })).toBe(true);
    expect(isMine(tech, dm, { senderMemberKey: 'u-admin' })).toBe(false);
    expect(isMine(cust, officeChat, { senderMemberKey: 'customer:c-1' })).toBe(true);
    expect(isMine(cust, officeChat, { senderMemberKey: 'office' })).toBe(false);
  });
  it("in the shared office inbox, every office reply is the office's", () => {
    expect(isMine(dispatcher, officeChat, { senderMemberKey: 'office' })).toBe(true);
    expect(isMine(admin, officeChat, { senderMemberKey: 'customer:c-1' })).toBe(false);
  });
});

describe('read markers and rooms', () => {
  it('office staff share the office seat in shared inboxes, and use their own elsewhere', () => {
    expect(memberKeyFor(dispatcher, officeChat)).toBe('office');
    expect(memberKeyFor(admin, dm)).toBe('u-admin');
    expect(memberKeyFor(cust, techChat)).toBe('customer:c-1');
  });

  it('events only go to rooms of people who may see the conversation', () => {
    expect(audienceRooms(officeChat).sort()).toEqual(['c:co:c-1', 'office:co']);
    expect(audienceRooms(techChat).sort()).toEqual(['c:co:c-1', 'u:u-rp']);
    expect(audienceRooms(dm).sort()).toEqual(['u:u-admin', 'u:u-rp']);
  });

  it('customers only join their own room; technicians never join the office room', () => {
    expect(roomsForSocket(cust)).toEqual(['c:co:c-1']);
    expect(roomsForSocket(tech)).toEqual(['u:u-rp']);
    expect(roomsForSocket(admin)).toEqual(['u:u-admin', 'office:co']);
  });
});

import { ChatService } from './chat.service';
import { ChatBus } from './chat.bus';
import type { Viewer } from './chat.policy';

const admin: Viewer = { userId: 'u-admin', companyId: 'co', role: 'company_admin', name: 'Admin' };
const tech: Viewer = { userId: 'u-rp', companyId: 'co', role: 'technician', name: 'RP Tech' };
const cust: Viewer = { userId: 'cu-1', companyId: 'co', role: 'customer', name: 'Aluthge', customerId: 'c-1' };
const kelvinHelper: Viewer = { ...admin };
const system: Viewer = { userId: 'system-job-service', companyId: 'co', role: 'company_admin', name: 'Job Service' };

const officeConv = (extra: any = {}) => ({
  id: 'conv-1', companyId: 'co', kind: 'CUSTOMER_OFFICE', customerId: 'c-1', customerName: 'Aluthge Pasindu', title: null,
  lastSeq: 4, archivedAt: null, lastMessageAt: null, lastMessagePreview: null, lastSenderName: null, createdAt: new Date(),
  members: [
    { id: 'm-o', memberKey: 'office', kind: 'OFFICE', name: 'Orrix', leftAt: null, hiddenAt: null, mutedUntil: null, lastReadSeq: 2 },
    { id: 'm-c', memberKey: 'customer:c-1', kind: 'CUSTOMER', name: 'Aluthge Pasindu', leftAt: null, hiddenAt: null, mutedUntil: null, lastReadSeq: 4 },
  ],
  ...extra,
});

function make(conv: any = officeConv()) {
  const sent: any[] = [];
  const prisma: any = {
    conversation: { findUnique: jest.fn(async () => conv), update: jest.fn(async () => conv) },
    chatMessage: { findUnique: jest.fn(async () => null), findMany: jest.fn(async () => []), update: jest.fn(async ({ data }: any) => ({ ...sent[0], ...data })) },
    chatMember: { updateMany: jest.fn(async () => ({ count: 1 })) },
    // The send statement: returns the saved row, built from its parameters.
    $queryRawUnsafe: jest.fn(async (sql: string, ...p: any[]) => {
      if (!sql.includes('INSERT INTO')) return [];
      const row = {
        id: 'msg-new', conversationId: p[0], companyId: p[1], seq: conv.lastSeq + 1, createdAt: p[2], senderName: p[4], senderKind: p[5],
        senderMemberKey: p[6], senderUserId: p[7], senderRole: p[8], body: p[9], attachments: p[10] ? JSON.parse(p[10]) : null,
        jobId: p[11], jobNumber: p[12], clientId: p[13], editedAt: null, deletedAt: null,
      };
      sent.push(row);
      return [row];
    }),
  };
  const dir: any = {
    companyName: jest.fn(async () => 'Orrix Engineering'),
    job: jest.fn(async (_c: string, id: string) => (id === 'j-mine' ? { id, jobNumber: 'JOB-29', customerId: 'c-1' } : id === 'j-other' ? { id, jobNumber: 'JOB-9', customerId: 'c-2' } : null)),
  };
  const bus = new ChatBus();
  const events: any[] = [];
  bus.on((e) => events.push(e));
  const sendSql = () => prisma.$queryRawUnsafe.mock.calls.filter((c: any[]) => String(c[0]).includes('INSERT INTO'));
  return { svc: new ChatService(prisma, dir, bus), prisma, events, sent, sendSql };
}

describe('seeing conversations', () => {
  it('reports a conversation someone may not see as not found', async () => {
    await expect(make().svc.visible(tech, 'conv-1')).rejects.toThrow('Conversation not found');
    await expect(make().svc.visible({ ...cust, customerId: 'c-2' }, 'conv-1')).rejects.toThrow('Conversation not found');
    await expect(make().svc.visible(cust, 'conv-1')).resolves.toBeTruthy();
  });

  it('names the conversation for each side: the customer sees the company, the office sees the customer', async () => {
    const { svc } = make();
    expect(svc.summary(cust, officeConv() as any, 0, 'Orrix Engineering').title).toBe('Orrix Engineering');
    expect(svc.summary(admin, officeConv() as any, 0, 'Orrix Engineering').title).toBe('Aluthge Pasindu');
    expect(svc.summary(admin, officeConv() as any, 0, 'Orrix').myMemberKey).toBe('office');
  });
});

describe('sending', () => {
  it('saves, numbers and marks it read for the sender in one statement, then tells everyone allowed to see it', async () => {
    const { svc, events, sendSql } = make();
    const m = await svc.send(cust, 'conv-1', { body: '  Hi, is RP still coming?  ', clientId: 'c-123' });
    expect(m).toMatchObject({ seq: 5, body: 'Hi, is RP still coming?', senderKind: 'CUSTOMER', senderMemberKey: 'customer:c-1', mine: true, clientId: 'c-123' });
    const [sql] = sendSql()[0];
    expect(sql).toContain('"comms"."ChatMessage"');
    expect(sql).toContain('ON CONFLICT ("conversationId", "clientId") DO NOTHING');
    expect(sql).toContain('"lastReadSeq" = m.seq');
    expect(events[0]).toMatchObject({ type: 'message', message: { seq: 5 } });
  });

  it('office replies are sent as the office seat but show who wrote them', async () => {
    expect(await make().svc.send(admin, 'conv-1', { body: 'Yes, by 2pm.' })).toMatchObject({ senderKind: 'STAFF', senderMemberKey: 'office', senderName: 'Admin', senderUserId: 'u-admin' });
  });

  it('Kelvin and our services post as themselves', async () => {
    expect(await make().svc.send(kelvinHelper, 'conv-1', { body: 'Running late', via: 'kelvin' })).toMatchObject({ senderKind: 'KELVIN', senderName: 'Kelvin' });
    expect(await make().svc.send(system, 'conv-1', { body: 'Please share your location' })).toMatchObject({ senderKind: 'SYSTEM', senderName: 'Orrix Engineering' });
  });

  it('a retry with the same client id returns the original instead of posting twice', async () => {
    const { svc, prisma } = make();
    prisma.$queryRawUnsafe.mockResolvedValueOnce([]); // the insert hit the client id: nothing new
    prisma.chatMessage.findUnique.mockResolvedValueOnce({ id: 'msg-old', seq: 3, body: 'Hi', senderKind: 'CUSTOMER', senderMemberKey: 'customer:c-1', deletedAt: null, attachments: null });
    const m = await svc.send(cust, 'conv-1', { body: 'Hi', clientId: 'c-123' });
    expect(m.id).toBe('msg-old');
  });

  it("refuses another customer's job, empty or archived messages, and people who can't see it", async () => {
    await expect(make().svc.send(admin, 'conv-1', { body: 'x', jobId: 'j-other' })).rejects.toThrow("isn't this customer's");
    expect(await make().svc.send(admin, 'conv-1', { body: 'x', jobId: 'j-mine' })).toMatchObject({ jobNumber: 'JOB-29' });
    await expect(make().svc.send(cust, 'conv-1', { body: '   ' })).rejects.toThrow('Write a message first');
    await expect(make(officeConv({ archivedAt: new Date() })).svc.send(cust, 'conv-1', { body: 'hi' })).rejects.toThrow('archived');
    await expect(make().svc.send(tech, 'conv-1', { body: 'hi' })).rejects.toThrow('Conversation not found');
  });

  it('only keeps https attachments', async () => {
    const { svc, sent } = make();
    await svc.send(cust, 'conv-1', { body: '', attachments: [{ url: 'https://cdn/x.jpg' }, { url: 'javascript:alert(1)' }] as any });
    expect(sent[0].attachments).toEqual([{ url: 'https://cdn/x.jpg' }]);
  });
});

describe('opening', () => {
  it('opens an existing conversation in one query, without looking anyone up', async () => {
    const { svc, prisma } = make();
    const dir = (svc as any).dir;
    dir.customer = jest.fn();
    const conv = await svc.openOffice(admin, 'c-1');
    expect(conv.id).toBe('conv-1');
    expect(dir.customer).not.toHaveBeenCalled();
    expect(prisma.conversation.findUnique).toHaveBeenCalledTimes(1);
  });
});

describe('reading and hiding', () => {
  it("moves only this person's read marker, never past the last message", async () => {
    const { svc, prisma, events } = make();
    await svc.markRead(admin, 'conv-1', 99);
    expect(prisma.chatMember.updateMany).toHaveBeenCalledWith({ where: { conversationId: 'conv-1', memberKey: 'office', lastReadSeq: { lt: 4 } }, data: expect.objectContaining({ lastReadSeq: 4 }) });
    expect(events[0]).toMatchObject({ type: 'read', memberKey: 'office', seq: 4 });
  });

  it('hiding only affects the person hiding; the office archives instead', async () => {
    const { svc, prisma } = make();
    await svc.hide(cust, 'conv-1');
    expect(prisma.chatMember.updateMany).toHaveBeenCalledWith({ where: { conversationId: 'conv-1', memberKey: 'customer:c-1' }, data: { hiddenAt: expect.any(Date) } });
    await expect(make().svc.hide(admin, 'conv-1')).rejects.toThrow('Archive');
    await expect(make().svc.archive(cust, 'conv-1', true)).rejects.toThrow('hide');
  });
});

describe('changing your own messages', () => {
  const msg = (extra: any = {}) => ({ id: 'msg-1', conversationId: 'conv-1', senderMemberKey: 'office', senderUserId: 'u-admin', createdAt: new Date(), deletedAt: null, ...extra });

  it('lets you edit your own message for 15 minutes', async () => {
    const { svc, prisma } = make();
    prisma.chatMessage.findUnique.mockResolvedValue(msg());
    prisma.chatMessage.update.mockResolvedValue({ ...msg(), body: 'Fixed', editedAt: new Date(), seq: 4, senderKind: 'STAFF' });
    expect(await svc.edit(admin, 'msg-1', 'Fixed')).toMatchObject({ body: 'Fixed' });
  });

  it("not a colleague's message in the shared inbox, and not after 15 minutes", async () => {
    const { svc, prisma } = make();
    prisma.chatMessage.findUnique.mockResolvedValue(msg({ senderUserId: 'u-someone-else' }));
    await expect(svc.edit(admin, 'msg-1', 'x')).rejects.toThrow('your own');
    prisma.chatMessage.findUnique.mockResolvedValue(msg({ createdAt: new Date(Date.now() - 20 * 60_000) }));
    await expect(svc.remove(admin, 'msg-1')).rejects.toThrow('15 minutes');
  });
});

describe('unread', () => {
  it('counts per person and leaves muted conversations out of the total', async () => {
    const { svc, prisma } = make();
    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ id: 'a', n: 2, muted: false }, { id: 'b', n: 5, muted: true }]);
    expect(await svc.unreadSummary(admin)).toEqual({ total: 2, byConversation: { a: 2, b: 5 } });
    expect(prisma.$queryRawUnsafe.mock.calls[0].slice(1)).toEqual(['co', ['u-admin', 'office']]);
    expect(prisma.$queryRawUnsafe.mock.calls[0][0]).toContain('"comms"."ChatMember"');
    await svc.unreadSummary(cust);
    expect(prisma.$queryRawUnsafe.mock.calls[1].slice(1)).toEqual(['co', ['customer:c-1'], 'c-1']);
    await svc.unreadSummary(tech);
    expect(prisma.$queryRawUnsafe.mock.calls[2].slice(1)).toEqual(['co', ['u-rp']]);
  });
});

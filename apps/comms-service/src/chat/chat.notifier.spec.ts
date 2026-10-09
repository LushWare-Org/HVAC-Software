import { ChatNotifier } from './chat.notifier';
import { ChatBus } from './chat.bus';

function make(viewing: string[] = [], telegramKeys: string[] = []) {
  const gateway: any = { isViewing: jest.fn(async (rooms: string[]) => rooms.some((r) => viewing.includes(r))) };
  const notifications: any = { sendPush: jest.fn(async () => ({})) };
  const webPush: any = { hasSubscription: jest.fn(async () => true), sendToUser: jest.fn(async () => undefined) };
  const crm: any = { getContact: jest.fn(async (_c: string, to: string, id: string) => ({ name: id, userId: `login-${id}`, pushToken: to === 'customer' ? 'fcm-c' : 'fcm-s', email: null })) };
  const dir: any = { companyName: jest.fn(async () => 'Orrix Engineering') };
  const prisma: any = {
    telegramLink: { findFirst: jest.fn(async ({ where }: any) => (telegramKeys.includes(where.memberKey) ? { id: 'l' } : null)) },
    telegramBot: { findUnique: jest.fn(async () => ({ enabled: true })) },
  };
  return { n: new ChatNotifier(new ChatBus(), gateway, notifications, webPush, crm, dir, prisma), notifications, webPush };
}

const conv = (members: any[]) => ({ id: 'conv-1', companyId: 'co', kind: 'CUSTOMER_TECH', customerId: 'c-1', lastSeq: 5, members } as any);
const msg = (from: string) => ({ id: 'm', seq: 5, senderMemberKey: from, senderName: 'RP Tech', body: 'On my way', deletedAt: null } as any);

describe('chat push', () => {
  it('pushes to the other side, not the sender, as the person who wrote it', async () => {
    const { n, notifications, webPush } = make();
    await n.onMessage({ type: 'message', conv: conv([{ memberKey: 'u-rp' }, { memberKey: 'customer:c-1' }]), message: msg('u-rp') });
    expect(notifications.sendPush).toHaveBeenCalledTimes(1);
    expect(notifications.sendPush).toHaveBeenCalledWith(expect.objectContaining({ pushToken: 'fcm-c', title: 'RP Tech', body: 'On my way', customerId: 'c-1' }));
    expect(webPush.sendToUser).toHaveBeenCalledWith('login-c-1', expect.objectContaining({ url: '/messages?c=conv-1' }));
  });

  it("customers see office replies as the company", async () => {
    const { n, notifications } = make();
    await n.onMessage({ type: 'message', conv: conv([{ memberKey: 'office' }, { memberKey: 'customer:c-1' }]), message: msg('office') });
    expect(notifications.sendPush).toHaveBeenCalledWith(expect.objectContaining({ title: 'Orrix Engineering' }));
  });

  it("skips people reading it right now, muted people, and the office seat; one ping per minute", async () => {
    const { n, notifications } = make(['c:co:c-1']);
    await n.onMessage({ type: 'message', conv: conv([{ memberKey: 'office' }, { memberKey: 'u-rp' }, { memberKey: 'customer:c-1' }, { memberKey: 'u-x', mutedUntil: new Date(Date.now() + 60_000) }]), message: msg('office') });
    expect(notifications.sendPush.mock.calls.map((c: any) => c[0].pushToken)).toEqual(['fcm-s']);
    await n.onMessage({ type: 'message', conv: conv([{ memberKey: 'u-rp' }, { memberKey: 'customer:c-2' }]), message: msg('customer:c-2') });
    expect(notifications.sendPush).toHaveBeenCalledTimes(1);
  });

  it('no phone push for someone linked on Telegram: Telegram already notifies them', async () => {
    const { n, notifications, webPush } = make([], ['customer:c-1']);
    await n.onMessage({ type: 'message', conv: conv([{ memberKey: 'u-rp' }, { memberKey: 'customer:c-1' }]), message: msg('u-rp') });
    expect(notifications.sendPush).not.toHaveBeenCalled();
    expect(webPush.sendToUser).not.toHaveBeenCalled();
  });

  it('no second push for job updates whose status already has its own push', async () => {
    const { n, notifications } = make();
    await n.onMessage({ type: 'message', conv: conv([{ memberKey: 'office' }, { memberKey: 'customer:c-1' }]), message: { ...msg('office'), clientId: 'job:j1:EN_ROUTE:2026-10-09' } });
    expect(notifications.sendPush).not.toHaveBeenCalled();
    await n.onMessage({ type: 'message', conv: conv([{ memberKey: 'office' }, { memberKey: 'customer:c-1' }]), message: { ...msg('office'), id: 'm2', clientId: 'job:j1:ON_HOLD:2026-10-09' } });
    expect(notifications.sendPush).toHaveBeenCalledTimes(1); // on hold has no push of its own
  });
});

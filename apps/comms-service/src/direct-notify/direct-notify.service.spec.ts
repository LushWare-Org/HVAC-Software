import { DirectNotifyService, directEmailHtml } from './direct-notify.service';

function make(contact: any, opts: { webSub?: boolean; emailFails?: boolean } = {}) {
  const notifications = {
    sendEmail: jest.fn(async () => { if (opts.emailFails) throw new Error('smtp'); return {}; }),
    sendPush: jest.fn(async () => ({})),
  };
  const webPush = { hasSubscription: jest.fn(async () => !!opts.webSub), sendToUser: jest.fn(async () => undefined) };
  const crm = { getContact: jest.fn(async () => contact), getSettings: jest.fn(async () => ({ name: 'Orrix Engineering' })) };
  return { svc: new DirectNotifyService(notifications as any, webPush as any, crm as any), notifications, webPush, crm };
}
const dto = (channels: any[]) => ({ to: 'customer' as const, id: 'c-1', title: 'Running late', message: 'RP is 15 minutes late.', channels, jobId: 'j-1' });

describe('DirectNotifyService', () => {
  it('emails and pushes to the phone app and the web portal', async () => {
    const { svc, notifications, webPush } = make({ name: 'Aluthge Pasindu', email: 'a@x.lk', userId: 'u-1', pushToken: 'fcm' }, { webSub: true });
    const out = await svc.send('co', dto(['email', 'push']));
    expect(out.results).toEqual({ email: 'sent', push: 'sent' });
    expect(notifications.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ recipientEmail: 'a@x.lk', subject: 'Running late', customerId: 'c-1', jobId: 'j-1' }));
    expect(notifications.sendPush).toHaveBeenCalledWith(expect.objectContaining({ pushToken: 'fcm', recipientId: 'u-1' }));
    expect(webPush.sendToUser).toHaveBeenCalledWith('u-1', expect.objectContaining({ title: 'Running late' }));
  });

  it('says plainly when there is no email or no device, and still sends the rest', async () => {
    const { svc, notifications } = make({ name: 'Yumeth', email: null, userId: null, pushToken: null });
    expect((await svc.send('co', dto(['email', 'push']))).results).toEqual({ email: 'no-email', push: 'no-device' });
    expect(notifications.sendEmail).not.toHaveBeenCalled();
  });

  it('a failed email does not stop the push', async () => {
    const { svc } = make({ name: 'A', email: 'a@x.lk', userId: 'u-1', pushToken: 'fcm' }, { emailFails: true });
    expect((await svc.send('co', dto(['email', 'push']))).results).toEqual({ email: 'failed', push: 'sent' });
  });

  it('only uses the channels asked for, and refuses someone it cannot find', async () => {
    const { svc, notifications } = make({ name: 'A', email: 'a@x.lk', userId: 'u-1', pushToken: 'fcm' });
    expect((await svc.send('co', dto(['push']))).results).toEqual({ push: 'sent' });
    expect(notifications.sendEmail).not.toHaveBeenCalled();
    await expect(make(null).svc.send('co', dto(['email']))).rejects.toThrow('Customer not found');
  });

  it('the email escapes what was typed and greets them by first name', () => {
    const html = directEmailHtml('Orrix', 'Aluthge Pasindu', '<b>late</b>\nsorry');
    expect(html).toContain('Hi Aluthge,');
    expect(html).toContain('&lt;b&gt;late&lt;/b&gt;<br>sorry');
    expect(html).toContain('A message from Orrix');
  });
});

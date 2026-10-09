import { customerReminderText, technicianReminderText } from './visit-reminder.text';
import { VisitRemindersService } from './visit-reminders.service';

const facts = { jobTitle: 'AC repair', technicianName: 'Silva', customerName: 'Hana', address: '1 Main St', when: 'Mon 12 Oct, 9:00 AM', clock: '9:00 AM' };

describe('reminder wording', () => {
  it('tells the customer about tomorrow and asks for confirmation', () => {
    const t = customerReminderText({ ...facts, kind: 'EVE', confirmUrl: 'https://p.example/jobs?confirm=1' });
    expect(t).toContain('tomorrow, Mon 12 Oct, 9:00 AM');
    expect(t).toContain('Silva will be your technician');
    expect(t).toContain('https://p.example/jobs?confirm=1');
    expect(t).toContain("ask for another time");
  });
  it('thanks a customer who already confirmed instead of asking again', () => {
    const t = customerReminderText({ ...facts, kind: 'EVE', confirmed: true, confirmUrl: 'https://p.example/x' });
    expect(t).toContain('You have confirmed this time');
    expect(t).not.toContain('https://p.example/x');
  });
  it('says the technician is about to arrive for the "soon" reminder', () => {
    expect(customerReminderText({ ...facts, kind: 'SOON' })).toContain('Silva is due to arrive for AC repair at 9:00 AM today');
  });
  it('gives the technician the customer, address and confirmation state', () => {
    const t = technicianReminderText({ ...facts, kind: 'EVE', confirmed: false });
    expect(t).toContain('Tomorrow, Mon 12 Oct, 9:00 AM: AC repair for Hana at 1 Main St');
    expect(t).toContain('has not confirmed');
  });
});

describe('VisitRemindersService', () => {
  const make = () => {
    const chat: any = { openOffice: jest.fn().mockResolvedValue({ id: 'cv1' }), openTechOffice: jest.fn().mockResolvedValue({ id: 'cv2' }), send: jest.fn().mockResolvedValue({}) };
    const direct: any = { send: jest.fn().mockResolvedValue({ results: { email: 'sent', push: 'no-device' } }) };
    const settings: any = { getSettings: jest.fn().mockResolvedValue({ name: 'Orrix', timezone: 'Asia/Colombo', phone: '+94 11 555 0100' }) };
    const notifications: any = { sendInApp: jest.fn().mockResolvedValue({}) };
    return { chat, direct, settings, notifications, svc: new VisitRemindersService(chat, direct, settings, notifications) };
  };
  const ev = { companyId: 'c1', jobId: 'job-1', kind: 'EVE' as const, audience: 'both' as const, customerId: 'cu1', customerName: 'Hana', jobTitle: 'AC repair', technicianUserId: 't1', technicianName: 'Silva', scheduledAt: '2026-10-12T04:00:00Z', confirmed: false };

  it('reaches the customer and the technician on every channel', async () => {
    const { svc, chat, direct, notifications } = make();
    const r = await svc.send(ev);
    expect(chat.openOffice).toHaveBeenCalledWith(expect.anything(), 'cu1');
    expect(chat.openTechOffice).toHaveBeenCalledWith(expect.anything(), 't1');
    expect(chat.send).toHaveBeenCalledTimes(2);
    expect(direct.send).toHaveBeenCalledTimes(2); // one email each
    expect(notifications.sendInApp).toHaveBeenCalled();
    expect(r.customer).toMatchObject({ message: 'sent', email: 'sent' });
    expect(r.technician).toMatchObject({ message: 'sent', email: 'sent' });
  });
  it('puts the company name and its details in the email', async () => {
    const { svc, direct } = make();
    await svc.send({ ...ev, audience: 'customer' });
    const html = direct.send.mock.calls[0][2].emailHtml as string;
    expect(html).toContain('Orrix');
    expect(html).toContain('+94 11 555 0100');
    expect(html).toContain('Confirm this time');
  });
  it('sends only the channels asked for', async () => {
    const { svc, chat, direct } = make();
    const r = await svc.send({ ...ev, audience: 'customer', channels: ['email'] });
    expect(chat.send).not.toHaveBeenCalled();
    expect(direct.send).toHaveBeenCalledTimes(1);
    expect(r.customer).toEqual({ email: 'sent' });
  });
  it('reports a failed channel without losing the rest', async () => {
    const { svc, chat } = make();
    chat.send.mockRejectedValueOnce(new Error('boom'));
    const r = await svc.send({ ...ev, audience: 'customer' });
    expect(r.customer).toMatchObject({ message: 'failed', email: 'sent' });
  });
  it('tells a technician a job was taken off them', async () => {
    const { svc, chat, direct } = make();
    const r = await svc.tellTechnician({ companyId: 'c1', jobId: 'job-1', techUserId: 't1', techName: 'Silva', kind: 'REMOVED', jobTitle: 'AC repair', customerName: 'Hana', previousLabel: 'Mon 12 Oct, 9:00 AM' });
    expect(chat.send.mock.calls[0][2].body).toContain('A job was taken off you');
    expect(direct.send.mock.calls[0][2].emailHtml).toContain('Was booked for');
    expect(r).toMatchObject({ message: 'sent', email: 'sent' });
  });
});

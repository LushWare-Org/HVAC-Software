import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const CO = 'co-1';
const aluthge = { id: 'c-new', companyId: CO, firstName: 'Aluthge', lastName: 'Pasindu', email: 'P88@gmail.com', phone: null, auth0UserId: null };

function setup() {
  const prisma: any = {
    customer: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    companyUser: { findFirst: jest.fn(), create: jest.fn(async ({ data }: any) => ({ id: 'u-new', ...data })), update: jest.fn(async ({ where, data }: any) => ({ id: where.id, ...data })) },
    company: { findUnique: jest.fn().mockResolvedValue({ name: 'Orrix Engineering' }) },
    $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  };
  const email = { sendWelcomeCustomer: jest.fn().mockResolvedValue(undefined) };
  return { prisma, email };
}

async function service(prisma: any, email: any) {
  const mod = await Test.createTestingModule({
    providers: [AuthService, { provide: PrismaService, useValue: prisma }, { provide: EmailService, useValue: email }],
  }).compile();
  return mod.get(AuthService);
}

describe('sending a customer their portal login', () => {
  it('creates a login for a customer who has none, and emails it', async () => {
    const { prisma, email } = setup();
    prisma.customer.findFirst.mockResolvedValueOnce(aluthge);
    prisma.companyUser.findFirst.mockResolvedValue(null);
    const out = await (await service(prisma, email)).resendWelcomeEmail(CO, 'c-new');
    expect(out).toMatchObject({ success: true, created: true });
    expect(prisma.companyUser.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: 'p88@gmail.com', role: 'customer', mustResetPassword: true }) });
    expect(prisma.customer.update).toHaveBeenCalledWith({ where: { id: 'c-new' }, data: { auth0UserId: 'u-new' } });
    expect(email.sendWelcomeCustomer).toHaveBeenCalledWith(expect.objectContaining({ to: 'p88@gmail.com', companyName: 'Orrix Engineering' }));
  });

  it('sends fresh details to a customer who already has a login', async () => {
    const { prisma, email } = setup();
    prisma.customer.findFirst.mockResolvedValueOnce({ ...aluthge, auth0UserId: 'u-1' });
    prisma.companyUser.findFirst.mockResolvedValueOnce({ id: 'u-1', role: 'customer' });
    const out = await (await service(prisma, email)).resendWelcomeEmail(CO, 'c-new');
    expect(out).toMatchObject({ created: false });
    expect(prisma.companyUser.update).toHaveBeenCalledWith({ where: { id: 'u-1' }, data: expect.objectContaining({ mustResetPassword: true }) });
    expect(email.sendWelcomeCustomer).toHaveBeenCalledTimes(1);
  });

  it("asks before taking another customer's login, and moves it when told to", async () => {
    const { prisma, email } = setup();
    const holder = { id: 'u-old', role: 'customer', name: 'Pasindu Ravishan' };
    const other = { id: 'c-old', firstName: 'Pasindu', lastName: 'Ravishan' };
    prisma.customer.findFirst.mockResolvedValueOnce(aluthge).mockResolvedValueOnce(other);
    prisma.companyUser.findFirst.mockResolvedValue(holder);
    const svc = await service(prisma, email);
    await expect(svc.resendWelcomeEmail(CO, 'c-new')).rejects.toThrow(ConflictException);
    expect(email.sendWelcomeCustomer).not.toHaveBeenCalled();

    prisma.customer.findFirst.mockResolvedValueOnce(aluthge).mockResolvedValueOnce(other);
    await svc.resendWelcomeEmail(CO, 'c-new', { moveLogin: true });
    expect(prisma.customer.updateMany).toHaveBeenCalledWith({ where: { companyId: CO, auth0UserId: 'u-old' }, data: { auth0UserId: null } });
    expect(prisma.customer.update).toHaveBeenCalledWith({ where: { id: 'c-new' }, data: { auth0UserId: 'u-old' } });
    expect(email.sendWelcomeCustomer).toHaveBeenCalledTimes(1);
  });

  it("refuses an email that belongs to a team member", async () => {
    const { prisma, email } = setup();
    prisma.customer.findFirst.mockResolvedValueOnce(aluthge);
    prisma.companyUser.findFirst.mockResolvedValue({ id: 'u-staff', role: 'technician', name: 'RP Tech' });
    await expect((await service(prisma, email)).resendWelcomeEmail(CO, 'c-new', { moveLogin: true })).rejects.toThrow('team member');
    expect(email.sendWelcomeCustomer).not.toHaveBeenCalled();
  });
});

import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { requireJwtSecret } from '@tscrm/auth-client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u-1', companyId: 'co-1', email: 'sam@example.com', name: 'Sam',
    role: 'customer', isActive: true, approvalStatus: 'APPROVED', mustResetPassword: true,
    passwordHash: '$2b$12$originalhashoriginalhashoriginalhashoriginalhashorig',
    ...overrides,
  };
}

describe('AuthService — forgot and reset password', () => {
  let service: AuthService;
  let prisma: any;
  let email: { sendPasswordResetLink: jest.Mock; sendPasswordResetConfirmation: jest.Mock };

  beforeEach(async () => {
    prisma = {
      companyUser: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      company: { findUnique: jest.fn().mockResolvedValue({ name: 'Acme HVAC' }) },
    };
    email = {
      sendPasswordResetLink: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = mod.get(AuthService);
  });

  const tokenFromEmail = () => {
    const url: string = email.sendPasswordResetLink.mock.calls[0][0].resetUrl;
    return decodeURIComponent(url.split('token=')[1]);
  };

  it('answers the same way whether or not the email has an account', async () => {
    prisma.companyUser.findMany.mockResolvedValue([]);
    const none = await service.requestPasswordReset('nobody@example.com');
    prisma.companyUser.findMany.mockResolvedValue([makeUser()]);
    const some = await service.requestPasswordReset('sam@example.com');
    expect(none).toEqual(some);
    expect(email.sendPasswordResetLink).toHaveBeenCalledTimes(1);
  });

  it('sends one link per company account, customers to the portal and staff to the dashboard', async () => {
    prisma.companyUser.findMany.mockResolvedValue([
      makeUser(),
      makeUser({ id: 'u-2', companyId: 'co-2', role: 'dispatcher' }),
    ]);
    await service.requestPasswordReset('Sam@Example.com ');
    expect(prisma.companyUser.findMany).toHaveBeenCalledWith({ where: { email: 'sam@example.com', isActive: true } });
    const urls = email.sendPasswordResetLink.mock.calls.map((c) => c[0].resetUrl as string);
    expect(urls).toHaveLength(2);
    expect(urls[0].startsWith(`${process.env.CUSTOMER_PORTAL_URL ?? 'http://localhost:5174'}/reset-password?token=`)).toBe(true);
    expect(urls[1].startsWith(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/reset-password?token=`)).toBe(true);
  });

  it('never emails a technician whose account is still awaiting approval', async () => {
    prisma.companyUser.findMany.mockResolvedValue([makeUser({ role: 'technician', approvalStatus: 'PENDING' })]);
    await service.requestPasswordReset('sam@example.com');
    expect(email.sendPasswordResetLink).not.toHaveBeenCalled();
  });

  it('issues a link that can never be used as a sign-in token', async () => {
    prisma.companyUser.findMany.mockResolvedValue([makeUser()]);
    await service.requestPasswordReset('sam@example.com');
    expect(() => jwt.verify(tokenFromEmail(), requireJwtSecret())).toThrow();
  });

  it('sets the new password, clears the forced-reset flag, and confirms by email', async () => {
    const user = makeUser();
    prisma.companyUser.findMany.mockResolvedValue([user]);
    await service.requestPasswordReset('sam@example.com');
    prisma.companyUser.findFirst.mockResolvedValue(user);

    await service.resetPasswordWithToken(tokenFromEmail(), 'a-brand-new-pass');

    const update = prisma.companyUser.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: 'u-1' });
    expect(update.data.mustResetPassword).toBe(false);
    expect(await bcrypt.compare('a-brand-new-pass', update.data.passwordHash)).toBe(true);
    expect(email.sendPasswordResetConfirmation).toHaveBeenCalled();
  });

  it('refuses a link a second time, once the password it was issued for has changed', async () => {
    prisma.companyUser.findMany.mockResolvedValue([makeUser()]);
    await service.requestPasswordReset('sam@example.com');
    prisma.companyUser.findFirst.mockResolvedValue(makeUser({ passwordHash: '$2b$12$somethingelse' }));
    await expect(service.resetPasswordWithToken(tokenFromEmail(), 'a-brand-new-pass')).rejects.toThrow(BadRequestException);
    expect(prisma.companyUser.update).not.toHaveBeenCalled();
  });

  it('refuses a tampered or forged link', async () => {
    const forged = jwt.sign({ sub: 'u-1', cid: 'co-1', fp: 'x' }, requireJwtSecret(), { audience: 'password-reset' });
    await expect(service.resetPasswordWithToken(forged, 'a-brand-new-pass')).rejects.toThrow(BadRequestException);
  });

  it('refuses a password shorter than 8 characters', async () => {
    await expect(service.resetPasswordWithToken('x'.repeat(40), 'short')).rejects.toThrow(BadRequestException);
  });
});

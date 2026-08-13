import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const CO = 'co-1';

function makePrisma() {
  return {
    customer: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    companyUser: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    company: {
      findUnique: jest.fn().mockResolvedValue({ name: 'Acme HVAC' }),
    },
    lead: {
      create: jest.fn(),
    },
  };
}

function makeEmail() {
  return {
    sendWelcomeCustomer: jest.fn().mockResolvedValue(undefined),
    sendWelcomeTechnician: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AuthService — house owner provisioning', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let email: ReturnType<typeof makeEmail>;

  beforeEach(async () => {
    prisma = makePrisma();
    email = makeEmail();
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = mod.get(AuthService);
  });

  it('rejects when the owner has no email', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'cust-1', companyId: CO, firstName: 'Amara', lastName: 'Silva', email: null, auth0UserId: null,
    });
    await expect(service.provisionHouseOwnerAccount(CO, 'cust-1')).rejects.toThrow(BadRequestException);
    expect(email.sendWelcomeCustomer).not.toHaveBeenCalled();
  });

  it('creates a new portal account and sends the welcome email', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'cust-1', companyId: CO, firstName: 'Amara', lastName: 'Silva',
      email: 'amara@example.com', phone: '0771234567', auth0UserId: null,
    });
    prisma.companyUser.findFirst.mockResolvedValue(null); // no active/inactive collision
    prisma.companyUser.create.mockResolvedValue({ id: 'user-1' });

    const result = await service.provisionHouseOwnerAccount(CO, 'cust-1');

    expect(result.alreadyProvisioned).toBe(false);
    expect(prisma.companyUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'amara@example.com', role: 'customer', mustResetPassword: true }),
      }),
    );
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { auth0UserId: 'user-1' },
    });
    expect(email.sendWelcomeCustomer).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when the owner already has an active portal account (e.g. owns a second house)', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'cust-1', companyId: CO, firstName: 'Amara', lastName: 'Silva',
      email: 'amara@example.com', phone: null, auth0UserId: 'user-1',
    });
    prisma.companyUser.findFirst.mockResolvedValue({ id: 'user-1', isActive: true });

    const result = await service.provisionHouseOwnerAccount(CO, 'cust-1');

    expect(result.alreadyProvisioned).toBe(true);
    expect(prisma.companyUser.create).not.toHaveBeenCalled();
    expect(email.sendWelcomeCustomer).not.toHaveBeenCalled();
  });

  it('blocks when the email collides with a DIFFERENT active customer account', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'cust-2', companyId: CO, firstName: 'Nimal', lastName: 'Perera',
      email: 'shared@example.com', phone: null, auth0UserId: null,
    });
    // A different customer's CompanyUser already owns this email.
    prisma.companyUser.findFirst.mockResolvedValue({ id: 'user-other', isActive: true });

    await expect(service.provisionHouseOwnerAccount(CO, 'cust-2')).rejects.toThrow(ConflictException);
    expect(email.sendWelcomeCustomer).not.toHaveBeenCalled();
  });
});

describe('AuthService — provisionHouseOwner (brand-new customer)', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let email: ReturnType<typeof makeEmail>;

  beforeEach(async () => {
    prisma = makePrisma();
    email = makeEmail();
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = mod.get(AuthService);
  });

  it('creates a new Customer (no Lead) and a portal account, and sends the welcome email', async () => {
    prisma.customer.findFirst.mockResolvedValue(null); // no existing customer with this email
    prisma.customer.create.mockResolvedValue({
      id: 'cust-new', companyId: CO, firstName: 'Nadia', lastName: 'Fernando',
      email: 'nadia@example.com', phone: '0771112222', auth0UserId: null,
    });
    prisma.companyUser.findFirst.mockResolvedValue(null);
    prisma.companyUser.create.mockResolvedValue({ id: 'user-new' });

    const result = await service.provisionHouseOwner(CO, {
      firstName: 'Nadia', lastName: 'Fernando', email: 'nadia@example.com', phone: '0771112222',
    });

    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: CO, firstName: 'Nadia', lastName: 'Fernando', email: 'nadia@example.com',
        }),
      }),
    );
    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(email.sendWelcomeCustomer).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      success: true, userId: 'user-new', customerId: 'cust-new',
      firstName: 'Nadia', lastName: 'Fernando',
    });
  });

  it('reactivates a soft-deleted Customer with the same email instead of erroring', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'cust-old', companyId: CO, firstName: 'Old', lastName: 'Name',
      email: 'nadia@example.com', phone: null, auth0UserId: null, isActive: false,
    });
    prisma.customer.update.mockResolvedValue({
      id: 'cust-old', companyId: CO, firstName: 'Nadia', lastName: 'Fernando',
      email: 'nadia@example.com', phone: null, auth0UserId: null,
    });
    prisma.companyUser.findFirst.mockResolvedValue(null);
    prisma.companyUser.create.mockResolvedValue({ id: 'user-new' });

    const result = await service.provisionHouseOwner(CO, {
      firstName: 'Nadia', lastName: 'Fernando', email: 'nadia@example.com',
    });

    expect(prisma.customer.create).not.toHaveBeenCalled();
    expect(prisma.customer.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cust-old' } }),
    );
    expect(result.customerId).toBe('cust-old');
  });

  it('blocks when the email already has an active portal account', async () => {
    prisma.customer.findFirst.mockResolvedValue({
      id: 'cust-existing', companyId: CO, firstName: 'Existing', lastName: 'Owner',
      email: 'taken@example.com', phone: null, auth0UserId: 'user-existing',
    });
    prisma.companyUser.findFirst.mockResolvedValue({ id: 'user-existing', isActive: true });

    await expect(
      service.provisionHouseOwner(CO, { firstName: 'X', lastName: 'Y', email: 'taken@example.com' }),
    ).rejects.toThrow(ConflictException);
    expect(email.sendWelcomeCustomer).not.toHaveBeenCalled();
  });
});

describe('AuthService — companyId comes from the caller\'s JWT, not the request body', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrisma>;
  let email: ReturnType<typeof makeEmail>;

  beforeEach(async () => {
    prisma = makePrisma();
    email = makeEmail();
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = mod.get(AuthService);
  });

  it('provisionLeadAccount scopes the new Customer/Lead to the companyId argument', async () => {
    prisma.customer.findFirst.mockResolvedValue(null); // no existing customer for this email
    prisma.customer.create.mockResolvedValue({
      id: 'cust-new', companyId: CO, firstName: 'Nadia', lastName: 'Fernando',
      email: 'nadia@example.com', phone: null, auth0UserId: null,
    });
    prisma.companyUser.findFirst.mockResolvedValue(null);
    prisma.companyUser.create.mockResolvedValue({ id: 'user-new' });
    prisma.lead.create.mockResolvedValue({ id: 'lead-new' });

    // Note: no `companyId` field on the dto at all — it's a required positional arg.
    await service.provisionLeadAccount(CO, {
      firstName: 'Nadia', lastName: 'Fernando', email: 'nadia@example.com',
    });

    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: CO }) }),
    );
    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: CO }) }),
    );
  });

  it('provisionTechnicianAccount scopes the new CompanyUser to the companyId argument', async () => {
    prisma.companyUser.findFirst.mockResolvedValueOnce(null); // no active collision
    prisma.companyUser.findFirst.mockResolvedValueOnce(null); // no inactive row to reactivate
    prisma.companyUser.create.mockResolvedValue({ id: 'tech-new' });

    await service.provisionTechnicianAccount(CO, { name: 'Ruwan Tech', email: 'ruwan@example.com' });

    expect(prisma.companyUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: CO, role: 'technician' }) }),
    );
    expect(email.sendWelcomeTechnician).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService — login with the same email in multiple companies', () => {
  let service: AuthService;
  let prisma: {
    customer: { findFirst: jest.Mock };
    companyUser: { findMany: jest.Mock; update: jest.Mock };
    userLoginEvent: { create: jest.Mock };
    $executeRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      customer: { findFirst: jest.fn() },
      companyUser: { findMany: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      userLoginEvent: { create: jest.fn().mockResolvedValue({}) },
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    };
    const mod = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: makeEmail() },
      ],
    }).compile();
    service = mod.get(AuthService);
  });

  it('logs into the correct company when the password only matches one of several accounts sharing an email', async () => {
    const hashA = await bcrypt.hash('password-for-co-a', 12);
    const hashB = await bcrypt.hash('password-for-co-b', 12);
    prisma.companyUser.findMany.mockResolvedValue([
      { id: 'user-a', companyId: 'co-a', email: 'shared@example.com', passwordHash: hashA, role: 'company_admin', isActive: true, name: 'Admin A' },
      { id: 'user-b', companyId: 'co-b', email: 'shared@example.com', passwordHash: hashB, role: 'company_admin', isActive: true, name: 'Admin B' },
    ]);

    const result = await service.login('shared@example.com', 'password-for-co-b');

    expect(prisma.companyUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-b' } }),
    );
    expect(result.user.companyId).toBe('co-b');
  });

  it('lowercases the email before matching (login was previously case-sensitive)', async () => {
    const hash = await bcrypt.hash('correct-password', 12);
    prisma.companyUser.findMany.mockResolvedValue([
      { id: 'user-a', companyId: 'co-a', email: 'jane@example.com', passwordHash: hash, role: 'customer', isActive: true, name: 'Jane' },
    ]);

    await service.login('Jane@Example.com', 'correct-password');

    expect(prisma.companyUser.findMany).toHaveBeenCalledWith({ where: { email: 'jane@example.com' } });
  });

  it('rejects when no candidate\'s password matches', async () => {
    const hashA = await bcrypt.hash('password-for-co-a', 12);
    prisma.companyUser.findMany.mockResolvedValue([
      { id: 'user-a', companyId: 'co-a', email: 'shared@example.com', passwordHash: hashA, role: 'company_admin', isActive: true, name: 'Admin A' },
    ]);

    await expect(service.login('shared@example.com', 'wrong-password')).rejects.toThrow(UnauthorizedException);
  });
});

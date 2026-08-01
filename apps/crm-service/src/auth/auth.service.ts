import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
const APP_NAME = process.env.APP_NAME ?? 'T&S Services';

/** Generate a readable temporary password: 3 groups of 4 alphanumeric chars, e.g. "aX3k-Rm9p-Q2wZ" */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const group = (n: number) => Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `${group(4)}-${group(4)}-${group(4)}`;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * The same email can have a separate CompanyUser row in more than one company
   * (e.g. a customer with accounts at two different service providers) — email is
   * only unique per-company (@@unique([companyId, email])), not globally. Since each
   * tenant's account has its own password, the password itself disambiguates which
   * company to log into: try every row for this email and use whichever one's hash
   * actually matches, instead of grabbing an arbitrary first row and only checking
   * that one (which made every account but one effectively unusable once an email
   * was reused across tenants).
   */
  async login(email: string, password: string) {
    const candidates = await this.prisma.companyUser.findMany({ where: { email: email.toLowerCase() } });

    let user: (typeof candidates)[number] | undefined;
    for (const candidate of candidates) {
      if (candidate.passwordHash && await bcrypt.compare(password, candidate.passwordHash)) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Pending approval — technician self-registered but not yet approved
    if (user.role === 'technician' && user.approvalStatus === 'PENDING') {
      throw new ForbiddenException({
        code: 'PENDING_APPROVAL',
        message: 'Your account is pending admin approval. Please wait for your account to be activated.',
        user: { id: user.id, name: user.name, email: user.email },
      });
    }

    // Rejected application
    if (user.role === 'technician' && user.approvalStatus === 'REJECTED') {
      throw new ForbiddenException({
        code: 'ACCOUNT_REJECTED',
        message: user.approvalNote ?? 'Your application was not approved. Please contact the admin for more information.',
      });
    }

    // Deactivated account
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact your administrator.');
    }

    const now = new Date();
    await this.prisma.companyUser.update({ where: { id: user.id }, data: { lastLoginAt: now } });
    await this.prisma.userLoginEvent.create({
      data: { companyId: user.companyId, userId: user.id, userEmail: user.email },
    }).catch(() => { /* non-fatal — table may not exist in older envs */ });

    // Stamp last_seen_at on the scheduling technician record so dispatch
    // availability reflects actual app logins, not just GPS pings.
    if (user.role === 'technician') {
      try {
        await this.prisma.$executeRaw`
          UPDATE scheduling.technicians
          SET last_seen_at = NOW(), updated_at = NOW()
          WHERE user_id = ${user.id} AND company_id = ${user.companyId}
        `;
      } catch (_) { /* fire-and-forget — scheduling schema may not exist in test env */ }
    }

    let customerId: string | undefined;
    if (user.role === 'customer') {
      const customer = await this.prisma.customer.findFirst({
        where: { companyId: user.companyId, auth0UserId: user.id },
        select: { id: true },
      });
      customerId = customer?.id;
    }

    const tokenPayload: Record<string, any> = {
      sub: user.id,
      email: user.email,
      company_id: user.companyId,
      role: user.role,
      name: user.name,
      iss: 'tscrm-local',
    };
    if (customerId) tokenPayload['customer_id'] = customerId;

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        phone: user.phone,
        customerId,
        mustResetPassword: user.mustResetPassword, // ← consumed by both portals
      },
    };
  }

  /**
   * Customer self-registration (from customer portal sign-up form).
   */
  async register(dto: {
    companyId: string;
    name: string;
    email: string;
    phone?: string;
    password: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }) {
    const existing = await this.prisma.companyUser.findFirst({
      where: { companyId: dto.companyId, email: dto.email },
    });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const [firstName, ...rest] = dto.name.trim().split(' ');
    const lastName = rest.join(' ') || '-';

    const user = await this.prisma.companyUser.create({
      data: { companyId: dto.companyId, name: dto.name, email: dto.email, phone: dto.phone, passwordHash, role: 'customer', isActive: true },
    });

    const customer = await this.prisma.customer.create({
      data: {
        companyId: dto.companyId, firstName, lastName, email: dto.email, phone: dto.phone,
        address: dto.address, city: dto.city, state: dto.state, zipCode: dto.zipCode,
        auth0UserId: user.id, source: 'portal', tags: ['portal-signup'], engagementStatus: 'INACTIVE',
      },
    });

    await this.prisma.lead.create({
      data: {
        companyId: dto.companyId, customerId: customer.id, firstName, lastName,
        email: dto.email, phone: dto.phone, source: 'portal', status: 'NEW',
        notes: 'Customer self-registered via customer portal',
      },
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, company_id: user.companyId, role: user.role, name: user.name, customer_id: customer.id, iss: 'tscrm-local' },
      JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' },
    );

    return {
      access_token: token, token_type: 'Bearer', expires_in: 86400,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, phone: user.phone, customerId: customer.id, mustResetPassword: false },
    };
  }

  /**
   * Shared portal-account provisioning: creates/reactivates a CompanyUser(role=customer)
   * for a given Customer row, sends the temp-password welcome email. Used by both
   * provisionLeadAccount (which additionally creates a Lead) and
   * provisionHouseOwnerAccount (which does not — house owners aren't sales leads).
   *
   * Idempotent per-customer: if this exact Customer already has an active linked
   * CompanyUser, returns it as-is rather than erroring — the caller may be re-triggering
   * account generation for a person who already has portal access under another
   * house/context (e.g. owns two houses, or is also a project's developer client).
   * Only throws when the email collides with a DIFFERENT customer's active account,
   * since CompanyUser email is unique per company.
   */
  private async provisionPortalAccountForCustomer(
    companyId: string,
    customer: {
      id: string; firstName: string; lastName: string; email: string;
      phone?: string | null; auth0UserId?: string | null;
    },
  ): Promise<{ user: { id: string }; alreadyProvisioned: boolean }> {
    const email = customer.email.toLowerCase();

    // Customer already linked to an active CompanyUser — nothing to do.
    if (customer.auth0UserId) {
      const linked = await this.prisma.companyUser.findFirst({
        where: { id: customer.auth0UserId, companyId, isActive: true },
      });
      if (linked) return { user: { id: linked.id }, alreadyProvisioned: true };
    }

    // Email collision with a DIFFERENT customer's active account is a real conflict
    // (companyId+email is unique on CompanyUser).
    const existingActive = await this.prisma.companyUser.findFirst({
      where: { companyId, email, isActive: true },
    });
    if (existingActive && existingActive.id !== customer.auth0UserId) {
      throw new ConflictException('A portal account already exists for this email address');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Reactivate a previously-deleted (isActive=false) account rather than inserting a
    // new row — avoids the unique-constraint violation on (companyId, email).
    const existingInactive = await this.prisma.companyUser.findFirst({
      where: { companyId, email, isActive: false },
    });

    let user: { id: string };
    if (existingInactive) {
      user = await this.prisma.companyUser.update({
        where: { id: existingInactive.id },
        data: {
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          phone: customer.phone ?? undefined,
          passwordHash,
          isActive: true,
          mustResetPassword: true,
        },
      });
    } else {
      user = await this.prisma.companyUser.create({
        data: {
          companyId,
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          email,
          phone: customer.phone ?? undefined,
          passwordHash,
          role: 'customer',
          isActive: true,
          mustResetPassword: true,
        },
      });
    }

    await this.prisma.customer.update({ where: { id: customer.id }, data: { auth0UserId: user.id } });

    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
    await this.emailService.sendWelcomeCustomer({
      to: customer.email,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      tempPassword,
      companyName: company?.name ?? APP_NAME,
    });

    return { user: { id: user.id }, alreadyProvisioned: false };
  }

  /**
   * Admin provisions a customer portal account when adding a lead.
   * - Creates/links Customer + CompanyUser (customer role) + Lead.
   * - Generates a temp password and emails it to the customer.
   */
  async provisionLeadAccount(companyId: string, dto: {
    leadId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    source?: string;
    serviceInterest?: string;
  }) {
    // Create Customer record linked to this user.
    // If a soft-deleted Customer row already exists for this email, reactivate it.
    const existingCustomer = await this.prisma.customer.findFirst({
      where: { companyId, email: dto.email.toLowerCase() },
    });

    let customer: { id: string; firstName: string; lastName: string; email: string; phone: string | null; auth0UserId: string | null };
    if (existingCustomer) {
      if (existingCustomer.auth0UserId) {
        const linked = await this.prisma.companyUser.findFirst({
          where: { id: existingCustomer.auth0UserId, companyId, isActive: true },
        });
        if (linked) throw new ConflictException('A customer account already exists for this email address');
      }
      const updated = await this.prisma.customer.update({
        where: { id: existingCustomer.id },
        data: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone, isActive: true },
      });
      customer = { ...updated, email: updated.email ?? dto.email.toLowerCase() };
    } else {
      const created = await this.prisma.customer.create({
        data: {
          companyId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          source: dto.source ?? 'admin',
          tags: ['admin-created'],
          engagementStatus: 'ACTIVE',
        },
      });
      customer = { ...created, email: created.email ?? dto.email.toLowerCase() };
    }

    const { user } = await this.provisionPortalAccountForCustomer(companyId, customer);

    const lead = await this.prisma.lead.create({
      data: {
        companyId,
        customerId: customer.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        source: dto.source ?? 'admin',
        serviceInterest: dto.serviceInterest,
        status: 'NEW',
        notes: 'Lead created by admin — customer portal account provisioned',
      },
    });

    return {
      success: true,
      userId: user.id,
      customerId: customer.id,
      leadId: lead.id,
      message: `Account created and welcome email sent to ${dto.email}`,
    };
  }

  /**
   * Admin creates a brand-new Customer + portal account in one step, for a Housing
   * Scheme house owner who doesn't exist in the system yet. Mirrors
   * provisionLeadAccount's Customer creation/reactivation, but — like
   * provisionHouseOwnerAccount — never creates a Lead, since house owners aren't
   * sales leads.
   */
  async provisionHouseOwner(companyId: string, dto: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: { companyId, email: dto.email.toLowerCase() },
    });

    let customer: { id: string; firstName: string; lastName: string; email: string; phone: string | null; auth0UserId: string | null };
    if (existingCustomer) {
      if (existingCustomer.auth0UserId) {
        const linked = await this.prisma.companyUser.findFirst({
          where: { id: existingCustomer.auth0UserId, companyId, isActive: true },
        });
        if (linked) throw new ConflictException('A customer account already exists for this email address');
      }
      const updated = await this.prisma.customer.update({
        where: { id: existingCustomer.id },
        data: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone, isActive: true },
      });
      customer = { ...updated, email: updated.email ?? dto.email.toLowerCase() };
    } else {
      const created = await this.prisma.customer.create({
        data: {
          companyId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          source: 'admin',
          tags: ['house-owner'],
          engagementStatus: 'ACTIVE',
        },
      });
      customer = { ...created, email: created.email ?? dto.email.toLowerCase() };
    }

    const { user } = await this.provisionPortalAccountForCustomer(companyId, customer);

    return {
      success: true,
      userId: user.id,
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      message: `Account created and welcome email sent to ${dto.email}`,
    };
  }

  /**
   * Admin provisions a portal account for an existing house owner (Housing Scheme
   * projects). No Lead is created — house owners aren't sales leads. Idempotent: if
   * the owner already has active portal access (e.g. they own another house too),
   * returns success without re-sending the welcome email.
   */
  async provisionHouseOwnerAccount(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, companyId } });
    if (!customer) throw new BadRequestException('Owner not found in this company');
    if (!customer.email) throw new BadRequestException('Add an email address for this owner before generating an account');

    const { user, alreadyProvisioned } = await this.provisionPortalAccountForCustomer(
      companyId,
      { ...customer, email: customer.email },
    );

    return {
      success: true,
      userId: user.id,
      customerId: customer.id,
      alreadyProvisioned,
      message: alreadyProvisioned
        ? `${customer.firstName} ${customer.lastName} already has portal access.`
        : `Account created and welcome email sent to ${customer.email}`,
    };
  }

  /**
   * Admin provisions a technician account (from the Dispatch > Add Technician modal).
   * - Checks for duplicate email.
   * - Creates CompanyUser (technician role, APPROVED).
   * - Generates a temp password and emails it.
   */
  async provisionTechnicianAccount(companyId: string, dto: {
    name: string;
    email: string;
    phone?: string;
    skills?: string[];
    latitude?: number;
    longitude?: number;
    maxDailyJobs?: number;
  }) {
    // Only block if an ACTIVE account already exists — deactivated rows must not
    // prevent re-provisioning the same email after a delete.
    const existingActive = await this.prisma.companyUser.findFirst({
      where: { companyId, email: dto.email.toLowerCase(), isActive: true },
    });
    if (existingActive) {
      throw new ConflictException('An account already exists for this email address');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // If a previously-deleted (isActive=false) row exists, reactivate it instead of
    // inserting — avoids hitting the unique constraint on (companyId, email).
    const existingInactive = await this.prisma.companyUser.findFirst({
      where: { companyId, email: dto.email.toLowerCase(), isActive: false },
    });

    let user: { id: string };
    if (existingInactive) {
      user = await this.prisma.companyUser.update({
        where: { id: existingInactive.id },
        data: {
          name: dto.name,
          phone: dto.phone,
          passwordHash,
          role: 'technician',
          isActive: true,
          approvalStatus: 'APPROVED',
          mustResetPassword: true,
          skills: dto.skills ?? [],
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });
    } else {
      user = await this.prisma.companyUser.create({
        data: {
          companyId,
          name: dto.name,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          passwordHash,
          role: 'technician',
          isActive: true,
          approvalStatus: 'APPROVED',  // admin-created → immediately active
          mustResetPassword: true,
          skills: dto.skills ?? [],
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });

    await this.emailService.sendWelcomeTechnician({
      to: dto.email,
      name: dto.name,
      tempPassword,
      companyName: company?.name ?? APP_NAME,
    });

    return {
      success: true,
      userId: user.id,
      message: `Technician account created and welcome email sent to ${dto.email}`,
      // Return userId so the scheduling service can create a technician record with this userId
      userId4Scheduling: user.id,
    };
  }

  /**
   * Force password reset — called on first login after receiving a temp password.
   * Validates the new password, hashes it, and clears mustResetPassword.
   */
  async forceResetPassword(userId: string, companyId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const user = await this.prisma.companyUser.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new UnauthorizedException('User not found');

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.companyUser.update({
      where: { id: userId },
      data: { passwordHash: newHash, mustResetPassword: false },
    });

    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Check if an email already has a CompanyUser account.
   * Used by admin modals for real-time validation before provisioning.
   */
  async checkEmailExists(companyId: string, email: string): Promise<{ exists: boolean; role?: string; name?: string }> {
    // Only consider ACTIVE accounts — deactivated/deleted users must not block re-provisioning
    const user = await this.prisma.companyUser.findFirst({
      where: { companyId, email: email.toLowerCase(), isActive: true },
      select: { role: true, name: true },
    });
    if (!user) return { exists: false };
    return { exists: true, role: user.role, name: user.name };
  }

  /**
   * Technician self-registration (pending approval).
   */
  async registerTechnician(dto: {
    companyId: string; name: string; email: string; phone: string;
    password: string; skills?: string[]; latitude?: number; longitude?: number; notes?: string;
  }) {
    const existing = await this.prisma.companyUser.findFirst({ where: { companyId: dto.companyId, email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.companyUser.create({
      data: {
        companyId: dto.companyId, name: dto.name, email: dto.email, phone: dto.phone,
        passwordHash, role: 'technician', isActive: false, approvalStatus: 'PENDING',
        skills: dto.skills ?? [], latitude: dto.latitude, longitude: dto.longitude,
      },
    });

    return { success: true, message: 'Application submitted. An admin will review and approve your account.', userId: user.id };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async changePassword(companyId: string, userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.companyUser.findFirst({ where: { id: userId, companyId, isActive: true } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('User account not found or password is not set');

    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) throw new UnauthorizedException('Current password is incorrect');

    const newHash = await this.hashPassword(newPassword);
    await this.prisma.companyUser.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    return { success: true, message: 'Password changed successfully' };
  }
}

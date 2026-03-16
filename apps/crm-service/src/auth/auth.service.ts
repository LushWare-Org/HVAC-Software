import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.companyUser.findFirst({
      where: { email, isActive: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.companyUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // For CUSTOMER role, look up their linked Customer record
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

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256',
    });

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
      },
    };
  }

  /**
   * Customer self-registration.
   * Creates a CompanyUser (role=customer) + Customer record linked via auth0UserId.
   * Returns a JWT identical to login response.
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
    // Check no existing user with same email in this company
    const existing = await this.prisma.companyUser.findFirst({
      where: { companyId: dto.companyId, email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';

    // Create user account
    const user = await this.prisma.companyUser.create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: 'customer',
        isActive: true,
      },
    });

    // Create customer profile linked to this user account
    const customer = await this.prisma.customer.create({
      data: {
        companyId: dto.companyId,
        firstName,
        lastName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        auth0UserId: user.id,   // link user → customer
        source: 'portal',
        tags: ['portal-signup'],
        engagementStatus: 'INACTIVE',
      },
    });

    // Also create a lead so admin sees the new signup in their leads pipeline
    await this.prisma.lead.create({
      data: {
        companyId: dto.companyId,
        customerId: customer.id,
        firstName,
        lastName,
        email: dto.email,
        phone: dto.phone,
        source: 'portal',
        status: 'NEW',
        notes: 'Customer self-registered via customer portal',
      },
    });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        company_id: user.companyId,
        role: user.role,
        name: user.name,
        customer_id: customer.id,
        iss: 'tscrm-local',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' },
    );

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
        customerId: customer.id,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async changePassword(companyId: string, userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.companyUser.findFirst({
      where: { id: userId, companyId, isActive: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User account not found or password is not set');
    }

    const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validCurrent) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await this.hashPassword(newPassword);

    await this.prisma.companyUser.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return { success: true, message: 'Password changed successfully' };
  }
}

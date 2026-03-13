import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        company_id: user.companyId,
        role: user.role,
        name: user.name,
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

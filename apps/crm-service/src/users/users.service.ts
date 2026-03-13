import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, params: { role?: string; search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { role, search, isActive, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.companyUser.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      this.prisma.companyUser.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.companyUser.findFirst({ where: { id, companyId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findMe(companyId: string, userId: string) {
    // For local JWT, sub == user.id; for Auth0 JWT, sub == auth0UserId.
    const user = await this.prisma.companyUser.findFirst({
      where: { companyId, OR: [{ id: userId }, { auth0UserId: userId }] },
    });
    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  async create(companyId: string, data: { name: string; email: string; phone?: string; role?: string; auth0UserId?: string }) {
    return this.prisma.companyUser.create({
      data: { companyId, ...data },
    });
  }

  async update(companyId: string, id: string, data: { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean }) {
    await this.findOne(companyId, id); // ensure exists
    return this.prisma.companyUser.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.companyUser.delete({ where: { id } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AnnouncementDto {
  title?: string;
  body?: string;
  linkUrl?: string;
  linkLabel?: string;
  accentColor?: string;
  isActive?: boolean;
  activeFrom?: string | null;
  activeTo?: string | null;
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.companyAnnouncement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** All currently-active announcements for the portal carousel (newest first, max 5). */
  getActiveMany(companyId: string) {
    const now = new Date();
    return this.prisma.companyAnnouncement.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [{ activeFrom: null }, { activeFrom: { lte: now } }],
        AND: [{ OR: [{ activeTo: null }, { activeTo: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  create(companyId: string, dto: AnnouncementDto & { title: string }) {
    return this.prisma.companyAnnouncement.create({
      data: {
        companyId, // always from the caller's token, never the body
        title: dto.title,
        body: dto.body,
        linkUrl: dto.linkUrl,
        linkLabel: dto.linkLabel,
        accentColor: dto.accentColor ?? '#1a73e8',
        isActive: dto.isActive ?? true,
        activeFrom: dto.activeFrom ? new Date(dto.activeFrom) : null,
        activeTo: dto.activeTo ? new Date(dto.activeTo) : null,
      },
    });
  }

  private async assertOwned(companyId: string, id: string) {
    const row = await this.prisma.companyAnnouncement.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException(`Announcement ${id} not found`);
  }

  async update(companyId: string, id: string, dto: AnnouncementDto) {
    await this.assertOwned(companyId, id);
    return this.prisma.companyAnnouncement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
        ...(dto.linkLabel !== undefined && { linkLabel: dto.linkLabel }),
        ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.activeFrom !== undefined && {
          activeFrom: dto.activeFrom ? new Date(dto.activeFrom) : null,
        }),
        ...(dto.activeTo !== undefined && {
          activeTo: dto.activeTo ? new Date(dto.activeTo) : null,
        }),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.assertOwned(companyId, id);
    await this.prisma.companyAnnouncement.delete({ where: { id } });
  }
}

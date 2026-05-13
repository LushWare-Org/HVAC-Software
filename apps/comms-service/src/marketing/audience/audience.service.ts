import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { CrmClient } from '../automation/crm.client';

export interface CreateAudienceDto {
  name: string;
  type?: 'STATIC' | 'DYNAMIC';
  filtersJson?: string;
}

@Injectable()
export class AudienceService {
  constructor(
    private readonly db: MarketingPrismaService,
    private readonly crm: CrmClient,
  ) {}

  async list(companyId: string) {
    return this.db.audience.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(companyId: string, id: string) {
    const a = await this.db.audience.findFirst({ where: { id, companyId } });
    if (!a) throw new NotFoundException(`Audience ${id} not found`);
    return a;
  }

  async create(companyId: string, dto: CreateAudienceDto) {
    const filters = dto.filtersJson ?? '[]';
    const count = await this.crm.countAudienceMembers(companyId, filters);
    return this.db.audience.create({
      data: {
        companyId,
        name: dto.name,
        type: (dto.type ?? 'DYNAMIC') as any,
        filtersJson: filters,
        lastCount: count,
      },
    });
  }

  async update(companyId: string, id: string, dto: Partial<CreateAudienceDto>) {
    await this.get(companyId, id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.filtersJson !== undefined) {
      data.filtersJson = dto.filtersJson;
      data.lastCount = await this.crm.countAudienceMembers(companyId, dto.filtersJson);
    }
    return this.db.audience.update({ where: { id }, data });
  }

  async remove(companyId: string, id: string) {
    await this.get(companyId, id);
    await this.db.audience.delete({ where: { id } });
  }

  async previewCount(companyId: string, filtersJson: string): Promise<{ count: number }> {
    const count = await this.crm.countAudienceMembers(companyId, filtersJson);
    return { count };
  }

  async resolveMembers(companyId: string, id: string) {
    const audience = await this.get(companyId, id);
    return this.crm.resolveAudienceMembers(companyId, audience.filtersJson);
  }
}

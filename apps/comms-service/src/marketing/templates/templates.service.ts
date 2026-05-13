import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketingPrismaService } from '../prisma/marketing-prisma.service';
import { DEFAULT_TEMPLATES } from './default-templates';

export interface CreateTemplateDto {
  name: string;
  channel: 'EMAIL' | 'SMS';
  subject?: string;
  htmlBody?: string;
  smsBody?: string;
}

export interface UpdateTemplateDto extends Partial<CreateTemplateDto> {}

@Injectable()
export class TemplatesService {
  constructor(private readonly db: MarketingPrismaService) {}

  async list(companyId: string) {
    return this.db.template.findMany({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(companyId: string, id: string) {
    const t = await this.db.template.findFirst({ where: { id, companyId } });
    if (!t) throw new NotFoundException(`Template ${id} not found`);
    return t;
  }

  async create(companyId: string, dto: CreateTemplateDto) {
    return this.db.template.create({
      data: { companyId, ...dto },
    });
  }

  async update(companyId: string, id: string, dto: UpdateTemplateDto) {
    await this.get(companyId, id);
    return this.db.template.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.get(companyId, id);
    await this.db.template.delete({ where: { id } });
  }

  async seedDefaults(companyId: string): Promise<number> {
    const existing = await this.db.template.count({ where: { companyId, isDefault: true } });
    if (existing > 0) return 0;

    await this.db.template.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({
        companyId,
        ...t,
        isDefault: true,
        channel: t.channel as any,
      })),
    });
    return DEFAULT_TEMPLATES.length;
  }
}

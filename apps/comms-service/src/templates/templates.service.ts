/**
 * TemplatesService — CRUD for NotificationTemplate documents.
 *
 * Each template uses Handlebars syntax in `body` (and optionally `subject`).
 * The `render()` method compiles and executes a template with a given context.
 *
 * Variable extraction: templates list their variables for UI validation.
 * Example body: "Hi {{customerName}}, your job at {{jobAddress}} is confirmed."
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { Channel, TemplateType } from '../prisma/generated';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  // Compiled template cache: templateId → { subject?, body }
  private readonly cache = new Map<string, {
    subject: HandlebarsTemplateDelegate | null;
    body: HandlebarsTemplateDelegate;
  }>();

  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(companyId: string, dto: CreateTemplateDto) {
    this.validateHandlebars(dto.body, 'body');
    if (dto.subject) this.validateHandlebars(dto.subject, 'subject');

    const template = await this.prisma.notificationTemplate.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type as TemplateType,
        channel: dto.channel as Channel,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables ?? [],
        isDefault: dto.isDefault ?? false,
      },
    });

    this.logger.log(`Template created: ${template.id} (${template.name})`);
    return template;
  }

  async findAll(
    companyId: string,
    params: { type?: TemplateType; channel?: Channel; isActive?: boolean },
  ) {
    return this.prisma.notificationTemplate.findMany({
      where: {
        companyId,
        ...(params.type ? { type: params.type } : {}),
        ...(params.channel ? { channel: params.channel } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const t = await this.prisma.notificationTemplate.findFirst({
      where: { id, companyId },
    });
    if (!t) throw new NotFoundException(`Template ${id} not found`);
    return t;
  }

  async update(companyId: string, id: string, dto: UpdateTemplateDto) {
    await this.findOne(companyId, id);
    if (dto.body) this.validateHandlebars(dto.body, 'body');
    if (dto.subject) this.validateHandlebars(dto.subject, 'subject');

    // Invalidate cache entry on update
    this.cache.delete(id);

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.variables !== undefined ? { variables: dto.variables } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    this.cache.delete(id);
    await this.prisma.notificationTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  /**
   * Render a template with the given context.
   * Returns { subject?, body } as rendered strings.
   */
  async render(
    companyId: string,
    id: string,
    context: Record<string, unknown>,
  ): Promise<{ subject?: string; body: string }> {
    const template = await this.findOne(companyId, id);

    let compiled = this.cache.get(id);
    if (!compiled) {
      compiled = {
        subject: template.subject ? Handlebars.compile(template.subject) : null,
        body: Handlebars.compile(template.body),
      };
      this.cache.set(id, compiled);
    }

    return {
      subject: compiled.subject ? compiled.subject(context) : undefined,
      body: compiled.body(context),
    };
  }

  /**
   * Find the default template for a given type + channel and render it.
   */
  async renderDefault(
    companyId: string,
    type: TemplateType,
    channel: Channel,
    context: Record<string, unknown>,
  ): Promise<{ subject?: string; body: string }> {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { companyId, type, channel, isActive: true },
      orderBy: { isDefault: 'desc' },
    });

    if (!template) {
      throw new NotFoundException(
        `No active ${channel} template for type ${type}`,
      );
    }

    return this.render(companyId, template.id, context);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private validateHandlebars(source: string, field: string): void {
    try {
      Handlebars.precompile(source);
    } catch (err) {
      throw new BadRequestException(
        `Invalid Handlebars syntax in ${field}: ${(err as Error).message}`,
      );
    }
  }
}

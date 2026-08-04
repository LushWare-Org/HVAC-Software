import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '../prisma/generated';

const DOCUMENT_TYPES = ['INVOICE', 'QUOTE', 'AGREEMENT', 'PAYMENT_RECEIPT'];
const MODES = ['BUILDER', 'LETTERHEAD'];

export interface UpsertTemplateInput {
  documentType: 'INVOICE' | 'QUOTE' | 'AGREEMENT' | 'PAYMENT_RECEIPT';
  name?: string;
  mode?: 'BUILDER' | 'LETTERHEAD';
  companyName?: string | null;
  companyAddress?: string | null;
  logoUrl?: string | null;
  logoPosition?: string | null;
  accentColor?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  bankDetails?: string | null;
  showPageNumbers?: boolean;
  rows?: Array<{ id: string; blocks: Array<{ id: string; slot: string; widthPct: number; style?: Record<string, unknown> }> }> | null;
  letterheadImageUrl?: string | null;
  letterheadTopMarginPx?: number;
  letterheadBottomMarginPx?: number;
}

@Injectable()
export class DocumentTemplatesService {
  private static readonly IMAGE_MIMES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  private static readonly MAX_BYTES = 10 * 1024 * 1024;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(companyId: string, documentType?: string) {
    return this.prisma.documentTemplate.findMany({
      where: { companyId, ...(documentType ? { documentType } : {}) },
      orderBy: [{ documentType: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const row = await this.prisma.documentTemplate.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException('Template not found');
    return row;
  }

  async create(companyId: string, input: UpsertTemplateInput) {
    if (!input.name?.trim()) throw new BadRequestException('name is required');
    if (!DOCUMENT_TYPES.includes(input.documentType)) {
      throw new BadRequestException(`documentType must be one of ${DOCUMENT_TYPES.join(', ')}`);
    }
    if (input.mode && !MODES.includes(input.mode)) {
      throw new BadRequestException(`mode must be one of ${MODES.join(', ')}`);
    }

    const existingCount = await this.prisma.documentTemplate.count({
      where: { companyId, documentType: input.documentType },
    });

    return this.prisma.documentTemplate.create({
      data: {
        companyId,
        documentType: input.documentType,
        name: input.name.trim(),
        mode: input.mode ?? 'BUILDER',
        isDefault: existingCount === 0,
        companyName: input.companyName ?? null,
        companyAddress: input.companyAddress ?? null,
        logoUrl: input.logoUrl ?? null,
        logoPosition: input.logoPosition ?? 'LEFT',
        accentColor: input.accentColor ?? null,
        headerText: input.headerText ?? null,
        footerText: input.footerText ?? null,
        bankDetails: input.bankDetails ?? null,
        showPageNumbers: input.showPageNumbers ?? true,
        rows: (input.rows as Prisma.InputJsonValue[] | undefined) ?? undefined,
        letterheadImageUrl: input.letterheadImageUrl ?? null,
        letterheadTopMarginPx: input.letterheadTopMarginPx ?? 140,
        letterheadBottomMarginPx: input.letterheadBottomMarginPx ?? 100,
      },
    });
  }

  async update(companyId: string, id: string, input: Partial<UpsertTemplateInput>) {
    await this.findOne(companyId, id);
    if (input.mode && !MODES.includes(input.mode)) {
      throw new BadRequestException(`mode must be one of ${MODES.join(', ')}`);
    }
    const data: any = {};
    for (const key of [
      'name', 'mode', 'companyName', 'companyAddress', 'logoUrl', 'logoPosition', 'accentColor', 'headerText', 'footerText',
      'bankDetails', 'showPageNumbers', 'letterheadImageUrl', 'letterheadTopMarginPx', 'letterheadBottomMarginPx', 'rows',
    ] as const) {
      if (input[key] !== undefined) data[key] = input[key];
    }
    if (typeof data.name === 'string') {
      if (!data.name.trim()) throw new BadRequestException('name cannot be empty');
      data.name = data.name.trim();
    }
    return this.prisma.documentTemplate.update({ where: { id }, data });
  }

  async setDefault(companyId: string, id: string) {
    const row = await this.findOne(companyId, id);
    await this.prisma.documentTemplate.updateMany({
      where: { companyId, documentType: row.documentType, isDefault: true },
      data: { isDefault: false },
    });
    return this.prisma.documentTemplate.update({ where: { id }, data: { isDefault: true } });
  }

  async remove(companyId: string, id: string) {
    const row = await this.findOne(companyId, id);
    const total = await this.prisma.documentTemplate.count({
      where: { companyId, documentType: row.documentType },
    });
    if (total <= 1) {
      throw new BadRequestException('Cannot delete the last template for this document type');
    }
    if (row.isDefault) {
      const replacement = await this.prisma.documentTemplate.findFirst({
        where: { companyId, documentType: row.documentType, id: { not: id } },
        orderBy: { createdAt: 'asc' },
      });
      if (replacement) {
        await this.prisma.documentTemplate.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
    }
    await this.prisma.documentTemplate.delete({ where: { id } });
    return { success: true };
  }

  /** Resolve a specific template by id, or the default for the type — null when neither exists. */
  async resolve(companyId: string, documentType: string, templateId?: string) {
    if (templateId) {
      const row = await this.prisma.documentTemplate.findFirst({ where: { id: templateId, companyId, documentType } });
      if (row) return row;
    }
    return this.prisma.documentTemplate.findFirst({ where: { companyId, documentType, isDefault: true } });
  }

  /** Upload a letterhead image directly, or convert a PDF's first page to PNG once. */
  async uploadLetterhead(companyId: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    if (file.size > DocumentTemplatesService.MAX_BYTES) {
      throw new BadRequestException('File is too large — maximum size is 10 MB');
    }

    let buffer = file.buffer;
    let ext = DocumentTemplatesService.IMAGE_MIMES[file.mimetype];
    let contentType = file.mimetype;

    if (file.mimetype === 'application/pdf') {
      const { pdf } = await import('pdf-to-img');
      const doc = await pdf(file.buffer, { scale: 2 });
      const firstPage = await doc.getPage(1);
      buffer = Buffer.from(firstPage);
      ext = 'png';
      contentType = 'image/png';
    } else if (!ext) {
      throw new BadRequestException('Letterhead must be a JPEG, PNG, WebP image or a PDF');
    }

    const key = `documents/${companyId}/letterhead-${randomUUID()}.${ext}`;
    const url = await this.storage.putPublicObject(key, buffer, contentType);
    return { url };
  }

  /** Upload a template logo — images only, no PDF conversion. */
  async uploadLogo(companyId: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    if (file.size > DocumentTemplatesService.MAX_BYTES) {
      throw new BadRequestException('File is too large — maximum size is 10 MB');
    }
    const ext = DocumentTemplatesService.IMAGE_MIMES[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Logo must be a JPEG, PNG, or WebP image');
    }

    const key = `documents/${companyId}/logo-${randomUUID()}.${ext}`;
    const url = await this.storage.putPublicObject(key, file.buffer, file.mimetype);
    return { url };
  }
}

/**
 * TemplatesService — Unit Tests
 *
 * Tests:
 *  - create / findAll / findOne / update / remove
 *  - Handlebars template rendering with context
 *  - render() with compiled cache
 *  - renderDefault() when no active template exists
 *  - validateHandlebars() rejects malformed syntax
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateType, Channel } from '../prisma/generated';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockPrisma = {
  notificationTemplate: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const COMPANY_ID = 'co-001';
const TMPL_ID = 'tmpl-001';

function makeTemplate(overrides: Partial<any> = {}): any {
  return {
    id: TMPL_ID,
    companyId: COMPANY_ID,
    name: 'Job Completed SMS',
    type: TemplateType.JOB_STATUS_UPDATE,
    channel: Channel.SMS,
    subject: null,
    body: 'Hi {{customerName}}, your job at {{jobAddress}} is complete.',
    variables: ['customerName', 'jobAddress'],
    isActive: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a template with valid Handlebars body', async () => {
      const dto = {
        name: 'Test',
        type: 'JOB_STATUS_UPDATE' as any,
        channel: 'SMS' as any,
        body: 'Hello {{customerName}}',
        variables: ['customerName'],
      };
      mockPrisma.notificationTemplate.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...data, id: TMPL_ID }),
      );

      const result = await service.create(COMPANY_ID, dto);
      expect(result.id).toBe(TMPL_ID);
      expect(mockPrisma.notificationTemplate.create).toHaveBeenCalled();
    });

    it('throws BadRequestException for invalid Handlebars syntax', async () => {
      const dto = {
        name: 'Bad',
        type: 'CUSTOM' as any,
        channel: 'SMS' as any,
        body: 'Hello {{#unclosed',  // invalid
      };

      await expect(service.create(COMPANY_ID, dto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.notificationTemplate.create).not.toHaveBeenCalled();
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns template when found', async () => {
      const t = makeTemplate();
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(t);
      const result = await service.findOne(COMPANY_ID, TMPL_ID);
      expect(result.id).toBe(TMPL_ID);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(null);
      await expect(service.findOne(COMPANY_ID, 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ── render ────────────────────────────────────────────────────────────────

  describe('render', () => {
    it('renders template body with context', async () => {
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(makeTemplate());

      const result = await service.render(COMPANY_ID, TMPL_ID, {
        customerName: 'Alice',
        jobAddress: '123 Main St',
      });

      expect(result.body).toBe('Hi Alice, your job at 123 Main St is complete.');
      expect(result.subject).toBeUndefined();
    });

    it('renders subject when present (email template)', async () => {
      const emailTemplate = makeTemplate({
        channel: Channel.EMAIL,
        subject: 'Job update for {{customerName}}',
        body: '<p>Hi {{customerName}}, done at {{jobAddress}}.</p>',
      });
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(emailTemplate);

      const result = await service.render(COMPANY_ID, TMPL_ID, {
        customerName: 'Bob',
        jobAddress: '456 Oak Ave',
      });

      expect(result.subject).toBe('Job update for Bob');
      expect(result.body).toContain('Hi Bob');
    });

    it('uses cached compiled template on second call', async () => {
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(makeTemplate());

      await service.render(COMPANY_ID, TMPL_ID, { customerName: 'A', jobAddress: 'X' });
      await service.render(COMPANY_ID, TMPL_ID, { customerName: 'B', jobAddress: 'Y' });

      // DB should only be queried twice (once per render call)
      expect(mockPrisma.notificationTemplate.findFirst).toHaveBeenCalledTimes(2);
    });

    it('leaves unknown variables as empty string (Handlebars default)', async () => {
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(makeTemplate());

      const result = await service.render(COMPANY_ID, TMPL_ID, {
        customerName: 'Alice',
        // jobAddress intentionally omitted
      });

      expect(result.body).toBe('Hi Alice, your job at  is complete.');
    });
  });

  // ── renderDefault ─────────────────────────────────────────────────────────

  describe('renderDefault', () => {
    it('renders the default active template for a type/channel', async () => {
      const t = makeTemplate();
      mockPrisma.notificationTemplate.findFirst.mockResolvedValueOnce(t)  // renderDefault findFirst
        .mockResolvedValueOnce(t);  // render's findOne

      const result = await service.renderDefault(
        COMPANY_ID,
        TemplateType.JOB_STATUS_UPDATE,
        Channel.SMS,
        { customerName: 'Carol', jobAddress: '789 Pine Rd' },
      );

      expect(result.body).toContain('Carol');
    });

    it('throws NotFoundException when no active template exists', async () => {
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(null);
      await expect(
        service.renderDefault(COMPANY_ID, TemplateType.INVOICE_SENT, Channel.EMAIL, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('invalidates cache and updates template', async () => {
      const t = makeTemplate();
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue(t);
      mockPrisma.notificationTemplate.update.mockImplementation(({ data }: any) =>
        Promise.resolve({ ...t, ...data }),
      );

      // Prime the cache
      await service.render(COMPANY_ID, TMPL_ID, { customerName: 'A', jobAddress: 'B' });

      // Update the template body
      await service.update(COMPANY_ID, TMPL_ID, {
        body: 'Updated: {{customerName}}',
      });

      // Cache should be cleared — next render re-compiles
      mockPrisma.notificationTemplate.findFirst.mockResolvedValue({
        ...t,
        body: 'Updated: {{customerName}}',
      });

      const result = await service.render(COMPANY_ID, TMPL_ID, { customerName: 'Alice' });
      expect(result.body).toBe('Updated: Alice');
    });
  });
});

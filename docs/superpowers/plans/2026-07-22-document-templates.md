# Tenant Document Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each tenant design a letterhead+footer template (Builder mode: logo/colors/text, or Letterhead mode: uploaded stationery image/PDF as background) for Invoices, Quotes, and Agreements — multiple named templates per type, picked per document — fixing the existing tenant-name PDF bug along the way and building agreement PDF generation from scratch.

**Architecture:** `DocumentTemplate` (crm schema) is tenant config, same home as `CompanySettings`. finance-service already owns the one shared Chromium/Puppeteer singleton (`PdfService`) — it renders invoices/quotes in-process (as today) and gains a new `POST /internal/documents/render` endpoint that crm-service calls for agreements, so agreements don't need a second Chromium pool. Letterhead PDF→image conversion happens once at upload time in crm-service via `pdf-to-img` (pure JS, no Chromium). A new `POST /documents/preview` endpoint in finance-service renders draft (unsaved) template state to HTML for the editor's live preview, using fixed sample data — no persistence round-trip while editing.

**Tech Stack:** NestJS 10, Prisma 5, Handlebars 4.7, Puppeteer-core 21 (existing), `pdf-to-img` (new, crm-service only), React 19 + TanStack Query.

## Global Constraints

- Every query stays scoped by `companyId`.
- Do not run `prisma migrate dev` against `crm` or `finance` schemas — apply via `scripts/apply-migrations.mjs` only (see prior sessions' drift issue on `crm`; `finance` has no known drift but stays consistent with the established process either way).
- Do not commit anything unless explicitly told to.
- New staff-only endpoints use the existing `STAFF_WRITE` role sets already defined per-controller in this codebase.
- Never reintroduce a per-request Chromium launch (`CLAUDE.md` anti-pattern) — all PDF rendering goes through `PdfService`'s existing singleton.
- Backward compatibility: when a document has no `templateId` and a company has no default template of that type, rendering must produce **exactly today's existing hardcoded output** — this is what "template config is undefined/null" resolves to at every layer.

---

## File Structure

**Backend — `apps/crm-service/src`**
- Modify: `prisma/schema.prisma` — new `DocumentTemplate` model.
- Modify: `../../../scripts/apply-migrations.mjs` — one new `crm` migration entry.
- Create: `document-templates/document-templates.service.ts`, `.controller.ts`, `.module.ts`.
- Create: `document-templates/document-templates.service.spec.ts`, `.controller.spec.ts`.
- Create: `finance-render/finance-render.client.ts` (mirrors `iot/jobs.client.ts` — crm calling out to another service).
- Modify: `agreements/agreements.service.ts`, `agreements/agreements.controller.ts` — `generatePdf` + `GET /agreements/:id/pdf`.
- Modify: `app.module.ts` — register `DocumentTemplatesModule`.
- Modify: `package.json` — add `pdf-to-img`.

**Backend — `apps/finance-service/src`**
- Modify: `prisma/schema.prisma` — `templateId` on `Invoice`/`Quote`.
- Modify: `../../../scripts/apply-migrations.mjs` — one new `finance` migration entry.
- Create: `document-templates/document-template.client.ts` (mirrors `company-settings/company-settings.client.ts`).
- Modify: `pdf/pdf.service.ts` — template-aware header/footer, fix tenant-name bug, `generateAgreementPdf`, page-number support in `htmlToPdf`.
- Modify: `pdf/templates/invoice.hbs`, `pdf/templates/quote.hbs` — surgical edits (hero/footer regions).
- Create: `pdf/templates/agreement.hbs`.
- Create: `document-render/document-render.controller.ts`, `.module.ts` (the `POST /internal/documents/render` + `POST /documents/preview` endpoints).
- Modify: `invoices/invoices.controller.ts`, `quotes/quotes.controller.ts` — fix tenant-name bug, resolve+pass template.
- Modify: `invoices/dto/create-invoice.dto.ts`, `quotes/dto/create-quote.dto.ts` — `templateId?`.
- Modify: `app.module.ts` — register `DocumentRenderModule`.

**Frontend — `apps/admin-dashboard/src`**
- Create: `pages/finance/documentTemplatesApi.ts`.
- Modify: `pages/finance/Finance.tsx` — new `'templates'` tab.
- Create: `pages/finance/DocumentTemplatesTab.tsx`, `pages/finance/TemplateEditorModal.tsx`.
- Modify: `pages/finance/AddInvoiceModal.tsx`, `pages/finance/AddQuoteModal.tsx`, `pages/agreements/AgreementEditorModal.tsx` — template picker.
- Modify: `pages/agreements/AgreementDrawer.tsx` (or wherever an agreement's actions live) — "Download PDF" action.

---

### Task 1: crm-service — `DocumentTemplate` schema + CRUD service

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma`
- Modify: `scripts/apply-migrations.mjs`
- Create: `apps/crm-service/src/document-templates/document-templates.service.ts`
- Test: `apps/crm-service/src/document-templates/document-templates.service.spec.ts`

**Interfaces:**
- Produces: `DocumentTemplatesService.list/create/update/remove/setDefault/resolve(companyId, ...)`, consumed by Task 2 (controller) and, cross-service, by finance-service's client (Task 5) via the `resolve` endpoint Task 2 exposes.

- [ ] **Step 1: Add the Prisma model**

In `apps/crm-service/prisma/schema.prisma`, add after the `EquipmentErrorCode` model:

```prisma
model DocumentTemplate {
  id          String   @id @default(uuid())
  companyId   String
  documentType String  // INVOICE | QUOTE | AGREEMENT
  name        String
  isDefault   Boolean  @default(false)
  mode        String   @default("BUILDER") // BUILDER | LETTERHEAD

  logoUrl         String?
  logoPosition    String?  @default("LEFT") // LEFT | CENTER | RIGHT
  accentColor     String?
  headerText      String?
  footerText      String?
  bankDetails     String?
  showPageNumbers Boolean  @default(true)

  letterheadImageUrl       String?
  letterheadTopMarginPx    Int?     @default(140)
  letterheadBottomMarginPx Int?     @default(100)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([companyId, documentType, name])
  @@index([companyId, documentType])
  @@map("document_templates")
}
```

Run: `pnpm --filter crm-service exec prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 2: Add the migration SQL**

In `scripts/apply-migrations.mjs`, add to the `migrations` array (after the `20260722000000_optional_customer_and_equipment_scan` entry):

```javascript
  // ── CRM: tenant document templates (letterhead/footer for invoices/quotes/agreements)
  //    (spec: docs/superpowers/specs/2026-07-22-document-templates-design.md) ──
  {
    schema: 'crm',
    name: '20260722010000_add_document_templates',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."document_templates" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "mode" TEXT NOT NULL DEFAULT 'BUILDER',
  "logoUrl" TEXT,
  "logoPosition" TEXT DEFAULT 'LEFT',
  "accentColor" TEXT,
  "headerText" TEXT,
  "footerText" TEXT,
  "bankDetails" TEXT,
  "showPageNumbers" BOOLEAN NOT NULL DEFAULT true,
  "letterheadImageUrl" TEXT,
  "letterheadTopMarginPx" INTEGER DEFAULT 140,
  "letterheadBottomMarginPx" INTEGER DEFAULT 100,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "document_templates_companyId_documentType_name_key"
  ON "crm"."document_templates"("companyId", "documentType", "name");
CREATE INDEX IF NOT EXISTS "document_templates_companyId_documentType_idx"
  ON "crm"."document_templates"("companyId", "documentType");
    `.trim(),
  },
```

(Do not run this yet — applied once in Task 11 alongside the finance-service migration.)

- [ ] **Step 3: Write the failing tests**

Create `apps/crm-service/src/document-templates/document-templates.service.spec.ts`:

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentTemplatesService } from './document-templates.service';

const CO = 'co-1';

function makePrisma() {
  return {
    documentTemplate: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      $transaction: undefined,
    },
    $transaction: jest.fn(async (fns: any[]) => Promise.all(fns)),
  };
}

describe('DocumentTemplatesService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: DocumentTemplatesService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new DocumentTemplatesService(prisma as any);
  });

  describe('create', () => {
    it('requires a name', async () => {
      await expect(
        service.create(CO, { documentType: 'INVOICE', name: '  ', mode: 'BUILDER' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid documentType', async () => {
      await expect(
        service.create(CO, { documentType: 'BOGUS', name: 'X', mode: 'BUILDER' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('the first template for a type is made default automatically', async () => {
      prisma.documentTemplate.count.mockResolvedValue(0);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      await service.create(CO, { documentType: 'INVOICE', name: 'Formal', mode: 'BUILDER' });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) }),
      );
    });

    it('subsequent templates default to non-default', async () => {
      prisma.documentTemplate.count.mockResolvedValue(1);
      prisma.documentTemplate.create.mockResolvedValue({ id: 't2', companyId: CO, documentType: 'INVOICE', isDefault: false });
      await service.create(CO, { documentType: 'INVOICE', name: 'Friendly', mode: 'BUILDER' });
      expect(prisma.documentTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDefault: false }) }),
      );
    });
  });

  describe('setDefault', () => {
    it('404s for a template outside the company', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue(null);
      await expect(service.setDefault(CO, 't1')).rejects.toThrow(NotFoundException);
    });

    it('clears the previous default and sets the new one, scoped to the same documentType', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't2', companyId: CO, documentType: 'INVOICE' });
      await service.setDefault(CO, 't2');
      expect(prisma.documentTemplate.updateMany).toHaveBeenCalledWith({
        where: { companyId: CO, documentType: 'INVOICE', isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.documentTemplate.update).toHaveBeenCalledWith({
        where: { id: 't2' },
        data: { isDefault: true },
      });
    });
  });

  describe('remove', () => {
    it('404s for a template outside the company', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue(null);
      await expect(service.remove(CO, 't1')).rejects.toThrow(NotFoundException);
    });

    it('rejects deleting the last template of a type', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      prisma.documentTemplate.count.mockResolvedValue(1);
      await expect(service.remove(CO, 't1')).rejects.toThrow(BadRequestException);
    });

    it('when deleting the default with others remaining, promotes another to default', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      prisma.documentTemplate.count.mockResolvedValue(2);
      prisma.documentTemplate.findFirst.mockResolvedValueOnce({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      // second findFirst call inside remove() looks for a replacement
      (prisma.documentTemplate.findFirst as jest.Mock).mockResolvedValueOnce({ id: 't1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      (prisma.documentTemplate.findFirst as jest.Mock).mockResolvedValueOnce({ id: 't2', companyId: CO, documentType: 'INVOICE' });
      await service.remove(CO, 't1');
      expect(prisma.documentTemplate.update).toHaveBeenCalledWith({ where: { id: 't2' }, data: { isDefault: true } });
      expect(prisma.documentTemplate.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });

  describe('resolve', () => {
    it('returns the named template when templateId is given and found', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 't1', companyId: CO, documentType: 'INVOICE' });
      const result = await service.resolve(CO, 'INVOICE', 't1');
      expect(result?.id).toBe('t1');
    });

    it('falls back to the default template when templateId is omitted', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue({ id: 'default-1', companyId: CO, documentType: 'INVOICE', isDefault: true });
      const result = await service.resolve(CO, 'INVOICE', undefined);
      expect(prisma.documentTemplate.findFirst).toHaveBeenCalledWith({
        where: { companyId: CO, documentType: 'INVOICE', isDefault: true },
      });
      expect(result?.id).toBe('default-1');
    });

    it('returns null when nothing resolves (no template created yet — caller falls back to hardcoded look)', async () => {
      prisma.documentTemplate.findFirst.mockResolvedValue(null);
      const result = await service.resolve(CO, 'INVOICE', undefined);
      expect(result).toBeNull();
    });
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm --filter crm-service test -- document-templates.service.spec.ts`
Expected: FAIL with "Cannot find module './document-templates.service'"

- [ ] **Step 5: Implement the service**

Create `apps/crm-service/src/document-templates/document-templates.service.ts`:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DOCUMENT_TYPES = ['INVOICE', 'QUOTE', 'AGREEMENT'];
const MODES = ['BUILDER', 'LETTERHEAD'];

export interface UpsertTemplateInput {
  documentType: 'INVOICE' | 'QUOTE' | 'AGREEMENT';
  name?: string;
  mode?: 'BUILDER' | 'LETTERHEAD';
  logoUrl?: string | null;
  logoPosition?: string | null;
  accentColor?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  bankDetails?: string | null;
  showPageNumbers?: boolean;
  letterheadImageUrl?: string | null;
  letterheadTopMarginPx?: number;
  letterheadBottomMarginPx?: number;
}

@Injectable()
export class DocumentTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

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
        logoUrl: input.logoUrl ?? null,
        logoPosition: input.logoPosition ?? 'LEFT',
        accentColor: input.accentColor ?? null,
        headerText: input.headerText ?? null,
        footerText: input.footerText ?? null,
        bankDetails: input.bankDetails ?? null,
        showPageNumbers: input.showPageNumbers ?? true,
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
      'name', 'mode', 'logoUrl', 'logoPosition', 'accentColor', 'headerText', 'footerText',
      'bankDetails', 'showPageNumbers', 'letterheadImageUrl', 'letterheadTopMarginPx', 'letterheadBottomMarginPx',
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
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- document-templates.service.spec.ts`
Expected: PASS (all 11 tests)

- [ ] **Step 7: Commit**

```bash
git add apps/crm-service/prisma/schema.prisma apps/crm-service/src/document-templates scripts/apply-migrations.mjs
git commit -m "feat(crm): DocumentTemplate model + CRUD service for tenant letterhead templates"
```

---

### Task 2: crm-service — `DocumentTemplate` controller + module wiring

**Files:**
- Create: `apps/crm-service/src/document-templates/document-templates.controller.ts`
- Create: `apps/crm-service/src/document-templates/document-templates.module.ts`
- Modify: `apps/crm-service/src/app.module.ts`
- Test: `apps/crm-service/src/document-templates/document-templates.controller.spec.ts`

**Interfaces:**
- Consumes: `DocumentTemplatesService` (Task 1).
- Produces: `GET/POST /document-templates`, `GET/PATCH/DELETE /document-templates/:id`, `POST /document-templates/:id/set-default`, `GET /document-templates/resolve` — the last one is called service-to-service by finance-service's client (Task 5).

- [ ] **Step 1: Write the failing test**

Create `apps/crm-service/src/document-templates/document-templates.controller.spec.ts` (RBAC-reflection style, matching `houses.controller.spec.ts`):

```typescript
import { ROLES_KEY } from '@tscrm/auth-client';
import { Role } from '@tscrm/types';
import { DocumentTemplatesController } from './document-templates.controller';

describe('DocumentTemplatesController RBAC', () => {
  it('POST / is staff-only', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, DocumentTemplatesController.prototype.create);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN]));
    expect(roles).not.toContain(Role.CUSTOMER);
  });

  it('DELETE :id is staff-only', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, DocumentTemplatesController.prototype.remove);
    expect(roles).toEqual(expect.arrayContaining([Role.COMPANY_ADMIN]));
    expect(roles).not.toContain(Role.CUSTOMER);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter crm-service test -- document-templates.controller.spec.ts`
Expected: FAIL with "Cannot find module './document-templates.controller'"

- [ ] **Step 3: Implement the controller**

Create `apps/crm-service/src/document-templates/document-templates.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';
import { DocumentTemplatesService } from './document-templates.service';

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER];

class UpsertTemplateDto {
  @IsIn(['INVOICE', 'QUOTE', 'AGREEMENT']) documentType!: 'INVOICE' | 'QUOTE' | 'AGREEMENT';
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsIn(['BUILDER', 'LETTERHEAD']) mode?: 'BUILDER' | 'LETTERHEAD';
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsIn(['LEFT', 'CENTER', 'RIGHT']) logoPosition?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsString() headerText?: string;
  @IsOptional() @IsString() footerText?: string;
  @IsOptional() @IsString() bankDetails?: string;
  @IsOptional() @IsBoolean() showPageNumbers?: boolean;
  @IsOptional() @IsString() letterheadImageUrl?: string;
  @IsOptional() @IsInt() letterheadTopMarginPx?: number;
  @IsOptional() @IsInt() letterheadBottomMarginPx?: number;
}

@ApiTags('Document Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('document-templates')
export class DocumentTemplatesController {
  constructor(private readonly templates: DocumentTemplatesService) {}

  // Static route MUST precede ':id'.
  @Get('resolve')
  @ApiOperation({ summary: 'Resolve the active template for a document type (service-to-service + UI use)' })
  resolve(
    @CurrentUser() user: AuthUser,
    @Query('documentType') documentType: string,
    @Query('templateId') templateId?: string,
  ) {
    return this.templates.resolve(user.companyId, documentType, templateId);
  }

  @Get()
  @ApiOperation({ summary: 'List templates, optionally filtered by documentType' })
  list(@CurrentUser() user: AuthUser, @Query('documentType') documentType?: string) {
    return this.templates.list(user.companyId, documentType);
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Create a named template' })
  create(@CurrentUser() user: AuthUser, @Body() dto: UpsertTemplateDto) {
    return this.templates.create(user.companyId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Update a template' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: Partial<UpsertTemplateDto>) {
    return this.templates.update(user.companyId, id, dto);
  }

  @Post(':id/set-default')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "Make this the document type's default template" })
  setDefault(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.setDefault(user.companyId, id);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Delete a template (blocked if it is the only one for its type)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.remove(user.companyId, id);
  }
}
```

- [ ] **Step 4: Create the module and register it**

Create `apps/crm-service/src/document-templates/document-templates.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DocumentTemplatesController } from './document-templates.controller';
import { DocumentTemplatesService } from './document-templates.service';

@Module({
  controllers: [DocumentTemplatesController],
  providers: [DocumentTemplatesService],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}
```

In `apps/crm-service/src/app.module.ts`, add the import and add `DocumentTemplatesModule` to the `imports` array (alongside `ProjectsModule`/`HousesModule`).

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- document-templates.controller.spec.ts`
Expected: PASS

- [ ] **Step 6: Run full crm-service suite and type-check**

Run: `pnpm --filter crm-service test && pnpm --filter crm-service type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/crm-service/src/document-templates apps/crm-service/src/app.module.ts
git commit -m "feat(crm): document-templates CRUD endpoints + resolve endpoint for cross-service reads"
```

---

### Task 3: crm-service — Letterhead upload (image or PDF→PNG)

**Files:**
- Modify: `apps/crm-service/src/document-templates/document-templates.service.ts`
- Modify: `apps/crm-service/src/document-templates/document-templates.controller.ts`
- Modify: `apps/crm-service/src/document-templates/document-templates.module.ts`
- Modify: `apps/crm-service/package.json`
- Test: `apps/crm-service/src/document-templates/document-templates.service.spec.ts`

**Interfaces:**
- Consumes: `StorageService.putPublicObject` (existing, `storage/storage.service.ts`).
- Produces: `DocumentTemplatesService.uploadLetterhead(companyId, file)` → `{ url: string }`. `POST /document-templates/letterhead-upload` (multipart) — standalone, not tied to a specific template id, so the frontend can upload before the template row is even created.

- [ ] **Step 1: Add the `pdf-to-img` dependency**

In `apps/crm-service/package.json`, add to `"dependencies"` (after `"passport-jwt"`):

```json
    "pdf-to-img": "^4.2.0",
```

Run: `pnpm install`
Expected: lockfile updates, resolves into the workspace.

- [ ] **Step 2: Write the failing test**

Add to `apps/crm-service/src/document-templates/document-templates.service.spec.ts` (extend `makePrisma` to add a `storage` mock and pass it to the constructor — update the existing `beforeEach` too):

```typescript
// At the top of the file, add:
function makeStorage() {
  return { putPublicObject: jest.fn().mockResolvedValue('https://cdn.example.com/documents/co-1/letterhead-abc.png') };
}

// Change the existing beforeEach in the outer describe block from:
//   service = new DocumentTemplatesService(prisma as any);
// to:
//   service = new DocumentTemplatesService(prisma as any, makeStorage() as any);

// Add a new describe block:
describe('uploadLetterhead', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let storage: ReturnType<typeof makeStorage>;
  let service: DocumentTemplatesService;

  beforeEach(() => {
    prisma = makePrisma();
    storage = makeStorage();
    service = new DocumentTemplatesService(prisma as any, storage as any);
  });

  it('uploads a PNG directly without conversion', async () => {
    const result = await service.uploadLetterhead(CO, {
      buffer: Buffer.from('fake-png'), mimetype: 'image/png', size: 1000,
    });
    expect(storage.putPublicObject).toHaveBeenCalledWith(
      expect.stringContaining('documents/co-1/'),
      expect.any(Buffer),
      'image/png',
    );
    expect(result.url).toBe('https://cdn.example.com/documents/co-1/letterhead-abc.png');
  });

  it('rejects an unsupported mimetype', async () => {
    await expect(
      service.uploadLetterhead(CO, { buffer: Buffer.from('x'), mimetype: 'text/plain', size: 100 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a file over the size limit', async () => {
    await expect(
      service.uploadLetterhead(CO, { buffer: Buffer.from('x'), mimetype: 'image/png', size: 11 * 1024 * 1024 }),
    ).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter crm-service test -- document-templates.service.spec.ts`
Expected: FAIL — `uploadLetterhead` doesn't exist; constructor doesn't accept a second `storage` argument yet (existing tests in the file will also fail to compile until Step 4 updates the constructor signature — that's expected mid-step).

- [ ] **Step 4: Implement `uploadLetterhead`**

In `apps/crm-service/src/document-templates/document-templates.service.ts`, update the imports and constructor:

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
```

```typescript
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
```

Add the new method (anywhere inside the class, e.g. right after `resolve`):

```typescript
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- document-templates.service.spec.ts`
Expected: PASS (all 14 tests)

- [ ] **Step 6: Add the controller endpoint**

In `apps/crm-service/src/document-templates/document-templates.controller.ts`, update the imports:

```typescript
import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
```

Add the endpoint (after the `resolve` method, still before the non-static `:id` routes per the "static routes precede :id" rule already followed in this file):

```typescript
  @Post('letterhead-upload')
  @Roles(...STAFF_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a letterhead image or PDF (converted to an image once)' })
  uploadLetterhead(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.templates.uploadLetterhead(user.companyId, file);
  }
```

- [ ] **Step 7: Wire `StorageModule` into the module**

In `apps/crm-service/src/document-templates/document-templates.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DocumentTemplatesController } from './document-templates.controller';
import { DocumentTemplatesService } from './document-templates.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [DocumentTemplatesController],
  providers: [DocumentTemplatesService],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}
```

- [ ] **Step 8: Run full crm-service suite and type-check**

Run: `pnpm --filter crm-service test && pnpm --filter crm-service type-check`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/crm-service/src/document-templates apps/crm-service/package.json pnpm-lock.yaml
git commit -m "feat(crm): letterhead image/PDF upload with one-time PDF-to-image conversion"
```

---

### Task 4: finance-service — `templateId` on Invoice/Quote

**Files:**
- Modify: `apps/finance-service/prisma/schema.prisma`
- Modify: `scripts/apply-migrations.mjs`

**Interfaces:**
- Produces: `Invoice.templateId`, `Quote.templateId` (both `String?`, cross-schema soft reference — no FK, same convention as `jobId`/`projectId` on these models).

- [ ] **Step 1: Update the Prisma schema**

In `apps/finance-service/prisma/schema.prisma`, add `templateId String?` to `model Invoice` (near `workOrderId`, line ~186) and to `model Quote` (near `projectId`, line ~111):

```prisma
  // Invoice model — add after workOrderId:
  templateId            String?       // cross-schema ref to crm.document_templates
```

```prisma
  // Quote model — add after projectId:
  templateId       String?     // cross-schema ref to crm.document_templates
```

Run: `pnpm --filter finance-service exec prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 2: Add the migration SQL**

In `scripts/apply-migrations.mjs`, add a new entry with `schema: 'finance'`:

```javascript
  // ── Finance: templateId on invoices/quotes (tenant document templates)
  //    (spec: docs/superpowers/specs/2026-07-22-document-templates-design.md) ──
  {
    schema: 'finance',
    name: '20260722010000_add_document_template_id',
    sql: `
ALTER TABLE "finance"."invoices" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "finance"."quotes" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
    `.trim(),
  },
```

Check the schema name matches the existing convention: run `grep -n "schema:" scripts/apply-migrations.mjs | sort -u` and confirm finance-service's schema is indeed called `finance` (cross-check against `apps/finance-service/prisma/schema.prisma`'s datasource/schema comment or `DATABASE_URL` default) before finalizing — if it differs, use the correct name.

- [ ] **Step 3: Commit**

```bash
git add apps/finance-service/prisma/schema.prisma scripts/apply-migrations.mjs
git commit -m "feat(finance): add templateId to invoices and quotes"
```

---

### Task 5: finance-service — `DocumentTemplateClient`

**Files:**
- Create: `apps/finance-service/src/document-templates/document-template.client.ts`
- Test: `apps/finance-service/src/document-templates/document-template.client.spec.ts`

**Interfaces:**
- Consumes: crm-service's `GET /document-templates/resolve` (Task 2).
- Produces: `DocumentTemplateClient.resolve(companyId, documentType, templateId?): Promise<TemplateConfig | null>`, consumed by Task 6/7/8/9.

- [ ] **Step 1: Look at the exact pattern to mirror**

Run: `cat apps/finance-service/src/company-settings/company-settings.client.ts apps/finance-service/src/company-settings/company-settings.client.spec.ts`

(Already read earlier in this session — `getSettings` does a `fetch` with a 5s timeout, a short in-memory cache, `authHeaders()` with dev-bypass-or-JWT, and fails open. `resolve` follows the identical shape but fails open to `null`, not a default object, since "no template" is itself a valid, meaningful state — not an error.)

- [ ] **Step 2: Write the failing test**

Create `apps/finance-service/src/document-templates/document-template.client.spec.ts`:

```typescript
import { DocumentTemplateClient } from './document-template.client';

const originalFetch = global.fetch;

describe('DocumentTemplateClient', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the resolved template on a successful call', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 't1', documentType: 'INVOICE', mode: 'BUILDER' }),
    }) as any;
    const client = new DocumentTemplateClient();
    const result = await client.resolve('co-1', 'INVOICE', 't1');
    expect(result?.id).toBe('t1');
  });

  it('returns null (not throw) when the upstream call fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any;
    const client = new DocumentTemplateClient();
    const result = await client.resolve('co-1', 'INVOICE');
    expect(result).toBeNull();
  });

  it('returns null when crm-service has no template for this company/type', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => null }) as any;
    const client = new DocumentTemplateClient();
    const result = await client.resolve('co-1', 'INVOICE');
    expect(result).toBeNull();
  });

  it('caches a resolved template for the same companyId+documentType+templateId', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 't1', documentType: 'INVOICE' }),
    });
    global.fetch = fetchMock as any;
    const client = new DocumentTemplateClient();
    await client.resolve('co-1', 'INVOICE', 't1');
    await client.resolve('co-1', 'INVOICE', 't1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter finance-service test -- document-template.client.spec.ts`
Expected: FAIL with "Cannot find module './document-template.client'"

- [ ] **Step 4: Implement the client**

Create `apps/finance-service/src/document-templates/document-template.client.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface DocumentTemplateConfig {
  id: string;
  documentType: string;
  mode: string;
  logoUrl?: string | null;
  logoPosition?: string | null;
  accentColor?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  bankDetails?: string | null;
  showPageNumbers?: boolean;
  letterheadImageUrl?: string | null;
  letterheadTopMarginPx?: number | null;
  letterheadBottomMarginPx?: number | null;
}

interface CacheEntry {
  value: DocumentTemplateConfig | null;
  expiresAt: number;
}

/** Reads the resolved document template from crm-service — same pattern as CompanySettingsClient. */
@Injectable()
export class DocumentTemplateClient {
  private readonly logger = new Logger(DocumentTemplateClient.name);
  private readonly cache = new Map<string, CacheEntry>();

  async resolve(companyId: string, documentType: string, templateId?: string): Promise<DocumentTemplateConfig | null> {
    const cacheKey = `${companyId}:${documentType}:${templateId ?? ''}`;
    const hit = this.cache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    try {
      const params = new URLSearchParams({ documentType, ...(templateId ? { templateId } : {}) });
      const res = await fetch(`${CRM_SERVICE_URL}/document-templates/resolve?${params}`, {
        headers: this.authHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw new Error(`crm responded ${res.status}`);
      const value = ((await res.json()) as DocumentTemplateConfig | null) ?? null;
      this.cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (err) {
      this.logger.warn(`template resolve failed for ${companyId}/${documentType}, falling back to no template: ${(err as Error).message}`);
      return null;
    }
  }

  private authHeaders(companyId: string): Record<string, string> {
    const secret = process.env.JWT_SECRET;
    if (process.env.BYPASS_AUTH === 'true' || !secret) {
      return {
        'x-test-user-role': 'company_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'document-template-client',
        'x-test-user-email': 'service@tscrm.internal',
      };
    }
    const token = jwt.sign(
      { sub: 'document-template-client', email: 'service@tscrm.internal', name: 'Document Template Client', company_id: companyId, role: 'company_admin' },
      secret,
      { expiresIn: '5m' },
    );
    return { Authorization: `Bearer ${token}` };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- document-template.client.spec.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/finance-service/src/document-templates
git commit -m "feat(finance): DocumentTemplateClient — resolve tenant templates from crm-service"
```

---

### Task 6: finance-service — template-aware header/footer rendering (invoice + quote)

**Files:**
- Modify: `apps/finance-service/src/pdf/pdf.service.ts`
- Modify: `apps/finance-service/src/pdf/templates/invoice.hbs`
- Modify: `apps/finance-service/src/pdf/templates/quote.hbs`
- Test: `apps/finance-service/src/pdf/pdf.service.spec.ts` (new)

**Interfaces:**
- Produces: `renderInvoiceHtml`/`renderQuoteHtml`/`generateInvoicePdf`/`generateQuotePdf` gain a `template?: DocumentTemplateConfig | null` parameter (default `null` — today's exact hardcoded look). `htmlToPdf` gains an optional `{ footerTemplate?: string }` for real page numbers via Puppeteer's native footer mechanism.

- [ ] **Step 1: Write the failing tests**

Create `apps/finance-service/src/pdf/pdf.service.spec.ts`:

```typescript
import { PdfService } from './pdf.service';
import type { DocumentTemplateConfig } from '../document-templates/document-template.client';

const baseQuote: any = {
  quoteNumber: 'Q-1', status: 'DRAFT', customerName: 'Amara', customerEmail: 'a@x.com',
  title: 'HVAC service', description: '', createdAt: new Date(), validUntil: null, jobId: null,
  lineItems: [], subtotal: 0, discountAmount: 0, discountType: null, discountValue: null,
  taxRate: 0, taxAmount: 0, total: 0, approvedAt: null, approvedByName: null, approvedByEmail: null,
  notes: null, terms: null,
};

describe('PdfService — template-aware rendering', () => {
  const service = new PdfService();

  it('with no template, renders the existing hardcoded hero (backward compatible)', () => {
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Acme HVAC');
    expect(html).not.toContain('class="letterhead-bg"');
  });

  it('builder mode template injects logo, accent color, and footer text', () => {
    const template: DocumentTemplateConfig = {
      id: 't1', documentType: 'QUOTE', mode: 'BUILDER',
      logoUrl: 'https://cdn.example.com/logo.png', logoPosition: 'LEFT', accentColor: '#ff0000',
      headerText: 'Est. 1998', footerText: 'Thank you for your business', bankDetails: 'Acc #12345',
      showPageNumbers: true,
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toContain('https://cdn.example.com/logo.png');
    expect(html).toContain('#ff0000');
    expect(html).toContain('Est. 1998');
    expect(html).toContain('Thank you for your business');
    expect(html).toContain('Acc #12345');
  });

  it('letterhead mode sets a background image and hides the branded hero', () => {
    const template: DocumentTemplateConfig = {
      id: 't2', documentType: 'QUOTE', mode: 'LETTERHEAD',
      letterheadImageUrl: 'https://cdn.example.com/letterhead.png',
      letterheadTopMarginPx: 150, letterheadBottomMarginPx: 90,
    };
    const html = service.renderQuoteHtml(baseQuote, 'Acme HVAC', '123 Main St', undefined, template);
    expect(html).toContain('https://cdn.example.com/letterhead.png');
    expect(html).toContain('150px');
    expect(html).toContain('90px');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter finance-service test -- pdf.service.spec.ts`
Expected: FAIL — `renderQuoteHtml` doesn't accept a 5th `template` argument yet, so the builder/letterhead assertions won't find the expected strings (the no-template test may pass already, which is fine — TDD here is about the new behavior, not every assertion needing to start red).

- [ ] **Step 3: Add the CSS + Handlebars helpers to `invoice.hbs`**

In `apps/finance-service/src/pdf/templates/invoice.hbs`, inside `<style>` just before the closing `</style>` (line 126), add:

```css
    /* ── Template-driven overrides (Task 6) ── */
    .brand-logo { max-height: 44px; max-width: 160px; object-fit: contain; }
    .brand-tagline { margin-top: 4px; font-size: 10.5px; color: #94a3b8; }
    .letterhead-bg { background-size: 100% auto; background-repeat: no-repeat; background-position: top center; }
    .letterhead-spacer-top { display: block; }
    .letterhead-spacer-bottom { display: block; }
    .footer-bank { margin-top: 4px; font-size: 10px; color: #64748b; }
```

Replace the `.hero` block (lines 131-156) with a mode-conditional version:

```html
      {{#if template.isLetterhead}}
      <div class="letterhead-spacer-top" style="height: {{template.letterheadTopMarginPx}}px;"></div>
      <div style="padding: 0 40px; display: flex; justify-content: flex-end;">
        <div class="doc-card" style="background: #f1f5f9; border-color: #e2e8f0;">
          <div class="doc-label" style="color:#64748b;">Invoice</div>
          <div class="doc-number" style="color:#0f172a;">{{invoiceNumber}}</div>
          <span class="status-badge status-{{status}}">{{status}}</span>
        </div>
      </div>
      {{else}}
      <div class="hero">
        <div class="hero-top">
          <div>
            {{#if template.logoUrl}}<img class="brand-logo" src="{{template.logoUrl}}" alt="" />{{/if}}
            <div class="eyebrow">Client billing statement</div>
            <div class="brand-name">{{companyName}}</div>
            <div class="brand-address">{{companyAddress}}</div>
            {{#if template.headerText}}<div class="brand-tagline">{{template.headerText}}</div>{{/if}}
          </div>
          <div class="doc-card">
            <div class="doc-label">Invoice</div>
            <div class="doc-number">{{invoiceNumber}}</div>
            <span class="status-badge status-{{status}}">{{status}}</span>
          </div>
        </div>
        <div class="hero-summary">
          <div class="summary-card">
            <div class="summary-label">Bill to</div>
            <div class="summary-value">{{customerName}}</div>
            <div class="summary-copy">{{customerEmail}}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Balance due</div>
            <div class="summary-value balance-accent">{{#if balanceDue}}{{balanceDueFmt}}{{else}}{{totalFmt}}{{/if}}</div>
            <div class="summary-copy">Payment due {{dueDate}}</div>
          </div>
        </div>
      </div>
      {{/if}}
```

Replace the `.footer` block (lines 301-304) with:

```html
        <div class="footer">
          <div>
            <div>Generated {{generatedAt}} · T&amp;S CRM</div>
            {{#if template.footerText}}<div>{{template.footerText}}</div>{{/if}}
            {{#if template.bankDetails}}<div class="footer-bank">{{template.bankDetails}}</div>{{/if}}
          </div>
          <div><strong>Payment due {{dueDate}}</strong></div>
        </div>
        {{#if template.isLetterhead}}
        <div class="letterhead-spacer-bottom" style="height: {{template.letterheadBottomMarginPx}}px;"></div>
        {{/if}}
```

Add the letterhead background + accent color as an inline `<style>` block right after `<body>` (line 128), since Handlebars can't interpolate into a static `<style>` block's selectors otherwise:

```html
<body>
  <style>
    {{#if template.isLetterhead}}
    .sheet {
      background-image: url('{{template.letterheadImageUrl}}');
      background-size: 100% auto; background-repeat: no-repeat; background-position: top center;
      box-shadow: none;
    }
    {{/if}}
    {{#if template.accentColor}}
    .eyebrow, .doc-label, .summary-label { color: {{template.accentColor}} !important; }
    .status-SENT { background: {{template.accentColor}}22 !important; color: {{template.accentColor}} !important; }
    {{/if}}
  </style>
```

- [ ] **Step 4: Apply the identical pattern to `quote.hbs`**

In `apps/finance-service/src/pdf/templates/quote.hbs`, apply the same four edits at its own line numbers (`</style>` at line 110, `.hero` at 115, `.footer` at 241, `<body>` at its own opening tag) — same CSS additions, same hero/footer conditional structure, substituting `quoteNumber`/quote-specific fields for `invoiceNumber`/invoice fields (e.g. the doc-card in letterhead mode shows `Quote` / `{{quoteNumber}}` instead of `Invoice` / `{{invoiceNumber}}`).

- [ ] **Step 5: Update `PdfService` to build the `template` context and add page-number support**

In `apps/finance-service/src/pdf/pdf.service.ts`, add the import:

```typescript
import type { DocumentTemplateConfig } from '../document-templates/document-template.client';
```

Update `renderQuoteHtml`'s signature and context (around line 102):

```typescript
  renderQuoteHtml(
    quote: QuoteWithItems,
    companyName: string,
    companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS,
    template?: DocumentTemplateConfig | null,
  ): string {
    const usd = (v: number | { toString(): string } | null | undefined) => formatMoneySrv(v, opts.currency);
    const dateStr = (d: Date | null | undefined) => formatDateSrv(d, opts.timezone);
    const tpl = loadTemplate('quote');
    const context = {
      companyName,
      companyAddress,
      template: this.templateContext(template),
      quoteNumber: quote.quoteNumber,
```

(Keep everything else in the existing `context` object unchanged — this only adds the `template:` line right after `companyAddress`.)

Do the same for `renderInvoiceHtml` (add the `template?: DocumentTemplateConfig | null` parameter and `template: this.templateContext(template),` in its context object).

Update `generateQuotePdf`/`generateInvoicePdf` to accept and forward the same optional 5th parameter, and pass `template?.showPageNumbers` through to `htmlToPdf`:

```typescript
  async generateQuotePdf(
    quote: QuoteWithItems, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): Promise<Buffer> {
    const html = this.renderQuoteHtml(quote, companyName, companyAddress, opts, template);
    return this.htmlToPdf(html, { showPageNumbers: template?.showPageNumbers ?? false });
  }

  async generateInvoicePdf(
    invoice: InvoiceWithRelations, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): Promise<Buffer> {
    const html = this.renderInvoiceHtml(invoice, companyName, companyAddress, opts, template);
    return this.htmlToPdf(html, { showPageNumbers: template?.showPageNumbers ?? false });
  }
```

Add the `templateContext` helper (private method, anywhere in the class) that normalizes `undefined`/`null` to a safe empty object and adds the derived `isLetterhead` flag the templates check:

```typescript
  /** Normalizes a resolved template into exactly what the .hbs files need — never null, so `{{#if template.x}}` always works. */
  private templateContext(template?: DocumentTemplateConfig | null) {
    if (!template) return { isLetterhead: false };
    return {
      isLetterhead: template.mode === 'LETTERHEAD',
      logoUrl: template.logoUrl ?? null,
      headerText: template.headerText ?? null,
      footerText: template.footerText ?? null,
      bankDetails: template.bankDetails ?? null,
      accentColor: template.accentColor ?? null,
      letterheadImageUrl: template.letterheadImageUrl ?? null,
      letterheadTopMarginPx: template.letterheadTopMarginPx ?? 140,
      letterheadBottomMarginPx: template.letterheadBottomMarginPx ?? 100,
    };
  }
```

Update `htmlToPdf` to support real page numbers via Puppeteer's native footer:

```typescript
  private async htmlToPdf(html: string, opts: { showPageNumbers?: boolean } = {}): Promise<Buffer> {
    await this.acquireSlot();
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const pdfBuffer = await page.pdf({
          format: 'Letter',
          printBackground: true,
          margin: opts.showPageNumbers
            ? { top: '0', right: '0', bottom: '24px', left: '0' }
            : { top: '0', right: '0', bottom: '0', left: '0' },
          displayHeaderFooter: !!opts.showPageNumbers,
          headerTemplate: '<span></span>',
          footerTemplate: opts.showPageNumbers
            ? '<div style="width:100%;font-size:9px;text-align:center;color:#94a3b8;font-family:Arial,sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
            : '<span></span>',
        });
        return Buffer.from(pdfBuffer);
      } finally {
        await page.close().catch(() => { /* ignore double-close */ });
      }
    } finally {
      this.releaseSlot();
    }
  }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- pdf.service.spec.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 7: Run the full finance-service suite and type-check**

Run: `pnpm --filter finance-service test && pnpm --filter finance-service type-check`
Expected: PASS — this catches any other caller of `generateInvoicePdf`/`generateQuotePdf`/`renderInvoiceHtml`/`renderQuoteHtml` that needs its call site checked (the new parameters are all optional, so existing 4-argument calls keep compiling unchanged).

- [ ] **Step 8: Commit**

```bash
git add apps/finance-service/src/pdf
git commit -m "feat(finance): template-driven header/footer rendering for invoice/quote PDFs (builder + letterhead modes), real page numbers"
```

---

### Task 7: finance-service — wire template resolution into invoice/quote controllers, fix tenant-name bug

**Files:**
- Modify: `apps/finance-service/src/invoices/invoices.controller.ts:36-40,177-198`
- Modify: `apps/finance-service/src/quotes/quotes.controller.ts` (same shape, its own line numbers)
- Modify: `apps/finance-service/src/invoices/dto/create-invoice.dto.ts`
- Modify: `apps/finance-service/src/quotes/dto/create-quote.dto.ts`
- Modify: `apps/finance-service/src/app.module.ts`

**Interfaces:**
- Consumes: `DocumentTemplateClient.resolve` (Task 5), `CompanySettingsClient.getSettings` (existing — now also read for `name`/`address`, not just currency/timezone).

- [ ] **Step 1: Add `templateId` to both create DTOs**

In `apps/finance-service/src/invoices/dto/create-invoice.dto.ts`, add after `workOrderId`:

```typescript
  @ApiPropertyOptional() @IsOptional() @IsString() templateId?: string;
```

In `apps/finance-service/src/quotes/dto/create-quote.dto.ts`'s `CreateQuoteDto` (check the file for its exact field list first — it wasn't fully read in this session; add the same optional field in the same style as its other optional string fields like `jobId`/`projectId`):

```typescript
  @ApiPropertyOptional() @IsOptional() @IsString() templateId?: string;
```

- [ ] **Step 2: Register `DocumentTemplateClient` for injection**

Since `DocumentTemplateClient` has no external deps (just `fetch`+`jsonwebtoken`), it doesn't need its own module — add it directly as a provider where it's consumed. Check whether `company-settings.client.ts` is registered via a dedicated `CompanySettingsModule` (it is — `apps/finance-service/src/company-settings/company-settings.module.ts`). Create the equivalent:

Create `apps/finance-service/src/document-templates/document-templates.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DocumentTemplateClient } from './document-template.client';

@Module({
  providers: [DocumentTemplateClient],
  exports: [DocumentTemplateClient],
})
export class DocumentTemplatesModule {}
```

In `apps/finance-service/src/app.module.ts`, import and add `DocumentTemplatesModule` to `imports` (alongside `CompanySettingsModule`).

- [ ] **Step 3: Fix the tenant-name bug and wire template resolution — Invoices**

In `apps/finance-service/src/invoices/invoices.controller.ts`, add `DocumentTemplateClient` to the constructor:

```typescript
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
    private readonly companySettings: CompanySettingsClient,
    private readonly documentTemplates: DocumentTemplateClient,
  ) {}
```

(add the import: `import { DocumentTemplateClient } from '../document-templates/document-template.client';`)

Replace the `downloadPdf` body (lines 179-198):

```typescript
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoicesService.findOne(user.companyId, id);
    const settings = await this.companySettings.getSettings(user.companyId);
    const companyName = settings.name || process.env.COMPANY_NAME || 'T&S Services';
    const companyAddress = (settings as any).address || process.env.COMPANY_ADDRESS || '';
    const template = await this.documentTemplates.resolve(user.companyId, 'INVOICE', (invoice as any).templateId);
    const pdf = await this.pdfService.generateInvoicePdf(invoice as any, companyName, companyAddress, {
      currency: settings.currency,
      timezone: settings.timezone,
    }, template);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
```

`CompanySettings` (the shared type in `packages/types`) doesn't currently expose `address` — check `packages/types/src/company-settings.ts` and add `address: string | null` to the interface and to `CompanySettingsService.getSettings` in crm-service (`apps/crm-service/src/company/company.service.ts`) so it's actually populated from the `Company` row, not just cast through with `as any`. This is a real gap, not a workaround — fix it at the source rather than casting.

- [ ] **Step 4: Same fix for Quotes**

Apply the identical pattern to `apps/finance-service/src/quotes/quotes.controller.ts`'s `downloadPdf` (or equivalently-named PDF endpoint) — same constructor addition, same settings/template resolution, `documentTemplates.resolve(user.companyId, 'QUOTE', (quote as any).templateId)`, same call shape into `generateQuotePdf`.

- [ ] **Step 5: Pass `templateId` through on create**

In `apps/finance-service/src/invoices/invoices.service.ts`'s `create` method, add `templateId: dto.templateId ?? null` to the `data` passed to `prisma.invoice.create` (find the exact spot by searching for where other optional cross-schema refs like `jobId`/`projectId` are assigned in that method, and add `templateId` alongside them). Do the equivalent in `apps/finance-service/src/quotes/quotes.service.ts`'s create method.

- [ ] **Step 6: Run the full finance-service suite and type-check**

Run: `pnpm --filter finance-service test && pnpm --filter finance-service type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/finance-service/src apps/crm-service/src/company packages/types/src/company-settings.ts
git commit -m "fix(finance): use tenant company name/address in PDFs instead of global env vars; wire template selection through create+download"
```

---

### Task 8: finance-service — Agreement PDF template + renderer

**Files:**
- Create: `apps/finance-service/src/pdf/templates/agreement.hbs`
- Modify: `apps/finance-service/src/pdf/pdf.service.ts`
- Test: `apps/finance-service/src/pdf/pdf.service.spec.ts`

**Interfaces:**
- Produces: `PdfService.generateAgreementPdf(context: AgreementPdfContext, companyName, companyAddress, opts, template)`, consumed by Task 9's render endpoint.

- [ ] **Step 1: Write the failing test**

Add to `apps/finance-service/src/pdf/pdf.service.spec.ts`:

```typescript
describe('PdfService — agreement rendering', () => {
  const service = new PdfService();
  const context = {
    name: 'Annual AC Maintenance', description: 'Two visits per year',
    customerName: 'Kamal Perera', customerEmail: 'kamal@example.com',
    startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'),
    serviceType: 'AC Maintenance', serviceInterval: 'BI_ANNUAL',
    visitsIncluded: 2, visitsUsed: 1,
    billingAmount: 250, billingCycle: 'ANNUAL', nextBillingDate: new Date('2027-01-01'),
    signedByName: null, signedAt: null,
  };

  it('renders parties, schedule, and pricing', () => {
    const html = service.renderAgreementHtml(context as any, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Annual AC Maintenance');
    expect(html).toContain('Kamal Perera');
    expect(html).toContain('AC Maintenance');
  });

  it('shows blank signature lines when unsigned', () => {
    const html = service.renderAgreementHtml(context as any, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Customer Representative');
  });

  it('prints the signed name/date when signed', () => {
    const signed = { ...context, signedByName: 'Kamal Perera', signedAt: new Date('2026-01-02') };
    const html = service.renderAgreementHtml(signed as any, 'Acme HVAC', '123 Main St');
    expect(html).toContain('Kamal Perera');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter finance-service test -- pdf.service.spec.ts`
Expected: FAIL — `renderAgreementHtml` doesn't exist.

- [ ] **Step 3: Create `agreement.hbs`**

Create `apps/finance-service/src/pdf/templates/agreement.hbs` — same page/sheet/hero/footer CSS shell as `invoice.hbs` (copy its `<style>` block verbatim, it's shared visual language), with this body:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    <!-- Same *, .page, .sheet, .hero*, .doc-*, .status-*, .footer, .brand-logo, .brand-tagline,
         .letterhead-*, .footer-bank rules as invoice.hbs's <style> block (copy verbatim). -->
    .section { padding: 0 40px; margin-top: 24px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 10px; }
    .kv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 24px; }
    .kv-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .kv-label { color: #64748b; }
    .kv-value { font-weight: 600; color: #0f172a; }
    .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }
    .sig-line { border-top: 1px solid #0f172a; padding-top: 8px; font-size: 11px; color: #64748b; }
    .sig-name { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 24px; min-height: 20px; }
  </style>
</head>
<body>
  <style>
    {{#if template.isLetterhead}}
    .sheet { background-image: url('{{template.letterheadImageUrl}}'); background-size: 100% auto; background-repeat: no-repeat; background-position: top center; box-shadow: none; }
    {{/if}}
    {{#if template.accentColor}}
    .eyebrow, .doc-label, .section-title { color: {{template.accentColor}} !important; }
    {{/if}}
  </style>
  <div class="page">
    <div class="sheet">
      {{#if template.isLetterhead}}
      <div style="height: {{template.letterheadTopMarginPx}}px;"></div>
      <div style="padding: 0 40px; display: flex; justify-content: flex-end;">
        <div class="doc-card" style="background: #f1f5f9; border-color: #e2e8f0;">
          <div class="doc-label" style="color:#64748b;">Service Agreement</div>
        </div>
      </div>
      {{else}}
      <div class="hero">
        <div class="hero-top">
          <div>
            {{#if template.logoUrl}}<img class="brand-logo" src="{{template.logoUrl}}" alt="" />{{/if}}
            <div class="eyebrow">Service agreement</div>
            <div class="brand-name">{{companyName}}</div>
            <div class="brand-address">{{companyAddress}}</div>
            {{#if template.headerText}}<div class="brand-tagline">{{template.headerText}}</div>{{/if}}
          </div>
          <div class="doc-card">
            <div class="doc-label">Agreement</div>
            <div class="doc-number">{{name}}</div>
          </div>
        </div>
      </div>
      {{/if}}

      <div class="body">
        <div class="section">
          <div class="section-title">Parties</div>
          <div class="kv-grid">
            <div class="kv-row"><span class="kv-label">Customer</span><span class="kv-value">{{customerName}}</span></div>
            <div class="kv-row"><span class="kv-label">Email</span><span class="kv-value">{{customerEmail}}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Schedule</div>
          <div class="kv-grid">
            <div class="kv-row"><span class="kv-label">Service type</span><span class="kv-value">{{serviceType}}</span></div>
            <div class="kv-row"><span class="kv-label">Interval</span><span class="kv-value">{{serviceInterval}}</span></div>
            <div class="kv-row"><span class="kv-label">Start</span><span class="kv-value">{{startDateFmt}}</span></div>
            <div class="kv-row"><span class="kv-label">End</span><span class="kv-value">{{endDateFmt}}</span></div>
            {{#if visitsIncluded}}<div class="kv-row"><span class="kv-label">Visits included</span><span class="kv-value">{{visitsUsed}} of {{visitsIncluded}} used</span></div>{{/if}}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Pricing</div>
          <div class="kv-grid">
            <div class="kv-row"><span class="kv-label">Amount</span><span class="kv-value">{{billingAmountFmt}}</span></div>
            <div class="kv-row"><span class="kv-label">Billing cycle</span><span class="kv-value">{{billingCycle}}</span></div>
            {{#if nextBillingDateFmt}}<div class="kv-row"><span class="kv-label">Next billing</span><span class="kv-value">{{nextBillingDateFmt}}</span></div>{{/if}}
          </div>
        </div>

        {{#if description}}
        <div class="section">
          <div class="section-title">Notes</div>
          <p style="font-size: 12px; color: #334155; line-height: 1.6;">{{description}}</p>
        </div>
        {{/if}}

        <div class="section sig-grid">
          <div>
            <div class="sig-name">&nbsp;</div>
            <div class="sig-line">Company Representative</div>
          </div>
          <div>
            <div class="sig-name">{{#if signedByName}}{{signedByName}} — {{signedAtFmt}}{{/if}}</div>
            <div class="sig-line">Customer Representative</div>
          </div>
        </div>

        <div class="footer" style="margin-top: 32px;">
          <div>
            <div>Generated {{generatedAt}} · T&amp;S CRM</div>
            {{#if template.footerText}}<div>{{template.footerText}}</div>{{/if}}
          </div>
        </div>
        {{#if template.isLetterhead}}
        <div style="height: {{template.letterheadBottomMarginPx}}px;"></div>
        {{/if}}
      </div>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 4: Add `renderAgreementHtml`/`generateAgreementPdf` to `PdfService`**

In `apps/finance-service/src/pdf/pdf.service.ts`, add near the other renderers:

```typescript
export interface AgreementPdfContext {
  name: string;
  description?: string | null;
  customerName: string;
  customerEmail: string;
  startDate: Date;
  endDate?: Date | null;
  serviceType?: string | null;
  serviceInterval?: string | null;
  visitsIncluded?: number | null;
  visitsUsed?: number;
  billingAmount?: number | { toString(): string } | null;
  billingCycle?: string | null;
  nextBillingDate?: Date | null;
  signedByName?: string | null;
  signedAt?: Date | null;
}
```

```typescript
  async generateAgreementPdf(
    context: AgreementPdfContext, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): Promise<Buffer> {
    const html = this.renderAgreementHtml(context, companyName, companyAddress, opts, template);
    return this.htmlToPdf(html, { showPageNumbers: template?.showPageNumbers ?? false });
  }

  renderAgreementHtml(
    context: AgreementPdfContext, companyName: string, companyAddress: string,
    opts: PdfRenderOpts = DEFAULT_RENDER_OPTS, template?: DocumentTemplateConfig | null,
  ): string {
    const usd = (v: number | { toString(): string } | null | undefined) => formatMoneySrv(v, opts.currency);
    const dateStr = (d: Date | null | undefined) => formatDateSrv(d, opts.timezone);
    const tpl = loadTemplate('agreement');
    return tpl({
      companyName,
      companyAddress,
      template: this.templateContext(template),
      name: context.name,
      description: context.description ?? '',
      customerName: context.customerName,
      customerEmail: context.customerEmail,
      startDateFmt: dateStr(context.startDate),
      endDateFmt: context.endDate ? dateStr(context.endDate) : 'Ongoing',
      serviceType: context.serviceType ?? '—',
      serviceInterval: context.serviceInterval ?? '—',
      visitsIncluded: context.visitsIncluded ?? null,
      visitsUsed: context.visitsUsed ?? 0,
      billingAmountFmt: context.billingAmount ? usd(context.billingAmount) : '—',
      billingCycle: context.billingCycle ?? '—',
      nextBillingDateFmt: context.nextBillingDate ? dateStr(context.nextBillingDate) : null,
      signedByName: context.signedByName ?? null,
      signedAtFmt: context.signedAt ? dateStr(context.signedAt) : '',
      generatedAt: dateStr(new Date()),
    });
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- pdf.service.spec.ts`
Expected: PASS (all 6 tests — 3 from Task 6, 3 new)

- [ ] **Step 6: Commit**

```bash
git add apps/finance-service/src/pdf
git commit -m "feat(finance): agreement PDF template + renderer (parties, schedule, pricing, signature block)"
```

---

### Task 9: finance-service — cross-service render + preview endpoints

**Files:**
- Create: `apps/finance-service/src/document-render/document-render.controller.ts`
- Create: `apps/finance-service/src/document-render/document-render.module.ts`
- Modify: `apps/finance-service/src/app.module.ts`
- Test: `apps/finance-service/src/document-render/document-render.controller.spec.ts`

**Interfaces:**
- Consumes: `PdfService.generateAgreementPdf` (Task 8), `PdfService.renderQuoteHtml`/`renderInvoiceHtml`/`renderAgreementHtml` (Tasks 6/8), `DocumentTemplateClient.resolve` (Task 5).
- Produces: `POST /internal/documents/render` (service-to-service, called by crm-service's agreements flow, Task 10) and `POST /documents/preview` (called directly by the admin-dashboard editor UI, Task 13/14).

- [ ] **Step 1: Write the failing test**

Create `apps/finance-service/src/document-render/document-render.controller.spec.ts`:

```typescript
import { DocumentRenderController } from './document-render.controller';

function makePdfService() {
  return {
    generateAgreementPdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
    renderQuoteHtml: jest.fn().mockReturnValue('<html>quote</html>'),
    renderInvoiceHtml: jest.fn().mockReturnValue('<html>invoice</html>'),
    renderAgreementHtml: jest.fn().mockReturnValue('<html>agreement</html>'),
  };
}
function makeTemplateClient() {
  return { resolve: jest.fn().mockResolvedValue(null) };
}

describe('DocumentRenderController', () => {
  it('renderAgreement resolves the template then generates a PDF', async () => {
    const pdf = makePdfService();
    const templates = makeTemplateClient();
    const controller = new DocumentRenderController(pdf as any, templates as any);
    const res: any = { set: jest.fn(), end: jest.fn() };
    await controller.renderAgreement(
      { companyId: 'co-1', templateId: 't1', context: { name: 'X', customerName: 'Y', customerEmail: 'y@x.com', startDate: '2026-01-01' }, companyName: 'Acme', companyAddress: '1 St' },
      res,
    );
    expect(templates.resolve).toHaveBeenCalledWith('co-1', 'AGREEMENT', 't1');
    expect(pdf.generateAgreementPdf).toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith(Buffer.from('pdf-bytes'));
  });

  it('preview returns HTML for the requested documentType using draft template fields directly (no DB lookup)', () => {
    const pdf = makePdfService();
    const templates = makeTemplateClient();
    const controller = new DocumentRenderController(pdf as any, templates as any);
    const result = controller.preview({ documentType: 'QUOTE', template: { mode: 'BUILDER', accentColor: '#111' } } as any);
    expect(templates.resolve).not.toHaveBeenCalled();
    expect(result).toEqual({ html: '<html>quote</html>' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter finance-service test -- document-render.controller.spec.ts`
Expected: FAIL with "Cannot find module './document-render.controller'"

- [ ] **Step 3: Implement the controller**

Create `apps/finance-service/src/document-render/document-render.controller.ts`:

```typescript
import { Body, Controller, Post, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateClient, DocumentTemplateConfig } from '../document-templates/document-template.client';

const SAMPLE_QUOTE: any = {
  quoteNumber: 'Q-SAMPLE-001', status: 'DRAFT', customerName: 'Jordan Rivera', customerEmail: 'jordan@example.com',
  title: 'Sample quote', description: 'Preview only', createdAt: new Date(), validUntil: new Date(Date.now() + 14 * 86400000),
  jobId: null, lineItems: [{ description: 'AC tune-up', category: 'LABOUR', quantity: 1, unitPrice: 150, lineTotal: 150, sortOrder: 0, taxable: true }],
  subtotal: 150, discountAmount: 0, discountType: null, discountValue: null, taxRate: 0.08, taxAmount: 12, total: 162,
  approvedAt: null, approvedByName: null, approvedByEmail: null, notes: 'Sample notes', terms: 'Sample terms',
};
const SAMPLE_INVOICE: any = {
  invoiceNumber: 'INV-SAMPLE-001', status: 'SENT', customerName: 'Jordan Rivera', customerEmail: 'jordan@example.com',
  createdAt: new Date(), dueDate: new Date(Date.now() + 30 * 86400000), quote: null,
  lineItems: [{ description: 'AC tune-up', category: 'LABOUR', quantity: 1, unitPrice: 150, lineTotal: 150, sortOrder: 0, taxable: true }],
  subtotal: 150, discountAmount: 0, taxRate: 0.08, taxAmount: 12, total: 162, amountPaid: 0, balanceDue: 162,
  stripePaymentUrl: '', payments: [], notes: 'Sample notes', terms: 'Sample terms',
};
const SAMPLE_AGREEMENT: any = {
  name: 'Sample Service Agreement', description: 'Preview only', customerName: 'Jordan Rivera', customerEmail: 'jordan@example.com',
  startDate: new Date(), endDate: new Date(Date.now() + 365 * 86400000), serviceType: 'AC Maintenance', serviceInterval: 'QUARTERLY',
  visitsIncluded: 4, visitsUsed: 1, billingAmount: 400, billingCycle: 'ANNUAL', nextBillingDate: new Date(Date.now() + 90 * 86400000),
  signedByName: null, signedAt: null,
};

interface RenderAgreementBody {
  companyId: string;
  templateId?: string;
  companyName: string;
  companyAddress: string;
  context: {
    name: string; description?: string; customerName: string; customerEmail: string;
    startDate: string; endDate?: string; serviceType?: string; serviceInterval?: string;
    visitsIncluded?: number; visitsUsed?: number; billingAmount?: number; billingCycle?: string;
    nextBillingDate?: string; signedByName?: string; signedAt?: string;
  };
}

interface PreviewBody {
  documentType: 'INVOICE' | 'QUOTE' | 'AGREEMENT';
  template: Partial<DocumentTemplateConfig>;
}

@ApiTags('Document Render (internal + preview)')
@Controller()
export class DocumentRenderController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly templates: DocumentTemplateClient,
  ) {}

  @Post('internal/documents/render')
  @ApiOperation({ summary: 'Service-to-service: render an agreement PDF for crm-service (no user-facing auth — internal network only)' })
  async renderAgreement(@Body() body: RenderAgreementBody, @Res() res: Response) {
    if (!body?.context?.name) throw new BadRequestException('context.name is required');
    const template = await this.templates.resolve(body.companyId, 'AGREEMENT', body.templateId);
    const pdf = await this.pdfService.generateAgreementPdf(
      {
        ...body.context,
        startDate: new Date(body.context.startDate),
        endDate: body.context.endDate ? new Date(body.context.endDate) : null,
        nextBillingDate: body.context.nextBillingDate ? new Date(body.context.nextBillingDate) : null,
        signedAt: body.context.signedAt ? new Date(body.context.signedAt) : null,
      },
      body.companyName,
      body.companyAddress,
      undefined,
      template,
    );
    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
    res.end(pdf);
  }

  @Post('documents/preview')
  @ApiOperation({ summary: 'Render draft (unsaved) template fields to HTML against sample data — for the template editor live preview' })
  preview(@Body() body: PreviewBody): { html: string } {
    const template = { id: 'draft', documentType: body.documentType, mode: 'BUILDER', ...body.template } as DocumentTemplateConfig;
    if (body.documentType === 'QUOTE') {
      return { html: this.pdfService.renderQuoteHtml(SAMPLE_QUOTE, 'Your Company Name', '123 Main St, Anytown', undefined, template) };
    }
    if (body.documentType === 'INVOICE') {
      return { html: this.pdfService.renderInvoiceHtml(SAMPLE_INVOICE, 'Your Company Name', '123 Main St, Anytown', undefined, template) };
    }
    return { html: this.pdfService.renderAgreementHtml(SAMPLE_AGREEMENT, 'Your Company Name', '123 Main St, Anytown', undefined, template) };
  }
}
```

Note: `/documents/preview` intentionally has no `@UseGuards` — check how `nginx.conf`/dev nginx routes `/api/finance/*` before assuming this is safe to leave fully open; if the gateway doesn't already gate finance-service routes behind auth, add `@UseGuards(JwtAuthGuard)` (no `RolesGuard`/`@Roles` needed — any authenticated staff user previewing a template they can already see the data for is fine, this endpoint only ever touches the fixed sample data above, never real tenant data).

- [ ] **Step 4: Create the module and register it**

Create `apps/finance-service/src/document-render/document-render.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DocumentRenderController } from './document-render.controller';
import { PdfModule } from '../pdf/pdf.module';
import { DocumentTemplatesModule } from '../document-templates/document-templates.module';

@Module({
  imports: [PdfModule, DocumentTemplatesModule],
  controllers: [DocumentRenderController],
})
export class DocumentRenderModule {}
```

Check `PdfModule` exports `PdfService` (it must, since `InvoicesModule`/`QuotesModule` already inject it) before assuming this import is sufficient.

In `apps/finance-service/src/app.module.ts`, import and add `DocumentRenderModule` to `imports`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter finance-service test -- document-render.controller.spec.ts`
Expected: PASS (both tests)

- [ ] **Step 6: Run the full finance-service suite and type-check**

Run: `pnpm --filter finance-service test && pnpm --filter finance-service type-check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/finance-service/src/document-render apps/finance-service/src/app.module.ts
git commit -m "feat(finance): internal agreement-render endpoint + template editor live-preview endpoint"
```

---

### Task 10: crm-service — Agreement PDF generation + download endpoint

**Files:**
- Create: `apps/crm-service/src/finance-render/finance-render.client.ts`
- Modify: `apps/crm-service/src/agreements/agreements.service.ts`
- Modify: `apps/crm-service/src/agreements/agreements.controller.ts`
- Modify: `apps/crm-service/src/agreements/agreements.module.ts`
- Test: `apps/crm-service/src/finance-render/finance-render.client.spec.ts`, `apps/crm-service/src/agreements/agreements.service.spec.ts`

**Interfaces:**
- Consumes: finance-service's `POST /internal/documents/render` (Task 9), `StorageService` (existing).
- Produces: `AgreementsService.generatePdf(companyId, id): Promise<Buffer>`, `GET /agreements/:id/pdf`.

- [ ] **Step 1: Write the failing test for `FinanceRenderClient`**

Create `apps/crm-service/src/finance-render/finance-render.client.spec.ts`:

```typescript
import { FinanceRenderClient } from './finance-render.client';
import axios from 'axios';

jest.mock('axios');

describe('FinanceRenderClient', () => {
  it('posts the agreement context and returns the PDF buffer', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ data: Buffer.from('pdf-bytes') });
    const client = new FinanceRenderClient();
    const result = await client.renderAgreement({
      companyId: 'co-1', companyName: 'Acme', companyAddress: '1 St',
      context: { name: 'X', customerName: 'Y', customerEmail: 'y@x.com', startDate: '2026-01-01' },
    });
    expect(result).toEqual(Buffer.from('pdf-bytes'));
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/internal/documents/render'),
      expect.objectContaining({ companyId: 'co-1' }),
      expect.objectContaining({ responseType: 'arraybuffer' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter crm-service test -- finance-render.client.spec.ts`
Expected: FAIL with "Cannot find module './finance-render.client'"

- [ ] **Step 3: Implement the client**

Create `apps/crm-service/src/finance-render/finance-render.client.ts` (mirrors `iot/jobs.client.ts`):

```typescript
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

const FINANCE_URL = process.env.FINANCE_SERVICE_URL ?? 'http://localhost:3004';

export interface RenderAgreementInput {
  companyId: string;
  templateId?: string;
  companyName: string;
  companyAddress: string;
  context: {
    name: string; description?: string; customerName: string; customerEmail: string;
    startDate: string; endDate?: string; serviceType?: string; serviceInterval?: string;
    visitsIncluded?: number; visitsUsed?: number; billingAmount?: number; billingCycle?: string;
    nextBillingDate?: string; signedByName?: string; signedAt?: string;
  };
}

@Injectable()
export class FinanceRenderClient {
  private readonly logger = new Logger(FinanceRenderClient.name);

  async renderAgreement(input: RenderAgreementInput): Promise<Buffer> {
    try {
      const res = await axios.post(`${FINANCE_URL}/internal/documents/render`, input, {
        responseType: 'arraybuffer',
        timeout: 20_000,
      });
      return Buffer.from(res.data);
    } catch (err: any) {
      this.logger.error(`Agreement PDF render failed: ${err?.response?.status} ${err.message}`);
      throw new ServiceUnavailableException('Could not generate the agreement PDF — try again shortly');
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter crm-service test -- finance-render.client.spec.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for `AgreementsService.generatePdf`**

Read the existing `apps/crm-service/src/agreements/agreements.service.spec.ts` first to match its mocking conventions, then add a test resembling:

```typescript
describe('generatePdf', () => {
  it('builds the render context from the agreement + customer + company, uploads, and stores documentUrl', async () => {
    prisma.serviceAgreement.findFirst.mockResolvedValue({
      id: 'a1', companyId: CO, name: 'Annual Maintenance', description: null,
      customerId: 'cust-1', startDate: new Date('2026-01-01'), endDate: null,
      serviceType: 'AC Maintenance', serviceInterval: 'ANNUAL', visitsIncluded: 2, visitsUsed: 0,
      billingAmount: 400, billingCycle: 'ANNUAL', nextBillingDate: null,
      signedByName: null, signedAt: null, templateId: null,
    });
    prisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', firstName: 'Kamal', lastName: 'Perera', email: 'k@x.com' });
    prisma.company.findFirst.mockResolvedValue({ id: CO, name: 'Acme', address: '1 St' });
    financeRender.renderAgreement.mockResolvedValue(Buffer.from('pdf-bytes'));
    storage.putPublicObject.mockResolvedValue('https://cdn.example.com/documents/co-1/agreement-a1.pdf');
    prisma.serviceAgreement.update.mockResolvedValue({ id: 'a1', documentUrl: 'https://cdn.example.com/documents/co-1/agreement-a1.pdf' });

    const result = await service.generatePdf(CO, 'a1');

    expect(financeRender.renderAgreement).toHaveBeenCalledWith(expect.objectContaining({
      companyId: CO,
      context: expect.objectContaining({ name: 'Annual Maintenance', customerName: 'Kamal Perera' }),
    }));
    expect(prisma.serviceAgreement.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { documentUrl: 'https://cdn.example.com/documents/co-1/agreement-a1.pdf' },
    });
    expect(result).toEqual(Buffer.from('pdf-bytes'));
  });
});
```

Add `company: { findFirst: jest.fn() }` and `financeRender`/`storage` mocks to whatever `makePrisma`/provider setup the existing spec file uses, following its own established pattern rather than introducing a new one.

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter crm-service test -- agreements.service.spec.ts`
Expected: FAIL — `generatePdf` doesn't exist yet.

- [ ] **Step 7: Implement `generatePdf`**

In `apps/crm-service/src/agreements/agreements.service.ts`, add `FinanceRenderClient` and `StorageService` to the constructor (check the existing constructor's parameter style first — this service likely already injects `PrismaService` and possibly others; add the two new ones consistent with that), then add:

```typescript
  async generatePdf(companyId: string, id: string): Promise<Buffer> {
    const agreement = await this.prisma.serviceAgreement.findFirst({ where: { id, companyId } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    const customer = await this.prisma.customer.findFirst({ where: { id: agreement.customerId, companyId } });
    if (!customer) throw new NotFoundException('Customer not found');
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });

    const pdf = await this.financeRender.renderAgreement({
      companyId,
      templateId: (agreement as any).templateId ?? undefined,
      companyName: company?.name ?? 'T&S Services',
      companyAddress: company?.address ?? '',
      context: {
        name: agreement.name,
        description: agreement.description ?? undefined,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email,
        startDate: agreement.startDate.toISOString(),
        endDate: agreement.endDate?.toISOString(),
        serviceType: agreement.serviceType ?? undefined,
        serviceInterval: agreement.serviceInterval ?? undefined,
        visitsIncluded: agreement.visitsIncluded ?? undefined,
        visitsUsed: agreement.visitsUsed,
        billingAmount: agreement.billingAmount ? parseFloat(agreement.billingAmount.toString()) : undefined,
        billingCycle: agreement.billingCycle ?? undefined,
        nextBillingDate: agreement.nextBillingDate?.toISOString(),
        signedByName: agreement.signedByName ?? undefined,
        signedAt: agreement.signedAt?.toISOString(),
      },
    });

    const key = `documents/${companyId}/agreement-${id}.pdf`;
    const documentUrl = await this.storage.putPublicObject(key, pdf, 'application/pdf');
    await this.prisma.serviceAgreement.update({ where: { id }, data: { documentUrl } });

    return pdf;
  }
```

- [ ] **Step 8: Add `templateId` to `ServiceAgreement`**

In `apps/crm-service/prisma/schema.prisma`, add `templateId String?` to `model ServiceAgreement` (near `documentUrl`). Add the corresponding line to the same migration entry created in Task 1 (extend its SQL, don't create a second migration for the same logical change):

```sql
ALTER TABLE "crm"."service_agreements" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
```

(Confirm the actual table name via `@@map(...)` on `ServiceAgreement` before finalizing — it may not be `service_agreements`.)

Run: `pnpm --filter crm-service exec prisma generate`

- [ ] **Step 9: Add the download endpoint**

In `apps/crm-service/src/agreements/agreements.controller.ts`, add (matching the existing controller's guard/role style):

```typescript
  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download the agreement as PDF (generates + stores it)' })
  async downloadPdf(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const agreement = await this.agreementsService.findOne(user.companyId, id);
    const pdf = await this.agreementsService.generatePdf(user.companyId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="agreement-${agreement.name.replace(/[^a-z0-9]+/gi, '-')}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
```

Add the `Res`/`Response` imports consistent with how `houses.controller.ts`/other controllers in this service import Express types, if not already imported in this file.

- [ ] **Step 10: Wire the module**

In `apps/crm-service/src/agreements/agreements.module.ts`, import `FinanceRenderClient` (no separate module needed, same reasoning as `DocumentTemplateClient` in finance-service — it has no deps) and `StorageModule`, add both as providers/imports.

- [ ] **Step 11: Run tests to verify they pass**

Run: `pnpm --filter crm-service test -- agreements.service.spec.ts finance-render.client.spec.ts`
Expected: PASS

- [ ] **Step 12: Run the full crm-service suite and type-check**

Run: `pnpm --filter crm-service test && pnpm --filter crm-service type-check`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add apps/crm-service/src/finance-render apps/crm-service/src/agreements apps/crm-service/prisma/schema.prisma
git commit -m "feat(crm): agreement PDF generation end-to-end (cross-service render + storage + download endpoint)"
```

---

### Task 11: Apply migrations to the dev database

**Files:** none (operational step)

- [ ] **Step 1: Run the migration script**

Run: `node scripts/apply-migrations.mjs`
Expected: `[apply] 20260722010000_add_document_templates` under `=== Schema: crm ===` and `[apply] 20260722010000_add_document_template_id` under `=== Schema: finance ===` (name/schema exactly as finalized in Tasks 1/4/10 — cross-check against what was actually written, since Task 10 extends the Task 1 entry rather than adding a new one).

- [ ] **Step 2: Verify the new tables/columns**

Run a verification script analogous to the one used in the previous plan's Task 8 (connect via `pg`, query `information_schema.columns`/`to_regclass` for `crm.document_templates`, `crm.service_agreements.templateId`, `finance.invoices.templateId`, `finance.quotes.templateId`).

- [ ] **Step 3: Restart crm-service and finance-service, confirm clean boot**

Run: `pnpm --filter crm-service dev` and `pnpm --filter finance-service dev` (separately, briefly), check logs for `DocumentTemplatesModule`/`DocumentRenderModule`/`AgreementsModule` initializing without errors and their new routes being mapped.

(No commit — operational only.)

---

### Task 12: Frontend — `documentTemplatesApi.ts` + Finance tab shell

**Files:**
- Create: `apps/admin-dashboard/src/pages/finance/documentTemplatesApi.ts`
- Modify: `apps/admin-dashboard/src/pages/finance/Finance.tsx`
- Create: `apps/admin-dashboard/src/pages/finance/DocumentTemplatesTab.tsx`

**Interfaces:**
- Consumes: `GET/POST/PATCH/DELETE /crm/document-templates`, `POST /crm/document-templates/:id/set-default`, `POST /crm/document-templates/letterhead-upload`, `POST /finance/documents/preview`.
- Produces: `useDocumentTemplates(documentType)`, `useCreateDocumentTemplate`, `useUpdateDocumentTemplate`, `useDeleteDocumentTemplate`, `useSetDefaultTemplate`, `useUploadLetterhead`, `usePreviewTemplate` hooks; `<DocumentTemplatesTab />` component.

- [ ] **Step 1: Data layer**

Create `apps/admin-dashboard/src/pages/finance/documentTemplatesApi.ts`:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { queryClient } from '../../lib/queryClient'
import api from '../../lib/api'

export type DocumentType = 'INVOICE' | 'QUOTE' | 'AGREEMENT'
export type TemplateMode = 'BUILDER' | 'LETTERHEAD'

export interface DocumentTemplate {
  id: string
  companyId: string
  documentType: DocumentType
  name: string
  isDefault: boolean
  mode: TemplateMode
  logoUrl?: string | null
  logoPosition?: string | null
  accentColor?: string | null
  headerText?: string | null
  footerText?: string | null
  bankDetails?: string | null
  showPageNumbers: boolean
  letterheadImageUrl?: string | null
  letterheadTopMarginPx?: number | null
  letterheadBottomMarginPx?: number | null
  createdAt: string
}

export interface UpsertTemplateInput {
  documentType: DocumentType
  name?: string
  mode?: TemplateMode
  logoUrl?: string
  logoPosition?: string
  accentColor?: string
  headerText?: string
  footerText?: string
  bankDetails?: string
  showPageNumbers?: boolean
  letterheadImageUrl?: string
  letterheadTopMarginPx?: number
  letterheadBottomMarginPx?: number
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: ['document-templates'] })

export function useDocumentTemplates(documentType: DocumentType) {
  return useQuery<DocumentTemplate[]>({
    queryKey: ['document-templates', documentType],
    queryFn: async () => (await api.get('/crm/document-templates', { params: { documentType } })).data ?? [],
    staleTime: 15_000,
  })
}

export function useCreateDocumentTemplate() {
  return useMutation({
    mutationFn: async (input: UpsertTemplateInput) => (await api.post('/crm/document-templates', input)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateDocumentTemplate() {
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<UpsertTemplateInput> & { id: string }) =>
      (await api.patch(`/crm/document-templates/${id}`, input)).data,
    onSuccess: invalidate,
  })
}

export function useDeleteDocumentTemplate() {
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/crm/document-templates/${id}`)).data,
    onSuccess: invalidate,
  })
}

export function useSetDefaultTemplate() {
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/crm/document-templates/${id}/set-default`)).data,
    onSuccess: invalidate,
  })
}

export function useUploadLetterhead() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/crm/document-templates/letterhead-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data as { url: string }
    },
  })
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: async ({ documentType, template }: { documentType: DocumentType; template: Partial<UpsertTemplateInput> }) =>
      (await api.post('/finance/documents/preview', { documentType, template })).data as { html: string },
  })
}
```

- [ ] **Step 2: Add the "Document Templates" tab shell**

In `apps/admin-dashboard/src/pages/finance/Finance.tsx`, change the tab union (line 109):

```typescript
  const [tab, setTab] = useState<'invoices' | 'quotes' | 'expenses' | 'templates'>('invoices')
```

Add the tab button (after the "Expenses" button, around line 264):

```tsx
        <button className={`tab-btn ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>
          <FileSignature size={14} /> Document Templates
        </button>
```

(Check `FileSignature` is already imported from `lucide-react` in this file — `AgreementsTab`-adjacent files use it; if not present here, add it to the existing `lucide-react` import line.)

Add the tab content (after the expenses tab's closing block):

```tsx
      {tab === 'templates' && <DocumentTemplatesTab />}
```

Add the import: `import DocumentTemplatesTab from './DocumentTemplatesTab'`.

- [ ] **Step 3: Build the tab shell (list view only — editor comes in Task 13/14)**

Create `apps/admin-dashboard/src/pages/finance/DocumentTemplatesTab.tsx`:

```tsx
import { useState } from 'react'
import { Plus, Star, Copy, Trash2, Loader2, FileText, DollarSign, FileSignature } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import {
  useDocumentTemplates, useDeleteDocumentTemplate, useSetDefaultTemplate,
  type DocumentType, type DocumentTemplate,
} from './documentTemplatesApi'
import TemplateEditorModal from './TemplateEditorModal'

const SECTIONS: { key: DocumentType; label: string; icon: React.ElementType }[] = [
  { key: 'INVOICE', label: 'Invoices', icon: FileText },
  { key: 'QUOTE', label: 'Quotes', icon: DollarSign },
  { key: 'AGREEMENT', label: 'Agreements', icon: FileSignature },
]

export default function DocumentTemplatesTab() {
  const [section, setSection] = useState<DocumentType>('INVOICE')
  const [editing, setEditing] = useState<DocumentTemplate | 'new' | null>(null)
  const templatesQ = useDocumentTemplates(section)
  const deleteMut = useDeleteDocumentTemplate()
  const setDefaultMut = useSetDefaultTemplate()
  const { showSuccess, showError } = useToast()

  const templates = templatesQ.data ?? []

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div style={{ display: 'flex', gap: 6 }}>
          {SECTIONS.map(s => {
            const Icon = s.icon
            const active = section === s.key
            return (
              <button key={s.key} className="btn btn-sm" onClick={() => setSection(s.key)}
                style={active
                  ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
                  : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                <Icon size={13} /> {s.label}
              </button>
            )
          })}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus size={12} /> New template
        </button>
      </div>

      {templatesQ.isLoading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
        </div>
      ) : templates.length === 0 ? (
        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No templates yet</p>
          <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>
            Without one, {SECTIONS.find(s => s.key === section)?.label.toLowerCase()} use the default T&amp;S CRM look.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, padding: 16 }}>
          {templates.map(t => (
            <div key={t.id} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <button onClick={() => setEditing(t)} style={{
                  fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'left',
                }}>
                  {t.name}
                </button>
                {t.isDefault && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '2px 7px', borderRadius: 999 }}>
                    <Star size={9} /> Default
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--t4)' }}>{t.mode === 'BUILDER' ? 'Custom design' : 'Uploaded letterhead'}</span>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {!t.isDefault && (
                  <button className="btn btn-secondary btn-sm" disabled={setDefaultMut.isPending}
                    onClick={() => setDefaultMut.mutate(t.id, {
                      onSuccess: () => showSuccess(`${t.name} is now the default`, 'Default set'),
                      onError: (e: any) => showError(e?.response?.data?.message ?? 'Could not set default', 'Failed'),
                    })}>
                    <Star size={11} /> Make default
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(t.id, {
                    onError: (e: any) => showError(e?.response?.data?.message ?? 'Could not delete this template', 'Delete failed'),
                  })}>
                  <Trash2 size={11} style={{ color: 'var(--red)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TemplateEditorModal
          documentType={section}
          template={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
```

`TemplateEditorModal` doesn't exist yet — this file won't compile until Task 13 creates it. That's expected mid-plan; don't run a build after this task alone.

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/pages/finance/documentTemplatesApi.ts apps/admin-dashboard/src/pages/finance/Finance.tsx apps/admin-dashboard/src/pages/finance/DocumentTemplatesTab.tsx
git commit -m "feat(admin): Document Templates tab shell — list view per document type"
```

---

### Task 13: Frontend — Template editor (Builder mode + live preview)

**Files:**
- Create: `apps/admin-dashboard/src/pages/finance/TemplateEditorModal.tsx`

**Interfaces:**
- Consumes: `useCreateDocumentTemplate`, `useUpdateDocumentTemplate`, `usePreviewTemplate` (Task 12).

- [ ] **Step 1: Build the editor — mode toggle, Builder fields, live preview iframe**

Create `apps/admin-dashboard/src/pages/finance/TemplateEditorModal.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Loader2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import {
  useCreateDocumentTemplate, useUpdateDocumentTemplate, usePreviewTemplate, useUploadLetterhead,
  type DocumentType, type DocumentTemplate, type TemplateMode, type UpsertTemplateInput,
} from './documentTemplatesApi'

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-input, var(--bg-card))',
  color: 'var(--t1)', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'block', marginBottom: 6,
}

export default function TemplateEditorModal({ documentType, template, onClose }: {
  documentType: DocumentType
  template: DocumentTemplate | null
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createMut = useCreateDocumentTemplate()
  const updateMut = useUpdateDocumentTemplate()
  const previewMut = usePreviewTemplate()
  const uploadLetterhead = useUploadLetterhead()
  const { showError } = useToast()

  const [name, setName] = useState(template?.name ?? '')
  const [mode, setMode] = useState<TemplateMode>(template?.mode ?? 'BUILDER')
  const [logoUrl, setLogoUrl] = useState(template?.logoUrl ?? '')
  const [logoPosition, setLogoPosition] = useState(template?.logoPosition ?? 'LEFT')
  const [accentColor, setAccentColor] = useState(template?.accentColor ?? '#0f172a')
  const [headerText, setHeaderText] = useState(template?.headerText ?? '')
  const [footerText, setFooterText] = useState(template?.footerText ?? '')
  const [bankDetails, setBankDetails] = useState(template?.bankDetails ?? '')
  const [showPageNumbers, setShowPageNumbers] = useState(template?.showPageNumbers ?? true)
  const [letterheadImageUrl, setLetterheadImageUrl] = useState(template?.letterheadImageUrl ?? '')
  const [topMargin, setTopMargin] = useState(template?.letterheadTopMarginPx ?? 140)
  const [bottomMargin, setBottomMargin] = useState(template?.letterheadBottomMarginPx ?? 100)
  const [error, setError] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')

  const draft: Partial<UpsertTemplateInput> = useMemo(() => ({
    mode,
    logoUrl: logoUrl || undefined,
    logoPosition,
    accentColor: accentColor || undefined,
    headerText: headerText || undefined,
    footerText: footerText || undefined,
    bankDetails: bankDetails || undefined,
    showPageNumbers,
    letterheadImageUrl: letterheadImageUrl || undefined,
    letterheadTopMarginPx: topMargin,
    letterheadBottomMarginPx: bottomMargin,
  }), [mode, logoUrl, logoPosition, accentColor, headerText, footerText, bankDetails, showPageNumbers, letterheadImageUrl, topMargin, bottomMargin])

  // Debounced live preview — re-renders ~400ms after the last edit.
  useEffect(() => {
    const t = setTimeout(() => {
      previewMut.mutate({ documentType, template: draft }, {
        onSuccess: (res) => setPreviewHtml(res.html),
      })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, documentType])

  const onPickLetterhead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await uploadLetterhead.mutateAsync(file)
      setLetterheadImageUrl(res.url)
    } catch (err: any) {
      showError(err?.response?.data?.message ?? 'Could not upload this file', 'Upload failed')
    }
  }

  const saving = createMut.isPending || updateMut.isPending
  const valid = !!name.trim()

  const save = async () => {
    if (!valid || saving) return
    setError('')
    const payload: UpsertTemplateInput = { documentType, name: name.trim(), ...draft }
    try {
      if (template) await updateMut.mutateAsync({ id: template.id, ...payload })
      else await createMut.mutateAsync(payload)
      onClose()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to save template')
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={template ? 'Edit template' : 'New template'}
        style={{ width: 1100, maxWidth: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'min(800px, calc(100vh - 48px))' }}
        onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <input style={{ ...inp, width: 220 }} value={name} placeholder="Template name" onChange={e => setName(e.target.value)} />
            <div style={{ display: 'flex', gap: 4 }}>
              {(['BUILDER', 'LETTERHEAD'] as TemplateMode[]).map(m => (
                <button key={m} className="btn btn-sm" onClick={() => setMode(m)} style={mode === m
                  ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
                  : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                  {m === 'BUILDER' ? 'Design in-app' : 'Upload letterhead'}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '360px 1fr' }}>
          {/* Left: controls */}
          <div style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, borderRight: '1px solid var(--bd)' }}>
            {mode === 'BUILDER' ? (
              <>
                <div>
                  <label style={lbl}>Logo URL</label>
                  <input style={inp} value={logoUrl} placeholder="https://…" onChange={e => setLogoUrl(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Logo position</label>
                  <select className="select" style={{ width: '100%' }} value={logoPosition ?? 'LEFT'} onChange={e => setLogoPosition(e.target.value)}>
                    <option value="LEFT">Left</option>
                    <option value="CENTER">Center</option>
                    <option value="RIGHT">Right</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Accent color</label>
                  <input type="color" style={{ ...inp, height: 38, padding: 4 }} value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Header text</label>
                  <input style={inp} value={headerText} placeholder="Tagline, registration number…" onChange={e => setHeaderText(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Footer text</label>
                  <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={footerText} placeholder="Terms, disclaimer…" onChange={e => setFooterText(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Bank details</label>
                  <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={bankDetails} placeholder="Account name, number, routing…" onChange={e => setBankDetails(e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t2)' }}>
                  <input type="checkbox" checked={showPageNumbers} onChange={e => setShowPageNumbers(e.target.checked)} />
                  Show page numbers
                </label>
              </>
            ) : (
              <>
                <div>
                  <label style={lbl}>Letterhead image or PDF</label>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: uploadLetterhead.isPending ? 'default' : 'pointer', width: 'fit-content' }}>
                    {uploadLetterhead.isPending ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                    {' '}{letterheadImageUrl ? 'Replace file' : 'Upload file'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onPickLetterhead} disabled={uploadLetterhead.isPending} style={{ display: 'none' }} />
                  </label>
                  {letterheadImageUrl && <p style={{ fontSize: 11, color: 'var(--t4)', margin: '6px 0 0' }}>Uploaded — drag the guide lines in the preview to set the safe zone.</p>}
                </div>
                <div>
                  <label style={lbl}>Top safe zone: {topMargin}px</label>
                  <input type="range" min={40} max={320} value={topMargin} onChange={e => setTopMargin(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={lbl}>Bottom safe zone: {bottomMargin}px</label>
                  <input type="range" min={40} max={320} value={bottomMargin} onChange={e => setBottomMargin(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={lbl}>Footer text</label>
                  <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={footerText} placeholder="Terms, disclaimer…" onChange={e => setFooterText(e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--t2)' }}>
                  <input type="checkbox" checked={showPageNumbers} onChange={e => setShowPageNumbers(e.target.checked)} />
                  Show page numbers
                </label>
              </>
            )}
          </div>

          {/* Right: live preview */}
          <div style={{ overflowY: 'auto', background: 'var(--bg-card-2)', padding: 18 }}>
            {previewMut.isPending && !previewHtml ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
              </div>
            ) : (
              <iframe title="Template preview" srcDoc={previewHtml} style={{ width: '100%', height: '100%', border: '1px solid var(--bd)', borderRadius: 10, background: '#fff' }} />
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
          {error && <span style={{ fontSize: 12, color: 'var(--red)', marginRight: 'auto' }}>{error}</span>}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid || saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {template ? 'Save changes' : 'Create template'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

Note: the "drag guide lines directly on the preview" interaction described in the design spec is deferred here in favor of range sliders for the safe-zone margins — still fully functional and directly tied to the live preview (the preview re-renders with the new margins as the slider moves), but doesn't require injecting draggable DOM elements into a cross-origin-like `iframe srcDoc` (which has real event-handling complexity: coordinates inside the iframe vs. outside it). If drag-on-preview is a hard requirement rather than a nice-to-have, that's a follow-up iteration once the slider version is verified working end-to-end.

- [ ] **Step 2: Build and manually verify**

Run: `pnpm --filter admin-dashboard build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/admin-dashboard/src/pages/finance/TemplateEditorModal.tsx
git commit -m "feat(admin): template editor — Builder mode fields + Letterhead upload + live preview"
```

---

### Task 14: Frontend — template picker in creation modals + Agreements "Download PDF"

**Files:**
- Modify: `apps/admin-dashboard/src/pages/finance/AddInvoiceModal.tsx`
- Modify: `apps/admin-dashboard/src/pages/finance/AddQuoteModal.tsx`
- Modify: `apps/admin-dashboard/src/pages/agreements/AgreementEditorModal.tsx`
- Modify: `apps/admin-dashboard/src/hooks/useAgreements.ts` (add a download-PDF helper if one doesn't already exist there)
- Modify: wherever agreement row actions render (`AgreementDrawer.tsx` or `Agreements.tsx` — check which owns the per-row action buttons first)

**Interfaces:**
- Consumes: `useDocumentTemplates('INVOICE' | 'QUOTE' | 'AGREEMENT')` (Task 12).

- [ ] **Step 1: Add the picker to `AddInvoiceModal`**

Read `apps/admin-dashboard/src/pages/finance/AddInvoiceModal.tsx`'s form-state (`useState`) block and its payload-building function first (not fully read this session — locate them by searching for the existing `customerId`/`notes` fields, which is the established shape to extend). Add:

```typescript
import { useDocumentTemplates } from './documentTemplatesApi'
```

```typescript
  const templatesQ = useDocumentTemplates('INVOICE')
  const templates = templatesQ.data ?? []
  const [templateId, setTemplateId] = useState('')
```

In the form JSX, only when `templates.length > 1` (per the design's "don't clutter the common case" rule), render:

```tsx
{templates.length > 1 && (
  <div>
    <label style={lbl}>Template</label>
    <select className="select" style={{ width: '100%' }} value={templateId} onChange={e => setTemplateId(e.target.value)}>
      <option value="">Use default</option>
      {templates.map(t => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>)}
    </select>
  </div>
)}
```

Add `templateId: templateId || undefined` to the create-mutation payload, alongside the modal's other optional fields (find the exact spot by locating where `notes`/`terms` are added to the submitted object).

- [ ] **Step 2: Same pattern for `AddQuoteModal`**

Identical shape, `useDocumentTemplates('QUOTE')`.

- [ ] **Step 3: Same pattern for `AgreementEditorModal`**

Identical shape, `useDocumentTemplates('AGREEMENT')`, added to the `form` state object already present in this file (seen earlier in this session — it has a `form` state with `customerId` etc.) and to whatever payload `useCreateAgreement`/`useUpdateAgreement` send (check `AgreementInput` in `useAgreements.ts` — it will need a `templateId?: string` field added there too, plus the corresponding pass-through already exists on the backend from Task 8's `templateId` column, but confirm `AgreementsService.create`/`update` in crm-service actually accept and persist it — if Task 8-10 didn't add that wiring explicitly, add `templateId: input.templateId ?? null` to `AgreementsService`'s create/update methods now, mirroring how `HousesService`/`ProjectsService` handle other optional passthrough fields elsewhere in this codebase).

- [ ] **Step 4: Add "Download PDF" to the Agreements UI**

In `apps/admin-dashboard/src/hooks/useAgreements.ts`, add:

```typescript
export function useDownloadAgreementPdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/crm/agreements/${id}/pdf`, { responseType: 'blob' })
      return res.data as Blob
    },
  })
}
```

Locate wherever an agreement's row-level or drawer-level actions currently render (check `AgreementDrawer.tsx` first, since that's the detail view analogous to `InvoiceDetailModal`/`QuoteDetailModal` which already have "Download PDF" buttons — mirror their exact button + blob-download-via-`<a>` pattern):

```tsx
const downloadPdf = useDownloadAgreementPdf()
const { showError } = useToast()

const onDownload = async () => {
  try {
    const blob = await downloadPdf.mutateAsync(agreement.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agreement-${agreement.name}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    showError(e?.response?.data?.message ?? 'Could not download the PDF', 'Download failed')
  }
}
```

```tsx
<button className="btn btn-secondary btn-sm" onClick={onDownload} disabled={downloadPdf.isPending}>
  {downloadPdf.isPending ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Download PDF
</button>
```

Match whatever blob-download helper `InvoiceDetailModal.tsx`/`QuoteDetailModal.tsx` already use instead of hand-rolling the above if one exists as a shared utility — check those two files for a `downloadBlob`/`saveAs`-style helper first.

- [ ] **Step 5: Build and manually verify**

Run: `pnpm --filter admin-dashboard build`
Expected: PASS

Then start the full stack and manually verify: create an Invoice template (Builder mode, set a logo + accent color), confirm it appears as default; create a second template; confirm the picker now shows in `AddInvoiceModal`; download an invoice PDF and confirm the branding applied; do the same for an Agreement end-to-end (create agreement → Download PDF → confirm it's a real, well-formed PDF with the schedule/pricing/signature sections).

- [ ] **Step 6: Commit**

```bash
git add apps/admin-dashboard/src/pages/finance apps/admin-dashboard/src/pages/agreements apps/admin-dashboard/src/hooks/useAgreements.ts
git commit -m "feat(admin): template picker in invoice/quote/agreement creation + agreement PDF download"
```

---

## Self-Review Notes

- **Spec coverage:** Builder mode (Task 6/8/13), Letterhead mode (Task 3/6/8/13), multiple named templates + default (Task 1/2/12), template picker per document (Task 14), agreement PDF net-new (Task 8/9/10/14), tenant-name bug fix (Task 7), page numbers (Task 6). All spec sections have a task.
- **Deviation flagged during planning:** Task 13 uses range sliders instead of literal draggable guide-lines on the iframe preview for the letterhead safe zone — functionally equivalent (both drive the same two pixel values with live preview feedback), noted inline as a possible follow-up rather than silently downgraded.
- **Several steps explicitly say "read the existing file first" instead of guessing its exact current shape** (`CreateQuoteDto`'s full field list, `AddInvoiceModal`'s exact state shape, `AgreementsService`'s constructor style, the agreements detail view's existing PDF-download pattern in Invoice/QuoteDetailModal) — these are real files this session did not fully read, and guessing their exact current code would risk silently-wrong edits; each of those steps names exactly what to check before writing the change, which is a deliberate plan-time choice, not a placeholder.
- **Type consistency:** `DocumentTemplateConfig` (finance-service client, Task 5) and the `template` object shape consumed by `.hbs` files (Task 6/8) and by `documentTemplatesApi.ts` (Task 12, frontend) all use the same field names (`logoUrl`, `accentColor`, `headerText`, `footerText`, `bankDetails`, `showPageNumbers`, `letterheadImageUrl`, `letterheadTopMarginPx`, `letterheadBottomMarginPx`) — cross-checked across all four layers.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-22-document-templates.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

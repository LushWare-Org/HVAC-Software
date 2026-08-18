import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CompanySettings, CurrencySettings, PaymentTermsPreset, TaxRatePreset } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxRatePresetDto, UpdateTaxRatePresetDto } from './dto/tax-rate-preset.dto';
import { CreatePaymentTermsPresetDto, UpdatePaymentTermsPresetDto } from './dto/payment-terms-preset.dto';

/** Seed-only tenant settings — never editable through PATCH /company. */
const SETTINGS_KEYS = ['currency', 'timezone', 'features'] as const;

interface CompanyRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  automaticFollowupEnabled: boolean;
  trialEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);
  private automaticFollowupColumnExists?: boolean;

  constructor(private readonly prisma: PrismaService) {}

  private async hasAutomaticFollowupColumn(): Promise<boolean> {
    if (this.automaticFollowupColumnExists !== undefined) {
      return this.automaticFollowupColumnExists;
    }

    this.automaticFollowupColumnExists = await this.prisma.columnExists('companies', 'automaticFollowupEnabled');
    if (!this.automaticFollowupColumnExists) {
      this.logger.warn('companies.automaticFollowupEnabled column is missing; defaulting automatic follow-up to enabled until the CRM migration is applied');
    }

    return this.automaticFollowupColumnExists;
  }

  private async findCompanyRow(companyId: string): Promise<CompanyRow | null> {
    if (!(await this.prisma.tableExists('companies'))) {
      throw new ServiceUnavailableException('CRM database schema is not ready; run crm-service Prisma migrations');
    }

    const hasToggleColumn = await this.hasAutomaticFollowupColumn();
    const selectAutomaticFollowup = hasToggleColumn
      ? '"automaticFollowupEnabled"'
      : 'TRUE AS "automaticFollowupEnabled"';
    const companiesTable = this.prisma.tableRef('companies');

    const rows = await this.prisma.$queryRawUnsafe<CompanyRow[]>(
      `
        SELECT
          id,
          name,
          email,
          phone,
          address,
          city,
          state,
          "zipCode",
          country,
          "logoUrl",
          website,
          "isActive",
          ${selectAutomaticFollowup},
          "trialEndsAt",
          "createdAt",
          "updatedAt"
        FROM ${companiesTable}
        WHERE id = $1
        LIMIT 1
      `,
      companyId,
    );

    return rows[0] ?? null;
  }

  async findOne(companyId: string) {
    const company = await this.findCompanyRow(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async getSettings(companyId: string): Promise<CompanySettings> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, address: true, logoUrl: true, currency: true, timezone: true, features: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return {
      id: company.id,
      name: company.name,
      address: company.address,
      logoUrl: company.logoUrl,
      currency: company.currency,
      timezone: company.timezone,
      features: (company.features ?? {}) as Record<string, unknown>,
    };
  }

  async update(companyId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    website?: string;
    logoUrl?: string;
    automaticFollowupEnabled?: boolean;
  }) {
    const blocked = SETTINGS_KEYS.filter((k) => k in (data as Record<string, unknown>));
    if (blocked.length > 0) {
      throw new BadRequestException(
        `Settings keys [${blocked.join(', ')}] are managed by the platform and cannot be updated here`,
      );
    }

    const existing = await this.findCompanyRow(companyId);
    if (!existing) throw new NotFoundException('Company not found');

    const hasToggleColumn = await this.hasAutomaticFollowupColumn();
    const automaticFollowupAssignment = hasToggleColumn
      ? ', "automaticFollowupEnabled" = $12'
      : '';

    await this.prisma.$executeRawUnsafe(
      `
        UPDATE ${this.prisma.tableRef('companies')}
        SET
          name = $2,
          email = $3,
          phone = $4,
          address = $5,
          city = $6,
          state = $7,
          "zipCode" = $8,
          country = $9,
          website = $10,
          "logoUrl" = $11
          ${automaticFollowupAssignment},
          "updatedAt" = NOW()
        WHERE id = $1
      `,
      companyId,
      data.name ?? existing.name,
      data.email ?? existing.email,
      data.phone ?? existing.phone,
      data.address ?? existing.address,
      data.city ?? existing.city,
      data.state ?? existing.state,
      data.zipCode ?? existing.zipCode,
      data.country ?? existing.country,
      data.website ?? existing.website,
      data.logoUrl ?? existing.logoUrl,
      data.automaticFollowupEnabled ?? existing.automaticFollowupEnabled,
    );

    return this.findOne(companyId);
  }

  async getCurrencies(companyId: string): Promise<CurrencySettings> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { currency: true, enabledCurrencies: true },
    });
    if (!company) throw new NotFoundException('Company not found');
    return { enabled: company.enabledCurrencies, default: company.currency };
  }

  async updateCurrencies(companyId: string, data: CurrencySettings): Promise<CurrencySettings> {
    if (!data.enabled || data.enabled.length === 0) {
      throw new BadRequestException('enabledCurrencies cannot be empty');
    }
    if (!data.enabled.includes(data.default)) {
      throw new BadRequestException('default currency must be one of the enabled currencies');
    }

    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: { currency: data.default, enabledCurrencies: data.enabled },
      select: { currency: true, enabledCurrencies: true },
    });
    return { enabled: updated.enabledCurrencies, default: updated.currency };
  }

  async listTaxRates(companyId: string): Promise<TaxRatePreset[]> {
    const rows = await this.prisma.taxRatePreset.findMany({
      where: { companyId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows as unknown as TaxRatePreset[];
  }

  async createTaxRate(companyId: string, dto: CreateTaxRatePresetDto): Promise<TaxRatePreset> {
    if (dto.isDefault) {
      await this.prisma.taxRatePreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const created = await this.prisma.taxRatePreset.create({
      data: { companyId, name: dto.name, rate: dto.rate, isDefault: !!dto.isDefault },
    });
    return created as unknown as TaxRatePreset;
  }

  private async findTaxRateOrThrow(companyId: string, id: string) {
    const preset = await this.prisma.taxRatePreset.findUnique({ where: { id } });
    if (!preset || preset.companyId !== companyId) {
      throw new NotFoundException('Tax rate preset not found');
    }
    return preset;
  }

  async updateTaxRate(companyId: string, id: string, dto: UpdateTaxRatePresetDto): Promise<TaxRatePreset> {
    const existing = await this.findTaxRateOrThrow(companyId, id);

    if (existing.isDefault && (dto.isActive === false || dto.isDefault === false)) {
      throw new BadRequestException(
        'Cannot deactivate or unset the default tax rate — set another preset as default first',
      );
    }

    if (dto.isDefault === true) {
      await this.prisma.taxRatePreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.taxRatePreset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return updated as unknown as TaxRatePreset;
  }

  async deleteTaxRate(companyId: string, id: string): Promise<void> {
    const existing = await this.findTaxRateOrThrow(companyId, id);
    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default tax rate — set another preset as default first',
      );
    }
    await this.prisma.taxRatePreset.delete({ where: { id } });
  }

  async listPaymentTerms(companyId: string): Promise<PaymentTermsPreset[]> {
    const rows = await this.prisma.paymentTermsPreset.findMany({
      where: { companyId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows as unknown as PaymentTermsPreset[];
  }

  async createPaymentTerms(companyId: string, dto: CreatePaymentTermsPresetDto): Promise<PaymentTermsPreset> {
    if (dto.isDefault) {
      await this.prisma.paymentTermsPreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    const created = await this.prisma.paymentTermsPreset.create({
      data: { companyId, name: dto.name, days: dto.days, isDefault: !!dto.isDefault },
    });
    return created as unknown as PaymentTermsPreset;
  }

  private async findPaymentTermsOrThrow(companyId: string, id: string) {
    const preset = await this.prisma.paymentTermsPreset.findUnique({ where: { id } });
    if (!preset || preset.companyId !== companyId) {
      throw new NotFoundException('Payment terms preset not found');
    }
    return preset;
  }

  async updatePaymentTerms(companyId: string, id: string, dto: UpdatePaymentTermsPresetDto): Promise<PaymentTermsPreset> {
    const existing = await this.findPaymentTermsOrThrow(companyId, id);

    if (existing.isDefault && (dto.isActive === false || dto.isDefault === false)) {
      throw new BadRequestException(
        'Cannot deactivate or unset the default payment terms — set another preset as default first',
      );
    }

    if (dto.isDefault === true) {
      await this.prisma.paymentTermsPreset.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.paymentTermsPreset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.days !== undefined ? { days: dto.days } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return updated as unknown as PaymentTermsPreset;
  }

  async deletePaymentTerms(companyId: string, id: string): Promise<void> {
    const existing = await this.findPaymentTermsOrThrow(companyId, id);
    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default payment terms — set another preset as default first',
      );
    }
    await this.prisma.paymentTermsPreset.delete({ where: { id } });
  }
}

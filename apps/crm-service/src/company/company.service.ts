import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}

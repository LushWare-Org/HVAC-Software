import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';

const PHONE_SUFFIX_DIGITS = 9;
const SUFFIX_LEN_SQL = Prisma.raw(String(PHONE_SUFFIX_DIGITS));

/** Below this, a "phone number" is too weak to identify anyone. */
const MIN_PHONE_DIGITS = 7;

export type LookupOutcome<T> =
  | { result: 'found'; customer: T }
  | { result: 'not_found' }
  | { result: 'ambiguous'; matches: number };

export function normalizePhone(input: string): string {
  return (input ?? '').replace(/\D/g, '');
}

export function phoneSuffix(input: string): string | null {
  const digits = normalizePhone(input);
  if (digits.length < MIN_PHONE_DIGITS) {
    return null;
  }
  return digits.slice(-PHONE_SUFFIX_DIGITS);
}

function normalizeText(input: string): string {
  return (input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

@Injectable()
export class CustomersLookupService {
  private readonly logger = new Logger(CustomersLookupService.name);

  constructor(private readonly prisma: PrismaService) {}
  async findByPhone(
    companyId: string,
    phone: string,
  ): Promise<LookupOutcome<Awaited<ReturnType<CustomersLookupService['hydrate']>>>> {
    const suffix = phoneSuffix(phone);
    if (!suffix) {
      return { result: 'not_found' };
    }

    // Matches the expression indexes added in
    // 20260902000000_customer_phone_lookup_index.
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT c.id
        FROM crm.customers c
        WHERE c."companyId" = ${companyId}
          AND c."isActive" = true
          AND (
            RIGHT(REGEXP_REPLACE(COALESCE(c.phone, ''), '[^0-9]', '', 'g'), ${SUFFIX_LEN_SQL}) = ${suffix}
            OR RIGHT(REGEXP_REPLACE(COALESCE(c.mobile, ''), '[^0-9]', '', 'g'), ${SUFFIX_LEN_SQL}) = ${suffix}
          )
        LIMIT 2
      `,
    );

    if (rows.length === 0) {
      return { result: 'not_found' };
    }
    if (rows.length > 1) {
      this.logger.log(
        `Phone lookup for company ${companyId} matched multiple customers — reporting ambiguous`,
      );
      return { result: 'ambiguous', matches: rows.length };
    }

    return { result: 'found', customer: await this.hydrate(companyId, rows[0].id) };
  }

  async matchByNameAndAddress(
    companyId: string,
    input: { firstName: string; lastName: string; address: string; zipCode?: string },
  ): Promise<LookupOutcome<Awaited<ReturnType<CustomersLookupService['hydrate']>>>> {
    const firstName = normalizeText(input.firstName);
    const lastName = normalizeText(input.lastName);
    const address = normalizeText(input.address);

    if (!firstName || !lastName || address.length < 4) {
      return { result: 'not_found' };
    }

    const zip = input.zipCode ? normalizeText(input.zipCode) : null;

    // The address is compared against both the customer row and any of their
    // saved addresses, since service addresses often differ from the billing
    // address on the customer record.
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT c.id
        FROM crm.customers c
        WHERE c."companyId" = ${companyId}
          AND c."isActive" = true
          AND TRIM(REGEXP_REPLACE(LOWER(c."firstName"), '[^a-z0-9]+', ' ', 'g')) = ${firstName}
          AND TRIM(REGEXP_REPLACE(LOWER(c."lastName"), '[^a-z0-9]+', ' ', 'g')) = ${lastName}
          AND (
            TRIM(REGEXP_REPLACE(LOWER(COALESCE(c.address, '')), '[^a-z0-9]+', ' ', 'g')) = ${address}
            OR EXISTS (
              SELECT 1 FROM crm.addresses a
              WHERE a."customerId" = c.id
                AND TRIM(REGEXP_REPLACE(LOWER(COALESCE(a.line1, '')), '[^a-z0-9]+', ' ', 'g')) = ${address}
            )
          )
          AND (
            ${zip}::text IS NULL
            OR TRIM(REGEXP_REPLACE(LOWER(COALESCE(c."zipCode", '')), '[^a-z0-9]+', ' ', 'g')) = ${zip}
          )
        LIMIT 2
      `,
    );

    if (rows.length === 0) {
      return { result: 'not_found' };
    }
    if (rows.length > 1) {
      return { result: 'ambiguous', matches: rows.length };
    }

    return { result: 'found', customer: await this.hydrate(companyId, rows[0].id) };
  }

  /** The caller-identity payload: enough for a greeting, nothing more. */
  private async hydrate(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        type: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobile: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        tags: true,
        engagementStatus: true,
        createdAt: true,
        _count: { select: { equipment: true, bookings: true, agreements: true } },
      },
    });

    if (!customer) {
      return null;
    }

    const tags = customer.tags ?? [];
    return {
      ...customer,
      isVip: tags.some((t) => t.toLowerCase() === 'vip'),
      hasServiceAgreement: customer._count.agreements > 0,
    };
  }
}

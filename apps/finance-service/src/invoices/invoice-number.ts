import { Prisma } from '../prisma/generated';

/**
 * Next invoice number for a company, e.g. "INV-2026-0007".
 *
 * Derived from MAX(existing number), not `count()`. Counting is wrong twice
 * over: a deleted invoice makes the next number collide with a live one, and two
 * concurrent callers both read the same count and both build the same number —
 * which `@@unique([companyId, invoiceNumber])` then rejects with P2002.
 *
 * Mirrors `generateJobNumber` in job-service, which solved this already.
 * Callers should still retry on P2002 (see `isInvoiceNumberTaken`): MAX closes
 * the window but cannot eliminate it without locking the table.
 */
export async function nextInvoiceNumber(
  client: Prisma.TransactionClient,
  companyId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  // Table is finance."Invoice" — PascalCase singular, because this schema has no
  // @@map directives. (job-service maps its models to snake_case plurals; the
  // conventions differ per service, so never assume across them.)
  const [row] = await client.$queryRaw<Array<{ maxNumber: number | bigint | null }>>`
    SELECT COALESCE(MAX(SUBSTRING("invoiceNumber" FROM ${`^INV-${year}-([0-9]+)$`})::int), 0) AS "maxNumber"
    FROM "finance"."Invoice"
    WHERE "companyId" = ${companyId}
      AND "invoiceNumber" ~ ${`^INV-${year}-[0-9]+$`}
  `;
  const max = Number(row?.maxNumber ?? 0);
  return `INV-${year}-${String(max + 1).padStart(4, '0')}`;
}

/** True when an error is the invoice-number uniqueness violation, so a retry makes sense. */
export function isInvoiceNumberTaken(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  const target = error.meta?.target;
  return Array.isArray(target)
    && target.includes('companyId')
    && target.includes('invoiceNumber');
}

/** Attempts before giving up — collisions need a fresh MAX read, not a delay. */
export const INVOICE_NUMBER_MAX_ATTEMPTS = 5;

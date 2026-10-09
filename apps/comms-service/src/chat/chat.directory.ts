/**
 * Facts about people the chat needs, read straight from the CRM and job tables
 * (same database, other schemas). Every lookup is scoped to the company, so an
 * id from another tenant simply isn't found.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StaffUser { id: string; name: string; role: string; avatarUrl: string | null }
export interface CustomerRef { id: string; name: string; email: string | null }

@Injectable()
export class ChatDirectory {
  private companyNames = new Map<string, { name: string; at: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /** An active, approved staff member (not a customer login) of this company. */
  async staff(companyId: string, userId: string): Promise<StaffUser | null> {
    const rows = await this.prisma.$queryRawUnsafe<StaffUser[]>(
      `SELECT id, name, role, "avatarUrl" FROM crm.company_users
        WHERE id = $1 AND "companyId" = $2 AND role <> 'customer' AND "isActive" = true
          AND COALESCE("approvalStatus"::text, 'APPROVED') = 'APPROVED'`,
      userId, companyId,
    );
    return rows[0] ?? null;
  }

  async customer(companyId: string, customerId: string): Promise<CustomerRef | null> {
    const rows = await this.prisma.$queryRawUnsafe<CustomerRef[]>(
      `SELECT id, TRIM(CONCAT("firstName", ' ', "lastName")) AS name, email FROM crm.customers
        WHERE id = $1 AND "companyId" = $2`,
      customerId, companyId,
    );
    return rows[0] ?? null;
  }

  /** True when this technician is (or was) on a job for this customer: the reason they may chat. */
  async techServedCustomer(companyId: string, techUserId: string, customerId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*)::int AS n FROM jobs.jobs
        WHERE "companyId" = $1 AND "customerId" = $2
          AND ("assignedToId" = $3 OR $3 = ANY("crewUserIds"))`,
      companyId, customerId, techUserId,
    );
    return (rows[0]?.n ?? 0) > 0;
  }

  /** Technicians a customer can start a private chat with. */
  async techsForCustomer(companyId: string, customerId: string): Promise<StaffUser[]> {
    return this.prisma.$queryRawUnsafe<StaffUser[]>(
      `SELECT DISTINCT u.id, u.name, u.role, u."avatarUrl"
         FROM jobs.jobs j
         JOIN crm.company_users u
           ON u."companyId" = j."companyId" AND (u.id = j."assignedToId" OR u.id = ANY(j."crewUserIds"))
        WHERE j."companyId" = $1 AND j."customerId" = $2 AND u.role = 'technician' AND u."isActive" = true
        ORDER BY u.name`,
      companyId, customerId,
    );
  }

  /** Customers a technician can start a private chat with. */
  async customersForTech(companyId: string, techUserId: string): Promise<CustomerRef[]> {
    return this.prisma.$queryRawUnsafe<CustomerRef[]>(
      `SELECT DISTINCT c.id, TRIM(CONCAT(c."firstName", ' ', c."lastName")) AS name, c.email
         FROM jobs.jobs j JOIN crm.customers c ON c.id = j."customerId" AND c."companyId" = j."companyId"
        WHERE j."companyId" = $1 AND (j."assignedToId" = $2 OR $2 = ANY(j."crewUserIds"))
        ORDER BY 2`,
      companyId, techUserId,
    );
  }

  /** Staff a staff member can message directly. */
  async colleagues(companyId: string, exceptUserId: string): Promise<StaffUser[]> {
    return this.prisma.$queryRawUnsafe<StaffUser[]>(
      `SELECT id, name, role, "avatarUrl" FROM crm.company_users
        WHERE "companyId" = $1 AND id <> $2 AND role <> 'customer' AND "isActive" = true
          AND COALESCE("approvalStatus"::text, 'APPROVED') = 'APPROVED'
        ORDER BY name`,
      companyId, exceptUserId,
    );
  }

  /** A job of this company, for the "About JOB-…" chip on a message. */
  async job(companyId: string, jobId: string): Promise<{ id: string; jobNumber: string; customerId: string | null } | null> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string; jobNumber: string; customerId: string | null }>>(
      `SELECT id, "jobNumber", "customerId" FROM jobs.jobs WHERE id = $1 AND "companyId" = $2`,
      jobId, companyId,
    );
    return rows[0] ?? null;
  }

  /** The company's name, as customers see it on office messages. Cached for ten minutes. */
  async companyName(companyId: string): Promise<string> {
    const hit = this.companyNames.get(companyId);
    if (hit && Date.now() - hit.at < 600_000) return hit.name;
    const rows = await this.prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM crm.companies WHERE id = $1`, companyId,
    );
    const name = rows[0]?.name || 'Our team';
    this.companyNames.set(companyId, { name, at: Date.now() });
    return name;
  }
}

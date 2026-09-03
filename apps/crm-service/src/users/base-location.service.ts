import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Keeps scheduling.technicians.base_location in step with the technician's own
 * CompanyUser latitude/longitude.
 *
 * crm owns the value; the Go scheduling service needs it in SQL to rank crew
 * candidates by distance from where they start their day. Copying it across the
 * schema boundary is the price of keeping that ranking inside the algorithm
 * rather than reassembling it in the dashboard.
 *
 * Every failure here is soft. Base location improves ranking; it never gates an
 * assignment, and a user update must not fail because scheduling is restarting.
 * The nightly reconcile repairs whatever a push missed.
 */
@Injectable()
export class BaseLocationService {
  private readonly logger = new Logger(BaseLocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private schedulingUrl(): string {
    return (process.env.SCHEDULING_SERVICE_URL ?? 'http://localhost:3003').replace(/\/$/, '');
  }

  private headers(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'Content-Type': 'application/json',
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'crm-base-location-sync',
      };
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}`,
    };
  }

  /** Pushes one technician's base to scheduling. Never throws. */
  async push(companyId: string, userId: string, lat: number, lng: number): Promise<boolean> {
    if (lat == null || lng == null) return false;
    try {
      const res = await fetch(
        `${this.schedulingUrl()}/technicians/by-user/${userId}/base-location`,
        {
          method: 'PATCH',
          headers: this.headers(companyId),
          body: JSON.stringify({ lat, lng }),
        },
      );
      return res.ok;
    } catch (err) {
      this.logger.warn(`base location push failed for ${userId}: ${(err as Error).message}`);
      return false;
    }
  }

  /** Repairs drift left by pushes that failed while scheduling was unreachable. */
  async reconcileAll(): Promise<{ synced: number; failed: number }> {
    const users = await this.prisma.companyUser.findMany({
      where: { role: 'technician', latitude: { not: null }, longitude: { not: null } },
      select: { id: true, companyId: true, latitude: true, longitude: true },
    });

    let synced = 0;
    let failed = 0;
    for (const u of users) {
      const ok = await this.push(u.companyId, u.id, u.latitude!, u.longitude!);
      if (ok) synced++;
      else failed++;
    }
    return { synced, failed };
  }

  /**
   * 02:30 daily. Without this the reconcile is dead code and drift is silent: a
   * technician whose base changed while scheduling was down would be ranked from
   * a stale location indefinitely, and nothing would ever say so.
   *
   * Depends on ScheduleModule.forRoot(), which crm-service registers in
   * iot.module.ts rather than app.module.ts. That makes it app-wide, so this
   * fires — but if the IoT module is ever removed, move the forRoot() call to
   * app.module.ts or every @Cron in the service goes quiet without an error.
   */
  @Cron('0 30 2 * * *')
  async nightlyReconcile(): Promise<void> {
    const { synced, failed } = await this.reconcileAll();
    if (failed > 0) {
      this.logger.warn(`base location reconcile left ${failed} technician(s) unsynced`);
    } else {
      this.logger.log(`base location reconcile clean: ${synced} technician(s)`);
    }
  }
}

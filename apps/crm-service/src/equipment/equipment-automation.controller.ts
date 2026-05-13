import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { EquipmentService } from './equipment.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Equipment Automation (internal)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers/equipment')
export class EquipmentAutomationController {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /customers/equipment/automation-candidates?companyId=...
   * Returns equipment + customer data for the marketing automation scanner.
   * Internal — called by comms-service worker only.
   */
  @Get('automation-candidates')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  getAutomationCandidates(
    @CurrentUser() user: AuthUser,
    @Query('companyId') queryCompanyId?: string,
  ) {
    // super_admin may pass explicit companyId; others always use their own
    const companyId = user.role === Role.SUPER_ADMIN && queryCompanyId ? queryCompanyId : user.companyId;
    return this.equipmentService.findAutomationCandidates(companyId);
  }

  /**
   * GET /customers/equipment/company-ids-with-marketing
   * Returns list of all companyIds that have active customers with equipment.
   * Used by the daily cron to know which companies to scan.
   */
  @Get('company-ids-with-marketing')
  @Roles(Role.SUPER_ADMIN)
  async getCompanyIdsWithMarketing() {
    const rows = await this.prisma.equipment.findMany({
      where: {
        customer: { isActive: true },
        OR: [{ installDate: { not: null } }, { warrantyEnd: { not: null } }],
      },
      distinct: ['companyId'],
      select: { companyId: true },
    });
    return rows.map((r) => r.companyId);
  }
}

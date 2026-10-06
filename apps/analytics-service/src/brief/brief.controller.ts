import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { BriefService } from './brief.service';

const MONEY_ROLES = new Set<string>([Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER]);

@ApiTags('Brief')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brief')
export class BriefController {
  constructor(private readonly briefs: BriefService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: "Today's brief: what needs attention, found by exact checks and ordered by AI" })
  @ApiQuery({ name: 'refresh', required: false, description: 'true to rebuild instead of using the 15-minute cache' })
  get(@CurrentUser() user: AuthUser, @Query('refresh') refresh?: string) {
    return this.briefs.build(user.companyId, {
      seesMoney: MONEY_ROLES.has(String(user.role).toLowerCase()),
      refresh: refresh === 'true' || refresh === '1',
    });
  }
}

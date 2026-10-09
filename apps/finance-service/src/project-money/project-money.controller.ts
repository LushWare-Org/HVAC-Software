import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { ProjectMoneyService } from './project-money.service';

@ApiTags('Project money')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectMoneyController {
  constructor(private readonly money: ProjectMoneyService) {}

  @Get(':projectId/money')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: "A project's cost so far (expenses, parts, crew hours), invoiced, paid, profit and budget use" })
  forProject(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.money.forProject(user.companyId, projectId);
  }
}

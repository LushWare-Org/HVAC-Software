import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampaignService, CreateCampaignDto } from './campaign.service';
import { JwtAuthGuard, RolesGuard, CurrentUser, Roles } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';

@ApiTags('marketing-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('m/campaigns')
export class CampaignController {
  constructor(private readonly svc: CampaignService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.svc.list(user.companyId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.get(user.companyId, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto) {
    return this.svc.create(user.companyId, user.userId, dto);
  }

  @Post(':id/launch')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Launch a campaign immediately — queues sends for all audience members' })
  launch(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.launch(user.companyId, id);
  }
}

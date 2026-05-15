import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { MarketingSettingsService } from './marketing-settings.service';
import { UpdateMarketingSettingsDto } from './marketing-settings.dto';

@ApiTags('marketing-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('m/settings')
export class MarketingSettingsController {
  constructor(private readonly svc: MarketingSettingsService) {}

  @Get()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Get marketing settings (upserts defaults on first call)' })
  get(@CurrentUser() user: AuthUser) {
    return this.svc.get(user.companyId);
  }

  @Patch()
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update marketing settings — COMPANY_ADMIN only' })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateMarketingSettingsDto) {
    return this.svc.update(user.companyId, dto);
  }
}

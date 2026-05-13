import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AudienceService, CreateAudienceDto } from './audience.service';
import { CurrentUser, Roles } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';

@ApiTags('marketing-audiences')
@Controller('m/audiences')
export class AudienceController {
  constructor(private readonly svc: AudienceService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.svc.list(user.companyId);
  }

  @Get('preview-count')
  @ApiOperation({ summary: 'Live audience count for a filter set (debounce on frontend)' })
  previewCount(@CurrentUser() user: AuthUser, @Query('filters') filters: string) {
    return this.svc.previewCount(user.companyId, filters ?? '[]');
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.get(user.companyId, id);
  }

  @Get(':id/members')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Resolve member list for a saved audience' })
  resolveMembers(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.resolveMembers(user.companyId, id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAudienceDto) {
    return this.svc.create(user.companyId, dto);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: Partial<CreateAudienceDto>) {
    return this.svc.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.remove(user.companyId, id);
  }
}

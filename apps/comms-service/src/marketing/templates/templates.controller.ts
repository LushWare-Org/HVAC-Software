import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service';
import { CurrentUser, Roles } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';

@ApiTags('marketing-templates')
@Controller('m/templates')
export class TemplatesController {
  constructor(private readonly svc: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all templates for this company' })
  list(@CurrentUser() user: AuthUser) {
    return this.svc.list(user.companyId);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.get(user.companyId, id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.svc.create(user.companyId, dto);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.svc.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.remove(user.companyId, id);
  }

  @Post('seed-defaults')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Seed 6 default trade templates (idempotent — skips if already seeded)' })
  seedDefaults(@CurrentUser() user: AuthUser) {
    return this.svc.seedDefaults(user.companyId).then((n) => ({ seeded: n }));
  }
}

import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsArray, IsBoolean, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectTemplatesService } from './project-templates.service';

class ComponentTypeDto {
  @IsString() key!: string;
  @IsString() label!: string;
  @IsOptional() @IsString() icon?: string;
  @IsBoolean() customerAssignable!: boolean;
}

class CreateTemplateDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ComponentTypeDto)
  componentTypes!: ComponentTypeDto[];
}

class UpdateTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ComponentTypeDto)
  componentTypes?: ComponentTypeDto[];
  @IsOptional() @IsIn(['DRAFT', 'PUBLISHED']) status?: string;
}

const STAFF_WRITE = [Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER];

@ApiTags('Project Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('project-templates')
export class ProjectTemplatesController {
  constructor(private readonly templates: ProjectTemplatesService) {}

  @Get()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: "List the company's project templates" })
  list(@CurrentUser() user: AuthUser) {
    return this.templates.list(user.companyId);
  }

  @Post()
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Create a project template' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.templates.create(user.companyId, dto);
  }

  @Get(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Template detail' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.findOne(user.companyId, id);
  }

  @Patch(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Update a template (built-ins cannot be edited)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templates.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITE)
  @ApiOperation({ summary: 'Delete a template (must be unused, built-ins cannot be deleted)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.templates.remove(user.companyId, id);
  }
}

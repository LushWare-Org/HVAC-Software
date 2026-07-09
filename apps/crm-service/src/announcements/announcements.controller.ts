import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { AnnouncementsService } from './announcements.service';

class AnnouncementBodyDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(500) body?: string;
  @IsOptional() @IsString() linkUrl?: string;
  @IsOptional() @IsString() @MaxLength(40) linkLabel?: string;
  @IsOptional() @IsString() @MaxLength(20) accentColor?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() activeFrom?: string;
  @IsOptional() @IsString() activeTo?: string;
}

class CreateAnnouncementDto {
  @IsString() @MaxLength(120) title!: string;
  @IsOptional() @IsString() @MaxLength(500) body?: string;
  @IsOptional() @IsString() linkUrl?: string;
  @IsOptional() @IsString() @MaxLength(40) linkLabel?: string;
  @IsOptional() @IsString() @MaxLength(20) accentColor?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() activeFrom?: string;
  @IsOptional() @IsString() activeTo?: string;
}

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Active announcements for the portal carousel (any authed role)' })
  getActive(@CurrentUser() user: AuthUser) {
    return this.announcements.getActiveMany(user.companyId);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'List all announcements (staff)' })
  list(@CurrentUser() user: AuthUser) {
    return this.announcements.list(user.companyId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create an announcement' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAnnouncementDto) {
    return this.announcements.create(user.companyId, dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update an announcement' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AnnouncementBodyDto) {
    return this.announcements.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an announcement' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.announcements.remove(user.companyId, id);
  }
}

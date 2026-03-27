import {
  Controller, Get, Post, Param, Query, Body,
  UseGuards, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { LocationsService } from './locations.service';

class EnsureVanDto {
  @IsString() technicianId!: string;
  @IsString() technicianName!: string;
}

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly svc: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all stock locations (warehouse + vans)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.svc.findAll(user.companyId);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get stock levels at a specific location' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  getLocationStock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.svc.getLocationStock(user.companyId, id, page, limit, search);
  }

  @Post('ensure-warehouse')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Ensure warehouse exists for company' })
  ensureWarehouse(@CurrentUser() user: AuthUser) {
    return this.svc.ensureWarehouse(user.companyId);
  }

  @Post('ensure-van')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Ensure van location exists for a technician' })
  ensureVan(@CurrentUser() user: AuthUser, @Body() dto: EnsureVanDto) {
    return this.svc.ensureVan(user.companyId, dto.technicianId, dto.technicianName);
  }
}

import {
  Controller, Get, Post, Put, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { EquipmentService } from './equipment.service';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateEquipmentDto {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNo?: string;
  @IsOptional() @IsString() installDate?: string;
  @IsOptional() @IsString() warrantyEnd?: string;
  @IsOptional() @IsString() notes?: string;
}

class BulkEquipmentDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNo?: string;
  @IsOptional() @IsString() installDate?: string;
  @IsOptional() @IsString() warrantyEnd?: string;
  @IsOptional() @IsString() notes?: string;
}

class BulkEquipmentBody {
  @IsArray() @ValidateNested({ each: true }) @Type(() => BulkEquipmentDto)
  equipment!: BulkEquipmentDto[];
}

@ApiTags('Customer Equipment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers/:customerId/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiOperation({ summary: 'List equipment for a customer' })
  findAll(@CurrentUser() user: AuthUser, @Param('customerId') customerId: string) {
    return this.equipmentService.findByCustomer(user.companyId, customerId);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Add equipment to a customer' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Body() dto: CreateEquipmentDto,
  ) {
    return this.equipmentService.create(user.companyId, customerId, dto);
  }

  @Put()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Bulk replace all equipment for a customer' })
  replaceAll(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Body() body: BulkEquipmentBody,
  ) {
    return this.equipmentService.replaceForCustomer(user.companyId, customerId, body.equipment);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove equipment' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.equipmentService.remove(user.companyId, id);
  }
}

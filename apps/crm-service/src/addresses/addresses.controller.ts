import {
  Controller, Get, Post, Put, Delete, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { AddressesService } from './addresses.service';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateAddressDto {
  @IsOptional() @IsString() type?: string;
  @IsString() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postcode?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

class BulkAddressDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() type?: string;
  @IsString() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postcode?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

class BulkAddressesBody {
  @IsArray() @ValidateNested({ each: true }) @Type(() => BulkAddressDto)
  addresses!: BulkAddressDto[];
}

// ── Customer Addresses ────────────────────────────────────────────────────────

@ApiTags('Customer Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers/:customerId/addresses')
export class CustomerAddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'List addresses for a customer' })
  findAll(@CurrentUser() user: AuthUser, @Param('customerId') customerId: string) {
    return this.addressesService.findByCustomer(user.companyId, customerId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Add address to a customer' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(user.companyId, { ...dto, customerId });
  }

  @Put()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Bulk replace all addresses for a customer' })
  replaceAll(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
    @Body() body: BulkAddressesBody,
  ) {
    return this.addressesService.replaceForCustomer(user.companyId, customerId, body.addresses);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an address' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.addressesService.remove(user.companyId, id);
  }
}

// ── Lead Addresses ────────────────────────────────────────────────────────────

@ApiTags('Lead Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads/:leadId/addresses')
export class LeadAddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'List addresses for a lead' })
  findAll(@CurrentUser() user: AuthUser, @Param('leadId') leadId: string) {
    return this.addressesService.findByLead(user.companyId, leadId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Add address to a lead' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('leadId') leadId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(user.companyId, { ...dto, leadId });
  }

  @Put()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Bulk replace all addresses for a lead' })
  replaceAll(
    @CurrentUser() user: AuthUser,
    @Param('leadId') leadId: string,
    @Body() body: BulkAddressesBody,
  ) {
    return this.addressesService.replaceForLead(user.companyId, leadId, body.addresses);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an address' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.addressesService.remove(user.companyId, id);
  }
}

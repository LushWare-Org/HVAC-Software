import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { PurchaseOrdersService } from './purchase-orders.service';

class POItemDto {
  @IsString() inventoryItemId!: string;
  @IsNumber() @Min(0.01) qty!: number;
  @IsNumber() @Min(0) unitCost!: number;
}

class CreatePODto {
  @IsString() supplierName!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => POItemDto) items!: POItemDto[];
  @IsOptional() @IsString() notes?: string;
}

enum POStatusDto {
  DRAFT = 'DRAFT', ORDERED = 'ORDERED', PARTIAL = 'PARTIAL',
  RECEIVED = 'RECEIVED', CANCELLED = 'CANCELLED',
}

class UpdatePOStatusDto {
  @IsEnum(POStatusDto) status!: POStatusDto;
}

class ReceiveItemDto {
  @IsString() inventoryItemId!: string;
  @IsNumber() @Min(0.01) qty!: number;
}

class ReceivePODto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ReceiveItemDto) receivedItems?: ReceiveItemDto[];
}

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly svc: PurchaseOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.svc.findAll(user.companyId, page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single purchase order' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOne(user.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase order (DRAFT)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePODto) {
    return this.svc.create(user.companyId, user.userId, user.name ?? 'Unknown', dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update PO status (DRAFT→ORDERED→RECEIVED)' })
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePOStatusDto) {
    return this.svc.updateStatus(user.companyId, id, dto.status as any);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive goods from PO (creates intake movements)' })
  receive(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReceivePODto) {
    return this.svc.receive(user.companyId, user.userId, user.name ?? 'Unknown', id, dto.receivedItems);
  }
}

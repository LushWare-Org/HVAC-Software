import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsInt, Min, MaxLength, IsNumber,
} from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { InventoryItemsService } from './inventory-items.service';

enum ItemCategoryDto {
  PART = 'PART',
  MATERIAL = 'MATERIAL',
  TOOL = 'TOOL',
  CONSUMABLE = 'CONSUMABLE',
}

class CreateInventoryItemDto {
  @IsString() @MaxLength(50) sku!: string;
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(ItemCategoryDto) category!: ItemCategoryDto;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() priceBookItemId?: string;
  @IsOptional() @IsInt() @Min(0) reorderPoint?: number;
  @IsOptional() @IsInt() @Min(0) reorderQty?: number;
}

class UpdateInventoryItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsInt() @Min(0) reorderPoint?: number;
  @IsOptional() @IsInt() @Min(0) reorderQty?: number;
  @IsOptional() @IsString() priceBookItemId?: string;
  @IsOptional() isActive?: boolean;
}

@ApiTags('Inventory Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('items')
export class InventoryItemsController {
  constructor(private readonly svc: InventoryItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items (paginated, searchable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false, enum: ItemCategoryDto })
  @ApiQuery({ name: 'priceBookItemId', required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('priceBookItemId') priceBookItemId?: string,
  ) {
    return this.svc.findAll(user.companyId, page, limit, search, category, priceBookItemId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inventory item with stock levels' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOne(user.companyId, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Create a new inventory item' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInventoryItemDto) {
    return this.svc.create(user.companyId, dto as any);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update an inventory item' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.svc.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an inventory item' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.remove(user.companyId, id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get stock levels per location for an item' })
  getStockLevels(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.getStockLevels(user.companyId, id);
  }
}

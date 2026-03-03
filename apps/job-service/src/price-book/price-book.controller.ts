import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, MaxLength,
} from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { PriceBookService } from './price-book.service';

enum PriceCategory {
  LABOUR = 'LABOUR',
  PART = 'PART',
  MATERIAL = 'MATERIAL',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  OTHER = 'OTHER',
}

class CreatePriceBookItemDto {
  @IsEnum(PriceCategory) category!: PriceCategory;
  @IsOptional() @IsString() @MaxLength(50) code?: string;
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsOptional() @IsBoolean() taxable?: boolean;
  @IsOptional() @IsString() jobTypeId?: string;
}

class UpdatePriceBookItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsBoolean() taxable?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('Price Book')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('price-book')
export class PriceBookController {
  constructor(private readonly svc: PriceBookService) {}

  @Get()
  @ApiOperation({ summary: 'List price book items (paginated, searchable by category)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false, enum: PriceCategory })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.svc.findAll(user.companyId, page, limit, search, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single price book item' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.findOne(user.companyId, id);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Add a new item to the price book' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePriceBookItemDto) {
    return this.svc.create(user.companyId, dto);
  }

  @Put(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Update a price book item' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePriceBookItemDto,
  ) {
    return this.svc.update(user.companyId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a price book item' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.remove(user.companyId, id);
  }
}

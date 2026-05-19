import {
  Controller, Get, Post, Body, Query,
  UseGuards, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { StockOperationsService } from './stock-operations.service';

class IntakeDto {
  @IsString() inventoryItemId!: string;
  @IsString() toLocationId!: string;
  @IsNumber() @Min(0.01) quantity!: number;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() notes?: string;
}

class TransferDto {
  @IsString() inventoryItemId!: string;
  @IsString() fromLocationId!: string;
  @IsString() toLocationId!: string;
  @IsNumber() @Min(0.01) quantity!: number;
  @IsOptional() @IsString() notes?: string;
}

class ConsumeDto {
  @IsString() inventoryItemId!: string;
  @IsString() locationId!: string;
  @IsNumber() @Min(0.01) quantity!: number;
  @IsOptional() @IsString() referenceId?: string;
  @IsOptional() @IsString() referenceType?: string;
}

class AdjustDto {
  @IsString() inventoryItemId!: string;
  @IsString() locationId!: string;
  @IsNumber() @Min(0) newQuantity!: number;
  @IsOptional() @IsString() reason?: string;
}

@ApiTags('Stock Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('movements')
export class StockOperationsController {
  constructor(private readonly svc: StockOperationsService) {}

  @Post('intake')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Receive stock into a location (purchase intake)' })
  intake(@CurrentUser() user: AuthUser, @Body() dto: IntakeDto) {
    return this.svc.intake(user.companyId, user.userId, user.name ?? 'Unknown', dto);
  }

  @Post('transfer')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Transfer stock between warehouse and van' })
  transfer(@CurrentUser() user: AuthUser, @Body() dto: TransferDto) {
    return this.svc.transfer(user.companyId, user.userId, user.name ?? 'Unknown', dto);
  }

  @Post('consume')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Consume stock from a location (used on job)' })
  consume(@CurrentUser() user: AuthUser, @Body() dto: ConsumeDto) {
    return this.svc.consume(user.companyId, user.userId, user.name ?? 'Unknown', dto);
  }

  @Post('adjust')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  @ApiOperation({ summary: 'Manual stock count adjustment' })
  adjust(@CurrentUser() user: AuthUser, @Body() dto: AdjustDto) {
    return this.svc.adjust(user.companyId, user.userId, user.name ?? 'Unknown', dto);
  }

  @Post('return')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Return excess stock from van back to warehouse' })
  return(@CurrentUser() user: AuthUser, @Body() dto: TransferDto) {
    return this.svc.returnStock(user.companyId, user.userId, user.name ?? 'Unknown', dto);
  }

  @Get()
  @ApiOperation({ summary: 'View stock movement log (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'inventoryItemId', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'movementType', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findMovements(
    @CurrentUser() user: AuthUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('locationId') locationId?: string,
    @Query('movementType') movementType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.svc.findMovements(user.companyId, page, limit, { inventoryItemId, locationId, movementType, dateFrom, dateTo });
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { AvailabilityService } from './availability.service';

@ApiTags('Availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('check-availability')
export class AvailabilityController {
  constructor(private readonly svc: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Check parts availability for scheduling' })
  @ApiQuery({ name: 'items', required: true, description: 'JSON array: [{"inventoryItemId":"...","qty":1}]' })
  @ApiQuery({ name: 'technicianId', required: false })
  check(
    @CurrentUser() user: AuthUser,
    @Query('items') itemsJson: string,
    @Query('technicianId') technicianId?: string,
  ) {
    let items: { inventoryItemId: string; qty: number }[];
    try { items = JSON.parse(itemsJson); } catch { items = []; }
    return this.svc.checkAvailability(user.companyId, items, technicianId);
  }
}

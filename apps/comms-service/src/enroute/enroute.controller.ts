/**
 * Internal endpoint — called by scheduling-service when an assignment is
 * marked EN_ROUTE. Auth: dev bypass headers or service JWT (same contract as
 * the other service-to-service callers).
 */
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { EnRouteNotificationService } from './enroute.service';
import { EnRouteNotificationDto } from './dto/enroute.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class EnRouteController {
  constructor(private readonly enroute: EnRouteNotificationService) {}

  @Post('en-route')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notify the customer their technician is en route (email + SMS)' })
  notify(@CurrentUser() user: AuthUser, @Body() dto: EnRouteNotificationDto) {
    return this.enroute.notify(user.companyId, dto);
  }
}

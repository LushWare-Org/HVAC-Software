/**
 * Internal endpoint — called by job-service when a reschedule event happens.
 * Same auth contract as /notifications/en-route.
 */
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { RescheduleNotificationService } from './reschedule-notification.service';
import { RescheduleNotificationDto } from './dto/reschedule-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class RescheduleNotificationController {
  constructor(private readonly reschedule: RescheduleNotificationService) {}

  @Post('reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deliver a reschedule notification (email + in-app)' })
  notify(@CurrentUser() user: AuthUser, @Body() dto: RescheduleNotificationDto) {
    return this.reschedule.notify(user.companyId, dto);
  }
}

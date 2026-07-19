/**
 * Internal endpoint — called by scheduling-service the moment a job is
 * assigned to a technician (smart or manual). Auth: dev bypass headers or
 * service JWT (same contract as the en-route notifier).
 */
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@tscrm/auth-client';
import { AuthUser } from '@tscrm/types';
import { JobAssignedNotificationService } from './job-assigned.service';
import { JobAssignedDto } from './dto/job-assigned.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class JobAssignedController {
  constructor(private readonly jobAssigned: JobAssignedNotificationService) {}

  @Post('job-assigned')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notify a technician they have been assigned a job (socket + in-app + push + email)' })
  notify(@CurrentUser() user: AuthUser, @Body() dto: JobAssignedDto) {
    return this.jobAssigned.notify(user.companyId, dto);
  }
}

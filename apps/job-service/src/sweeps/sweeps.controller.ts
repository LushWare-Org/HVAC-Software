import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '@tscrm/auth-client';
import { VisitCareService } from '../jobs/visit-care.service';
import { ScheduleNoticeService } from '../jobs/schedule-notice.service';
import { RescheduleNudgeCron } from '../reschedule/reschedule-nudge.cron';

/**
 * Runs the periodic sweeps on demand, so Cloud Scheduler can drive them instead of
 * in-process timers. Timers force this service to stay awake (and billed) around the
 * clock; a scheduler call wakes it only when there is work to do. Each sweep is safe to
 * run twice at once: every one of them claims its rows before sending.
 *
 * The work finishes inside the request on purpose: Cloud Run throttles CPU once the
 * response has gone out, so anything left running afterwards would stall.
 */
@Controller('internal/sweeps')
@UseGuards(InternalApiKeyGuard)
export class SweepsController {
  constructor(
    private readonly care: VisitCareService,
    private readonly notices: ScheduleNoticeService,
    private readonly nudges: RescheduleNudgeCron,
  ) {}

  @Post(':name')
  @HttpCode(HttpStatus.OK)
  async run(@Param('name') name: string) {
    switch (name) {
      case 'notices':
        return { sweep: name, result: { sent: await this.notices.sendDue() } };
      case 'reminders':
        return { sweep: name, result: await this.care.sweep() };
      case 'nudges':
        return { sweep: name, result: { sent: await this.nudges.sweep() } };
      default:
        throw new NotFoundException(`Unknown sweep "${name}"`);
    }
  }
}

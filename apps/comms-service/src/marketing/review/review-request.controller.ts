import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { AuthUser, Role } from '@tscrm/types';
import { ReviewRequestService } from './review-request.service';
import { TriggerReviewRequestDto } from './review-request.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/review-requests')
export class ReviewRequestController {
  constructor(private readonly service: ReviewRequestService) {}

  /**
   * POST /marketing/review-requests
   * Trigger a review request for a completed job.
   * Called by job-service webhook or admin manually.
   */
  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  trigger(@Body() dto: TriggerReviewRequestDto) {
    return this.service.trigger(dto);
  }

  /**
   * GET /marketing/review-requests/job/:jobId?companyId=...
   */
  @Get('job/:jobId')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  getByJob(@Param('jobId') jobId: string, @Query('companyId') companyId: string) {
    return this.service.getStatus(companyId, jobId);
  }

  /**
   * GET /marketing/review-requests/customer/:customerId?companyId=...
   */
  @Get('customer/:customerId')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER)
  getByCustomer(@Param('customerId') customerId: string, @Query('companyId') companyId: string) {
    return this.service.listForCustomer(companyId, customerId);
  }
}

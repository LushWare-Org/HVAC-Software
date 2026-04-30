/**
 * ReviewsController — customer-authored reviews of jobs, technicians, and the
 * company. CUSTOMER role may POST (from customer portal); all roles can read.
 *
 * Route map:
 *   GET    /reviews                        — list (filterable)
 *   GET    /reviews/company                — public company reviews
 *   GET    /reviews/customer/:customerId   — all reviews by one customer
 *   GET    /reviews/technician/:technicianId — published reviews for a tech
 *   GET    /reviews/job/:jobId             — review(s) for a specific job
 *   GET    /reviews/stats/company          — aggregate company + job averages
 *   GET    /reviews/stats/technician/:id   — aggregate technician stats
 *   GET    /reviews/:id                    — one review
 *   POST   /reviews                        — create / upsert (customer portal)
 */

import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsInt, IsOptional, IsEnum, Min, Max,
} from 'class-validator';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { ReviewsService } from './reviews.service';

const ReviewType = {
  JOB: 'JOB',
  COMPANY: 'COMPANY',
} as const;

type ReviewType = (typeof ReviewType)[keyof typeof ReviewType];

class CreateReviewDto {
  @IsOptional() @IsEnum(ReviewType) type?: ReviewType;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() jobId?: string;
  @IsOptional() @IsString() technicianId?: string;
  @IsOptional() @IsString() technicianName?: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsString() platform?: string;
  @IsOptional() @IsString() source?: string;
}

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ── Lists ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List reviews (filterable)' })
  @ApiQuery({ name: 'type',         required: false, enum: ReviewType })
  @ApiQuery({ name: 'customerId',   required: false })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'jobId',        required: false })
  @ApiQuery({ name: 'published',    required: false, type: Boolean })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('type')         type?: ReviewType,
    @Query('customerId')   customerId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('jobId')        jobId?: string,
    @Query('published')    published?: string,
  ) {
    // If the caller is a CUSTOMER, lock results to their own reviews so other
    // customers' feedback is never exposed through this endpoint.
    const effectiveCustomerId =
      user.role === Role.CUSTOMER ? user.customerId : customerId;

    return this.reviewsService.findAll(user.companyId, {
      type,
      customerId:   effectiveCustomerId,
      technicianId,
      jobId,
      published: published === undefined ? undefined : published === 'true',
    });
  }

  @Get('company')
  @ApiOperation({ summary: 'Published company reviews (public feed)' })
  findCompany(@CurrentUser() user: AuthUser) {
    return this.reviewsService.findCompanyReviews(user.companyId);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'All reviews authored by a specific customer' })
  findByCustomer(
    @CurrentUser() user: AuthUser,
    @Param('customerId') customerId: string,
  ) {
    // Customers may only see their own reviews by id.
    if (user.role === Role.CUSTOMER && user.customerId !== customerId) {
      return [];
    }
    return this.reviewsService.findByCustomer(user.companyId, customerId);
  }

  @Get('technician/:technicianId')
  @ApiOperation({ summary: 'Published reviews for a technician' })
  findByTechnician(
    @CurrentUser() user: AuthUser,
    @Param('technicianId') technicianId: string,
  ) {
    return this.reviewsService.findByTechnician(user.companyId, technicianId);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Reviews attached to a job' })
  findByJob(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.reviewsService.findByJob(user.companyId, jobId);
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  @Get('stats/company')
  @ApiOperation({ summary: 'Aggregate company + job review stats' })
  companyStats(@CurrentUser() user: AuthUser) {
    return this.reviewsService.getCompanyStats(user.companyId);
  }

  @Get('stats/technician/:technicianId')
  @ApiOperation({ summary: 'Aggregate technician rating stats' })
  technicianStats(
    @CurrentUser() user: AuthUser,
    @Param('technicianId') technicianId: string,
  ) {
    return this.reviewsService.getTechnicianStats(user.companyId, technicianId);
  }

  // ── Single / Create ──────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a review' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewsService.findOne(user.companyId, id);
  }

  @Post()
  @Roles(
    Role.CUSTOMER,
    Role.COMPANY_ADMIN,
    Role.OFFICE_MANAGER,
    Role.TECHNICIAN,
  )
  @ApiOperation({ summary: 'Create (or upsert) a review' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    // For customer-submitted reviews, trust the JWT over the body to prevent
    // a customer from writing a review on behalf of another account.
    const payload =
      user.role === Role.CUSTOMER
        ? { ...dto, customerId: user.customerId, customerName: user.name ?? dto.customerName }
        : dto;
    return this.reviewsService.create(user.companyId, payload);
  }
}

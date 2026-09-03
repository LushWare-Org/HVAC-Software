import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { BookingsService } from './bookings.service';
import { BookingAvailabilityService } from './booking-availability.service';
import { IsString, IsOptional, IsDateString, IsInt, Max, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class CreateBookingDto {
  @IsString() serviceType!: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() preferredDate!: string;
  @IsOptional() @IsDateString() alternateDate?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() guestName?: string;
  @IsOptional() @IsString() guestEmail?: string;
  @IsOptional() @IsString() guestPhone?: string;
  @IsOptional() @IsString() notes?: string;
}

class RescheduleBookingDto {
  @IsDateString() preferredDate!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

class CancelBookingDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

class AvailabilityQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) daysAhead?: number;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly availabilityService: BookingAvailabilityService,
  ) {}

  // Declared before any ':id' route so "availability" is not read as an id.
  @Get('availability')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Next offerable appointment slots',
    description:
      'Whole-company capacity based on active technicians — what can safely be promised ' +
      'to a caller. Which technician attends is decided later, when the booking is ' +
      'converted to a job.',
  })
  availability(@CurrentUser() user: AuthUser, @Query() query: AvailabilityQueryDto) {
    return this.availabilityService.findSlots(user.companyId, {
      limit: query.limit,
      daysAhead: query.daysAhead,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List booking requests' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.findAll(user.companyId, status, limit ? Number(limit) : undefined);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a booking request (also used by customer portal)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.companyId, {
      ...dto,
      preferredDate: new Date(dto.preferredDate),
      alternateDate: dto.alternateDate ? new Date(dto.alternateDate) : undefined,
    });
  }

  @Patch(':id/confirm')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Confirm a booking' })
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.confirm(user.companyId, id);
  }

  @Patch(':id/reschedule')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({
    summary: 'Move a booking to a new date',
    description: 'Returns the booking to PENDING so a human re-checks the new time.',
  })
  reschedule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingsService.reschedule(
      user.companyId,
      id,
      new Date(dto.preferredDate),
      dto.reason,
    );
  }

  @Patch(':id/cancel')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Cancel a booking (idempotent)' })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancel(user.companyId, id, dto.reason);
  }

  @Patch(':id/convert')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Convert a booking to a job (provide jobId from job-service)' })
  convert(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('jobId') jobId: string,
  ) {
    return this.bookingsService.convert(user.companyId, id, jobId);
  }
}

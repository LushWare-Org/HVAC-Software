import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@tscrm/auth-client';
import { Role, AuthUser } from '@tscrm/types';
import { BookingsService } from './bookings.service';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class CreateBookingDto {
  @IsString() serviceType: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() preferredDate: string;
  @IsOptional() @IsDateString() alternateDate?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() guestName?: string;
  @IsOptional() @IsString() guestEmail?: string;
  @IsOptional() @IsString() guestPhone?: string;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List booking requests' })
  findAll(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.bookingsService.findAll(user.companyId, status);
  }

  @Post()
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a booking request (also used by customer portal)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.companyId, {
      ...dto,
      preferredDate: new Date(dto.preferredDate),
      alternateDate: dto.alternateDate ? new Date(dto.alternateDate) : undefined,
    });
  }

  @Patch(':id/confirm')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Confirm a booking' })
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.confirm(user.companyId, id);
  }

  @Patch(':id/convert')
  @Roles(Role.COMPANY_ADMIN, Role.OFFICE_MANAGER, Role.DISPATCHER)
  @ApiOperation({ summary: 'Convert a booking to a job (provide jobId from job-service)' })
  convert(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('jobId') jobId: string,
  ) {
    return this.bookingsService.convert(user.companyId, id, jobId);
  }
}

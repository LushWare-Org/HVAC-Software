import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentPartner, PartnerContext } from '../../auth/partner-context';
import { Scopes } from '../../auth/scopes.decorator';
import { PARTNER_SCOPES } from '../../auth/scopes';
import { PartnerBookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

class RescheduleDto {
  @IsDateString() preferredDate!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

class CancelDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

@ApiTags('v1 — Bookings')
@ApiSecurity('partner-key')
@Controller('v1')
export class PartnerBookingsController {
  constructor(private readonly bookings: PartnerBookingsService) {}

  @Get('availability')
  @Scopes(PARTNER_SCOPES.AVAILABILITY_READ)
  @ApiOperation({
    summary: 'Appointment slots that can be offered to a caller',
    description:
      'Each slot carries a spoken `label` in the company timezone. Offer these ' +
      'verbatim rather than inventing times.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 6 })
  @ApiQuery({ name: 'daysAhead', required: false, example: 14 })
  availability(
    @CurrentPartner() partner: PartnerContext,
    @Query('limit', new DefaultValuePipe(6), ParseIntPipe) limit: number,
    @Query('daysAhead', new DefaultValuePipe(14), ParseIntPipe) daysAhead: number,
  ) {
    return this.bookings.availability(partner.companyId, limit, daysAhead);
  }

  @Post('bookings')
  @Scopes(PARTNER_SCOPES.BOOKING_CREATE)
  @ApiOperation({
    summary: 'Book an appointment',
    description:
      'Always created as PENDING — a human confirms before anyone is dispatched. Tell ' +
      'the caller it is awaiting confirmation, not confirmed. Omit customerId for a ' +
      'first-time caller and supply firstName, lastName and phone instead; a customer ' +
      'and a lead are created and tagged for staff review.',
  })
  create(@CurrentPartner() partner: PartnerContext, @Body() dto: CreateBookingDto) {
    return this.bookings.create(partner.companyId, partner.keyId, dto);
  }

  @Patch('bookings/:id/reschedule')
  @Scopes(PARTNER_SCOPES.BOOKING_RESCHEDULE)
  @ApiOperation({ summary: 'Move an appointment to a different slot' })
  reschedule(
    @CurrentPartner() partner: PartnerContext,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
  ) {
    return this.bookings.reschedule(
      partner.companyId,
      id,
      dto.preferredDate,
      dto.reason,
    );
  }

  @Patch('bookings/:id/cancel')
  @Scopes(PARTNER_SCOPES.BOOKING_CANCEL)
  @ApiOperation({ summary: 'Cancel an appointment' })
  cancel(
    @CurrentPartner() partner: PartnerContext,
    @Param('id') id: string,
    @Body() dto: CancelDto,
  ) {
    return this.bookings.cancel(partner.companyId, id, dto.reason);
  }
}

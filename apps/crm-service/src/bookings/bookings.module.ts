import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingAvailabilityService } from './booking-availability.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingAvailabilityService],
  exports: [BookingsService, BookingAvailabilityService],
})
export class BookingsModule {}

import { Module } from '@nestjs/common';
import { WhoamiController } from './whoami.controller';
import { CallersController } from './callers/callers.controller';
import { CallersService } from './callers/callers.service';
import { PartnerBookingsController } from './bookings/bookings.controller';
import { PartnerBookingsService } from './bookings/bookings.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsService } from './documents/documents.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';

@Module({
  controllers: [
    WhoamiController,
    CallersController,
    PartnerBookingsController,
    DocumentsController,
    PaymentsController,
  ],
  providers: [
    CallersService,
    PartnerBookingsService,
    DocumentsService,
    PaymentsService,
  ],
})
export class V1Module {}

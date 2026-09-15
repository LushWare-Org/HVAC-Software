import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '@tscrm/auth-client';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { EventsService } from './events.service';

class CreateAnalyticsEventDto {
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/**
 * Event ingest, called by other services (crm's follow-up agent).
 *
 * Previously unguarded and publicly reachable through the gateway, so anyone
 * could write fabricated events for any companyId straight into every tenant's
 * analytics. The caller names the tenant in the body, so there is no user to
 * authenticate; the shared internal key is what proves it is one of ours.
 */
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(InternalApiKeyGuard)
  create(@Body() dto: CreateAnalyticsEventDto) {
    return this.eventsService.createEvent(dto);
  }
}

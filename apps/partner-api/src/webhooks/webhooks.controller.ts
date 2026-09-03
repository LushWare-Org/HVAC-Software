import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentPartner, PartnerContext } from '../auth/partner-context';
import { Scopes } from '../auth/scopes.decorator';
import { PARTNER_SCOPES } from '../auth/scopes';
import { WebhooksService, ALL_EVENT_TYPES } from './webhooks.service';

class RegisterWebhookDto {
  @ApiProperty({ example: 'https://acme-voice.example.com/hooks/tscrm' })
  @IsString()
  url!: string;

  @ApiProperty({ isArray: true, example: ALL_EVENT_TYPES })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

@ApiTags('v1 — Webhooks')
@ApiSecurity('partner-key')
@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get('events')
  @Scopes(PARTNER_SCOPES.WEBHOOK_MANAGE)
  @ApiOperation({ summary: 'Event types available to subscribe to' })
  events() {
    return { events: ALL_EVENT_TYPES };
  }

  @Post()
  @Scopes(PARTNER_SCOPES.WEBHOOK_MANAGE)
  @ApiOperation({
    summary: 'Register an endpoint to receive events',
    description:
      'The signing secret is returned once and cannot be retrieved later. Verify every ' +
      'delivery: HMAC-SHA256 of "<x-tscrm-timestamp>.<raw body>" must equal ' +
      'x-tscrm-signature. Reject deliveries whose timestamp is far from now.',
  })
  register(
    @CurrentPartner() partner: PartnerContext,
    @Body() dto: RegisterWebhookDto,
  ) {
    return this.webhooks.register(partner.companyId, partner.keyId, dto);
  }

  @Get()
  @Scopes(PARTNER_SCOPES.WEBHOOK_MANAGE)
  @ApiOperation({ summary: 'List registered endpoints (secrets omitted)' })
  list(@CurrentPartner() partner: PartnerContext) {
    return this.webhooks.list(partner.companyId);
  }

  @Get(':id/deliveries')
  @Scopes(PARTNER_SCOPES.WEBHOOK_MANAGE)
  @ApiOperation({
    summary: 'Recent delivery attempts',
    description: 'Use this to check whether an event you expected was actually sent.',
  })
  deliveries(
    @CurrentPartner() partner: PartnerContext,
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.webhooks.deliveries(partner.companyId, id, limit);
  }

  @Delete(':id')
  @Scopes(PARTNER_SCOPES.WEBHOOK_MANAGE)
  @ApiOperation({ summary: 'Remove an endpoint' })
  remove(@CurrentPartner() partner: PartnerContext, @Param('id') id: string) {
    return this.webhooks.remove(partner.companyId, id);
  }
}

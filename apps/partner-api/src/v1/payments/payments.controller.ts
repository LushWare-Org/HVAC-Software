import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrentPartner, PartnerContext } from '../../auth/partner-context';
import { Scopes } from '../../auth/scopes.decorator';
import { PARTNER_SCOPES } from '../../auth/scopes';
import { PaymentsService } from './payments.service';
import { isSandbox } from '../../sandbox/sandbox';

class CreatePaymentLinkDto {
  @ApiProperty({ description: 'From /v1/callers/lookup or /v1/callers/match' })
  @IsString()
  customerId!: string;

  @ApiProperty({ description: 'An issued, unpaid invoice for that customer' })
  @IsString()
  invoiceId!: string;

  @ApiPropertyOptional({
    enum: ['sms', 'email'],
    description:
      'Also deliver the link to the contact details on the customer record. ' +
      'Omit to receive the link only in the response.',
  })
  @IsOptional()
  @IsEnum(['sms', 'email'])
  send?: 'sms' | 'email';
}

@ApiTags('v1 — Payments')
@ApiSecurity('partner-key')
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('link')
  @HttpCode(HttpStatus.OK)
  @Scopes(PARTNER_SCOPES.PAYMENT_LINK_CREATE)
  @ApiOperation({
    summary: 'Create a secure payment link for an unpaid invoice',
    description:
      'Returns a Stripe hosted checkout link tied to one invoice. Card details are ' +
      'entered on Stripe’s page — never spoken to the agent and never handled by this ' +
      'API. Refused for a customer record the agent created on this same call, and for ' +
      'invoices that are draft, paid or void.',
  })
  createLink(
    @CurrentPartner() partner: PartnerContext,
    @Body() dto: CreatePaymentLinkDto,
  ) {
    return this.payments.createLink(partner.companyId, dto, isSandbox(partner));
  }
}

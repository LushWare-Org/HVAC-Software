import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentPartner, PartnerContext } from '../../auth/partner-context';
import { Scopes } from '../../auth/scopes.decorator';
import { PARTNER_SCOPES } from '../../auth/scopes';
import { DocumentsService } from './documents.service';
import { SendDocumentDto, SendConfirmationDto } from './dto/send-document.dto';
import { isSandbox } from '../../sandbox/sandbox';

@ApiTags('v1 — Documents')
@ApiSecurity('partner-key')
@Controller('v1')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get('customers/:customerId/invoices')
  @Scopes(PARTNER_SCOPES.INVOICE_READ)
  @ApiOperation({
    summary: 'Invoices for a resolved caller, with balances',
    description:
      'Amounts are dollars. `totalOutstanding` is what the caller still owes across ' +
      'every unsettled invoice — safe to read out.',
  })
  @ApiQuery({ name: 'openOnly', required: false, type: Boolean })
  invoices(
    @CurrentPartner() partner: PartnerContext,
    @Param('customerId') customerId: string,
    @Query('openOnly') openOnly?: string,
  ) {
    return this.documents.listInvoices(
      partner.companyId,
      customerId,
      openOnly !== 'false',
    );
  }

  @Get('customers/:customerId/quotes')
  @Scopes(PARTNER_SCOPES.QUOTE_READ)
  @ApiOperation({ summary: 'Quotes for a resolved caller' })
  @ApiQuery({ name: 'openOnly', required: false, type: Boolean })
  quotes(
    @CurrentPartner() partner: PartnerContext,
    @Param('customerId') customerId: string,
    @Query('openOnly') openOnly?: string,
  ) {
    return this.documents.listQuotes(
      partner.companyId,
      customerId,
      openOnly !== 'false',
    );
  }

  @Post('documents/send')
  @HttpCode(HttpStatus.OK)
  @Scopes(PARTNER_SCOPES.DOCUMENT_SEND)
  @ApiOperation({
    summary: 'Send an invoice or quote to the customer',
    description:
      'Sent to the phone number or email address held on the customer record. There is ' +
      'deliberately no way to supply a destination — a caller who wants it sent ' +
      'somewhere new must have the office update their details first. The response ' +
      'reports a masked destination so the agent can confirm without reading the ' +
      'whole address aloud.',
  })
  send(@CurrentPartner() partner: PartnerContext, @Body() dto: SendDocumentDto) {
    return this.documents.send(partner.companyId, dto, isSandbox(partner));
  }

  @Post('bookings/:id/confirmation')
  @HttpCode(HttpStatus.OK)
  @Scopes(PARTNER_SCOPES.CONFIRMATION_SEND)
  @ApiOperation({
    summary: 'Send an appointment confirmation',
    description:
      'Wording follows the booking status — a PENDING booking is described as ' +
      'awaiting confirmation, never as confirmed.',
  })
  confirmation(
    @CurrentPartner() partner: PartnerContext,
    @Param('id') id: string,
    @Body() dto: SendConfirmationDto,
  ) {
    return this.documents.sendBookingConfirmation(
      partner.companyId,
      id,
      dto.channel,
      isSandbox(partner),
    );
  }
}

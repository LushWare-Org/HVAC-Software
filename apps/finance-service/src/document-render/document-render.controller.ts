import { Body, Controller, Post, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@tscrm/auth-client';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateClient, DocumentTemplateConfig } from '../document-templates/document-template.client';

const SAMPLE_QUOTE: any = {
  quoteNumber: 'Q-SAMPLE-001', status: 'DRAFT', customerName: 'Jordan Rivera', customerEmail: 'jordan@example.com',
  title: 'Sample quote', description: 'Preview only', createdAt: new Date(), validUntil: new Date(Date.now() + 14 * 86400000),
  jobId: null, lineItems: [{ description: 'AC tune-up', category: 'LABOUR', quantity: 1, unitPrice: 150, lineTotal: 150, sortOrder: 0, taxable: true }],
  subtotal: 150, discountAmount: 0, discountType: null, discountValue: null, taxRate: 0.08, taxAmount: 12, total: 162,
  approvedAt: null, approvedByName: null, approvedByEmail: null, notes: 'Sample notes', terms: 'Sample terms',
};
const SAMPLE_INVOICE: any = {
  invoiceNumber: 'INV-SAMPLE-001', status: 'SENT', customerName: 'Jordan Rivera', customerEmail: 'jordan@example.com',
  createdAt: new Date(), dueDate: new Date(Date.now() + 30 * 86400000), quote: null,
  lineItems: [{ description: 'AC tune-up', category: 'LABOUR', quantity: 1, unitPrice: 150, lineTotal: 150, sortOrder: 0, taxable: true }],
  subtotal: 150, discountAmount: 0, taxRate: 0.08, taxAmount: 12, total: 162, amountPaid: 0, balanceDue: 162,
  stripePaymentUrl: '', payments: [], notes: 'Sample notes', terms: 'Sample terms',
};
const SAMPLE_AGREEMENT: any = {
  name: 'Sample Service Agreement', description: 'Preview only', customerName: 'Jordan Rivera', customerEmail: 'jordan@example.com',
  startDate: new Date(), endDate: new Date(Date.now() + 365 * 86400000), serviceType: 'AC Maintenance', serviceInterval: 'QUARTERLY',
  visitsIncluded: 4, visitsUsed: 1, billingAmount: 400, billingCycle: 'ANNUAL', nextBillingDate: new Date(Date.now() + 90 * 86400000),
  signedByName: null, signedAt: null,
};

interface RenderAgreementBody {
  companyId: string;
  templateId?: string;
  companyName: string;
  companyAddress: string;
  context: {
    name: string; description?: string; customerName: string; customerEmail: string;
    startDate: string; endDate?: string; serviceType?: string; serviceInterval?: string;
    visitsIncluded?: number; visitsUsed?: number; billingAmount?: number; billingCycle?: string;
    nextBillingDate?: string; signedByName?: string; signedAt?: string;
  };
}

interface PreviewBody {
  documentType: 'INVOICE' | 'QUOTE' | 'AGREEMENT';
  template: Partial<DocumentTemplateConfig>;
}

@ApiTags('Document Render (internal + preview)')
@ApiBearerAuth()
@Controller()
export class DocumentRenderController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly templates: DocumentTemplateClient,
  ) {}

  @Post('internal/documents/render')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Service-to-service: render an agreement PDF for crm-service (auth via SERVICE_JWT or dev-bypass headers, same as JobsClient)' })
  async renderAgreement(@Body() body: RenderAgreementBody, @Res() res: Response) {
    if (!body?.context?.name) throw new BadRequestException('context.name is required');
    const template = await this.templates.resolve(body.companyId, 'AGREEMENT', body.templateId);
    const pdf = await this.pdfService.generateAgreementPdf(
      {
        ...body.context,
        startDate: new Date(body.context.startDate),
        endDate: body.context.endDate ? new Date(body.context.endDate) : null,
        nextBillingDate: body.context.nextBillingDate ? new Date(body.context.nextBillingDate) : null,
        signedAt: body.context.signedAt ? new Date(body.context.signedAt) : null,
      },
      body.companyName,
      body.companyAddress,
      undefined,
      template,
    );
    res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
    res.end(pdf);
  }

  @Post('documents/preview')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Render draft (unsaved) template fields to HTML against sample data — for the template editor live preview' })
  preview(@Body() body: PreviewBody): { html: string } {
    const template = { id: 'draft', documentType: body.documentType, mode: 'BUILDER', ...body.template } as DocumentTemplateConfig;
    if (body.documentType === 'QUOTE') {
      return { html: this.pdfService.renderQuoteHtml(SAMPLE_QUOTE, 'Your Company Name', '123 Main St, Anytown', undefined, template) };
    }
    if (body.documentType === 'INVOICE') {
      return { html: this.pdfService.renderInvoiceHtml(SAMPLE_INVOICE, 'Your Company Name', '123 Main St, Anytown', undefined, template) };
    }
    return { html: this.pdfService.renderAgreementHtml(SAMPLE_AGREEMENT, 'Your Company Name', '123 Main St, Anytown', undefined, template) };
  }
}

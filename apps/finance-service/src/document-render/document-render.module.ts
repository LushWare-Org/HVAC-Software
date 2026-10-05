import { Module } from '@nestjs/common';
import { DocumentRenderController } from './document-render.controller';
import { PdfModule } from '../pdf/pdf.module';
import { DocumentTemplatesModule } from '../document-templates/document-templates.module';
import { CompanySettingsModule } from '../company-settings/company-settings.module';

@Module({
  imports: [PdfModule, DocumentTemplatesModule, CompanySettingsModule],
  controllers: [DocumentRenderController],
})
export class DocumentRenderModule {}

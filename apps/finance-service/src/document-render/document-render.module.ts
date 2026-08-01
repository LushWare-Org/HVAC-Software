import { Module } from '@nestjs/common';
import { DocumentRenderController } from './document-render.controller';
import { PdfModule } from '../pdf/pdf.module';
import { DocumentTemplatesModule } from '../document-templates/document-templates.module';

@Module({
  imports: [PdfModule, DocumentTemplatesModule],
  controllers: [DocumentRenderController],
})
export class DocumentRenderModule {}

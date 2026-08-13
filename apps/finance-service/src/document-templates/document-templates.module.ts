import { Module } from '@nestjs/common';
import { DocumentTemplateClient } from './document-template.client';

@Module({
  providers: [DocumentTemplateClient],
  exports: [DocumentTemplateClient],
})
export class DocumentTemplatesModule {}

-- Paper size for documents printed from this template: A4 (default) or LETTER.
ALTER TABLE "document_templates" ADD COLUMN "pageSize" TEXT NOT NULL DEFAULT 'A4';

import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const CRM_SERVICE_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface DocumentTemplateConfig {
  id: string;
  documentType: string;
  mode: string;
  companyName?: string | null;
  companyAddress?: string | null;
  logoUrl?: string | null;
  logoPosition?: string | null;
  accentColor?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  bankDetails?: string | null;
  showPageNumbers?: boolean;
  letterheadImageUrl?: string | null;
  letterheadTopMarginPx?: number | null;
  letterheadBottomMarginPx?: number | null;
  rows?: import('../pdf/slots').TemplateRow[] | null;
}

interface CacheEntry {
  value: DocumentTemplateConfig | null;
  expiresAt: number;
}

/** Reads the resolved document template from crm-service — same pattern as CompanySettingsClient. */
@Injectable()
export class DocumentTemplateClient {
  private readonly logger = new Logger(DocumentTemplateClient.name);
  private readonly cache = new Map<string, CacheEntry>();

  async resolve(companyId: string, documentType: string, templateId?: string): Promise<DocumentTemplateConfig | null> {
    const cacheKey = `${companyId}:${documentType}:${templateId ?? ''}`;
    const hit = this.cache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) return hit.value;

    try {
      const params = new URLSearchParams({ documentType, ...(templateId ? { templateId } : {}) });
      const res = await fetch(`${CRM_SERVICE_URL}/document-templates/resolve?${params}`, {
        headers: this.authHeaders(companyId),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw new Error(`crm responded ${res.status}`);
      const value = ((await res.json()) as DocumentTemplateConfig | null) ?? null;
      this.cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (err) {
      this.logger.warn(`template resolve failed for ${companyId}/${documentType}, falling back to no template: ${(err as Error).message}`);
      return null;
    }
  }

  private authHeaders(companyId: string): Record<string, string> {
    const secret = process.env.JWT_SECRET;
    if (process.env.BYPASS_AUTH === 'true' || !secret) {
      return {
        'x-test-user-role': 'company_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'document-template-client',
        'x-test-user-email': 'service@tscrm.internal',
      };
    }
    const token = jwt.sign(
      { sub: 'document-template-client', email: 'service@tscrm.internal', name: 'Document Template Client', company_id: companyId, role: 'company_admin' },
      secret,
      { expiresIn: '5m' },
    );
    return { Authorization: `Bearer ${token}` };
  }
}

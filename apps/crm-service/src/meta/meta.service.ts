import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);

  private readonly verifyToken  = process.env.FACEBOOK_VERIFY_TOKEN  ?? '';
  private readonly appSecret    = process.env.FACEBOOK_APP_SECRET     ?? '';
  private readonly accessToken  = process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? '';
  private readonly pageId       = process.env.FACEBOOK_PAGE_ID        ?? '';
  private readonly companyId    = process.env.FACEBOOK_COMPANY_ID     ?? '';

  constructor(private readonly prisma: PrismaService) {}

  // Webhook verification

  verify(mode: string, token: string, challenge: string): string {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Meta webhook verified');
      return challenge;
    }
    throw new BadRequestException('Meta webhook verification failed — check FACEBOOK_VERIFY_TOKEN');
  }


  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // Verify X-Hub-Signature-256 when app secret is configured
    if (this.appSecret) {
      const expected = `sha256=${createHmac('sha256', this.appSecret).update(rawBody).digest('hex')}`;
      const sigBuf   = Buffer.from(signature ?? '');
      const expBuf   = Buffer.from(expected);
      const valid    = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
      if (!valid) throw new BadRequestException('Invalid Meta webhook signature');
    }

    const body = JSON.parse(rawBody.toString('utf8'));

    if (body.object !== 'page') return; // only handle page events

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === 'leadgen') {
          const leadgenId: string | undefined = change.value?.leadgen_id;
          if (leadgenId) {
            this.processLead(leadgenId).catch((err: Error) =>
              this.logger.error(`Failed to process leadgen ${leadgenId}: ${err.message}`),
            );
          }
        }
      }
    }
  }

  // Fetch lead from Graph API and store

  private async processLead(leadgenId: string): Promise<void> {
    const exists = await this.prisma.lead.findFirst({
      where: { companyId: this.companyId, notes: { contains: leadgenId } },
      select: { id: true },
    });
    if (exists) {
      this.logger.debug(`leadgen ${leadgenId} already imported, skipping`);
      return;
    }

    // Fetch lead field data from Meta Graph API
    const url = `${GRAPH_API}/${leadgenId}?fields=field_data,created_time,ad_name,form_id&access_token=${this.accessToken}`;
    const res  = await fetch(url);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Graph API error for ${leadgenId}: ${err}`);
    }

    const payload = await res.json() as {
      field_data: { name: string; values: string[] }[];
      created_time?: number;
      ad_name?: string;
      form_id?: string;
    };

    const fields = this.extractFields(payload.field_data ?? []);
    const rawFull  = fields.full_name ?? '';
    const rawFirst = fields.first_name ?? '';
    const rawLast  = fields.last_name  ?? '';
    const fullName = rawFull || `${rawFirst} ${rawLast}`.trim();
    const parts    = fullName.split(/\s+/);
    const firstName = parts[0] || 'Unknown';
    const lastName  = parts.slice(1).join(' ') || '-';

    const notes = [
      `Source: Meta Lead Ad`,
      `Leadgen ID: ${leadgenId}`,
      payload.ad_name   ? `Ad: ${payload.ad_name}`     : null,
      payload.form_id   ? `Form ID: ${payload.form_id}` : null,
      fields.services   ? `Services: ${fields.services}` : null,
      fields.message    ? `Message: ${fields.message}`   : null,
    ].filter(Boolean).join('\n');

    const lead = await this.prisma.lead.create({
      data: {
        companyId:       this.companyId,
        firstName,
        lastName,
        email:           fields.email                 ?? null,
        phone:           fields.phone_number ?? fields.phone ?? null,
        whatsappNo:      fields.whatsapp_number       ?? null,
        source:          'facebook',
        serviceInterest: fields.service_interest ?? fields.services ?? null,
        status:          'NEW',
        notes,
      },
    });

    this.logger.log(`Imported Meta lead ${lead.id}: ${firstName} ${lastName}`);
  }

  private extractFields(fieldData: { name: string; values: string[] }[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const f of fieldData) {
      out[f.name.toLowerCase().replace(/\s+/g, '_')] = f.values[0] ?? '';
    }
    return out;
  }
}

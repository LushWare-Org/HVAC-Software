import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export interface EquipmentScanResult {
  brand: string | null;
  model: string | null;
  serialNo: string | null;
  errorCodes: { code: string; meaning: string }[];
}

const SCAN_PROMPT = `You are analyzing a photo of HVAC/mechanical/electrical equipment taken by a field technician or CRM admin. The photo may show a nameplate/data sticker (brand, model, serial number) and/or a fault/error code table printed on or near the unit.

Extract whatever is clearly legible. Respond with ONLY a JSON object of this exact shape:
{"brand": string|null, "model": string|null, "serialNo": string|null, "errorCodes": [{"code": string, "meaning": string}]}

If no nameplate is visible, set brand/model/serialNo to null. If no error code table is visible, return an empty errorCodes array. Never invent values that are not actually legible in the photo.`;

/**
 * Fire-and-forget scan runner — scanAndStore() always resolves (internal try/catch)
 * so callers can invoke it without awaiting and without risking an unhandled rejection.
 */
@Injectable()
export class EquipmentScanService {
  private readonly logger = new Logger(EquipmentScanService.name);
  // Built lazily, not as a field initializer: the OpenAI SDK throws synchronously
  // when the API key is empty, and this is an eagerly-instantiated NestJS provider —
  // a missing key must not be able to crash the whole app at boot over one feature.
  private client: OpenAI | null = null;
  private readonly model = process.env.OPENAI_MODEL_EQUIPMENT_SCAN ?? 'gpt-4o';

  constructor(private readonly prisma: PrismaService) {}

  private getClient(): OpenAI {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured — equipment photo scanning is disabled');
    }
    if (!this.client) this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return this.client;
  }

  async scanAndStore(
    companyId: string,
    equipmentId: string,
    image: { buffer: Buffer; mimetype: string },
  ): Promise<void> {
    try {
      const result = await this.scan(image);
      await this.prisma.equipment.updateMany({
        where: { id: equipmentId, companyId },
        data: { imageScanStatus: 'DONE', imageScanResult: result as any, imageScanError: null },
      });
    } catch (err) {
      const message = (err as Error).message?.slice(0, 500) ?? 'Scan failed';
      this.logger.warn(`Equipment scan failed for ${equipmentId}: ${message}`);
      await this.prisma.equipment.updateMany({
        where: { id: equipmentId, companyId },
        data: { imageScanStatus: 'FAILED', imageScanError: message },
      });
    }
  }

  private async scan(image: { buffer: Buffer; mimetype: string }): Promise<EquipmentScanResult> {
    // Sent as a base64 data URL rather than the object's public URL: in dev that URL
    // points at localhost:9000 (MinIO), which OpenAI's servers cannot reach at all —
    // "400 Error while downloading ...". A data URL sidesteps needing the storage
    // endpoint to be publicly reachable from OpenAI in the first place, in any environment.
    const dataUrl = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
    const completion = await this.getClient().chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SCAN_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    } as any);

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return {
      brand: parsed.brand ?? null,
      model: parsed.model ?? null,
      serialNo: parsed.serialNo ?? null,
      errorCodes: Array.isArray(parsed.errorCodes)
        ? parsed.errorCodes
            .filter((e: any) => e && typeof e.code === 'string')
            .map((e: any) => ({ code: String(e.code), meaning: String(e.meaning ?? '') }))
        : [],
    };
  }
}

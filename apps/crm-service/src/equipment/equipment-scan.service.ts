import { Injectable, Logger, Optional } from '@nestjs/common';
import { AiGateway } from '@tscrm/ai';
import { createCrmAiGateway } from '../ai/ai-gateway.factory';
import { DEFAULT_GEMINI_MODEL } from '../ai/ai-routes';
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

/** A photo upload is not waited on, but a vision call can be slow: allow it time. */
const SCAN_TIMEOUT_MS = 45_000;

const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Fire-and-forget scan runner — scanAndStore() always resolves (internal try/catch)
 * so callers can invoke it without awaiting and without risking an unhandled rejection.
 *
 * Goes through the shared AI gateway: OpenAI vision first, Gemini as the
 * backup. The image travels as base64 inside the request rather than as the
 * object's URL, because in dev that URL is localhost MinIO, which no AI
 * provider can reach.
 */
@Injectable()
export class EquipmentScanService {
  private readonly logger = new Logger(EquipmentScanService.name);
  private readonly gateway: AiGateway;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() gateway?: AiGateway,
  ) {
    this.gateway = gateway ?? createCrmAiGateway(prisma, this.logger);
  }

  async scanAndStore(
    companyId: string,
    equipmentId: string,
    image: { buffer: Buffer; mimetype: string },
  ): Promise<void> {
    try {
      const result = await this.scan(companyId, image);
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

  private async scan(companyId: string, image: { buffer: Buffer; mimetype: string }): Promise<EquipmentScanResult> {
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('No AI key configured (OPENAI_API_KEY or GEMINI_API_KEY) — equipment photo scanning is disabled');
    }
    const res = await this.gateway.generateJson({
      task: 'equipment-scan',
      companyId,
      system: SCAN_PROMPT,
      prompt: 'Read the equipment in this photo.',
      images: [{ mimeType: image.mimetype, base64: image.buffer.toString('base64') }],
      timeoutMs: SCAN_TIMEOUT_MS,
      routes: [
        { provider: 'openai', model: process.env.OPENAI_MODEL_EQUIPMENT_SCAN || 'gpt-4o' },
        { provider: 'gemini', model: process.env.GEMINI_MODEL_EQUIPMENT_SCAN || DEFAULT_GEMINI_MODEL },
      ],
      validate: isObject,
    });
    if (!res) throw new Error('No AI model could read the photo right now. Try again in a minute.');

    const parsed = res.data;
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

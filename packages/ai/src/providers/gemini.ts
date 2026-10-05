import { GoogleGenAI } from '@google/genai';
import { AiTimeoutError } from '../errors';
import type { ProviderAdapter, ProviderCall, ProviderResult } from '../types';

/** Google rejects request deadlines under 10 seconds. */
export const GEMINI_MIN_TIMEOUT_MS = 10_000;

export class GeminiProvider implements ProviderAdapter {
  readonly name = 'gemini' as const;
  private client: GoogleGenAI | null = null;

  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  isConfigured(): boolean {
    return !!this.env.GEMINI_API_KEY;
  }

  async generate(call: ProviderCall): Promise<ProviderResult> {
    if (!this.client) this.client = new GoogleGenAI({ apiKey: this.env.GEMINI_API_KEY! });
    const timeoutMs = Math.max(call.timeoutMs, GEMINI_MIN_TIMEOUT_MS);

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      ...(call.images ?? []).map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } })),
      { text: call.prompt },
    ];

    const request = this.client.models.generateContent({
      model: call.model,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: call.system,
        responseMimeType: 'application/json',
        temperature: call.temperature,
        httpOptions: { timeout: timeoutMs },
      },
    });
    const response = await withDeadline(request, timeoutMs);
    const usage = response.usageMetadata;
    return {
      text: response.text ?? '',
      usage: usage ? { inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount } : undefined,
    };
  }
}

/** The SDK's own timeout is advisory; this one is not. */
export function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AiTimeoutError(ms)), ms);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

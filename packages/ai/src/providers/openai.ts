import OpenAI from 'openai';
import type { ProviderAdapter, ProviderCall, ProviderResult } from '../types';
import { withDeadline } from './gemini';

export class OpenAIProvider implements ProviderAdapter {
  readonly name = 'openai' as const;
  private client: OpenAI | null = null;

  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  isConfigured(): boolean {
    return !!this.env.OPENAI_API_KEY;
  }

  async generate(call: ProviderCall): Promise<ProviderResult> {
    // maxRetries 0: the gateway owns retries, so attempts are counted and logged once.
    if (!this.client) this.client = new OpenAI({ apiKey: this.env.OPENAI_API_KEY!, maxRetries: 0 });

    // JSON mode requires the word "JSON" somewhere in the messages.
    const system = /json/i.test(call.system) ? call.system : `${call.system}\n\nRespond with JSON only.`;
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: 'text', text: call.prompt },
      ...(call.images ?? []).map((img) => ({
        type: 'image_url' as const,
        image_url: { url: `data:${img.mimeType};base64,${img.base64}`, detail: 'high' as const },
      })),
    ];

    const request = this.client.chat.completions.create(
      {
        model: call.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: call.images?.length ? content : call.prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: call.temperature,
      },
      { timeout: call.timeoutMs },
    );
    const response = await withDeadline(request, call.timeoutMs);
    return {
      text: response.choices[0]?.message?.content ?? '',
      usage: response.usage
        ? { inputTokens: response.usage.prompt_tokens, outputTokens: response.usage.completion_tokens }
        : undefined,
    };
  }
}

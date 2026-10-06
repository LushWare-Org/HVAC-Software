import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export type LlmEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; call: { id: string; name: string; args: string } }
  | { type: 'usage'; inputTokens: number; outputTokens: number };

@Injectable()
export class LLMProvider {
  private client: OpenAI | null = null;
  readonly modelHelp = process.env.OPENAI_MODEL_HELP ?? 'gpt-4o-mini';
  readonly modelData = process.env.OPENAI_MODEL_DATA ?? 'gpt-4o';

  // Built on first use: the SDK throws when the key is empty, which must not
  // stop the service from booting.
  private get api(): OpenAI {
    return (this.client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
  }

  /**
   * Streams text, then at most one tool call per round (parallel calls are
   * off so each action gets its own confirmation), then token usage.
   */
  async *stream(model: string, messages: ChatCompletionMessageParam[], tools?: ChatCompletionTool[]): AsyncIterable<LlmEvent> {
    const stream = await this.api.chat.completions.create({
      model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      ...(tools?.length ? { tools, tool_choice: 'auto' as const, parallel_tool_calls: false } : {}),
    });

    let call: { id: string; name: string; args: string } | null = null;
    for await (const chunk of stream) {
      if (chunk.usage) {
        yield { type: 'usage', inputTokens: chunk.usage.prompt_tokens, outputTokens: chunk.usage.completion_tokens };
      }
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      const tc = delta.tool_calls?.[0];
      if (tc) {
        if (tc.id) call = { id: tc.id, name: tc.function?.name ?? '', args: '' };
        if (call && tc.function?.arguments) call.args += tc.function.arguments;
        continue;
      }
      if (delta.content) yield { type: 'text', text: delta.content };
    }
    if (call) yield { type: 'tool', call };
  }
}

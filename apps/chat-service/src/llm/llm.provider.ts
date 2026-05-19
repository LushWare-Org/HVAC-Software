import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

@Injectable()
export class LLMProvider {
  private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  readonly modelHelp = process.env.OPENAI_MODEL_HELP ?? 'gpt-4o-mini';
  readonly modelData = process.env.OPENAI_MODEL_DATA ?? 'gpt-4o';

  async *stream(
    model: string,
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
  ): AsyncIterable<string> {
    const params: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
      model,
      messages,
      stream: true,
      ...(tools?.length ? { tools, tool_choice: 'auto' } : {}),
    };

    const stream = await this.client.chat.completions.create(params);

    let toolCallBuffer: { id: string; name: string; args: string } | null = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // Accumulate tool call arguments
      if (delta.tool_calls?.[0]) {
        const tc = delta.tool_calls[0];
        if (tc.id) {
          toolCallBuffer = { id: tc.id, name: tc.function?.name ?? '', args: '' };
        }
        if (toolCallBuffer && tc.function?.arguments) {
          toolCallBuffer.args += tc.function.arguments;
        }
        continue;
      }

      // Tool call is fully accumulated — signal caller to execute it
      if (toolCallBuffer && !delta.tool_calls) {
        yield `__TOOL_CALL__${JSON.stringify(toolCallBuffer)}`;
        toolCallBuffer = null;
        continue;
      }

      if (delta.content) yield delta.content;
    }

    // Flush any remaining tool call
    if (toolCallBuffer) {
      yield `__TOOL_CALL__${JSON.stringify(toolCallBuffer)}`;
    }
  }

  async complete(
    model: string,
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
  ): Promise<OpenAI.Chat.ChatCompletion> {
    return this.client.chat.completions.create({
      model,
      messages,
      stream: false,
      ...(tools?.length ? { tools, tool_choice: 'auto' } : {}),
    });
  }
}

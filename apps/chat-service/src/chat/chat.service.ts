import { Injectable } from '@nestjs/common';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { LLMProvider } from '../llm/llm.provider';
import { PromptService, BotType } from '../prompts/prompt.service';
import { ToolRegistry } from '../tools/tool.registry';
import { ToolExecutor, ExecutionContext } from '../tools/tool.executor';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatTurn[];
}

@Injectable()
export class ChatService {
  constructor(
    private readonly llm: LLMProvider,
    private readonly prompts: PromptService,
    private readonly registry: ToolRegistry,
    private readonly executor: ToolExecutor,
  ) {}

  async *streamResponse(
    req: ChatRequest,
    botType: BotType,
    ctx: ExecutionContext,
  ): AsyncIterable<string> {
    const systemPrompt = this.prompts.forBot(botType);
    const tools = this.registry.forBot(botType);
    const model = this.llm.modelData; // gpt-4o for both — reliable tool use

    // Build messages: system + history (last 10) + current
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...req.history.slice(-10).map(t => ({ role: t.role, content: t.content } as ChatCompletionMessageParam)),
      { role: 'user', content: req.message },
    ];

    // Stream and handle tool calls in a loop (model may call multiple tools)
    let iterMessages = [...messages];
    let assistantBuffer = '';

    while (true) {
      let pendingToolCall: { id: string; name: string; args: string } | null = null;

      for await (const chunk of this.llm.stream(model, iterMessages, tools)) {
        if (chunk.startsWith('__TOOL_CALL__')) {
          pendingToolCall = JSON.parse(chunk.slice('__TOOL_CALL__'.length));
          break;
        }
        assistantBuffer += chunk;
        yield chunk;
      }

      if (!pendingToolCall) break; // no more tool calls — done

      // Flush what was said before the tool call
      if (assistantBuffer) {
        iterMessages.push({ role: 'assistant', content: assistantBuffer });
        assistantBuffer = '';
      }

      // Signal tool execution to frontend via a separate status token (not mixed into message content)
      yield `__STATUS__${pendingToolCall.name}`;

      // Execute tool
      const toolArgs = JSON.parse(pendingToolCall.args || '{}');
      const toolResult = await this.executor.execute(pendingToolCall.name, toolArgs, ctx);

      // Append tool call + result to messages so model can continue
      iterMessages.push({
        role: 'assistant',
        content: null as any,
        tool_calls: [{
          id: pendingToolCall.id,
          type: 'function',
          function: { name: pendingToolCall.name, arguments: pendingToolCall.args },
        }],
      });
      iterMessages.push({
        role: 'tool',
        tool_call_id: pendingToolCall.id,
        content: toolResult,
      });
    }
  }
}

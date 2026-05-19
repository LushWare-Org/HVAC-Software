import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLMModule } from '../llm/llm.module';
import { PromptService } from '../prompts/prompt.service';
import { ToolRegistry } from '../tools/tool.registry';
import { ToolExecutor } from '../tools/tool.executor';

@Module({
  imports: [LLMModule],
  controllers: [ChatController],
  providers: [ChatService, PromptService, ToolRegistry, ToolExecutor],
})
export class ChatModule {}

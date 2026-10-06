import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLMModule } from '../llm/llm.module';
import { PromptService } from '../prompts/prompt.service';

@Module({
  imports: [LLMModule],
  controllers: [ChatController],
  providers: [ChatService, PromptService],
})
export class ChatModule {}

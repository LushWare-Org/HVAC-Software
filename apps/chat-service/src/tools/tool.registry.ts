import { Injectable } from '@nestjs/common';
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { CUSTOMER_TOOLS } from './customer.tools';
import { ADMIN_TOOLS } from './admin.tools';
import { BotType } from '../prompts/prompt.service';

@Injectable()
export class ToolRegistry {
  forBot(botType: BotType): ChatCompletionTool[] {
    return botType === 'customer' ? CUSTOMER_TOOLS : ADMIN_TOOLS;
  }
}

import { Injectable } from '@nestjs/common';
import { CUSTOMER_SYSTEM_PROMPT } from './customer.prompt';
import { ADMIN_SYSTEM_PROMPT } from './admin.prompt';

export type BotType = 'customer' | 'admin';

@Injectable()
export class PromptService {
  forBot(botType: BotType): string {
    return botType === 'customer' ? CUSTOMER_SYSTEM_PROMPT : ADMIN_SYSTEM_PROMPT;
  }
}

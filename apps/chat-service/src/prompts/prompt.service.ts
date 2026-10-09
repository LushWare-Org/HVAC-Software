import { Injectable } from '@nestjs/common';
import { CUSTOMER_SYSTEM_PROMPT } from './customer.prompt';
import { ADMIN_SYSTEM_PROMPT } from './admin.prompt';
import { TECHNICIAN_SYSTEM_PROMPT } from './technician.prompt';

export type BotType = 'customer' | 'admin' | 'technician';

@Injectable()
export class PromptService {
  forBot(botType: BotType): string {
    if (botType === 'customer') return CUSTOMER_SYSTEM_PROMPT;
    return botType === 'technician' ? TECHNICIAN_SYSTEM_PROMPT : ADMIN_SYSTEM_PROMPT;
  }
}

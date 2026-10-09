import { chatErrorMessage } from './chat-error';

describe('chatErrorMessage', () => {
  it('says plainly when the AI is out of quota or credits', () => {
    expect(chatErrorMessage(Object.assign(new Error('429 quota'), { status: 429 }))).toBe("Kelvin's AI has reached its usage limit for now. Try again later, or ask an admin to check the AI plan.");
    expect(chatErrorMessage({ code: 'insufficient_quota' })).toMatch(/usage limit/);
  });

  it('says when no AI is set up, and stays generic otherwise', () => {
    expect(chatErrorMessage(new Error('No AI key is configured (GEMINI_API_KEY or OPENAI_API_KEY).'))).toBe("Kelvin's AI isn't set up yet. Ask an admin to add an AI key.");
    expect(chatErrorMessage(new Error('boom'))).toBe('Chat service error. Please try again.');
  });
});

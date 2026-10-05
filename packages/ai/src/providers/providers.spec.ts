const openaiCreate = jest.fn();
jest.mock('openai', () => jest.fn().mockImplementation(() => ({ chat: { completions: { create: openaiCreate } } })));

const geminiGenerate = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({ models: { generateContent: geminiGenerate } })),
}));

import { OpenAIProvider } from './openai';
import { GeminiProvider, GEMINI_MIN_TIMEOUT_MS } from './gemini';
import { AiTimeoutError } from '../errors';

const call = { model: 'm', system: 'Be brief.', prompt: 'Read it.', timeoutMs: 5_000 };
const image = { mimeType: 'image/jpeg', base64: 'QUJD' };

describe('OpenAIProvider', () => {
  beforeEach(() => openaiCreate.mockReset());

  it('is configured only with an API key', () => {
    expect(new OpenAIProvider({}).isConfigured()).toBe(false);
    expect(new OpenAIProvider({ OPENAI_API_KEY: 'k' }).isConfigured()).toBe(true);
  });

  it('sends images inline as data URLs, since providers cannot reach private storage', async () => {
    openaiCreate.mockResolvedValue({ choices: [{ message: { content: '{"a":1}' } }], usage: { prompt_tokens: 3, completion_tokens: 2 } });
    const res = await new OpenAIProvider({ OPENAI_API_KEY: 'k' }).generate({ ...call, images: [image] });

    const body = openaiCreate.mock.calls[0][0];
    const img = body.messages[1].content.find((c: any) => c.type === 'image_url');
    expect(img.image_url.url).toBe('data:image/jpeg;base64,QUJD');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(res).toEqual({ text: '{"a":1}', usage: { inputTokens: 3, outputTokens: 2 } });
  });

  it('adds the word JSON to the system message when missing, as JSON mode requires', async () => {
    openaiCreate.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });
    await new OpenAIProvider({ OPENAI_API_KEY: 'k' }).generate(call);
    expect(openaiCreate.mock.calls[0][0].messages[0].content).toMatch(/JSON/);
  });
});

describe('GeminiProvider', () => {
  beforeEach(() => geminiGenerate.mockReset());

  it('raises the deadline to the 10s Gemini minimum and asks for JSON', async () => {
    geminiGenerate.mockResolvedValue({ text: '{"a":1}', usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 4 } });
    const res = await new GeminiProvider({ GEMINI_API_KEY: 'k' }).generate({ ...call, images: [image] });

    const req = geminiGenerate.mock.calls[0][0];
    expect(req.config.httpOptions.timeout).toBe(GEMINI_MIN_TIMEOUT_MS);
    expect(req.config.responseMimeType).toBe('application/json');
    expect(req.contents[0].parts[0]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: 'QUJD' } });
    expect(res).toEqual({ text: '{"a":1}', usage: { inputTokens: 7, outputTokens: 4 } });
  });

  it('gives up at its own deadline even if the SDK never answers', async () => {
    jest.useFakeTimers();
    geminiGenerate.mockReturnValue(new Promise(() => { /* never settles */ }));
    const pending = new GeminiProvider({ GEMINI_API_KEY: 'k' }).generate({ ...call, timeoutMs: 12_000 });
    jest.advanceTimersByTime(12_000);
    await expect(pending).rejects.toBeInstanceOf(AiTimeoutError);
    jest.useRealTimers();
  });
});

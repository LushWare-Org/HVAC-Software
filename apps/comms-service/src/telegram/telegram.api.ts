/**
 * The few Telegram Bot API calls we use, over plain HTTPS. The token is only
 * ever in the URL path of requests to api.telegram.org, never logged.
 */
export class TelegramApiError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
  /** The person blocked the bot or deleted their account: stop sending to them. */
  get gone(): boolean {
    return this.code === 403 || /chat not found|user is deactivated|bot was blocked/i.test(this.message);
  }
}

export interface TgUser { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string }
export interface TgChat { id: number; type: string; first_name?: string; last_name?: string; username?: string }
export interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  date: number;
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string; width: number; height: number }>;
  document?: { file_id: string; file_name?: string };
  reply_to_message?: { message_id: number };
}
export interface TgUpdate { update_id: number; message?: TgMessage; edited_message?: TgMessage }

const BASE = 'https://api.telegram.org';

export async function tg<T = any>(token: string, method: string, body?: Record<string, unknown>, timeoutMs = 10_000): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new TelegramApiError(0, `Telegram could not be reached: ${(err as Error).message}`);
  }
  const data = (await res.json().catch(() => null)) as { ok: boolean; result?: T; error_code?: number; description?: string } | null;
  if (!data?.ok) throw new TelegramApiError(data?.error_code ?? res.status, data?.description ?? `Telegram error ${res.status}`);
  return data.result as T;
}

/** A token looks like "123456789:AA…" (digits, colon, 30+ url-safe characters). */
export const looksLikeToken = (t: string) => /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(t);

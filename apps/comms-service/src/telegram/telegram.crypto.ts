/**
 * Bot tokens are kept encrypted (AES-256-GCM). The key comes from
 * TELEGRAM_TOKEN_KEY, or is derived from JWT_SECRET when that isn't set, so
 * a token copied out of the database is useless on its own.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function key(): Buffer {
  const raw = process.env.TELEGRAM_TOKEN_KEY || process.env.JWT_SECRET;
  if (!raw) throw new Error('Set TELEGRAM_TOKEN_KEY (or JWT_SECRET) before connecting a Telegram bot');
  return createHash('sha256').update(`telegram-token:${raw}`).digest();
}

export function sealToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), enc.toString('base64url')].join('.');
}

export function openToken(sealed: string): string {
  const [v, iv, tag, enc] = sealed.split('.');
  if (v !== 'v1' || !iv || !tag || !enc) throw new Error('Unreadable bot token');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(enc, 'base64url')), decipher.final()]).toString('utf8');
}

/** One-time link codes: random, URL-safe, and stored only as a hash. */
export function newLinkCode(): { code: string; hash: string } {
  const code = randomBytes(18).toString('base64url'); // 24 chars, fits Telegram's /start limit
  return { code, hash: hashCode(code) };
}

export const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

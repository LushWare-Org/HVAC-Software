/**
 * How Kelvin reaches a person: an in-app message, an email, a push to their phone
 * or browser, or any mix. Email and push go through comms /notifications/direct,
 * which reports per channel what happened, so the reply can say "emailed, but no
 * device to push to" instead of claiming everything went.
 */
import type { ServiceHttp } from '../service-http';

export type Channel = 'message' | 'email' | 'push';
const ALL: Channel[] = ['message', 'email', 'push'];

export const CHANNELS_PARAM = {
  type: 'array',
  items: { type: 'string', enum: ALL },
  description:
    "How to reach them: 'message' (their in-app inbox), 'email', 'push' (a notification on their phone or browser). " +
    'Use every way the person asks for, e.g. "message and email him" → ["message","email"]. Defaults to ["message"].',
};

/** The channels asked for, in a fixed order, defaulting to an in-app message. */
export function channelsOf(v: unknown, fallback: Channel[] = ['message']): Channel[] {
  const asked = (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\s]+/) : []).map((x) => String(x).toLowerCase().trim());
  const picked = ALL.filter((c) => asked.includes(c) || (c === 'push' && asked.includes('notification')));
  return picked.length ? picked : fallback;
}

const WORD: Record<Channel, string> = { message: 'in-app message', email: 'email', push: 'push notification' };
export const channelWords = (chs: Channel[]) => chs.map((c) => WORD[c]).join(', ');
/** "In-app message and email to Sara" — the ✉ line on a card. */
export const sendsLine = (chs: Channel[], name: string) => {
  const w = chs.map((c) => WORD[c]);
  const joined = w.length > 1 ? `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}` : w[0];
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)} to ${name}`;
};

const MISSED: Record<string, string> = {
  'no-email': 'no email address on file',
  'no-device': "they haven't turned on notifications on any phone or browser",
  failed: 'it failed to send',
};

/** Sends the email/push part and turns the per-channel results into one honest sentence. */
export async function sendDirect(
  http: ServiceHttp,
  body: { to: 'customer' | 'staff'; id: string; title: string; message: string; channels: Channel[]; jobId?: string },
): Promise<{ sent: Channel[]; missed: string[] }> {
  // A chat message already pushes to their phone/browser, so don't push the same words twice.
  const want = body.channels.filter((c) => c !== 'message' && !(c === 'push' && body.channels.includes('message')));
  const rides = body.channels.includes('message') && body.channels.includes('push')
    ? ['The push goes with the message if they have notifications on'] : [];
  if (!want.length) return { sent: [], missed: rides };
  const res = await http.post('comms', '/notifications/direct', { ...body, channels: want });
  const sent: Channel[] = [];
  const missed: string[] = [];
  for (const c of want) {
    const r = res?.results?.[c];
    if (r === 'sent') sent.push(c);
    else missed.push(`No ${WORD[c]}: ${MISSED[r] ?? 'not sent'}`);
  }
  return { sent, missed: [...missed, ...rides] };
}

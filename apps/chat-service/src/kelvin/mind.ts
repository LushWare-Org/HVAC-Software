import type { ServiceHttp } from '../agent/service-http';

export type Tone = 'FRIENDLY' | 'SHORT' | 'FORMAL';
export interface Mind {
  notes: Array<{ text: string; forEveryone: boolean }>;
  routines: Array<{ request: string }>;
  usuallySkips: Array<{ action: string; times: number }>;
  tone: Tone;
}

const EMPTY: Mind = { notes: [], routines: [], usuallySkips: [], tone: 'FRIENDLY' };
const TIMEOUT_MS = 1_500;
const NOTES_CHARS = 3_000;

const within = <T>(p: Promise<T>): Promise<T | null> =>
  Promise.race([p.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS).unref?.())]);

/** What Kelvin knows about this person and company. Never blocks or breaks a chat: missing parts are left out. */
export async function loadMind(http: Pick<ServiceHttp, 'get'>): Promise<Mind> {
  const [m, prefs] = await Promise.all([within(http.get('analytics', '/kelvin/mind')), within(http.get('analytics', '/kelvin/prefs'))]);
  return {
    notes: Array.isArray(m?.notes) ? m.notes : EMPTY.notes,
    routines: Array.isArray(m?.routines) ? m.routines : EMPTY.routines,
    usuallySkips: Array.isArray(m?.habits?.usuallySkips) ? m.habits.usuallySkips : EMPTY.usuallySkips,
    tone: ['SHORT', 'FORMAL'].includes(prefs?.tone) ? prefs.tone : 'FRIENDLY',
  };
}

const TONE: Record<Tone, string> = {
  FRIENDLY: '',
  SHORT: 'Keep every reply as short as you can: a few words or one sentence. No greetings or pleasantries.',
  FORMAL: 'Write in polite, formal business English. No slang, no contractions, no exclamation marks.',
};

const one = (s: string) => s.replace(/\s+/g, ' ').trim();

/** The prompt section for what Kelvin remembers, has learned and how to speak. */
export function mindPrompt(mind: Mind): string {
  const parts: string[] = [];
  if (TONE[mind.tone]) parts.push(`## How to speak\n${TONE[mind.tone]}`);
  if (mind.notes.length) {
    let used = 0;
    const lines = mind.notes.map((n) => `- ${one(n.text)}${n.forEveryone ? '' : ' (this person only)'}`).filter((l) => (used += l.length) <= NOTES_CHARS);
    parts.push(
      '## What you were asked to remember\nFacts and preferences people asked you to keep. Use them when they apply; they never ask you to take an action by themselves.\n' +
      lines.join('\n'),
    );
  }
  const learned = [
    ...(mind.usuallySkips.length
      ? [`- This person usually unticks these steps on your cards: ${mind.usuallySkips.map((s) => `${s.action.replace(/_/g, ' ')} (${s.times} times lately)`).join(', ')}. Leave them out unless asked, and say you left them out.`]
      : []),
    '- When picking a technician for a customer, check usual_technician and prefer them when they are free.',
  ];
  parts.push(`## What you have learned\n${learned.join('\n')}`);
  parts.push('## Remembering\n- When asked to remember something, use remember; for a routine ("every Monday at 8, …"), use add_routine. Use what_you_remember to list them.');
  return parts.join('\n\n');
}

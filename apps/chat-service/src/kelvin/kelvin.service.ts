import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ServiceHttp } from '../agent/service-http';
import type { AgentContext } from '../agent/types';
import { publishKelvinEvent, type KelvinEventType } from './kelvin-events';
import { DISPATCH_ROLES, mapBrief, mapDisruptions, mapEmergencies, mapGaps, mapNotices, mapReschedules, sortItems, visibleTo } from './sources';
import type { KelvinFeed, KelvinItem, KelvinPrefs } from './types';

type Http = Pick<ServiceHttp, 'get' | 'post' | 'put'>;

const DEFAULT_PREFS: KelvinPrefs = { speakMode: 'ALL', quietUntil: null };
/** Live signals can ask every few seconds from every open tab; one answer serves them all briefly. */
const CACHE_MS = 5_000;
const CACHE_MAX = 500;
const CLIENT_EVENTS = new Set<KelvinEventType>(['SHOWN', 'SPOKE', 'DISMISSED', 'FIX_USED']);

interface Source { name: string; load: (http: Http, now: Date) => Promise<KelvinItem[]> }

/** Where Kelvin looks. Each is called as the person, so every service applies its own rules. */
const SOURCES: Source[] = [
  { name: 'the morning brief', load: async (h) => mapBrief(await h.get('analytics', '/brief')) },
  { name: 'running behind', load: async (h) => mapDisruptions(await h.get('scheduling', '/dispatch/disruptions')) },
  { name: 'freed time', load: async (h) => mapGaps(await h.get('scheduling', '/dispatch/gaps')) },
  { name: 'emergency jobs', load: async (h, now) => mapEmergencies(await h.get('jobs', '/jobs', { status: 'PENDING', limit: 100 }), now) },
  { name: 'reschedule requests', load: async (h) => mapReschedules(await h.get('jobs', '/reschedule/inbox', { scope: 'action', limit: 20 })) },
  { name: 'notifications', load: async (h) => mapNotices(await h.get('comms', '/notifications', { limit: 20 })) },
];

function within<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

@Injectable()
export class KelvinService {
  private readonly logger = new Logger(KelvinService.name);
  private readonly cache = new Map<string, { at: number; feed: KelvinFeed }>();

  constructor(
    // Factories so tests can hand in a fake; production makes a ServiceHttp per person.
    private readonly httpFor: (ctx: AgentContext) => Http = (ctx) => new ServiceHttp(ctx),
    private readonly timeoutMs = 4_000,
  ) {}

  async feed(ctx: AgentContext, now = new Date()): Promise<KelvinFeed> {
    const generatedAt = now.toISOString();
    if (!DISPATCH_ROLES.has(ctx.role.toLowerCase())) return { items: [], unavailable: [], prefs: DEFAULT_PREFS, generatedAt };

    const key = `${ctx.companyId}:${ctx.userId}:${ctx.role}`;
    const hit = this.cache.get(key);
    if (hit && now.getTime() - hit.at < CACHE_MS && now.getTime() >= hit.at) return hit.feed;

    const http = this.httpFor(ctx);
    const results = await Promise.allSettled(SOURCES.map((s) => within(s.load(http, now), this.timeoutMs)));
    const unavailable: string[] = [];
    let items: KelvinItem[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') items.push(...r.value);
      else { unavailable.push(SOURCES[i].name); this.logger.warn(`Kelvin source "${SOURCES[i].name}" failed: ${(r.reason as Error)?.message}`); }
    });
    items = items.filter((i) => visibleTo(i, ctx.role) && !(i.expiresAt && Date.parse(i.expiresAt) <= now.getTime()));

    const [state, prefs] = await Promise.all([
      within(http.post('analytics', '/kelvin/state', { itemIds: items.map((i) => i.id) }), this.timeoutMs).catch(() => null),
      within(http.get('analytics', '/kelvin/prefs'), this.timeoutMs).catch(() => null),
    ]);
    if (state) {
      const dismissed = new Set<string>(state.dismissed ?? []);
      const spoken = new Set<string>(state.spoken ?? []);
      const seen = new Set<string>(state.seen ?? []);
      items = items.filter((i) => !dismissed.has(i.id)).map((i) => ({ ...i, spoken: spoken.has(i.id), seen: seen.has(i.id) }));
    }
    if (!prefs) unavailable.push('your settings');
    const feed: KelvinFeed = { items: sortItems(items), unavailable, prefs: (prefs as KelvinPrefs) ?? null, generatedAt };
    if (this.cache.size >= CACHE_MAX) this.cache.clear();
    this.cache.set(key, { at: now.getTime(), feed });
    return feed;
  }

  recordClientEvent(ctx: AgentContext, body: { type?: string; itemId?: string; summary?: string }): void {
    if (!CLIENT_EVENTS.has(body?.type as KelvinEventType) || typeof body.itemId !== 'string' || !body.itemId) return;
    publishKelvinEvent({
      companyId: ctx.companyId, userId: ctx.userId, type: body.type as KelvinEventType,
      itemId: body.itemId.slice(0, 200), summary: String(body.summary ?? '').slice(0, 300),
    });
  }

  prefs(ctx: AgentContext): Promise<KelvinPrefs> {
    return this.httpFor(ctx).get('analytics', '/kelvin/prefs');
  }

  setPrefs(ctx: AgentContext, body: Partial<KelvinPrefs>): Promise<KelvinPrefs> {
    if (body?.speakMode !== undefined && !['ALL', 'URGENT_ONLY', 'NEVER'].includes(body.speakMode)) {
      throw new BadRequestException('speakMode must be ALL, URGENT_ONLY or NEVER');
    }
    return this.httpFor(ctx).put('analytics', '/kelvin/prefs', body);
  }

  today(ctx: AgentContext, since?: string) {
    return this.httpFor(ctx).get('analytics', '/kelvin/events', since ? { since } : undefined);
  }
}

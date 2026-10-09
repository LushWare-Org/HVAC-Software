/**
 * Map pins, drawn once as plain SVG/HTML so Leaflet (divIcon) and Google Maps
 * (Advanced Marker content) show exactly the same thing.
 *
 * Reading a job pin without a legend:
 *   colour of the teardrop = the trade (cyan HVAC, indigo plumbing, gold electrical)
 *   badge on its corner    = where the job is (see STAGE_LABEL)
 *   dashed white pin       = nobody is assigned yet
 *   red pulse / orange ring = emergency / high priority
 * A technician is a round photo, never a teardrop, so people and jobs can't be confused.
 */
import { gradientForName, initialsForName } from '../../components/Avatar'

export type Trade = 'hvac' | 'plumbing' | 'electrical' | 'general' | 'agreement'
export type Stage = 'unassigned' | 'scheduled' | 'enroute' | 'onsite' | 'done' | 'hold'
export type Urgency = 'normal' | 'high' | 'emergency'

export const TRADE_COLOR: Record<Trade, string> = {
  hvac: '#0891B2', plumbing: '#4F46E5', electrical: '#CA8A04', general: '#475569', agreement: '#0F766E',
}
export const TRADE_LABEL: Record<Trade, string> = {
  hvac: 'HVAC', plumbing: 'Plumbing', electrical: 'Electrical', general: 'Other', agreement: 'Agreement visit',
}
export const STAGE_COLOR: Record<Stage, string> = {
  unassigned: '#F59E0B', scheduled: '#2563EB', enroute: '#7C3AED', onsite: '#0D9488', done: '#16A34A', hold: '#64748B',
}
export const STAGE_LABEL: Record<Stage, string> = {
  unassigned: 'Unassigned', scheduled: 'Scheduled', enroute: 'On the way', onsite: 'On site', done: 'Completed', hold: 'On hold',
}

// ─── Working out what a job is ────────────────────────────────────────────────

const TRADE_WORDS: Array<[Trade, RegExp]> = [
  ['plumbing', /plumb|pipe|leak|drain|water|tap|heater|pump|sink|toilet|bath/i],
  ['electrical', /electric|wiring|socket|breaker|circuit|distribution board|earthing|fan install|lighting/i],
  ['hvac', /hvac|a\/?c\b|air.?con|cool|chill|refrig|compressor|thermostat|duct|split|gas|freez|cold room|ventil/i],
]

/** Trade from the job's tags first (most reliable), then its type name, then its title. */
export function tradeOf(job: { tags?: string[]; jobTypeName?: string; title?: string; isAgreementJob?: boolean }): Trade {
  for (const t of job.tags ?? []) {
    const k = t.toLowerCase()
    if (k === 'hvac' || k === 'plumbing' || k === 'electrical') return k
  }
  for (const text of [job.jobTypeName, job.title]) {
    if (!text) continue
    for (const [trade, re] of TRADE_WORDS) if (re.test(text)) return trade
  }
  return job.isAgreementJob ? 'agreement' : 'general'
}

/** Where the job is in its life. Assignment status wins over job status only while the job is still open. */
export function stageOf(job: { status?: string }, assigned: boolean, assignmentStatus?: string): Stage {
  const s = job.status ?? ''
  if (['COMPLETED', 'INVOICED', 'PAID'].includes(s)) return 'done'
  if (s === 'ON_HOLD') return 'hold'
  if (s === 'ON_SITE' || assignmentStatus === 'ON_SITE') return 'onsite'
  if (s === 'EN_ROUTE' || assignmentStatus === 'EN_ROUTE') return 'enroute'
  return assigned ? 'scheduled' : 'unassigned'
}

export function urgencyOf(priority?: string): Urgency {
  const p = (priority ?? '').toUpperCase()
  if (p === 'EMERGENCY' || p === 'URGENT') return 'emergency'
  return p === 'HIGH' ? 'high' : 'normal'
}

// ─── Styles (injected once; pins live outside the React tree) ─────────────────

export function ensurePinStyles() {
  if (typeof document === 'undefined' || document.getElementById('hvactor-pin-styles')) return
  const el = document.createElement('style')
  el.id = 'hvactor-pin-styles'
  el.textContent = `
    @keyframes hp-pop { from { transform: scale(.6) translateY(4px); opacity: 0 } to { transform: none; opacity: 1 } }
    @keyframes hp-pulse { 0% { transform: scale(.7); opacity: .55 } 100% { transform: scale(1.8); opacity: 0 } }
    @keyframes hp-chev { 0%,100% { transform: translateX(-2px); opacity: .35 } 50% { transform: translateX(2px); opacity: 1 } }
    @keyframes hp-ripple { 0% { transform: scale(.85); opacity: .55 } 100% { transform: scale(1.9); opacity: 0 } }
    @keyframes hp-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
    .hp-pin { animation: hp-pop .22s cubic-bezier(.34,1.56,.64,1) both; transform-origin: 50% 100%; pointer-events: auto; cursor: pointer }
    .hp-pulse { transform-origin: 22px 20px; animation: hp-pulse 1.8s ease-out infinite }
    .hp-chev { animation: hp-chev 1s ease-in-out infinite }
    .hp-ripple { animation: hp-ripple 1.6s ease-out infinite }
    .hp-moving .hp-face { animation: hp-bob .9s ease-in-out infinite }
    .hp-tip { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.18); padding: 6px 9px; font: 500 11px/1.45 system-ui,sans-serif; color: #334155; max-width: 220px; white-space: normal }
    .hp-tip.leaflet-tooltip-top::before { border-top-color: #fff }
    .hp-tip .t { font-weight: 700; font-size: 11.5px; color: #0f172a }
    .hp-tip .s { color: #64748b }
    @media (prefers-reduced-motion: reduce) { .hp-pin, .hp-pulse, .hp-chev, .hp-ripple, .hp-moving .hp-face { animation: none !important } }
  `
  document.head.appendChild(el)
}

// ─── Job pin ─────────────────────────────────────────────────────────────────

/** Pin is 44 × 54 with its tip at (22, 52): the exact map point. */
export const JOB_PIN = { width: 44, height: 54, anchorX: 22, anchorY: 52 }

const BODY = 'M22 52C22 52 5 34 5 20A17 17 0 1 1 39 20C39 34 22 52 22 52Z'

const GLYPH: Record<Trade, (c: string) => string> = {
  hvac: (c) => `<path d="M22 11V29M14.2 15.5L29.8 24.5M14.2 24.5L29.8 15.5M19.6 12.4L22 14.6L24.4 12.4M19.6 27.6L22 25.4L24.4 27.6" stroke="${c}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  plumbing: (c) => `<path d="M22 10.5C22 10.5 14.5 19 14.5 23.5A7.5 7.5 0 0 0 29.5 23.5C29.5 19 22 10.5 22 10.5Z" fill="${c}"/>`,
  electrical: (c) => `<polygon points="24,9.5 15.5,22.5 21.3,22.5 19.5,31.5 28.5,17.5 22.7,17.5" fill="${c}"/>`,
  general: (c) => `<path d="M27.5 11.5a6 6 0 0 0-7.4 7.6L12.5 26.7a2.2 2.2 0 0 0 3.1 3.1l7.6-7.6a6 6 0 0 0 7.6-7.4l-3.4 3.4-3-1-1-3z" fill="${c}"/>`,
  agreement: (c) => `<path d="M30 17a8 8 0 0 0-14-3.2M14 23a8 8 0 0 0 14 3.2" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M16.5 10.5v4h4M27.5 29.5v-4h-4" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
}

/** Little stage symbols, centred on (0,0). */
const BADGE: Record<Stage, (c: string) => string> = {
  unassigned: (c) => `<text x="0" y="4.2" text-anchor="middle" font-size="12" font-weight="800" fill="${c}" font-family="system-ui,sans-serif">!</text>`,
  scheduled: (c) => `<circle r="4.6" fill="none" stroke="${c}" stroke-width="1.7"/><path d="M0 -2.4V0.2L2 1.4" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  enroute: (c) => `<path class="hp-chev" d="M-2.2 -3.4L2.2 0L-2.2 3.4" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  onsite: (c) => `<circle r="4.8" fill="none" stroke="${c}" stroke-width="1.6"/><circle r="2" fill="${c}"/>`,
  done: (c) => `<path d="M-3.4 .2L-1 2.8L3.6 -2.6" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  hold: (c) => `<rect x="-3.4" y="-3.6" width="2.4" height="7.2" rx="1" fill="${c}"/><rect x="1" y="-3.6" width="2.4" height="7.2" rx="1" fill="${c}"/>`,
}

function halo(u: Urgency): string {
  if (u === 'emergency') return `<circle class="hp-pulse" cx="22" cy="20" r="19" fill="#DC2626" opacity=".4"/>`
  if (u === 'high') return `<circle cx="22" cy="20" r="22" fill="none" stroke="#F97316" stroke-width="2.5" stroke-dasharray="4 3"/>`
  return ''
}

export function jobPinHtml(trade: Trade, stage: Stage, urgency: Urgency = 'normal', opts: { dim?: boolean } = {}): string {
  const color = TRADE_COLOR[trade]
  const open = stage === 'unassigned'
  const sc = STAGE_COLOR[stage]
  return `<div class="hp-pin" style="width:${JOB_PIN.width}px;height:${JOB_PIN.height}px;${opts.dim ? 'opacity:.55;' : ''}">
    <svg width="44" height="54" viewBox="0 0 44 54" style="overflow:visible;display:block">
      ${halo(urgency)}
      <ellipse cx="22" cy="52" rx="7" ry="2.2" fill="#000" opacity=".22"/>
      <path d="${BODY}" fill="${open ? '#fff' : color}" stroke="${open ? color : '#fff'}" stroke-width="${open ? 3 : 2.5}" ${open ? 'stroke-dasharray="5 3"' : ''} stroke-linejoin="round"/>
      ${GLYPH[trade](open ? color : '#fff')}
      <circle cx="35" cy="8" r="8.5" fill="#fff" stroke="${sc}" stroke-width="2.4"/>
      <g transform="translate(35 8)">${BADGE[stage](sc)}</g>
    </svg></div>`
}

// ─── Technician pin ──────────────────────────────────────────────────────────

/** Round photo with a ring of job slots. Tip of the pointer at (28, 66). */
export const TECH_PIN = { width: 56, height: 68, anchorX: 28, anchorY: 66 }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Round face: the photo if there is one, otherwise coloured initials. A broken photo falls back to initials. */
export function faceHtml(name: string, avatarUrl: string | null | undefined, size: number): string {
  const [from, to] = gradientForName(name || '?')
  const initials = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 ${Math.round(size * 0.38)}px system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,${from},${to})">${esc(initialsForName(name || '?'))}</div>`
  const photo = avatarUrl
    ? `<img src="${esc(avatarUrl)}" alt="" referrerpolicy="no-referrer" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.remove()" />`
    : ''
  return `<div class="hp-face" style="position:relative;width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;background:#1e293b">${initials}${photo}</div>`
}

export interface TechPinInput {
  name: string
  avatarUrl?: string | null
  /** Availability colour: green online, blue available, amber away, grey offline. */
  color: string
  /** Jobs booked today, and the daily limit: drawn as that many filled ring segments. */
  workload: number
  maxJobs: number
  moving?: boolean
  /** Direction of travel in degrees clockwise from north. */
  heading?: number | null
  stale?: boolean
}

export function techPinHtml(t: TechPinInput): string {
  const max = Math.max(1, Math.min(12, t.maxJobs || 1))
  const filled = Math.max(0, Math.min(max, t.workload))
  const r = 22
  const circ = 2 * Math.PI * r
  const seg = circ / max
  const full = filled >= max
  let ring = ''
  for (let i = 0; i < max; i++) {
    const on = i < filled
    ring += `<circle cx="28" cy="28" r="${r}" fill="none" stroke="${on ? (full ? '#EF4444' : t.color) : '#CBD5E1'}" stroke-width="4.5" stroke-dasharray="${Math.max(1, seg - (max > 1 ? 3 : 0))} ${circ}" stroke-dashoffset="${-i * seg}" transform="rotate(-90 28 28)"/>`
  }
  const arrow = t.moving && t.heading != null
    ? `<div style="position:absolute;left:0;top:0;width:56px;height:56px;transform:rotate(${Math.round(t.heading)}deg);transition:transform .6s ease"><svg width="56" height="56" viewBox="0 0 56 56"><path d="M28 -1L33.5 8H22.5Z" fill="${t.color}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>`
    : ''
  const ripple = t.moving ? `<div class="hp-ripple" style="position:absolute;left:3px;top:3px;width:50px;height:50px;border-radius:50%;border:2.5px solid ${t.color}"></div>` : ''
  return `<div class="hp-pin ${t.moving ? 'hp-moving' : ''}" style="position:relative;width:${TECH_PIN.width}px;height:${TECH_PIN.height}px;${t.stale ? 'opacity:.6;' : ''}">
    ${ripple}
    <svg width="56" height="68" viewBox="0 0 56 68" style="position:absolute;left:0;top:0;overflow:visible">
      <ellipse cx="28" cy="66" rx="7" ry="2" fill="#000" opacity=".22"/>
      <path d="M21 52.5L28 66L35 52.5Z" fill="${t.color}"/>
      ${ring}
      <circle cx="28" cy="28" r="18.5" fill="#fff"/>
    </svg>
    <div style="position:absolute;left:11px;top:11px">${faceHtml(t.name, t.avatarUrl, 34)}</div>
    ${arrow}
    <div style="position:absolute;right:1px;bottom:19px;width:13px;height:13px;border-radius:50%;background:${t.color};border:2.5px solid #fff"></div>
  </div>`
}

// ─── Movement ────────────────────────────────────────────────────────────────

/** Compass bearing in degrees (0 = north, clockwise) from one point to another. */
export function bearing(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const [lat1, lng1] = [toRad(from[0]), toRad(from[1])]
  const [lat2, lng2] = [toRad(to[0]), toRad(to[1])]
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

/** Straight-line distance in metres. Enough to tell a GPS wobble from real movement. */
export function metresBetween(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

import type { KelvinItem } from './types'

const WORDS = ['No things', 'One thing', 'Two things', 'Three things', 'Four things', 'Five things']
const partOfDay = (d: Date) => (d.getHours() < 12 ? 'morning' : d.getHours() < 17 ? 'afternoon' : 'evening')
const join = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)

export function greeting({ items, unavailable, name, now, state = 'ready' }: {
  items: KelvinItem[]; unavailable: string[]; name?: string; now: Date; state?: 'ready' | 'loading' | 'offline'
}) {
  const hello = `Good ${partOfDay(now)}${name ? `, ${name.trim().split(/\s+/)[0]}` : ''}.`
  if (state === 'offline') return { line: `${hello} I can't check anything right now.`, sub: "I'm offline. Your pages still work; I'll be back as soon as I can." }
  if (state === 'loading') return { line: `${hello} Let me look…`, sub: '' }
  const needs = items.filter(i => i.urgency !== 'quiet').length
  if (needs > 0) {
    const n = needs < WORDS.length ? WORDS[needs] : `${needs} things`
    return {
      line: `${hello} ${n} ${needs === 1 ? 'needs' : 'need'} you.`,
      sub: unavailable.length ? `Couldn't check ${join(unavailable)} just now.` : 'Everything else is on track.',
    }
  }
  if (unavailable.length) return { line: `${hello} I couldn't check everything just now.`, sub: `Couldn't check ${join(unavailable)}. I'll try again in a minute.` }
  return { line: `${hello} Nothing needs you right now.`, sub: "I'll tell you when something does." }
}

export function suggestions(role: string, now: Date): string[] {
  const money = ['super_admin', 'company_admin', 'office_manager'].includes(role.toLowerCase())
  const h = now.getHours()
  const first = h < 12 ? "Who's free this morning?" : h < 15 ? "Who's free this afternoon?" : "What's on tomorrow?"
  return [first, 'Create a job', money ? 'Which invoices are overdue?' : "What's running late?"]
}

/** "2 minutes ago", for "Found by Kelvin". Empty when the time can't be read. */
export function ago(iso: string, now = new Date()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const s = Math.max(0, (now.getTime() - t) / 1000)
  const n = (v: number, unit: string) => `${v} ${unit}${v === 1 ? '' : 's'} ago`
  if (s < 45) return 'just now'
  if (s < 3600) return n(Math.max(1, Math.round(s / 60)), 'minute')
  if (s < 86400) return n(Math.round(s / 3600), 'hour')
  return n(Math.round(s / 86400), 'day')
}

import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { m } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { useKelvin } from './KelvinProvider'
import KelvinFace from './KelvinFace'
import KelvinMemory from './KelvinMemory'
import { fetchToday } from './api'
import { byLine, greeting, suggestions } from './desk'
import type { KelvinItem } from './types'

const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase()

export default function KelvinDesk() {
  const k = useKelvin()
  const { user } = useAuth()
  const [ask, setAsk] = useState('')
  const since = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString() }, [])
  const today = useQuery({ queryKey: ['kelvin', 'today', since], queryFn: () => fetchToday(since), enabled: k.enabled, refetchInterval: 60_000 })
  const items = k.feed?.items ?? []
  const needs = items.filter(i => i.urgency !== 'quiet')
  const quiet = items.filter(i => i.urgency === 'quiet')
  useEffect(() => { if (items.length) k.markSeen(items.map(i => i.id)) }, [items.map(i => i.id).join()]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!k.enabled) return <Navigate to="/" replace />
  const g = greeting({ items, unavailable: k.unavailable, name: user?.name, now: new Date(), state: k.feedState })

  return (
    <div className="kv-desk">
      <header className="kv-desk-hello">
        <KelvinFace size={72} mood={k.mood} follow="everywhere" />
        <div>
          <h1>{g.line}</h1>
          <p>{g.sub}</p>
        </div>
      </header>

      <form className="kv-desk-ask" onSubmit={e => { e.preventDefault(); if (ask.trim()) { k.openPanel(ask.trim()); setAsk('') } }}>
        <input value={ask} onChange={e => setAsk(e.target.value)} placeholder="Ask Kelvin, or tell him what to do…" aria-label="Ask Kelvin" />
        <button type="submit" className="ops-btn ops-btn-primary" disabled={!ask.trim()}>Ask</button>
      </form>
      <div className="kv-starters">
        {suggestions(String(user?.role ?? ''), new Date()).map(s => <button key={s} type="button" className="kv-chip" onClick={() => k.openPanel(s)}>{s}</button>)}
      </div>

      <div className="kv-desk-cols">
        <section aria-labelledby="kv-needs">
          <h2 id="kv-needs">Needs you</h2>
          {needs.length === 0 && <p className="kv-empty">{
            k.feedState === 'offline' ? "I couldn't check anything just now."
              : k.feedState === 'loading' ? 'Checking…'
              : k.unavailable.length ? "I couldn't check everything. Nothing found in what I could." : 'Nothing right now.'}</p>}
          <ul className="kv-list">{needs.map(i => <DeskItem key={i.id} item={i} />)}</ul>
          {quiet.length > 0 && (
            <>
              <h3 className="kv-sub">For your information</h3>
              <ul className="kv-list">{quiet.map(i => <DeskItem key={i.id} item={i} />)}</ul>
            </>
          )}
        </section>
        <section aria-labelledby="kv-done">
          <h2 id="kv-done">Done today</h2>
          {today.isError && <p className="kv-empty">Couldn't load today's log just now.</p>}
          {today.data?.length === 0 && <p className="kv-empty">Nothing yet today. Ask me to do something and it shows here.</p>}
          <ol className="kv-log">
            {(today.data ?? []).map((e, n) => (
              <li key={n} className={`is-${e.type.toLowerCase()}`}>
                <time>{clock(e.createdAt)}</time>
                <span>{e.type === 'SPOKE' ? `Told you: ${e.summary}` : e.type === 'ACTION_FAILED' ? `Couldn't finish: ${e.summary}` : e.summary}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <KelvinMemory />
    </div>
  )
}

function DeskItem({ item }: { item: KelvinItem }) {
  const k = useKelvin()
  return (
    <m.li layout className={`kv-item is-${item.urgency}`} data-kelvin-item={item.id}>
      {item.urgency === 'urgent' && <span className="kv-item-tag">Urgent</span>}
      <p className="kv-item-title">{item.title}</p>
      {item.why && <p className="kv-item-why">{item.why}</p>}
      <span className="kv-heatline" aria-hidden="true" />
      <p className="kv-by">{byLine(item)}</p>
      <div className="kv-item-fixes">
        {item.fixes.map(f => <button key={f.request} type="button" className="ops-btn ops-btn-sm" onClick={() => k.applyFix(item, f)}>{f.label}</button>)}
        <button type="button" className="kv-link" onClick={() => k.dismiss(item)}>Dismiss</button>
      </div>
    </m.li>
  )
}

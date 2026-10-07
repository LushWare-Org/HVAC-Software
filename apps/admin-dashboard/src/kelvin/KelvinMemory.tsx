import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, m } from 'motion/react'
import { useAuth } from '../contexts/AuthContext'
import { useKelvin } from './KelvinProvider'
import { fetchMind, forgetNote, removeRoutine } from './api'
import { routineWhen } from './memory'

const LEADS = ['super_admin', 'company_admin', 'office_manager']
const KEY = ['kelvin', 'mind']

/** What Kelvin keeps in mind, and his routines. Things are added by asking him; removed here. */
export default function KelvinMemory() {
  const k = useKelvin()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const mind = useQuery({ queryKey: KEY, queryFn: fetchMind, enabled: k.enabled, staleTime: 30_000 })
  const done = { onSuccess: () => { setError(null); void qc.invalidateQueries({ queryKey: KEY }) }, onError: () => setError("That couldn't be removed just now. Try again.") }
  const forget = useMutation({ mutationFn: forgetNote, ...done })
  const stop = useMutation({ mutationFn: removeRoutine, ...done })
  const lead = LEADS.includes(String(user?.role ?? '').toLowerCase())
  const notes = mind.data?.notes ?? []
  const routines = mind.data?.routines ?? []

  return (
    <div className="kv-desk-cols kv-memory">
      <section aria-labelledby="kv-mem-notes">
        <h2 id="kv-mem-notes">What I remember</h2>
        {mind.isError && <p className="kv-empty">Couldn't load what I remember just now.</p>}
        {mind.isSuccess && notes.length === 0 && (
          <p className="kv-empty">Nothing yet. Tell me "remember that R&amp;R Brothers always want Kasun" and I'll keep it in mind.</p>
        )}
        <ul className="kv-mem-list">
          <AnimatePresence initial={false}>
            {notes.map(n => (
              <m.li key={n.id} layout exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
                <span className="kv-mem-text">{n.text}</span>
                <span className="kv-mem-meta">{n.forEveryone ? `For everyone${n.createdByName ? `, added by ${n.createdByName}` : ''}` : 'Just for you'}</span>
                {(!n.forEveryone || lead) && (
                  <button type="button" className="kv-link" disabled={forget.isPending} onClick={() => forget.mutate(n.id)} aria-label={`Forget: ${n.text}`}>Forget</button>
                )}
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
      <section aria-labelledby="kv-mem-routines">
        <h2 id="kv-mem-routines">Routines</h2>
        {mind.isSuccess && routines.length === 0 && (
          <p className="kv-empty">None yet. Try "every weekday at 8, chase invoices over 30 days overdue". I bring it up here at that time, ready to run.</p>
        )}
        <ul className="kv-mem-list">
          <AnimatePresence initial={false}>
            {routines.map(r => (
              <m.li key={r.id} layout exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
                <span className="kv-mem-text">{r.request}</span>
                <span className="kv-mem-meta">{routineWhen(r.days, r.time)}</span>
                <span className="kv-mem-actions">
                  <button type="button" className="kv-link" onClick={() => k.openPanel(r.request)}>Run now</button>
                  <button type="button" className="kv-link" disabled={stop.isPending} onClick={() => stop.mutate(r.id)} aria-label={`Stop routine: ${r.request}`}>Stop</button>
                </span>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
        {error && <p className="kv-empty" role="alert">{error}</p>}
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { ShieldCheck, Check, X, Minus, Mail, RotateCcw } from 'lucide-react'
import KelvinFace from './KelvinFace'
import { countdown } from './plan'
import type { ActionCardData, StepOutcome } from './chatStream'

/** Ticks once a second while an undo countdown is showing. */
function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  return now
}

const ICON: Record<StepOutcome['status'], React.ReactNode> = {
  done: <Check size={14} aria-label="Done" />,
  failed: <X size={14} aria-label="Failed" />,
  skipped: <Minus size={14} aria-label="Skipped" />,
  not_run: <Minus size={14} aria-label="Not run" />,
}

/**
 * A change Kelvin prepared. Nothing happens until Confirm. A plan lists its steps
 * with tick boxes; after it runs, each step shows what happened and the card
 * offers Undo for 10 minutes. While it runs, his ring heats up.
 */
export default function ActionCard({ card, onConfirm, onCancel, onToggle, onTickAll, onUndo, onRetry }: {
  card: ActionCardData
  onConfirm: (c: ActionCardData) => void
  onCancel: (c: ActionCardData) => void
  onToggle?: (c: ActionCardData, n: number, on: boolean) => void
  onTickAll?: (c: ActionCardData, on: boolean) => void
  onUndo?: (c: ActionCardData) => void
  onRetry?: (c: ActionCardData) => void
}) {
  const mood = card.state === 'running' ? 'thinking' : card.state === 'done' ? 'pleased' : card.state === 'failed' ? 'urgent' : 'idle'
  const progress = card.state === 'running' ? null : card.state === 'done' || card.state === 'failed' ? 1 : undefined
  const left = countdown(card.undo?.expiresAt, useNow(!!card.undo))
  const ticked = new Set(card.ticked ?? [])
  const outcome = (n: number) => card.outcome?.find(o => o.n === n)
  const sendsTicked = card.steps?.some(s => s.sends && ticked.has(s.n))
  const count = card.steps ? ticked.size : 1
  const notRun = card.outcome?.some(o => o.status === 'not_run')
  const many = (card.steps?.length ?? 0) > 3
  const allTicked = !!card.steps && ticked.size === card.steps.length

  return (
    <div className={`kv-card is-${card.state}${card.isUndo ? ' is-undo' : ''}`} role="group" aria-label={card.title}>
      {card.state === 'running' && <span className="kv-card-heat" aria-hidden="true" />}
      <div className="kv-card-head">
        <KelvinFace size={20} mood={mood} progress={progress} />
        <span className="kv-card-title">{card.title}</span>
      </div>

      {card.steps && many && card.state === 'pending' && onTickAll && (
        <div className="kv-steps-head">
          <span>{ticked.size} of {card.steps.length} ticked</span>
          <button type="button" className="kv-link" onClick={() => onTickAll(card, !allTicked)}>{allTicked ? 'Untick all' : 'Tick all'}</button>
        </div>
      )}
      {card.steps ? (
        <ol className={`kv-steps${many ? ' is-many' : ''}`}>
          {card.steps.map(st => {
            const o = outcome(st.n)
            return (
              <li key={st.n} className={`kv-step${o ? ` is-${o.status}` : ''}${!o && !ticked.has(st.n) ? ' is-off' : ''}`}>
                {card.state === 'pending' ? (
                  <input type="checkbox" checked={ticked.has(st.n)} onChange={e => onToggle?.(card, st.n, e.target.checked)} aria-label={`Include step ${st.n}: ${st.title}`} />
                ) : (
                  <span className="kv-step-mark" aria-hidden={!o}>{o ? ICON[o.status] : st.n}</span>
                )}
                <div className="kv-step-body">
                  <span className="kv-step-title">{st.title}</span>
                  {st.lines.length > 0 && <span className="kv-step-lines">{st.lines.join(' · ')}</span>}
                  {st.sends && <span className="kv-step-sends"><Mail size={12} aria-hidden="true" /> {st.sends}</span>}
                  {o?.status === 'failed' && o.message && <span className="kv-step-error">{o.message}</span>}
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <ul className="kv-card-lines">{card.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      )}
      {card.notes?.length ? <ul className="kv-card-notes">{card.notes.map((n, i) => <li key={i}>{n}</li>)}</ul> : null}

      {card.state === 'pending' && (
        <>
          <p className="kv-card-note">
            <ShieldCheck size={13} aria-hidden="true" />
            {sendsTicked ? 'Nothing changes until you confirm. Steps marked ✉ reach the customer and can\'t be undone.' : 'Nothing changes until you confirm'}
          </p>
          <div className="kv-card-actions">
            <button type="button" className="ops-btn ops-btn-primary" onClick={() => onConfirm(card)} disabled={count === 0}>
              {card.isUndo ? 'Undo' : card.steps && card.steps.length > 1 ? `Confirm ${count} step${count === 1 ? '' : 's'}` : 'Confirm'}
            </button>
            <button type="button" className="ops-btn" onClick={() => onCancel(card)}>Cancel</button>
          </div>
        </>
      )}
      {card.state === 'running' && <p className="kv-card-status" role="status">Working on it…</p>}
      {(card.state === 'done' || card.state === 'failed') && <p className={`kv-card-status is-${card.state}`} role="status">{card.result}</p>}
      {card.cantUnsend?.length ? <p className="kv-card-note">Can't be unsent: {card.cantUnsend.join(', ')}</p> : null}
      {(card.state === 'done' || card.state === 'failed') && (left || (notRun && onRetry)) && (
        <div className="kv-card-actions">
          {left && <button type="button" className="ops-btn" onClick={() => onUndo?.(card)}><RotateCcw size={14} aria-hidden="true" /> Undo ({left})</button>}
          {notRun && onRetry && <button type="button" className="ops-btn" onClick={() => onRetry(card)}>Retry from here</button>}
        </div>
      )}
      {card.state === 'cancelled' && <p className="kv-card-status" role="status">Cancelled. Nothing was changed.</p>}
    </div>
  )
}

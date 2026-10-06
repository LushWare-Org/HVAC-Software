import { ShieldCheck } from 'lucide-react'
import KelvinFace from './KelvinFace'
import type { ActionCardData } from './chatStream'

/** A change Kelvin prepared. Nothing happens until Confirm. While it runs, his ring heats up. */
export default function ActionCard({ card, onConfirm, onCancel }: {
  card: ActionCardData
  onConfirm: (c: ActionCardData) => void
  onCancel: (c: ActionCardData) => void
}) {
  const mood = card.state === 'running' ? 'thinking' : card.state === 'done' ? 'pleased' : card.state === 'failed' ? 'urgent' : 'idle'
  const progress = card.state === 'running' ? null : card.state === 'done' || card.state === 'failed' ? 1 : undefined
  return (
    <div className={`kv-card is-${card.state}`} role="group" aria-label={card.title}>
      {card.state === 'running' && <span className="kv-card-heat" aria-hidden="true" />}
      <div className="kv-card-head">
        <KelvinFace size={20} mood={mood} progress={progress} />
        <span className="kv-card-title">{card.title}</span>
      </div>
      <ul className="kv-card-lines">{card.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      {card.state === 'pending' && (
        <>
          <p className="kv-card-note"><ShieldCheck size={13} aria-hidden="true" /> Nothing changes until you confirm</p>
          <div className="kv-card-actions">
            <button type="button" className="ops-btn ops-btn-primary" onClick={() => onConfirm(card)}>Confirm</button>
            <button type="button" className="ops-btn" onClick={() => onCancel(card)}>Cancel</button>
          </div>
        </>
      )}
      {card.state === 'running' && <p className="kv-card-status" role="status">Working on it…</p>}
      {(card.state === 'done' || card.state === 'failed') && <p className={`kv-card-status is-${card.state}`} role="status">{card.result}</p>}
      {card.state === 'cancelled' && <p className="kv-card-status" role="status">Cancelled. Nothing was changed.</p>}
    </div>
  )
}

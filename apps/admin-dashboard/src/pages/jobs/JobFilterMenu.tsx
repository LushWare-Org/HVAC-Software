/**
 * A filter you open from a button: pick one or several options, each drawn with
 * the same label used in the table (status symbol, priority bars, technician photo).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import './jobsTable.css'

export interface FilterOption {
  value: string
  /** How the option looks (the table's own label). */
  node: ReactNode
  /** A short plain-text form for the button once chosen. */
  text: string
  count?: number
}

export default function JobFilterMenu({ label, options, selected, onChange }: {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])

  const chosen = options.filter(o => selected.includes(o.value))
  const summary = !chosen.length ? 'All' : chosen.length === 1 ? chosen[0].text : `${chosen.length} chosen`
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])

  return (
    <div className="jf" ref={box}>
      <button type="button" className={`jf-btn${chosen.length ? ' has-value' : ''}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {label} <b>{summary}</b> <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="jf-pop" role="listbox" aria-label={label} aria-multiselectable="true">
          {options.map(o => {
            const on = selected.includes(o.value)
            return (
              <button key={o.value} type="button" role="option" aria-selected={on} className={`jf-opt${on ? ' is-on' : ''}`} onClick={() => toggle(o.value)}>
                <span className="jf-box">{on && <Check size={11} strokeWidth={3} />}</span>
                {o.node}
                {o.count !== undefined && <span className="jf-count">{o.count}</span>}
              </button>
            )
          })}
          {!options.length && <div style={{ padding: 12, fontSize: 13, color: 'var(--t3)' }}>Nothing to filter yet.</div>}
          {chosen.length > 0 && (
            <div className="jf-foot"><span>{chosen.length} chosen</span><button type="button" onClick={() => onChange([])}>Clear</button></div>
          )}
        </div>
      )}
    </div>
  )
}

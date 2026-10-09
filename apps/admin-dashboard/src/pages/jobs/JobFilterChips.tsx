/**
 * A row of filters that are all visible at once: click one to apply it, click again to
 * remove it. Several can be on together. Each chip wears the same label the table uses
 * and shows how many jobs it would match in this tab.
 */
import type { FilterOption } from './JobFilterMenu'
import './jobsTable.css'

export default function JobFilterChips({ label, options, selected, onChange, loading }: {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (next: string[]) => void
  loading?: boolean
}) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  return (
    <div className="jc-row" role="group" aria-label={`Filter by ${label.toLowerCase()}`}>
      <span className="jc-label">{label}</span>
      {options.map(o => {
        const on = selected.includes(o.value)
        return (
          <button
            key={o.value} type="button" aria-pressed={on}
            className={`jc-chip${on ? ' is-on' : ''}${!o.count && !on ? ' is-empty' : ''}`}
            onClick={() => toggle(o.value)}
          >
            {o.node}
            <span className="jc-n">{loading ? '…' : o.count ?? 0}</span>
          </button>
        )
      })}
      {selected.length > 0 && <button type="button" className="jc-clear" onClick={() => onChange([])}>Clear</button>}
    </div>
  )
}

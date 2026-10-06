/**
 * What is going wrong right now, with fixes one click away. Each fix asks the
 * assistant, which shows exactly what will change and waits for Confirm.
 * Renders nothing on a day that is running to plan.
 */
import { useDisruptions, type Disruption } from '../../hooks/useDisruptions'
import { askAssistant } from '../../lib/assistant'

const KIND_LABEL: Record<Disruption['kind'], string> = {
  LATE_START: 'Late start',
  LATE_ARRIVAL: 'Arriving late',
  OVERRUN: 'Running over',
  TECH_OFF: 'Technician off',
}

export default function RunningBehind() {
  const { data } = useDisruptions()
  const items = data?.disruptions ?? []
  if (!items.length) return null

  return (
    <section className="ops-panel brief" aria-labelledby="running-behind">
      <header className="brief-head rb-head">
        <div className="brief-headline-wrap">
          <h2 id="running-behind" className="brief-headline">
            {items.length === 1 ? '1 visit needs attention' : `${items.length} visits need attention`}
          </h2>
          <p className="brief-yesterday">Checked against live GPS and today's schedule. Each fix shows you exactly what changes before it happens.</p>
        </div>
      </header>
      <ul className="brief-rows">
        {items.map(d => (
          <li key={`${d.kind}-${d.jobId}`} className="brief-row" style={{ ['--tone' as string]: d.kind === 'TECH_OFF' || d.delayMins >= 30 ? 'var(--red)' : 'var(--amber)' }}>
            <span className="brief-tag">{KIND_LABEL[d.kind]}</span>
            <div className="brief-body">
              <p className="brief-title">{d.detail}</p>
              {d.knockOn.length > 1 && (
                <ul className="brief-examples">
                  {d.knockOn.slice(1, 4).map(k => <li key={k.jobId}>{k.jobNumber}{k.customer ? `, ${k.customer}` : ''}<span>about {k.delayMins} min late</span></li>)}
                </ul>
              )}
              {d.options.length > 0 && (
                <div className="rb-options">
                  {d.options.map(o => (
                    <button key={o.request} type="button" className="ops-btn ops-btn-sm rb-option" onClick={() => askAssistant(o.request)} title="Opens the assistant to confirm">
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

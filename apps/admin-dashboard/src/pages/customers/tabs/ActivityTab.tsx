/**
 * Activity tab — single synthetic "Customer Created" event (no DB activity
 * log exists yet). Restyled only, same data source as before.
 */
import { Activity, Plus } from 'lucide-react'
import { SectionLabel } from '../shared'

export default function ActivityTab({ createdAt, source }: { createdAt: string; source?: string | null }) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const events = [{
    id: 'created', icon: Plus, color: 'var(--blue)',
    label: 'Customer Created',
    desc: source ? `Customer added via ${source}.` : 'Customer added manually.',
    time: fmt(createdAt),
  }]

  return (
    <div>
      <SectionLabel icon={Activity}>Activity Timeline</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {events.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--t4)', textAlign: 'center', padding: '32px 0' }}>No activity recorded yet.</p>
        ) : events.map(item => {
          const Icon = item.icon
          return (
            <div key={item.id} style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <Icon size={14} />
              </div>
              <div style={{ flex: 1, padding: 12, borderRadius: 11, border: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{item.label}</span>
                  <time style={{ fontSize: 11, color: 'var(--t4)' }}>{item.time}</time>
                </div>
                <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

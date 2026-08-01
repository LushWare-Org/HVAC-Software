/**
 * My Service Plans — the customer's agreements: what's included, visits used,
 * next scheduled service, and renewal state.
 */
import { ShieldCheck, CalendarDays, Loader2, CheckCircle2, Clock, RefreshCw, Infinity as InfinityIcon, Home } from 'lucide-react'
import { useMyAgreements, type MyAgreement } from '../hooks/useMyAgreements'
import { useMyHouses } from '../hooks/useMyHouse'
import { formatMoney } from '../lib/format'

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const fmtMoney = (v?: string | number | null) =>
  v != null && v !== '' ? formatMoney(v) : null

const INTERVALS: Record<string, string> = {
  MONTHLY: 'every month', BI_MONTHLY: 'every 2 months', QUARTERLY: 'every 3 months',
  BI_ANNUAL: 'twice a year', ANNUAL: 'once a year',
}

function frequencyText(a: MyAgreement): string | null {
  if (!a.serviceInterval) return null
  if (a.serviceInterval === 'CUSTOM') return a.serviceIntervalDays ? `every ${a.serviceIntervalDays} days` : null
  return INTERVALS[a.serviceInterval] ?? null
}

const STATUS_META: Record<MyAgreement['status'], { label: string; color: string; bg: string }> = {
  DRAFT:           { label: 'Being prepared', color: 'var(--t3)', bg: 'var(--bg-card-2)' },
  SENT:            { label: 'Waiting for your confirmation', color: 'var(--blue)', bg: 'var(--blue-dim, var(--bg-card-2))' },
  ACTIVE:          { label: 'Active', color: 'var(--green)', bg: 'var(--green-dim, var(--bg-card-2))' },
  PENDING_RENEWAL: { label: 'Renewal due', color: 'var(--amber)', bg: 'var(--amber-dim, var(--bg-card-2))' },
  RENEWED:         { label: 'Renewed', color: 'var(--t3)', bg: 'var(--bg-card-2)' },
  EXPIRED:         { label: 'Expired', color: 'var(--red)', bg: 'var(--red-dim, var(--bg-card-2))' },
  CANCELLED:       { label: 'Cancelled', color: 'var(--red)', bg: 'var(--red-dim, var(--bg-card-2))' },
}

function VisitBar({ a }: { a: MyAgreement }) {
  if (a.visitsIncluded == null) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t3)' }}>
        <InfinityIcon size={14} /> Unlimited visits
      </span>
    )
  }
  const pct = Math.min(1, a.visitsUsed / a.visitsIncluded)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>
        <span>Visits used</span>
        <span style={{ fontWeight: 600, color: 'var(--t2)' }}>{a.visitsUsed} of {a.visitsIncluded}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-card-2)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct * 100}%`, borderRadius: 4,
          background: pct >= 1 ? 'var(--amber)' : 'var(--green)',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function AgreementCard({ a, houseLabel }: { a: MyAgreement; houseLabel?: string }) {
  const meta = STATUS_META[a.status]
  const freq = frequencyText(a)
  const money = fmtMoney(a.value)

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{a.name}</h3>
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {a.serviceType && <span>{a.serviceType}{freq ? ` — ${freq}` : ''}</span>}
            {houseLabel && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
                color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 7px', borderRadius: 999,
              }}>
                <Home size={9} /> {houseLabel}
              </span>
            )}
          </p>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          color: meta.color, background: meta.bg, whiteSpace: 'nowrap',
        }}>
          {meta.label}
        </span>
      </div>

      {(a.serviceInterval || a.visitsIncluded != null) && (
        <div style={{ marginBottom: 14 }}><VisitBar a={a} /></div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: a.description ? 12 : 0 }}>
        {a.nextServiceDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <CalendarDays size={15} style={{ color: 'var(--blue)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>Next service</p>
              <p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{fmtDate(a.nextServiceDate)}</p>
            </div>
          </div>
        )}
        {a.lastServiceDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>Last service</p>
              <p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{fmtDate(a.lastServiceDate)}</p>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Clock size={15} style={{ color: 'var(--t3)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>Plan period</p>
            <p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{fmtDate(a.startDate)} – {fmtDate(a.endDate)}</p>
          </div>
        </div>
        {money && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <ShieldCheck size={15} style={{ color: 'var(--t3)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>Plan price</p>
              <p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                {money}{a.billingCycle && a.billingCycle !== 'UPFRONT' ? ` · billed ${a.billingCycle.toLowerCase()}` : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {a.description && (
        <p style={{
          fontSize: 13, color: 'var(--t2)', whiteSpace: 'pre-wrap', lineHeight: 1.55,
          borderTop: '1px solid var(--bd)', paddingTop: 12, margin: 0,
        }}>
          {a.description}
        </p>
      )}

      {a.status === 'PENDING_RENEWAL' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
          padding: '10px 12px', borderRadius: 8, background: 'var(--amber-dim, var(--bg-card-2))',
          fontSize: 13, color: 'var(--amber)',
        }}>
          <RefreshCw size={14} />
          This plan is up for renewal — we'll email you the new terms, or call the office to renew now.
        </div>
      )}
      {a.status === 'SENT' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
          padding: '10px 12px', borderRadius: 8, background: 'var(--blue-dim, var(--bg-card-2))',
          fontSize: 13, color: 'var(--blue)',
        }}>
          <Clock size={14} />
          Check your email — we've sent you this plan to review and confirm.
        </div>
      )}
    </div>
  )
}

export default function Agreements() {
  const { data, isLoading } = useMyAgreements()
  const agreements = (data?.data ?? []).filter(a => a.status !== 'DRAFT' && a.status !== 'RENEWED')
  const { data: houses } = useMyHouses()
  const houseLabelById = new Map((houses ?? []).map(h => [h.id, h.label]))

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--canvas-t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} style={{ color: 'var(--blue)' }} /> My Service Plans
        </h1>
        <p style={{ fontSize: 13, color: 'var(--canvas-t2)', margin: '4px 0 0' }}>
          Your maintenance agreements — coverage, visits, and upcoming service
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
        </div>
      ) : agreements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--t3)' }}>
          <ShieldCheck size={36} style={{ marginBottom: 12, opacity: 0.35 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No service plans yet</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>
            Ask us about a maintenance plan — scheduled visits, priority service, and no surprises.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
          {agreements.map(a => <AgreementCard key={a.id} a={a} houseLabel={a.houseId ? houseLabelById.get(a.houseId) : undefined} />)}
        </div>
      )}
    </div>
  )
}

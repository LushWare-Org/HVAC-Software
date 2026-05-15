import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Megaphone, BarChart3, Layout, Users, Settings, Shield,
  Send, Mail, MessageSquare, Check, Loader2, AlertCircle,
  Plus, Trash2, RefreshCw, Play, Save,
  Eye, MousePointer, Star, Wrench, Heart, TrendingUp, Filter, CalendarDays, Clock,
} from 'lucide-react'
import {
  useMarketingKpis, useCampaignStats, useCampaigns, useCreateCampaign, useLaunchCampaign,
  useMarketingTemplates, useSeedDefaultTemplates, useDeleteTemplate, useCreateTemplate,
  useAudiences, useCreateAudience, useDeleteAudience, useAudiencePreviewCount,
  useMarketingSettings, useUpdateMarketingSettings,
  useDeletionLog, useDeleteCustomerMarketingData,
  useAttributionStats,
  type StatsRange, type MarketingSettings,
} from '../../hooks/useMarketing'
import { useToast } from '../../contexts/ToastContext'

// ── Shared Toggle ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      type="button"
      aria-label="Toggle"
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none',
        background: checked ? 'var(--blue)' : 'var(--bd-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color var(--dur)',
        display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0,
      }}
    >
      <div style={{
        width: 20, height: 16, borderRadius: 10, background: 'white',
        transition: 'transform var(--dur)',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        boxShadow: 'var(--shadow-sm)',
      }} />
    </button>
  )
}

// ── Channel badge ────────────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: 'EMAIL' | 'SMS' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600,
      background: channel === 'EMAIL' ? 'var(--blue-glow)' : 'var(--violet-dim)',
      color: channel === 'EMAIL' ? 'var(--blue)' : 'var(--violet)',
    }}>
      {channel === 'EMAIL' ? <Mail size={10} /> : <MessageSquare size={10} />}
      {channel}
    </span>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    DRAFT:     { bg: 'var(--bg-card-2)', color: 'var(--t3)' },
    SCHEDULED: { bg: 'var(--amber-dim)', color: 'var(--amber)' },
    SENDING:   { bg: 'var(--blue-glow)', color: 'var(--blue)' },
    SENT:      { bg: 'var(--green-dim)', color: 'var(--green)' },
    PAUSED:    { bg: 'var(--red-dim)',   color: 'var(--red)' },
  }
  const style = map[status] ?? map.DRAFT
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600,
      background: style.bg, color: style.color,
    }}>
      {status}
    </span>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, grad, icon: Icon,
}: {
  label: string; value: string | number; sub?: string; grad: string; icon: React.ElementType
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        <div className={`kpi-icon-box ${grad}`} style={{ color: 'white' }}>
          <Icon size={14} color="white" />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
    </div>
  )
}

// ── Empty ────────────────────────────────────────────────────────────────────
function Empty({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--t3)' }}>
      <Icon size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  )
}

// ── Pct helper ───────────────────────────────────────────────────────────────
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

// ── DateTimePicker ────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function DateTimePicker({ value, onChange, min, placeholder = 'Pick date & time' }: {
  value: string; onChange: (v: string) => void; min?: string; placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth() : new Date().getMonth())
  const [selDate, setSelDate] = useState(() => value ? value.slice(0, 10) : '')
  const [hour, setHour] = useState(() => value ? parseInt(value.slice(11, 13)) || 9 : 9)
  const [minute, setMinute] = useState(() => value ? Math.round(parseInt(value.slice(14, 16)) / 15) * 15 % 60 : 0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const minDate = min ? min.slice(0, 10) : ''
  const today = new Date().toISOString().slice(0, 10)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const emit = (date: string, h: number, m: number) => {
    if (!date) return
    onChange(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  const selectDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (minDate && dateStr < minDate) return
    setSelDate(dateStr)
    emit(dateStr, hour, minute)
  }

  const changeHour = (delta: number) => { const h = (hour + delta + 24) % 24; setHour(h); emit(selDate, h, minute) }
  const changeMinute = (delta: number) => { const m = (minute + delta + 60) % 60; setMinute(m); emit(selDate, hour, m) }

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

  const displayVal = selDate
    ? `${new Date(`${selDate}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}  ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    : ''

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)} className="form-input"
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', justifyContent: 'space-between', textAlign: 'left', width: '100%' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: displayVal ? 'var(--t1)' : 'var(--t4)' }}>
          <CalendarDays size={13} style={{ color: 'var(--blue)', flexShrink: 0 }} />
          {displayVal || placeholder}
        </span>
        {value && (
          <span onClick={e => { e.stopPropagation(); onChange(''); setSelDate('') }}
            style={{ fontSize: 16, lineHeight: 1, color: 'var(--t3)', cursor: 'pointer', paddingInline: 2 }}>×</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
          background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-lg)', padding: 16, minWidth: 272,
        }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={prevMonth} style={{ fontSize: 16 }}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={nextMonth} style={{ fontSize: 16 }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--t3)', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 12 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />
              const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSel = ds === selDate
              const isDisabled = !!(minDate && ds < minDate)
              const isToday = ds === today
              return (
                <button key={idx} type="button" disabled={isDisabled} onClick={() => selectDay(day)} style={{
                  width: '100%', aspectRatio: '1', borderRadius: 6, border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: isToday ? 700 : 400,
                  background: isSel ? 'var(--blue)' : isToday ? 'var(--blue-glow)' : 'transparent',
                  color: isSel ? 'white' : isDisabled ? 'var(--t4)' : isToday ? 'var(--blue)' : 'var(--t1)',
                  opacity: isDisabled ? 0.4 : 1,
                }}>
                  {day}
                </button>
              )
            })}
          </div>

          {/* Time stepper */}
          <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Clock size={11} style={{ color: 'var(--t3)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              {([['hour', hour, changeHour, 1], ['minute', minute, changeMinute, 15]] as const).map(([key, val, change, step]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => change(step)} style={{ fontSize: 14, padding: '2px 10px', lineHeight: 1 }}>▲</button>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', minWidth: 36, textAlign: 'center' }}>{String(val).padStart(2, '0')}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => change(-step)} style={{ fontSize: 14, padding: '2px 10px', lineHeight: 1 }}>▼</button>
                </div>
              ))}
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--t3)', marginBottom: 2 }}>:</span>
            </div>
          </div>

          <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}

// ── LaunchModal ───────────────────────────────────────────────────────────────
function LaunchModal({ campaign, onConfirm, onClose, isPending }: {
  campaign: { id: string; name: string; channel: string }
  onConfirm: () => void; onClose: () => void; isPending: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    }}>
      <div className="card anim-fade-up" style={{ width: 440, maxWidth: '90vw', padding: 0, overflow: 'hidden' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Play size={16} style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <div className="card-title">Launch Campaign</div>
              <div className="card-subtitle">Messages will be queued immediately</div>
            </div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>{campaign.name}</p>
            <ChannelBadge channel={campaign.channel as 'EMAIL' | 'SMS'} />
          </div>
          {isPending ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Loader2 size={28} className="spin" style={{ color: 'var(--blue)', marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Queuing messages…</p>
              <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Suppression checks and frequency caps are applied per recipient</p>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
              All audience members will be queued for delivery. Suppression lists and frequency caps are enforced automatically. This action cannot be undone.
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
          <button className="btn btn-sm" onClick={onConfirm} disabled={isPending}
            style={{ background: 'var(--green)', color: 'white', border: 'none' }}>
            {isPending ? <><Loader2 size={12} className="spin" /> Launching…</> : <><Play size={12} /> Launch Now</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = 'Delete', variant = 'danger', onConfirm, onClose, isPending, children }: {
  title: string; message?: string; confirmLabel?: string; variant?: 'danger' | 'primary'
  onConfirm: () => void; onClose: () => void; isPending: boolean; children?: React.ReactNode
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    }}>
      <div className="card anim-fade-up" style={{ width: 420, maxWidth: '90vw', padding: 0, overflow: 'hidden' }}>
        <div className="card-header">
          <div className="card-title">{title}</div>
        </div>
        <div className="card-body">
          {message && <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>{message}</p>}
          {children}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={isPending}>Cancel</button>
          <button className="btn btn-sm" onClick={onConfirm} disabled={isPending}
            style={variant === 'danger' ? { background: 'var(--red)', color: 'white', border: 'none' } : {}}>
            {isPending ? <><Loader2 size={12} className="spin" /> {confirmLabel}…</> : <><Trash2 size={12} /> {confirmLabel}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [range, setRange] = useState<StatsRange>('30d')
  const kpis = useMarketingKpis(range)
  const stats = useCampaignStats(range)
  const attribution = useAttributionStats(range)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Range selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        {(['7d', '30d', '90d'] as StatsRange[]).map(r => (
          <button key={r} className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        {kpis.isLoading ? (
          <div style={{ gridColumn: '1/-1' }}><Spinner /></div>
        ) : kpis.isError ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--t3)', padding: 32 }}>
            <AlertCircle size={20} style={{ marginBottom: 8 }} /><p>Failed to load KPIs</p>
          </div>
        ) : kpis.data ? (
          <>
            <KpiCard label="Sent"         value={(kpis.data.sent ?? 0).toLocaleString()}         grad="kpi-grad-blue"   icon={Send} />
            <KpiCard label="Delivered"    value={(kpis.data.delivered ?? 0).toLocaleString()}     sub={pct(kpis.data.deliveryRate)} grad="kpi-grad-green"  icon={Check} />
            <KpiCard label="Opened"       value={(kpis.data.opened ?? 0).toLocaleString()}        sub={pct(kpis.data.openRate)}    grad="kpi-grad-violet" icon={Eye} />
            <KpiCard label="Clicked"      value={(kpis.data.clicked ?? 0).toLocaleString()}       sub={pct(kpis.data.clickRate)}   grad="kpi-grad-amber"  icon={MousePointer} />
            <KpiCard label="Reviews Sent" value={(kpis.data.reviewsSent ?? 0).toLocaleString()}   grad="kpi-grad-cyan"   icon={Star} />
          </>
        ) : null}
      </div>

      {/* Attribution breakdown */}
      {attribution.data && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Automation Activity</div>
              <div className="card-subtitle">Review requests, win-back sequences, and equipment automations this period</div>
            </div>
            <TrendingUp size={18} style={{ color: 'var(--blue)', flexShrink: 0 }} />
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {[
                { label: 'Total Clicks', value: attribution.data.totalClicks },
                { label: 'Review Requests', value: attribution.data.reviewSends },
                { label: 'Review Clicks', value: attribution.data.reviewClicks, sub: `${attribution.data.reviewClickRate}% click rate` },
                { label: 'Win-back Sends', value: attribution.data.winbackSends },
                { label: 'Equipment Alerts', value: attribution.data.automationSends },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 'var(--r-md)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>{value.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, fontWeight: 600 }}>{label}</p>
                  {sub && <p style={{ fontSize: 10, color: 'var(--blue)', marginTop: 2 }}>{sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Campaign stats table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Campaign Performance</div>
            <div className="card-subtitle">All campaigns in the selected period</div>
          </div>
        </div>
        <div className="card-body-flush">
          {stats.isLoading ? <Spinner /> : !stats.data?.length ? (
            <Empty icon={BarChart3} message="No campaigns in this period" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                  {['Campaign', 'Channel', 'Status', 'Sent', 'Delivered', 'Opened', 'Clicked'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.data.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < stats.data!.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--t1)' }}>{c.name}</td>
                    <td style={{ padding: '10px 16px' }}><ChannelBadge channel={c.channel} /></td>
                    <td style={{ padding: '10px 16px' }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: '10px 16px', color: 'var(--t2)' }}>{c.sent}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--t2)' }}>{c.delivered}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--t2)' }}>{c.opened}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--t2)' }}>{c.clicked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── CAMPAIGNS TAB ────────────────────────────────────────────────────────────
function CampaignsTab() {
  const campaigns = useCampaigns()
  const templates = useMarketingTemplates()
  const audiences = useAudiences()
  const create = useCreateCampaign()
  const launch = useLaunchCampaign()
  const { showSuccess, showError } = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', channel: 'EMAIL' as 'EMAIL' | 'SMS', audienceId: '', templateId: '', scheduleAt: '' })
  const [launchTarget, setLaunchTarget] = useState<{ id: string; name: string; channel: string } | null>(null)

  const handleCreate = async () => {
    if (!form.name.trim()) return
    try {
      await create.mutateAsync({
        ...form,
        audienceId: form.audienceId || undefined,
        templateId: form.templateId || undefined,
        scheduleAt: form.scheduleAt || undefined,
      })
      showSuccess(form.scheduleAt ? 'Campaign scheduled' : 'Campaign created')
      setShowCreate(false)
      setForm({ name: '', channel: 'EMAIL', audienceId: '', templateId: '', scheduleAt: '' })
    } catch {
      showError('Failed to create campaign')
    }
  }

  const handleLaunch = async () => {
    if (!launchTarget) return
    try {
      await launch.mutateAsync(launchTarget.id)
      showSuccess(`Campaign "${launchTarget.name}" launched`)
      setLaunchTarget(null)
    } catch {
      showError('Failed to launch campaign')
      setLaunchTarget(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {launchTarget && (
        <LaunchModal
          campaign={launchTarget}
          isPending={launch.isPending}
          onConfirm={handleLaunch}
          onClose={() => !launch.isPending && setLaunchTarget(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> New Campaign
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card anim-fade-in">
          <div className="card-header">
            <div className="card-title">New Campaign</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Summer HVAC Promo" />
              </div>
              <div className="form-group">
                <label className="form-label">Channel *</label>
                <select className="form-input" value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value as any }))}>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Audience</label>
                <select className="form-input" value={form.audienceId} onChange={e => setForm(p => ({ ...p, audienceId: e.target.value }))}>
                  <option value="">— Select audience —</option>
                  {audiences.data?.map(a => <option key={a.id} value={a.id}>{a.name} ({a.lastCount} members)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Template</label>
                <select className="form-input" value={form.templateId} onChange={e => setForm(p => ({ ...p, templateId: e.target.value }))}>
                  <option value="">— Select template —</option>
                  {templates.data?.filter(t => t.channel === form.channel).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Schedule For (optional)</label>
                <DateTimePicker
                  value={form.scheduleAt}
                  onChange={v => setForm(p => ({ ...p, scheduleAt: v }))}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  placeholder="Leave blank to launch manually"
                />
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>
                  Leave blank to save as draft and launch manually. Set a future time to auto-send.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={create.isPending || !form.name.trim()}>
                {create.isPending ? <><Loader2 size={12} className="spin" /> Creating…</> : form.scheduleAt ? <><Save size={12} /> Schedule</> : <><Plus size={12} /> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Campaigns</div>
        </div>
        <div className="card-body-flush">
          {campaigns.isLoading ? <Spinner /> : !campaigns.data?.length ? (
            <Empty icon={Megaphone} message="No campaigns yet — create one to get started" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                  {['Name', 'Channel', 'Status', 'Created', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: i === 4 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.data.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < campaigns.data!.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--t1)' }}>{c.name}</td>
                    <td style={{ padding: '10px 16px' }}><ChannelBadge channel={c.channel} /></td>
                    <td style={{ padding: '10px 16px' }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: '10px 16px', color: 'var(--t3)', fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      {c.status === 'DRAFT' && (
                        <button className="btn btn-sm" onClick={() => setLaunchTarget({ id: c.id, name: c.name, channel: c.channel })}
                          disabled={launch.isPending && launchTarget?.id === c.id}
                          style={{ background: 'var(--green)', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Play size={11} /> Launch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── TEMPLATES TAB ─────────────────────────────────────────────────────────────
function TemplatesTab() {
  const templates = useMarketingTemplates()
  const seedDefaults = useSeedDefaultTemplates()
  const deleteTemplate = useDeleteTemplate()
  const createTemplate = useCreateTemplate()
  const { showSuccess, showError } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [tplForm, setTplForm] = useState({ name: '', channel: 'EMAIL' as 'EMAIL' | 'SMS', subject: '', htmlBody: '', smsBody: '' })
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const handleSeed = async () => {
    try {
      const { seeded } = await seedDefaults.mutateAsync()
      showSuccess(seeded > 0 ? `${seeded} default templates seeded` : 'Defaults already exist')
    } catch {
      showError('Failed to seed templates')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id)
      showSuccess('Template deleted')
      setDeleteTarget(null)
    } catch {
      showError('Failed to delete template')
      setDeleteTarget(null)
    }
  }

  const handleCreate = async () => {
    if (!tplForm.name.trim()) return showError('Template name is required')
    if (tplForm.channel === 'EMAIL' && !tplForm.htmlBody.trim()) return showError('HTML body is required for email templates')
    if (tplForm.channel === 'SMS' && !tplForm.smsBody.trim()) return showError('SMS body is required')
    try {
      await createTemplate.mutateAsync({
        name: tplForm.name,
        channel: tplForm.channel,
        subject: tplForm.channel === 'EMAIL' ? tplForm.subject : undefined,
        htmlBody: tplForm.channel === 'EMAIL' ? tplForm.htmlBody : undefined,
        smsBody: tplForm.channel === 'SMS' ? tplForm.smsBody : undefined,
      })
      showSuccess('Template created')
      setShowCreateForm(false)
      setTplForm({ name: '', channel: 'EMAIL', subject: '', htmlBody: '', smsBody: '' })
    } catch {
      showError('Failed to create template')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {deleteTarget && (
        <ConfirmModal
          title="Delete Template"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          isPending={deleteTemplate.isPending}
          onConfirm={confirmDelete}
          onClose={() => !deleteTemplate.isPending && setDeleteTarget(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={handleSeed} disabled={seedDefaults.isPending}>
          {seedDefaults.isPending ? <><Loader2 size={12} className="spin" /> Seeding...</> : <><RefreshCw size={12} /> Seed Defaults</>}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={13} /> Add Template
        </button>
      </div>

      {showCreateForm && (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>New Template</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="form-label">Name *</label>
              <input className="form-input" placeholder="e.g. Summer Tune-Up Offer" value={tplForm.name}
                onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Channel</label>
              <select className="form-input" value={tplForm.channel}
                onChange={e => setTplForm(p => ({ ...p, channel: e.target.value as 'EMAIL' | 'SMS' }))}>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>
          {tplForm.channel === 'EMAIL' && (
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Subject Line</label>
              <input className="form-input" placeholder="{{customer.firstName}}, your annual tune-up is due" value={tplForm.subject}
                onChange={e => setTplForm(p => ({ ...p, subject: e.target.value }))} />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">{tplForm.channel === 'EMAIL' ? 'HTML Body *' : 'SMS Body *'}</label>
            {tplForm.channel === 'EMAIL' ? (
              <textarea className="form-input" rows={8} placeholder={`<p>Hi {{customer.firstName}},</p>\n<p>Your annual HVAC tune-up is due. <a href="{{trackedLink}}">Book Now</a></p>\n<p><a href="{{unsubLink}}">Unsubscribe</a></p>`}
                value={tplForm.htmlBody} onChange={e => setTplForm(p => ({ ...p, htmlBody: e.target.value }))}
                style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
            ) : (
              <textarea className="form-input" rows={3} placeholder="Hi {{customer.firstName}}, your HVAC tune-up is due. Reply STOP to opt out."
                value={tplForm.smsBody} onChange={e => setTplForm(p => ({ ...p, smsBody: e.target.value }))}
                style={{ resize: 'vertical' }} />
            )}
            <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
              Available tags: <code style={{ background: 'var(--bg-card-2)', padding: '1px 4px', borderRadius: 3 }}>{'{{customer.firstName}}'}</code>{' '}
              <code style={{ background: 'var(--bg-card-2)', padding: '1px 4px', borderRadius: 3 }}>{'{{customer.lastName}}'}</code>{' '}
              <code style={{ background: 'var(--bg-card-2)', padding: '1px 4px', borderRadius: 3 }}>{'{{trackedLink}}'}</code>{' '}
              <code style={{ background: 'var(--bg-card-2)', padding: '1px 4px', borderRadius: 3 }}>{'{{unsubLink}}'}</code>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={createTemplate.isPending}>
              {createTemplate.isPending ? <><Loader2 size={12} className="spin" /> Creating…</> : <><Save size={12} /> Save Template</>}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Message Templates</div>
            <div className="card-subtitle">Reusable email and SMS templates with merge tag support</div>
          </div>
        </div>
        <div className="card-body-flush">
          {templates.isLoading ? <Spinner /> : !templates.data?.length ? (
            <Empty icon={Layout} message="No templates — click 'Seed Defaults' to add 6 trade templates" />
          ) : (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.data.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)',
                  background: 'var(--bg-card-2)', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <ChannelBadge channel={t.channel} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>{t.name}</p>
                      {t.subject && <p style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Subject: {t.subject}</p>}
                      {t.smsBody && <p style={{ fontSize: 11, color: 'var(--t3)' }}>{t.smsBody.slice(0, 80)}…</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {t.isDefault && (
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-full)', background: 'var(--blue-glow)', color: 'var(--blue)', fontWeight: 600 }}>DEFAULT</span>
                    )}
                    {!t.isDefault && (
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteTarget({ id: t.id, name: t.name })}>
                        <Trash2 size={13} style={{ color: 'var(--red)' }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Merge tags reference */}
      <div className="card">
        <div className="card-header"><div className="card-title">Merge Tags Reference</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['{{customer.firstName}}', '{{customer.lastName}}', '{{company.name}}', '{{trackedLink}}', '{{unsubLink}}'].map(tag => (
              <code key={tag} style={{ padding: '4px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)', fontSize: 12, color: 'var(--violet)', fontFamily: 'monospace' }}>{tag}</code>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AUDIENCES TAB ─────────────────────────────────────────────────────────────
// ── Audience filter types ─────────────────────────────────────────────────────
type AudienceFilterField = 'state' | 'zipCode' | 'city' | 'lifecycleStage'
  | 'equipmentType' | 'equipmentBrand' | 'hasEquipment' | 'warrantyEndBefore' | 'warrantyEndAfter' | 'installDateBefore' | 'installDateAfter'
type AudienceFilterOp = 'eq' | 'neq' | 'in' | 'contains' | 'has_any'

interface AudienceFilterRow {
  id: number
  field: AudienceFilterField
  op: AudienceFilterOp
  value: string
}

type FieldMeta = { label: string; ops: { value: AudienceFilterOp; label: string }[]; placeholder: string; isEnum?: boolean; isDate?: boolean; isBool?: boolean }
const FIELD_META: Record<AudienceFilterField, FieldMeta> = {
  // ── Customer fields ──────────────────────────────────────────────────────────
  state:            { label: 'State', ops: [{ value: 'eq', label: 'is' }, { value: 'neq', label: 'is not' }, { value: 'in', label: 'is any of' }], placeholder: 'e.g. TX' },
  zipCode:          { label: 'Zip Code', ops: [{ value: 'eq', label: 'is' }, { value: 'in', label: 'is any of' }], placeholder: 'e.g. 77001' },
  city:             { label: 'City', ops: [{ value: 'eq', label: 'is exactly' }, { value: 'contains', label: 'contains' }], placeholder: 'e.g. Houston' },
  lifecycleStage:   { label: 'Lifecycle Stage', ops: [{ value: 'eq', label: 'is' }, { value: 'in', label: 'is any of' }], placeholder: 'ACTIVE', isEnum: true },
  // ── Equipment fields ─────────────────────────────────────────────────────────
  hasEquipment:     { label: 'Has Equipment', ops: [{ value: 'eq', label: 'is' }], placeholder: 'true', isBool: true },
  equipmentType:    { label: 'Equipment Type', ops: [{ value: 'eq', label: 'is exactly' }, { value: 'contains', label: 'contains' }], placeholder: 'e.g. Heat Pump, AC Unit' },
  equipmentBrand:   { label: 'Equipment Brand', ops: [{ value: 'eq', label: 'is exactly' }, { value: 'contains', label: 'contains' }], placeholder: 'e.g. Lennox, Carrier' },
  warrantyEndBefore:{ label: 'Warranty Ends Before', ops: [{ value: 'eq', label: 'date' }], placeholder: '', isDate: true },
  warrantyEndAfter: { label: 'Warranty Ends After', ops: [{ value: 'eq', label: 'date' }], placeholder: '', isDate: true },
  installDateBefore:{ label: 'Installed Before', ops: [{ value: 'eq', label: 'date' }], placeholder: '', isDate: true },
  installDateAfter: { label: 'Installed After', ops: [{ value: 'eq', label: 'date' }], placeholder: '', isDate: true },
}

const FIELD_GROUPS = [
  { label: 'Customer', fields: ['state', 'zipCode', 'city', 'lifecycleStage'] as AudienceFilterField[] },
  { label: 'Equipment', fields: ['hasEquipment', 'equipmentType', 'equipmentBrand', 'warrantyEndBefore', 'warrantyEndAfter', 'installDateBefore', 'installDateAfter'] as AudienceFilterField[] },
]

const LIFECYCLE_OPTIONS = ['LEAD', 'ACTIVE', 'INACTIVE', 'CHURNED']

let _rowId = 0
const nextId = () => ++_rowId

function filterRowToJson(row: AudienceFilterRow): object | null {
  const val = row.value.trim()
  if (!val) return null
  const isIn = row.op === 'in'
  const value = isIn ? val.split(',').map(v => v.trim()).filter(Boolean) : val
  if (isIn && (value as string[]).length === 0) return null
  return { field: row.field, op: row.op, value }
}

function buildFiltersJson(rows: AudienceFilterRow[]): string {
  const valid = rows.map(filterRowToJson).filter(Boolean)
  return JSON.stringify(valid)
}

// ── Filter builder sub-component ──────────────────────────────────────────────
function FilterBuilder({ rows, onChange }: { rows: AudienceFilterRow[]; onChange: (rows: AudienceFilterRow[]) => void }) {
  const addRow = () => onChange([...rows, { id: nextId(), field: 'state', op: 'eq', value: '' }])

  const updateRow = (id: number, patch: Partial<AudienceFilterRow>) =>
    onChange(rows.map(r => r.id === id ? { ...r, ...patch, ...(patch.field ? { op: FIELD_META[patch.field as AudienceFilterField].ops[0].value, value: '' } : {}) } : r))

  const removeRow = (id: number) => onChange(rows.filter(r => r.id !== id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.length === 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--r)', border: '1px dashed var(--bd-md)', color: 'var(--t3)', fontSize: 13, textAlign: 'center' }}>
          No filters — audience will match all active customers
        </div>
      )}
      {rows.map((row, i) => {
        const meta = FIELD_META[row.field]
        const isIn = row.op === 'in'
        const isEnum = meta.isEnum
        return (
          <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--r)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
            {i > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', minWidth: 24 }}>AND</span>}
            {i === 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', minWidth: 24 }}>IF</span>}
            <select
              className="form-input"
              style={{ flex: '0 0 170px', fontSize: 12 }}
              value={row.field}
              onChange={e => updateRow(row.id, { field: e.target.value as AudienceFilterField })}
            >
              {FIELD_GROUPS.map(g => (
                <optgroup key={g.label} label={g.label}>
                  {g.fields.map(f => <option key={f} value={f}>{FIELD_META[f].label}</option>)}
                </optgroup>
              ))}
            </select>
            {meta.ops.length > 1 && (
              <select
                className="form-input"
                style={{ flex: '0 0 120px', fontSize: 12 }}
                value={row.op}
                onChange={e => updateRow(row.id, { op: e.target.value as AudienceFilterOp })}
              >
                {meta.ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
            {meta.isBool ? (
              <select className="form-input" style={{ flex: 1, fontSize: 12 }} value={row.value}
                onChange={e => updateRow(row.id, { value: e.target.value })}>
                <option value="true">Yes (has equipment)</option>
                <option value="false">No (no equipment)</option>
              </select>
            ) : meta.isDate ? (
              <input type="date" className="form-input" style={{ flex: 1, fontSize: 12 }} value={row.value}
                onChange={e => updateRow(row.id, { value: e.target.value })} />
            ) : isEnum && !isIn ? (
              <select className="form-input" style={{ flex: 1, fontSize: 12 }} value={row.value}
                onChange={e => updateRow(row.id, { value: e.target.value })}>
                <option value="">— pick one —</option>
                {LIFECYCLE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className="form-input" style={{ flex: 1, fontSize: 12 }} value={row.value}
                onChange={e => updateRow(row.id, { value: e.target.value })}
                placeholder={isIn ? `${meta.placeholder}, ... (comma-separated)` : meta.placeholder} />
            )}
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeRow(row.id)}>
              <Trash2 size={12} style={{ color: 'var(--red)' }} />
            </button>
          </div>
        )
      })}
      <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addRow}>
        <Plus size={12} /> Add Filter
      </button>
    </div>
  )
}

// ── Audience preview count badge ──────────────────────────────────────────────
function PreviewCount({ filtersJson }: { filtersJson: string }) {
  const preview = useAudiencePreviewCount(filtersJson)
  if (filtersJson === '[]') return <span style={{ color: 'var(--t3)', fontSize: 13 }}>Add filters to see estimated reach</span>
  if (preview.isLoading) return <span style={{ color: 'var(--t3)', fontSize: 13 }}><Loader2 size={12} className="spin" /> Calculating...</span>
  if (preview.isError) return <span style={{ color: 'var(--red)', fontSize: 13 }}>Could not fetch count</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t1)', fontWeight: 500 }}>
      <Users size={14} style={{ color: 'var(--blue)' }} />
      <strong style={{ color: 'var(--blue)' }}>{preview.data?.count.toLocaleString() ?? 0}</strong> customers match
    </span>
  )
}

function AudiencesTab() {
  const audiences = useAudiences()
  const create = useCreateAudience()
  const deleteAudience = useDeleteAudience()
  const { showSuccess, showError } = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'DYNAMIC' | 'STATIC'>('DYNAMIC')
  const [filterRows, setFilterRows] = useState<AudienceFilterRow[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const filtersJson = useMemo(() => buildFiltersJson(filterRows), [filterRows])

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ name: name.trim(), type, filtersJson })
      showSuccess('Audience created')
      setShowCreate(false)
      setName('')
      setType('DYNAMIC')
      setFilterRows([])
    } catch {
      showError('Failed to create audience')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAudience.mutateAsync(deleteTarget.id)
      showSuccess('Audience deleted')
      setDeleteTarget(null)
    } catch {
      showError('Failed to delete audience')
      setDeleteTarget(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {deleteTarget && (
        <ConfirmModal
          title="Delete Audience"
          message={`Delete "${deleteTarget.name}"? Campaigns using this audience will not be affected.`}
          confirmLabel="Delete"
          isPending={deleteAudience.isPending}
          onConfirm={confirmDelete}
          onClose={() => !deleteAudience.isPending && setDeleteTarget(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> New Audience
        </button>
      </div>

      {showCreate && (
        <div className="card anim-fade-in">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} style={{ color: 'var(--blue)' }} /> Build Audience
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Name + Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Audience Name *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Texas Active Customers" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type</label>
                <select className="form-input" value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="DYNAMIC">Dynamic</option>
                  <option value="STATIC">Static</option>
                </select>
              </div>
            </div>

            {/* Filter builder — only for DYNAMIC */}
            {type === 'DYNAMIC' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Filter Rules
                </div>
                <FilterBuilder rows={filterRows} onChange={setFilterRows} />
              </div>
            )}

            {/* Live count preview */}
            {type === 'DYNAMIC' && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--r)', background: 'var(--blue-glow)', border: '1px solid var(--blue-dim, #bfdbfe)' }}>
                <PreviewCount filtersJson={filtersJson} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowCreate(false); setFilterRows([]); setName(''); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={create.isPending || !name.trim()}>
                {create.isPending ? <><Loader2 size={12} className="spin" /> Creating...</> : <><Plus size={12} /> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Audience Segments</div>
            <div className="card-subtitle">Customer groups used to target campaigns</div>
          </div>
        </div>
        <div className="card-body-flush">
          {audiences.isLoading ? <Spinner /> : !audiences.data?.length ? (
            <Empty icon={Users} message="No audiences yet — create segments to target campaigns" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                  {['Name', 'Type', 'Filters', 'Members', 'Created', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: i === 5 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audiences.data.map((a, i) => {
                  let parsedFilters: { field: string; op: string; value: unknown }[] = []
                  try { parsedFilters = JSON.parse(a.filtersJson || '[]') } catch { /* */ }
                  return (
                    <tr key={a.id} style={{ borderBottom: i < audiences.data!.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--t1)' }}>{a.name}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--r-full)', fontWeight: 600, background: a.type === 'DYNAMIC' ? 'var(--blue-glow)' : 'var(--bg-card-2)', color: a.type === 'DYNAMIC' ? 'var(--blue)' : 'var(--t3)' }}>
                          {a.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--t3)', fontSize: 12 }}>
                        {parsedFilters.length === 0
                          ? <span style={{ color: 'var(--t3)' }}>All customers</span>
                          : parsedFilters.map((f, fi) => (
                            <span key={fi} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-card-2)', border: '1px solid var(--bd)', fontSize: 11 }}>
                              {FIELD_META[f.field as AudienceFilterField]?.label ?? f.field} {f.op} {Array.isArray(f.value) ? (f.value as string[]).join(', ') : String(f.value)}
                            </span>
                          ))
                        }
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--t2)' }}>{a.lastCount.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--t3)', fontSize: 12 }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteTarget({ id: a.id, name: a.name })}>
                          <Trash2 size={13} style={{ color: 'var(--red)' }} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const settingsQuery = useMarketingSettings()
  const update = useUpdateMarketingSettings()
  const { showSuccess, showError } = useToast()

  const [form, setForm] = useState<Partial<MarketingSettings>>({})
  const [dirty, setDirty] = useState(false)

  const data = settingsQuery.data
  const merged = { ...data, ...form } as MarketingSettings

  const toggle = (key: keyof MarketingSettings) => {
    setForm(p => ({ ...p, [key]: !merged[key] }))
    setDirty(true)
  }

  const setNum = (key: keyof MarketingSettings, val: number) => {
    setForm(p => ({ ...p, [key]: val }))
    setDirty(true)
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync(form)
      setDirty(false)
      setForm({})
      showSuccess('Marketing settings saved')
    } catch {
      showError('Failed to save settings')
    }
  }

  if (settingsQuery.isLoading) return <Spinner />
  if (settingsQuery.isError) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--t3)' }}>
      <AlertCircle size={24} style={{ marginBottom: 8 }} />
      <p>Failed to load marketing settings</p>
      <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => settingsQuery.refetch()}>Retry</button>
    </div>
  )

  const automationRows = [
    { key: 'globalEnabled' as const, icon: Megaphone, label: 'Global Marketing', desc: 'Master kill switch — disabling this stops ALL automated marketing sends immediately.' },
    { key: 'reviewRequestsEnabled' as const, icon: Star, label: 'Review Requests', desc: 'Send automated review requests via SMS day-1 and email day-3 after job completion.' },
    { key: 'equipmentAutomationsEnabled' as const, icon: Wrench, label: 'Equipment Automations', desc: 'Daily scan triggers tune-up, replacement, and warranty reminders based on equipment age.' },
    { key: 'winbackEnabled' as const, icon: Heart, label: 'Win-Back Campaigns', desc: 'Re-engage inactive customers (180+ days) at high churn risk with a 3-step SMS/email sequence.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Automation toggles */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Automation Controls</div>
            <div className="card-subtitle">Enable or disable each automated marketing flow</div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {automationRows.map(({ key, icon: Icon, label, desc }) => {
            const isEnabled = merged[key] as boolean
            const isGlobal = key === 'globalEnabled'
            const disabledByGlobal = !isGlobal && !merged.globalEnabled
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '14px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)',
                background: isEnabled && !disabledByGlobal ? 'var(--bg-card-2)' : 'var(--bg-hover)',
                opacity: disabledByGlobal ? 0.5 : 1,
                transition: 'all var(--dur)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isEnabled ? 'var(--blue-glow)' : 'var(--bg-card-2)', flexShrink: 0 }}>
                    <Icon size={16} style={{ color: isEnabled ? 'var(--blue)' : 'var(--t3)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 520 }}>{desc}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isEnabled && !disabledByGlobal ? 'var(--green)' : 'var(--t4)' }}>
                    {isEnabled && !disabledByGlobal ? 'On' : 'Off'}
                  </span>
                  <Toggle checked={isEnabled} onChange={() => toggle(key)} disabled={disabledByGlobal} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Frequency caps */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Frequency Caps</div>
            <div className="card-subtitle">Limit how often a single customer can receive marketing messages</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Max per customer per day</label>
              <input type="number" className="form-input" min={1} max={20}
                value={merged.frequencyCapPerDay ?? 3}
                onChange={e => setNum('frequencyCapPerDay', parseInt(e.target.value) || 1)} />
              <span style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4, display: 'block' }}>Default: 3</span>
            </div>
            <div className="form-group">
              <label className="form-label">Max per customer per week</label>
              <input type="number" className="form-input" min={1} max={50}
                value={merged.frequencyCapPerWeek ?? 10}
                onChange={e => setNum('frequencyCapPerWeek', parseInt(e.target.value) || 1)} />
              <span style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4, display: 'block' }}>Default: 10</span>
            </div>
            <div className="form-group">
              <label className="form-label">Default Sender Name</label>
              <input type="text" className="form-input"
                value={merged.defaultSenderName ?? ''}
                onChange={e => { setForm(p => ({ ...p, defaultSenderName: e.target.value })); setDirty(true) }}
                placeholder="e.g. Lush HVAC Team" />
            </div>
          </div>
        </div>
        <div className="card-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={update.isPending || !dirty}>
            {update.isPending ? <><Loader2 size={12} className="spin" /> Saving...</> : <><Save size={12} /> Save Settings</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── COMPLIANCE TAB ────────────────────────────────────────────────────────────
function ComplianceTab() {
  const deletionLog = useDeletionLog()
  const deleteData = useDeleteCustomerMarketingData()
  const { showSuccess, showError } = useToast()

  const [customerId, setCustomerId] = useState('')
  const [lastResult, setLastResult] = useState<{ sendJobsDeleted: number; suppressionsDeleted: number; reviewRequestsDeleted: number; total: number } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    if (!customerId.trim()) return
    setShowConfirm(true)
  }

  const confirmErase = async () => {
    try {
      const result = await deleteData.mutateAsync(customerId.trim())
      setLastResult(result)
      showSuccess(`Deleted ${result.total} marketing records`)
      setCustomerId('')
      setShowConfirm(false)
    } catch {
      showError('Failed to erase customer data')
      setShowConfirm(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showConfirm && (
        <ConfirmModal
          title="⚠ CCPA Right-to-Delete"
          confirmLabel="Erase Data"
          isPending={deleteData.isPending}
          onConfirm={confirmErase}
          onClose={() => !deleteData.isPending && setShowConfirm(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--red-dim)', border: '1px solid var(--red)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>This action is permanent and cannot be undone.</p>
              <p style={{ fontSize: 12, color: 'var(--t2)' }}>All send history, suppression records, and review requests will be erased. The CRM customer profile is not affected.</p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--t3)' }}>Customer ID: <code style={{ background: 'var(--bg-card-2)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{customerId}</code></p>
          </div>
        </ConfirmModal>
      )}

      {/* Erasure form */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={15} style={{ color: 'var(--blue)' }} /> CCPA Right-to-Delete
            </div>
            <div className="card-subtitle">Permanently erase all marketing data for a customer. Logs the action for your compliance audit trail.</div>
          </div>
        </div>
        <div className="card-body">
          {/* Warning banner */}
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--r-md)', marginBottom: 20,
            background: 'var(--amber-dim)', border: '1px solid var(--amber)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <AlertCircle size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 3 }}>Irreversible Action</p>
              <p style={{ fontSize: 12, color: 'var(--t2)' }}>
                Erasing marketing data deletes all SendJob records, SendEvents, suppression entries, and review requests for the customer. A deletion log entry is created for audit purposes. Customer profile in the CRM is not affected.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Customer ID</label>
              <input className="form-input" value={customerId}
                onChange={e => { setCustomerId(e.target.value); setLastResult(null) }}
                placeholder="Paste customer UUID from the CRM..." />
            </div>
            <button className="btn btn-sm" onClick={handleDelete}
              disabled={!customerId.trim()}
              style={{
                background: 'var(--red)', color: 'white', border: 'none', height: 38, marginBottom: 1,
                cursor: !customerId.trim() ? 'not-allowed' : 'pointer',
                opacity: !customerId.trim() ? 0.5 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
              <Trash2 size={12} /> Erase Data
            </button>
          </div>

          {/* Result */}
          {lastResult && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--r-md)', marginTop: 16,
              background: 'var(--green-dim)', border: '1px solid var(--green)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Check size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Erasure complete — {lastResult.total} records deleted</p>
                <p style={{ fontSize: 12, color: 'var(--t2)' }}>
                  Send jobs: {lastResult.sendJobsDeleted} &nbsp;·&nbsp; Suppressions: {lastResult.suppressionsDeleted} &nbsp;·&nbsp; Review requests: {lastResult.reviewRequestsDeleted}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deletion log */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Deletion Audit Log</div>
            <div className="card-subtitle">Last 100 CCPA deletion requests for this company</div>
          </div>
        </div>
        <div className="card-body-flush">
          {deletionLog.isLoading ? <Spinner /> : !deletionLog.data?.length ? (
            <Empty icon={Shield} message="No deletion requests recorded yet" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                  {['Customer ID', 'Records Deleted', 'Deleted By', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deletionLog.data.map((entry, i) => (
                  <tr key={entry.id} style={{ borderBottom: i < deletionLog.data!.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--t2)' }}>{entry.customerId}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--red-dim)', color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>{entry.recordsDeleted}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--t3)' }}>{entry.deletedBy.slice(0, 12)}…</td>
                    <td style={{ padding: '10px 16px', color: 'var(--t3)', fontSize: 12 }}>{new Date(entry.deletedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'campaigns' | 'templates' | 'audiences' | 'settings' | 'compliance'

export default function Marketing() {
  const [tab, setTab] = useState<Tab>('overview')

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',    label: 'Overview',    icon: BarChart3 },
    { id: 'campaigns',  label: 'Campaigns',   icon: Megaphone },
    { id: 'templates',  label: 'Templates',   icon: Layout },
    { id: 'audiences',  label: 'Audiences',   icon: Users },
    { id: 'settings',   label: 'Settings',    icon: Settings },
    { id: 'compliance', label: 'Compliance',  icon: Shield },
  ]

  return (
    <div className="anim-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketing</h1>
          <p className="page-subtitle">Campaigns, automations, templates, and CCPA compliance</p>
        </div>
      </div>

      <div className="page-tabs mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="anim-fade-in">
        {tab === 'overview'    && <OverviewTab />}
        {tab === 'campaigns'   && <CampaignsTab />}
        {tab === 'templates'   && <TemplatesTab />}
        {tab === 'audiences'   && <AudiencesTab />}
        {tab === 'settings'    && <SettingsTab />}
        {tab === 'compliance'  && <ComplianceTab />}
      </div>
    </div>
  )
}

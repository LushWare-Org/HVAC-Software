import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Megaphone, BarChart3, Layout, Users, Settings, Shield,
  Send, Mail, MessageSquare, Check, Loader2, AlertCircle,
  Plus, Trash2, RefreshCw, Play, Save,
  Eye, MousePointer, Star, Wrench, Heart, TrendingUp, Filter, CalendarDays, Clock,
} from 'lucide-react'
import {
  useMarketingKpis, useCampaignStats, useCampaigns, useCreateCampaign, useLaunchCampaign,
  useMarketingTemplates, useSeedDefaultTemplates, useDeleteTemplate, useCreateTemplate, useUpdateTemplate,
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

// ── BLOCK-BASED EMAIL BUILDER ─────────────────────────────────────────────────

type BlockType = 'header' | 'greeting' | 'text' | 'button' | 'highlight' | 'bullets' | 'divider' | 'footer'

interface EmailBlock {
  id: string
  type: BlockType
  data: Record<string, string>
}

const EMAIL_THEMES = [
  { id: 'ocean',  name: 'Ocean',  dot: '#3b82f6', primary: '#1e40af', accent: '#3b82f6', bg: '#f0f4f8' },
  { id: 'forest', name: 'Forest', dot: '#10b981', primary: '#065f46', accent: '#10b981', bg: '#f0fdf4' },
  { id: 'sunset', name: 'Sunset', dot: '#f97316', primary: '#c2410c', accent: '#f97316', bg: '#fff7ed' },
  { id: 'slate',  name: 'Slate',  dot: '#475569', primary: '#1e293b', accent: '#475569', bg: '#f8fafc' },
  { id: 'rose',   name: 'Rose',   dot: '#e11d48', primary: '#9f1239', accent: '#e11d48', bg: '#fff1f2' },
]

const BLOCK_DEFS: Record<BlockType, { label: string; icon: string; defaultData: Record<string, string> }> = {
  header:    { label: 'Header',        icon: '▤',  defaultData: { company: '{{company.name}}', headline: 'Your Headline Here' } },
  greeting:  { label: 'Greeting',      icon: '👋', defaultData: { text: 'Hi {{customer.firstName}},' } },
  text:      { label: 'Text Paragraph',icon: '¶',  defaultData: { body: 'Write your message here. Explain the value and why the customer should act now.' } },
  button:    { label: 'CTA Button',    icon: '▶',  defaultData: { label: 'Book Now', url: '{{trackedLink}}' } },
  highlight: { label: 'Highlight Box', icon: '💡', defaultData: { title: 'Why choose us?', body: 'Licensed technicians · Same-day availability · Satisfaction guaranteed' } },
  bullets:   { label: 'Bullet List',   icon: '≡',  defaultData: { title: "What's included:", items: "Full system inspection & cleaning\nFilter replacement\nPerformance report" } },
  divider:   { label: 'Divider',       icon: '─',  defaultData: {} },
  footer:    { label: 'Footer',        icon: '▣',  defaultData: { company: '{{company.name}}', unsubUrl: '{{unsubLink}}' } },
}

const ADD_BLOCK_OPTIONS: BlockType[] = ['header','greeting','text','button','highlight','bullets','divider','footer']

const MERGE_TAGS = [
  { label: 'First Name',   tag: '{{customer.firstName}}' },
  { label: 'Last Name',    tag: '{{customer.lastName}}' },
  { label: 'Company',      tag: '{{company.name}}' },
  { label: 'Tracked Link', tag: '{{trackedLink}}' },
  { label: 'Unsub Link',   tag: '{{unsubLink}}' },
]

function mkBlock(type: BlockType): EmailBlock {
  return { id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, type, data: { ...BLOCK_DEFS[type].defaultData } }
}

function initialBlocks(): EmailBlock[] {
  return ['header','greeting','text','button','footer'].map(t => mkBlock(t as BlockType))
}

function renderBlock(b: EmailBlock, theme: typeof EMAIL_THEMES[0]): string {
  const { primary, accent, bg } = theme
  switch (b.type) {
    case 'header':
      return `<tr><td style="background:linear-gradient(135deg,${primary} 0%,${accent} 100%);padding:36px 48px"><p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600">${b.data.company||''}</p><h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;line-height:1.3">${b.data.headline||''}</h1></td></tr>`
    case 'greeting':
      return `<tr><td style="padding:32px 48px 0"><p style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e">${b.data.text||''}</p></td></tr>`
    case 'text':
      return `<tr><td style="padding:20px 48px"><p style="margin:0;color:#475569;font-size:15px;line-height:1.75">${(b.data.body||'').replace(/\n/g,'<br>')}</p></td></tr>`
    case 'button':
      return `<tr><td style="padding:24px 48px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td><a href="${b.data.url||'#'}" style="display:inline-block;background:linear-gradient(135deg,${primary},${accent});color:#fff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:15px;font-weight:700">${b.data.label||'Click Here'} →</a></td></tr></table></td></tr>`
    case 'highlight':
      return `<tr><td style="padding:12px 48px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${bg};border-left:4px solid ${accent};border-radius:0 8px 8px 0;padding:16px 20px"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${primary}">${b.data.title||''}</p><p style="margin:0;font-size:13px;color:#64748b;line-height:1.7">${(b.data.body||'').replace(/\n/g,'<br>')}</p></td></tr></table></td></tr>`
    case 'bullets': {
      const items = (b.data.items||'').split('\n').filter(Boolean)
      return `<tr><td style="padding:12px 48px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${bg};border-radius:8px;padding:16px 20px;border-left:4px solid ${accent}">${b.data.title?`<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${primary}">${b.data.title}</p>`:''}<p style="margin:0;font-size:13px;color:#64748b;line-height:1.8">${items.map(i=>`• ${i}`).join('<br>')}</p></td></tr></table></td></tr>`
    }
    case 'divider':
      return `<tr><td style="padding:8px 48px"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0"></td></tr>`
    case 'footer':
      return `<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center"><p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7">${b.data.company||''} · You're receiving this as a valued customer.<br><a href="${b.data.unsubUrl||'{{unsubLink}}'}" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a></p></td></tr>`
    default: return ''
  }
}

function buildHtml(blocks: EmailBlock[], themeId: string): string {
  const theme = EMAIL_THEMES.find(t => t.id === themeId) ?? EMAIL_THEMES[0]
  const rows = blocks.map(b => renderBlock(b, theme)).join('\n')
  const meta = JSON.stringify({ v: 1, themeId, blocks })
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${theme.bg};font-family:'Helvetica Neue',Arial,sans-serif">
<!-- TSCRM_BLOCKS:${meta} -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:${theme.bg};padding:40px 20px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
${rows}
</table></td></tr></table>
</body></html>`
}

function extractBlocks(html: string): { blocks: EmailBlock[]; themeId: string } | null {
  const match = html.match(/<!-- TSCRM_BLOCKS:(.*?) -->/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (parsed.blocks && parsed.themeId) return { blocks: parsed.blocks, themeId: parsed.themeId }
  } catch { /* */ }
  return null
}

// ── Inline merge-tag dropdown ─────────────────────────────────────────────────
function MergeTagBtn({ onSelect }: { onSelect: (tag: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 'var(--r-sm)', border: '1px solid var(--violet)', background: 'var(--violet-dim)', color: 'var(--violet)', cursor: 'pointer', fontWeight: 600 }}>
        + Merge Tag
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', minWidth: 140, overflow: 'hidden', marginTop: 2 }}
          onMouseLeave={() => setOpen(false)}>
          {MERGE_TAGS.map(mt => (
            <button key={mt.tag} onClick={() => { onSelect(mt.tag); setOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t1)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              {mt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Friendly link options for the CTA button block ───────────────────────────
const LINK_OPTIONS = [
  { label: '📅  Book a Service',   value: '{{trackedLink}}',             hint: 'Sends customers to the booking page (recommended)' },
  { label: '💳  View Invoices',     value: '{{trackedLink}}',             hint: 'Link goes to the customer portal — set destination in campaign' },
  { label: '🔗  Custom URL',        value: 'custom',                      hint: 'Paste any URL you want the button to open' },
]

// ── Block inline editor ───────────────────────────────────────────────────────
function BlockEditor({ block, onChange }: { block: EmailBlock; onChange: (data: Record<string, string>) => void }) {
  const set = (key: string, val: string) => onChange({ ...block.data, [key]: val })
  const append = (key: string, tag: string) => set(key, (block.data[key] || '') + tag)

  // Determine if the current URL is a custom one (not one of the preset tracked values)
  const isCustomUrl = block.type === 'button' && block.data.url !== undefined && block.data.url !== '{{trackedLink}}' && block.data.url !== ''
  const selectedLink = isCustomUrl ? 'custom' : (block.data.url || '{{trackedLink}}')

  const inputRow = (label: string, key: string, placeholder?: string, hint?: string) => (
    <div key={key} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', flex: 1 }}>{label}</span>
        <MergeTagBtn onSelect={tag => append(key, tag)} />
      </div>
      <input className="form-input" value={block.data[key] || ''} onChange={e => set(key, e.target.value)}
        placeholder={placeholder} style={{ fontSize: 14, padding: '10px 12px' }} />
      {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--t3)' }}>{hint}</p>}
    </div>
  )

  const textareaRow = (label: string, key: string, rows: number, placeholder?: string, hint?: string) => (
    <div key={key} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', flex: 1 }}>{label}</span>
        <MergeTagBtn onSelect={tag => append(key, tag)} />
      </div>
      <textarea className="form-input" value={block.data[key] || ''} onChange={e => set(key, e.target.value)}
        rows={rows} placeholder={placeholder}
        style={{ fontSize: 14, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.65, padding: '10px 12px', minHeight: rows * 26 }} />
      {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--t3)' }}>{hint}</p>}
    </div>
  )

  const buttonLinkPicker = () => {
    return (
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>Button Label</span>
        <input className="form-input" value={block.data.label || ''} onChange={e => set('label', e.target.value)}
          placeholder="Book Now" style={{ fontSize: 14, padding: '10px 12px', marginBottom: 14 }} />

        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>Button Links To</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {LINK_OPTIONS.map(opt => {
            const isSel = selectedLink === opt.value
            return (
              <button key={opt.value} onClick={() => {
                if (opt.value === 'custom') set('url', '')
                else set('url', opt.value)
              }} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                borderRadius: 'var(--r-md)', border: `1.5px solid ${isSel ? 'var(--blue)' : 'var(--bd)'}`,
                background: isSel ? 'var(--blue-glow)' : 'var(--bg-card-2)', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isSel ? 'var(--blue)' : 'var(--bd)'}`, marginTop: 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isSel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)' }} />}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isSel ? 'var(--blue)' : 'var(--t1)' }}>{opt.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>{opt.hint}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Custom URL input */}
        {selectedLink === 'custom' && (
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: 5 }}>Paste your URL</span>
            <input className="form-input" value={isCustomUrl ? block.data.url || '' : ''} onChange={e => set('url', e.target.value)}
              placeholder="https://example.com/your-page" style={{ fontSize: 14, padding: '10px 12px' }} />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--t3)' }}>Must start with https://</p>
          </div>
        )}

        {/* Helpful note for tracked link */}
        {selectedLink !== 'custom' && (
          <div style={{ padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
              💡 The actual destination is set when you <strong style={{ color: 'var(--t2)' }}>create a campaign</strong>. This button will track clicks automatically.
            </p>
          </div>
        )}
      </div>
    )
  }

  switch (block.type) {
    case 'header':    return <>{inputRow('Company Name', 'company', '{{company.name}}')}{inputRow('Headline', 'headline', 'Your Headline Here', 'This is the big title customers see first')}</>
    case 'greeting':  return <>{inputRow('Greeting Text', 'text', 'Hi {{customer.firstName}},', 'Use the merge tag button to insert the customer\'s name')}</>
    case 'text':      return <>{textareaRow('Body Text', 'body', 6, 'Write your message here…', 'Keep it short — 2 to 3 sentences work best for emails')}</>
    case 'button':    return <>{buttonLinkPicker()}</>
    case 'highlight': return <>{inputRow('Title', 'title', 'Why choose us?')}{textareaRow('Body', 'body', 4, 'Key points…', 'Short, punchy lines work best here')}</>
    case 'bullets':   return <>{inputRow('Title (optional)', 'title', "What's included:")}{textareaRow('Bullet Items (one per line)', 'items', 5, 'Item one\nItem two\nItem three', 'Each line becomes a bullet point')}</>
    case 'divider':   return <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, padding: '4px 0' }}>Adds a thin horizontal line — great for separating sections.</p>
    case 'footer':    return <>{inputRow('Company Name', 'company', '{{company.name}}')}{inputRow('Unsubscribe URL', 'unsubUrl', '{{unsubLink}}', 'Required by email law — keep this as {{unsubLink}}')}</>
    default:          return null
  }
}

// ── Email block list (accordion) ──────────────────────────────────────────────
function BlockList({ blocks, themeId, onChange }: {
  blocks: EmailBlock[]
  themeId: string
  onChange: (blocks: EmailBlock[]) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(blocks[0]?.id ?? null)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...blocks]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  const remove = (id: string) => {
    onChange(blocks.filter(b => b.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const update = (id: string, data: Record<string, string>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, data } : b))
  }

  const add = (type: BlockType) => {
    const nb = mkBlock(type)
    onChange([...blocks, nb])
    setExpandedId(nb.id)
    setShowAddMenu(false)
  }

  const theme = EMAIL_THEMES.find(t => t.id === themeId) ?? EMAIL_THEMES[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {blocks.map((b, idx) => {
        const isOpen = expandedId === b.id
        const def = BLOCK_DEFS[b.type]
        return (
          <div key={b.id} style={{ border: `1px solid ${isOpen ? theme.accent : 'var(--bd)'}`, borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--bg-card)', transition: 'border-color 0.15s' }}>
            {/* Block header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', cursor: 'pointer', background: isOpen ? `${theme.accent}14` : 'transparent', userSelect: 'none' }}
              onClick={() => setExpandedId(isOpen ? null : b.id)}>
              <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{def.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>{def.label}</span>
              <button onClick={e => { e.stopPropagation(); move(idx, -1) }} disabled={idx === 0}
                style={{ padding: '2px 5px', border: 'none', background: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--t3)', fontSize: 11, opacity: idx === 0 ? 0.3 : 1 }} title="Move up">↑</button>
              <button onClick={e => { e.stopPropagation(); move(idx, 1) }} disabled={idx === blocks.length - 1}
                style={{ padding: '2px 5px', border: 'none', background: 'none', cursor: idx === blocks.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--t3)', fontSize: 11, opacity: idx === blocks.length - 1 ? 0.3 : 1 }} title="Move down">↓</button>
              <button onClick={e => { e.stopPropagation(); remove(b.id) }}
                style={{ padding: '2px 5px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 11 }} title="Remove">✕</button>
              <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 2 }}>{isOpen ? '▲' : '▼'}</span>
            </div>
            {/* Editor fields */}
            {isOpen && (
              <div style={{ padding: '16px 16px 12px', borderTop: '1px solid var(--bd)' }}>
                <BlockEditor block={b} onChange={data => update(b.id, data)} />
              </div>
            )}
          </div>
        )
      })}

      {/* Add block */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowAddMenu(o => !o)} style={{ width: '100%', padding: '8px', border: '1px dashed var(--bd)', borderRadius: 'var(--r-md)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t3)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Plus size={12} /> Add Block
        </button>
        {showAddMenu && (
          <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', zIndex: 20 }}>
            {ADD_BLOCK_OPTIONS.map(type => (
              <button key={type} onClick={() => add(type)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span style={{ width: 18, textAlign: 'center' }}>{BLOCK_DEFS[type].icon}</span>
                {BLOCK_DEFS[type].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── SMS phone mockup preview ──────────────────────────────────────────────────
function SmsPhoneMockup({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px 16px' }}>
      <div style={{ width: 260, background: '#1c1c1e', borderRadius: 36, padding: '16px 12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ background: '#2c2c2e', borderRadius: 24, overflow: 'hidden' }}>
          <div style={{ background: '#1c1c1e', padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid #3a3a3c' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#98989e', fontWeight: 600 }}>Messages</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#fff', fontWeight: 600 }}>T&S Services</p>
          </div>
          <div style={{ padding: '16px 12px', minHeight: 120 }}>
            {text ? (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ maxWidth: '80%', background: '#3a3a3c', borderRadius: '16px 16px 16px 4px', padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#fff', lineHeight: 1.5, wordBreak: 'break-word' }}>{text}</p>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#636366', fontSize: 12, margin: '20px 0' }}>Preview appears here</p>
            )}
          </div>
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
  const updateTemplate = useUpdateTemplate()
  const { showSuccess, showError } = useToast()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const [form, setForm] = useState({ name: '', channel: 'EMAIL' as 'EMAIL' | 'SMS', subject: '', smsBody: '' })
  const [isDirty, setIsDirty] = useState(false)

  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks)
  const [themeId, setThemeId] = useState('ocean')
  const [legacyHtml, setLegacyHtml] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isEditing = isCreating || selectedId !== null
  const selected = templates.data?.find(t => t.id === selectedId) ?? null
  const isSaving = createTemplate.isPending || updateTemplate.isPending

  useEffect(() => {
    if (form.channel === 'EMAIL' && !legacyHtml) {
      setPreviewHtml(buildHtml(blocks, themeId))
    }
  }, [blocks, themeId, form.channel, legacyHtml])

  const selectTemplate = (t: { id: string; channel: string; name: string; subject?: string; htmlBody?: string; smsBody?: string }) => {
    setSelectedId(t.id)
    setIsCreating(false)
    setIsDirty(false)
    setLegacyHtml(null)
    const ch = t.channel as 'EMAIL' | 'SMS'
    setForm({ name: t.name, channel: ch, subject: t.subject ?? '', smsBody: t.smsBody ?? '' })
    if (ch === 'EMAIL') {
      const html = t.htmlBody ?? ''
      const extracted = extractBlocks(html)
      if (extracted) {
        setBlocks(extracted.blocks)
        setThemeId(extracted.themeId)
        setPreviewHtml(buildHtml(extracted.blocks, extracted.themeId))
      } else {
        setBlocks(initialBlocks())
        setLegacyHtml(html)
        setPreviewHtml(html)
      }
    } else {
      setPreviewHtml('')
    }
  }

  const startCreate = () => {
    setSelectedId(null)
    setIsCreating(true)
    setIsDirty(false)
    setLegacyHtml(null)
    setForm({ name: '', channel: 'EMAIL', subject: '', smsBody: '' })
    const b = initialBlocks()
    setBlocks(b)
    setThemeId('ocean')
    setPreviewHtml(buildHtml(b, 'ocean'))
  }

  const handleCancel = () => {
    setSelectedId(null)
    setIsCreating(false)
    setIsDirty(false)
    setLegacyHtml(null)
  }

  const switchToBuilder = () => {
    setLegacyHtml(null)
    const b = initialBlocks()
    setBlocks(b)
    setThemeId('ocean')
    setPreviewHtml(buildHtml(b, 'ocean'))
    setIsDirty(true)
  }

  const setField = (field: keyof typeof form, value: string) => {
    setForm(p => ({ ...p, [field]: value }))
    setIsDirty(true)
    if (field === 'channel') {
      setLegacyHtml(null)
      if (value === 'EMAIL') {
        const b = initialBlocks()
        setBlocks(b)
        setThemeId('ocean')
        setPreviewHtml(buildHtml(b, 'ocean'))
      } else {
        setPreviewHtml('')
      }
    }
    if (field === 'smsBody') {
      if (previewTimer.current) clearTimeout(previewTimer.current)
      previewTimer.current = setTimeout(() => setPreviewHtml(value), 300)
    }
  }

  const handleBlocksChange = (next: EmailBlock[]) => {
    setBlocks(next)
    setIsDirty(true)
  }

  const handleThemeChange = (id: string) => {
    setThemeId(id)
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return showError('Name is required')
    if (form.channel === 'SMS' && !form.smsBody.trim()) return showError('SMS body is required')
    try {
      const htmlBody = form.channel === 'EMAIL' ? buildHtml(blocks, themeId) : undefined
      const payload = {
        name: form.name, channel: form.channel,
        subject: form.channel === 'EMAIL' ? form.subject : undefined,
        htmlBody,
        smsBody: form.channel === 'SMS' ? form.smsBody : undefined,
      }
      if (isCreating) {
        const created = await createTemplate.mutateAsync(payload)
        showSuccess('Template created')
        setIsCreating(false)
        setSelectedId(created.id)
        setIsDirty(false)
        setLegacyHtml(null)
      } else if (selectedId) {
        await updateTemplate.mutateAsync({ id: selectedId, data: payload })
        showSuccess('Changes saved')
        setIsDirty(false)
        setLegacyHtml(null)
      }
    } catch { showError('Failed to save template') }
  }

  const handleSeed = async () => {
    try {
      const { seeded } = await seedDefaults.mutateAsync()
      showSuccess(seeded > 0 ? `${seeded} templates seeded` : 'Defaults already exist')
    } catch { showError('Failed to seed templates') }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id)
      showSuccess('Template deleted')
      setDeleteTarget(null)
      setSelectedId(null)
      setIsCreating(false)
    } catch { showError('Failed to delete template'); setDeleteTarget(null) }
  }

  const currentTheme = EMAIL_THEMES.find(t => t.id === themeId) ?? EMAIL_THEMES[0]

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 220px)', minHeight: 600 }}>
      {deleteTarget && (
        <ConfirmModal title="Delete Template" message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete" isPending={deleteTemplate.isPending} onConfirm={confirmDelete}
          onClose={() => !deleteTemplate.isPending && setDeleteTarget(null)} />
      )}

      {/* ── Left: Template List ── */}
      <div style={{ width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header" style={{ gap: 6, flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <div className="card-title">Templates</div>
              <div className="card-subtitle">{templates.data?.length ?? 0} total</div>
            </div>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={handleSeed} disabled={seedDefaults.isPending} title="Seed Defaults">
              {seedDefaults.isPending ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
            </button>
            <button className="btn btn-primary btn-sm btn-icon" onClick={startCreate} title="New Template">
              <Plus size={13} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {templates.isLoading ? <div style={{ padding: 16 }}><Spinner /></div> : (
              <>
                {isCreating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--blue-glow)', border: '1px solid var(--blue)', marginBottom: 4 }}>
                    <ChannelBadge channel={form.channel} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {form.name || 'New Template'}
                    </span>
                  </div>
                )}
                {!templates.data?.length && !isCreating && (
                  <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>No templates yet — seed defaults or create one</p>
                  </div>
                )}
                {templates.data?.map(t => {
                  const isSelected = t.id === selectedId
                  return (
                    <button key={t.id} onClick={() => selectTemplate(t)} style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
                      marginBottom: 2,
                      background: isSelected ? 'var(--blue-glow)' : 'transparent',
                      outline: isSelected ? '1px solid var(--blue)' : 'none',
                    }}>
                      <ChannelBadge channel={t.channel} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--blue)' : 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </p>
                        {t.subject && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>}
                      </div>
                      {t.isDefault && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--r-full)', background: 'var(--bg-card-2)', color: 'var(--t3)', fontWeight: 700, flexShrink: 0 }}>DEFAULT</span>}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Builder ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!isEditing ? (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty icon={Layout} message="Select a template to edit, or click + to create a new one" />
          </div>
        ) : (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── Top bar ── */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10, marginBottom: form.channel === 'EMAIL' ? 10 : 0 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 4 }}>Template Name</label>
                  <input className="form-input" placeholder="e.g. Summer Tune-Up Offer" value={form.name}
                    onChange={e => setField('name', e.target.value)} style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 4 }}>Channel</label>
                  <select className="form-input" value={form.channel}
                    onChange={e => setField('channel', e.target.value)}
                    disabled={!isCreating}>
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>
              {form.channel === 'EMAIL' && (
                <div>
                  <label className="form-label" style={{ marginBottom: 4 }}>Subject Line</label>
                  <input className="form-input" placeholder="{{customer.firstName}}, your annual tune-up is due…" value={form.subject}
                    onChange={e => setField('subject', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              )}
            </div>

            {/* ── Split: builder left / preview right ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

              {/* ── Builder panel ── */}
              <div style={{ flex: '0 0 48%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--bd)', overflow: 'hidden' }}>
                {form.channel === 'EMAIL' ? (
                  <>
                    {/* Color theme swatches */}
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginRight: 2 }}>THEME</span>
                      {EMAIL_THEMES.map(th => (
                        <button key={th.id} onClick={() => handleThemeChange(th.id)} title={th.name}
                          style={{ width: 22, height: 22, borderRadius: '50%', background: th.dot, border: themeId === th.id ? '3px solid var(--t1)' : '2px solid transparent', cursor: 'pointer', outline: 'none', flexShrink: 0, boxShadow: themeId === th.id ? '0 0 0 1px var(--t1)' : 'none' }} />
                      ))}
                      <span style={{ fontSize: 11, color: 'var(--t2)', marginLeft: 4 }}>{currentTheme.name}</span>
                    </div>

                    {legacyHtml ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
                        <div style={{ textAlign: 'center', maxWidth: 280 }}>
                          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>This template uses custom HTML</p>
                          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>Switch to the visual builder to edit with simple fields. You'll start fresh but can keep the preview as a reference.</p>
                          <button className="btn btn-primary btn-sm" onClick={switchToBuilder}>
                            <Layout size={12} /> Switch to Visual Builder
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
                        <BlockList blocks={blocks} themeId={themeId} onChange={handleBlocksChange} />
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)' }}>SMS BODY</span>
                      <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 'auto' }}>{form.smsBody.length}/160</span>
                    </div>
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea className="form-input" value={form.smsBody} onChange={e => setField('smsBody', e.target.value)}
                        rows={8} placeholder="Hi {{customer.firstName}}, your service reminder from {{company.name}}: {{trackedLink}} Reply STOP to opt out."
                        style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.7, padding: '10px 12px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>INSERT:</span>
                        {MERGE_TAGS.map(mt => (
                          <button key={mt.tag} onClick={() => setField('smsBody', form.smsBody + mt.tag)} style={{
                            padding: '2px 8px', borderRadius: 'var(--r-full)', border: '1px solid var(--violet)',
                            background: 'var(--violet-dim)', color: 'var(--violet)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}>{mt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Preview panel ── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: form.channel === 'EMAIL' ? '#f0f4f8' : 'var(--bg-card-2)' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--bd)', background: 'var(--bg-card)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)' }}>LIVE PREVIEW</span>
                  {form.channel === 'EMAIL' && !legacyHtml && (
                    <span style={{ fontSize: 10, marginLeft: 'auto', padding: '1px 6px', borderRadius: 'var(--r-full)', background: `${currentTheme.dot}22`, color: currentTheme.dot }}>
                      {currentTheme.name} theme
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {form.channel === 'EMAIL' ? (
                    previewHtml ? (
                      <iframe srcDoc={previewHtml} title="Email Preview" sandbox="allow-same-origin"
                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>Add blocks to see preview</p>
                      </div>
                    )
                  ) : (
                    <SmsPhoneMockup text={form.smsBody} />
                  )}
                </div>
              </div>
            </div>

            {/* ── Action bar ── */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleCancel}>Cancel</button>
              {selectedId && !selected?.isDefault && (
                <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget({ id: selectedId, name: selected?.name ?? '' })} style={{ color: 'var(--red)' }}>
                  <Trash2 size={13} /> Delete
                </button>
              )}
              <div style={{ flex: 1 }} />
              {isDirty && <span style={{ fontSize: 11, color: 'var(--t3)' }}>Unsaved changes</span>}
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSaving || !isDirty}>
                {isSaving ? <><Loader2 size={12} className="spin" /> Saving…</> : <><Save size={12} /> Save Template</>}
              </button>
            </div>
          </div>
        )}
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

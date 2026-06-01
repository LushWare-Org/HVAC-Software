import {
  Wifi, WifiOff, Thermometer, Droplets,
  AlertTriangle, RefreshCw, Plug, Trash2, Zap, Mail,
  TrendingDown, CheckCircle2, Activity,
} from 'lucide-react'
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import {
  useCustomerIotDevices,
  useDisconnectIot,
  useDevSeedIot,
  useDevTriggerIotAlerts,
  useConnectHoneywell,
  useConnectNest,
  useSendIotConnectLink,
  useIotDeviceHistory,
  type IotDeviceSnapshot,
  type IotHistoryPoint,
} from '../../hooks/useIot'

interface Props {
  customerId: string
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

// ── Performance detection (mirrors backend logic) ─────────────────────────────
// Returns 'good' | 'underperforming' | 'idle' | 'unknown'
type PerfStatus = 'good' | 'underperforming' | 'idle' | 'unknown'
const PERF_MIN_SAMPLES = 4
const PERF_DELTA_F = 4

function evaluatePerformance(history: IotHistoryPoint[] | undefined, current: IotDeviceSnapshot): PerfStatus {
  if (!history || history.length < PERF_MIN_SAMPLES) return 'unknown'
  if (current.hvacState !== 'HEATING' && current.hvacState !== 'COOLING') return 'idle'

  // Last 2h window — assumes ~12 points
  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  const recent = history.filter(p => new Date(p.recordedAt).getTime() >= cutoff).slice(-12)
  if (recent.length < PERF_MIN_SAMPLES) return 'good'

  let consecutiveBad = 0
  for (let i = recent.length - 1; i >= 0; i--) {
    const s = recent[i].snapshot
    if (s.hvacState !== 'HEATING' && s.hvacState !== 'COOLING') { consecutiveBad = 0; continue }
    const target = s.hvacState === 'HEATING' ? s.heatSetpointF : s.coolSetpointF
    const gap = s.hvacState === 'HEATING' ? target - s.currentTempF : s.currentTempF - target
    if (gap >= PERF_DELTA_F) {
      consecutiveBad++
      if (consecutiveBad >= PERF_MIN_SAMPLES) return 'underperforming'
    } else {
      consecutiveBad = 0
    }
  }
  return 'good'
}

function PerformanceBadge({ status }: { status: PerfStatus }) {
  if (status === 'unknown') return null
  const map: Record<Exclude<PerfStatus, 'unknown'>, { label: string; icon: typeof CheckCircle2; bg: string; color: string; bd: string }> = {
    good:            { label: 'Performing well',      icon: CheckCircle2,  bg: '#ECFDF5', color: '#047857', bd: '#A7F3D0' },
    underperforming: { label: 'Underperforming',      icon: TrendingDown,  bg: '#FEF2F2', color: '#B91C1C', bd: '#FECACA' },
    idle:            { label: 'Idle',                 icon: Activity,      bg: '#F3F4F6', color: '#6B7280', bd: '#E5E7EB' },
  }
  const cfg = map[status]
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-700 px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bd}` }}
    >
      <Icon size={10} /> {cfg.label}
    </span>
  )
}

// ── 24h Temperature sparkline ─────────────────────────────────────────────────
function TempSparkline({ history, snapshot }: { history: IotHistoryPoint[] | undefined; snapshot: IotDeviceSnapshot }) {
  if (!history || history.length < 2) {
    return (
      <div
        className="rounded-lg border border-dashed text-[10px] flex items-center justify-center"
        style={{ borderColor: 'var(--bd)', color: 'var(--t3)', height: 70 }}
      >
        Gathering history…
      </div>
    )
  }

  const data = history.map(p => ({
    t: new Date(p.recordedAt).getTime(),
    temp: p.snapshot.currentTempF,
  }))
  const target = snapshot.hvacMode === 'HEAT' ? snapshot.heatSetpointF : snapshot.coolSetpointF
  const isHeat = snapshot.hvacMode === 'HEAT' || snapshot.hvacState === 'HEATING'
  const accent = isHeat ? '#F97316' : '#3B82F6'
  const accentSoft = isHeat ? 'rgba(249,115,22,0.18)' : 'rgba(59,130,246,0.18)'

  const temps = data.map(d => d.temp)
  const minT = Math.min(...temps, target) - 2
  const maxT = Math.max(...temps, target) + 2

  return (
    <div style={{ height: 70, marginTop: 6, marginBottom: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`tempFill-${snapshot.deviceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[minT, maxT]} />
          <ReferenceLine
            y={target}
            stroke={accent}
            strokeDasharray="3 3"
            strokeOpacity={0.6}
            label={{
              value: `${target}°`,
              position: 'right',
              fontSize: 9,
              fill: accent,
              fontWeight: 700,
            }}
          />
          <Area
            type="monotone"
            dataKey="temp"
            stroke={accent}
            strokeWidth={1.8}
            fill={`url(#tempFill-${snapshot.deviceId})`}
            isAnimationActive={false}
            dot={false}
          />
          <Tooltip
            cursor={{ stroke: accentSoft, strokeWidth: 12 }}
            contentStyle={{
              fontSize: 11,
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid var(--bd)',
              background: 'var(--bg-card)',
            }}
            formatter={(v) => [`${v}°F`, 'Temp'] as [string, string]}
            labelFormatter={(t) =>
              new Date(t as number).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function HvacStateBadge({ state }: { state: string }) {
  const styles: Record<string, { label: string; bg: string; color: string }> = {
    HEATING: { label: 'Heating', bg: '#FFF3E0', color: '#F97316' },
    COOLING: { label: 'Cooling', bg: '#EFF6FF', color: '#3B82F6' },
    IDLE:    { label: 'Idle',    bg: '#F3F4F6', color: '#6B7280' },
    OFF:     { label: 'Off',     bg: '#F9FAFB', color: '#9CA3AF' },
  }
  const s = styles[state] ?? styles.OFF
  return (
    <span
      className="text-[10px] font-700 px-2 py-0.5 rounded-full border"
      style={{ background: s.bg, color: s.color, borderColor: s.color + '50' }}
    >
      {s.label}
    </span>
  )
}

function DeviceCard({ device }: { device: IotDeviceSnapshot }) {
  const offline = !device.online
  const emergency = device.emergencyHeat
  const { data: history } = useIotDeviceHistory(device.deviceId, 24)
  const perfStatus = evaluatePerformance(history, device)
  const isUnderperforming = perfStatus === 'underperforming'

  return (
    <div
      className="rounded-xl border p-4 mb-3 transition-all"
      style={{
        borderColor: emergency ? '#EF4444' : isUnderperforming ? '#F97316' : 'var(--bd)',
        background: emergency ? '#FEF2F2' : isUnderperforming ? '#FFF7ED' : 'var(--bg-card)',
        boxShadow: emergency ? '0 0 0 2px #EF444430' : isUnderperforming ? '0 0 0 2px #F9731620' : undefined,
      }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Thermometer size={14} style={{ color: 'var(--blue-light)', flexShrink: 0 }} />
          <span className="font-700 text-sm truncate" style={{ color: 'var(--t1)' }}>
            {device.name}
          </span>
          <span
            className="text-[9px] font-600 px-1.5 py-0.5 rounded shrink-0"
            style={{ background: 'var(--bg-surface)', color: 'var(--t3)' }}
          >
            {device.provider === 'honeywell' ? 'Honeywell' : 'Nest'}
          </span>
        </div>
        <div className="shrink-0 ml-2">
          {offline ? (
            <span className="flex items-center gap-1 text-[11px] font-600 text-red-500">
              <WifiOff size={11} /> Offline
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-600 text-green-600">
              <Wifi size={11} /> Online
            </span>
          )}
        </div>
      </div>

      {/* Emergency heat alert */}
      {emergency && (
        <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg bg-red-100 border border-red-200">
          <AlertTriangle size={13} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <p className="font-700 text-red-700">Emergency heat active — heat pump may have failed</p>
            <p className="text-red-600 mt-0.5">Urgent job auto-created in dispatch queue</p>
          </div>
        </div>
      )}

      {/* Underperforming alert (no emergency, but HVAC can't hit setpoint) */}
      {!emergency && isUnderperforming && (
        <div className="flex items-start gap-2 mb-3 p-2.5 rounded-lg" style={{ background: '#FFEDD5', border: '1px solid #FED7AA' }}>
          <TrendingDown size={13} className="shrink-0 mt-0.5" style={{ color: '#C2410C' }} />
          <div className="text-[11px] leading-snug">
            <p className="font-700" style={{ color: '#9A3412' }}>System cannot reach setpoint</p>
            <p style={{ color: '#C2410C', marginTop: 2 }}>High-priority job auto-created for diagnostic</p>
          </div>
        </div>
      )}

      {offline ? (
        <p className="text-[12px]" style={{ color: 'var(--t3)' }}>
          Last seen {formatTime(device.lastSyncedAt)}
        </p>
      ) : (
        <>
          {/* Temps */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <p className="text-[10px] font-500 mb-0.5" style={{ color: 'var(--t3)' }}>
                Current Temp
              </p>
              <p className="text-2xl font-800 leading-none" style={{ color: 'var(--t1)' }}>
                {device.currentTempF}
                <span className="text-base font-500 ml-0.5" style={{ color: 'var(--t2)' }}>°F</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-500 mb-0.5" style={{ color: 'var(--t3)' }}>
                Setpoint
              </p>
              <p className="text-2xl font-800 leading-none" style={{ color: 'var(--t2)' }}>
                {device.hvacMode === 'HEAT' ? device.heatSetpointF : device.coolSetpointF}
                <span className="text-base font-500 ml-0.5">°F</span>
              </p>
            </div>
          </div>

          {/* 24h sparkline */}
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-600 uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
              Last 24h
            </span>
            <PerformanceBadge status={perfStatus} />
          </div>
          <TempSparkline history={history} snapshot={device} />

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <HvacStateBadge state={device.hvacState} />
            <span
              className="flex items-center gap-1 text-[11px]"
              style={{ color: 'var(--t3)' }}
            >
              <Droplets size={10} /> {device.humidity}% humidity
            </span>
            <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
              Mode: {device.hvacMode}
            </span>
          </div>

          {/* Heat range */}
          <div className="flex items-center gap-2 mb-2 text-[10px]" style={{ color: 'var(--t3)' }}>
            <span>Heat ≥ {device.heatSetpointF}°F</span>
            <span>·</span>
            <span>Cool ≤ {device.coolSetpointF}°F</span>
          </div>

          <p className="text-[10px]" style={{ color: 'var(--t3)' }}>
            Synced {formatTime(device.lastSyncedAt)}
          </p>
        </>
      )}
    </div>
  )
}

export function IotDevicesTab({ customerId }: Props) {
  const { data, isLoading, isError, refetch, isRefetching } =
    useCustomerIotDevices(customerId)
  const disconnect = useDisconnectIot(customerId)
  const devSeed = useDevSeedIot(customerId)
  const triggerAlerts = useDevTriggerIotAlerts(customerId)
  const connectHoneywell = useConnectHoneywell(customerId)
  const connectNest = useConnectNest(customerId)
  const sendLink = useSendIotConnectLink(customerId)

  const isDev = import.meta.env.DEV
  const connections = data ?? []
  const totalDevices = connections.reduce((s, c) => s + c.devices.length, 0)
  const hasDevices = totalDevices > 0

  // Detect active alerts across all devices
  const allDevices = connections.flatMap(c => c.devices)
  const hasEmergencyHeat = allDevices.some(d => d.emergencyHeat)
  const hasOffline = allDevices.some(d => !d.online)
  const hasAlert = hasEmergencyHeat || hasOffline

  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        {[1, 2].map(i => (
          <div
            key={i}
            className="h-36 rounded-xl animate-pulse"
            style={{ background: 'var(--bg-surface)' }}
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-[12px] text-red-600">
        Failed to load IoT device data. Check network or try again.
      </div>
    )
  }

  return (
    <div className="mt-1">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-600" style={{ color: 'var(--t3)' }}>
          {hasDevices ? `${totalDevices} device${totalDevices !== 1 ? 's' : ''} connected` : 'No devices connected'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh device data"
          >
            <RefreshCw
              size={13}
              className={isRefetching ? 'animate-spin' : ''}
              style={{ color: 'var(--t3)' }}
            />
          </button>
          <button
            onClick={() => {
              if (sendLink.isPending) return
              sendLink.mutate(undefined, {
                onSuccess: () => alert('Connect link emailed to customer ✓'),
                onError: () => alert('Failed to send link — check customer has an email address'),
              })
            }}
            disabled={sendLink.isPending}
            className="flex items-center gap-1.5 text-[11px] font-600 px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--bg-surface)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
            title="Email customer a link to connect their thermostat"
          >
            <Mail size={11} /> {sendLink.isPending ? 'Sending…' : 'Send Link'}
          </button>
          <button
            onClick={connectHoneywell}
            className="flex items-center gap-1.5 text-[11px] font-600 px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: 'var(--blue)', color: '#fff' }}
          >
            <Plug size={11} /> Connect Honeywell
          </button>
          <button
            onClick={connectNest}
            className="flex items-center gap-1.5 text-[11px] font-600 px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: '#34a853', color: '#fff' }}
          >
            <Plug size={11} /> Connect Nest
          </button>
        </div>
      </div>

      {/* Active alert banner */}
      {hasAlert && (
        <div className="mb-3 p-3 rounded-xl border border-red-200 bg-red-50 flex items-start gap-2">
          <AlertTriangle size={13} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            {hasEmergencyHeat && (
              <>
                <p className="text-[11px] font-700 text-red-700">Emergency heat active — heat pump may have failed</p>
                <p className="text-[10px] text-red-600 mt-0.5">An urgent job has been auto-created in the dispatch queue</p>
              </>
            )}
            {hasOffline && (
              <p className="text-[11px] font-600 text-red-600">One or more thermostats offline</p>
            )}
          </div>
        </div>
      )}

      {/* Dev seed banner — only shown in dev mode */}
      {isDev && (
        <div className="mb-3 p-3 rounded-xl border border-dashed border-yellow-400 bg-yellow-50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={11} className="text-yellow-600" />
            <p className="text-[10px] font-700 text-yellow-700">Dev mode — no Honeywell credentials needed</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => devSeed.mutate()}
              disabled={devSeed.isPending || hasDevices}
              className="text-[11px] font-600 px-2.5 py-1 rounded-lg bg-yellow-400 text-yellow-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {devSeed.isPending
                ? 'Seeding...'
                : hasDevices
                ? 'Mock data seeded ✓'
                : 'Seed Mock (incl. emergency + underperforming)'}
            </button>
            {hasDevices && (
              <button
                onClick={() => triggerAlerts.mutate()}
                disabled={triggerAlerts.isPending}
                className="text-[11px] font-600 px-2.5 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Run the IoT alerts cron immediately — creates jobs for emergency & underperforming devices"
              >
                {triggerAlerts.isPending ? 'Running...' : triggerAlerts.isSuccess ? 'Alerts ran ✓ — check Jobs' : 'Trigger Alerts Cron Now'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasDevices && (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--bd)' }}
        >
          <Thermometer size={30} className="mb-2 opacity-30" style={{ color: 'var(--t2)' }} />
          <p className="text-[13px] font-600 mb-1" style={{ color: 'var(--t2)' }}>
            No IoT devices connected
          </p>
          <p
            className="text-[11px] text-center max-w-[200px] leading-relaxed"
            style={{ color: 'var(--t3)' }}
          >
            Connect a Honeywell thermostat to see live temperature, mode, and system data
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={connectHoneywell}
              className="flex items-center gap-1.5 text-[11px] font-600 px-3 py-2 rounded-lg"
              style={{ background: 'var(--blue)', color: '#fff' }}
            >
              <Plug size={11} /> Honeywell Home
            </button>
            <button
              onClick={connectNest}
              className="flex items-center gap-1.5 text-[11px] font-600 px-3 py-2 rounded-lg"
              style={{ background: '#34a853', color: '#fff' }}
            >
              <Plug size={11} /> Google Nest
            </button>
          </div>
        </div>
      )}

      {/* Device cards */}
      {connections.map(conn =>
        conn.devices.map((device: IotDeviceSnapshot) => (
          <DeviceCard key={device.deviceId} device={device} />
        ))
      )}

      {/* Disconnect links */}
      {connections
        .filter(c => c.devices.length > 0)
        .map(conn => (
          <button
            key={conn.provider}
            onClick={() => {
              if (window.confirm(`Disconnect ${conn.provider} from this customer?`)) {
                disconnect.mutate(conn.provider)
              }
            }}
            disabled={disconnect.isPending}
            className="flex items-center gap-1 mt-1 text-[11px] text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={11} /> Disconnect {conn.provider}
          </button>
        ))}
    </div>
  )
}

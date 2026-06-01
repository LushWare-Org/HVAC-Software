import { Wifi, WifiOff, AlertTriangle, RefreshCw, Plug, Trash2, Zap, Thermometer, Droplets, Wind } from 'lucide-react'
import {
  useMyIotDevices, useDisconnectMyIot, useConnectHoneywellPortal, useConnectNestPortal,
  type IotDeviceSnapshot,
} from '../hooks/useMyIot'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

// ── State config ─────────────────────────────────────────────────────────────

const STATE_CONFIG = {
  HEATING: { label: 'Heating',  color: '#F97316', glow: 'rgba(249,115,22,0.18)', dim: 'rgba(249,115,22,0.1)' },
  COOLING: { label: 'Cooling',  color: '#3B82F6', glow: 'rgba(59,130,246,0.18)', dim: 'rgba(59,130,246,0.1)' },
  IDLE:    { label: 'Idle',     color: '#94A3B8', glow: 'transparent',           dim: 'rgba(148,163,184,0.08)' },
  OFF:     { label: 'Off',      color: '#64748B', glow: 'transparent',           dim: 'rgba(100,116,139,0.08)' },
} as const

// ── SVG Temperature Gauge ─────────────────────────────────────────────────────

const SIZE = 128
const CX = SIZE / 2
const CY = SIZE / 2
const R = 48
const CIRC = 2 * Math.PI * R
const ARC_DEG = 240
const ARC_LEN = CIRC * (ARC_DEG / 360)   // ~201.06
const GAP_LEN = CIRC - ARC_LEN           // ~86.17
const MIN_T = 55
const MAX_T = 95

function TempGauge({ temp, state }: { temp: number; state: keyof typeof STATE_CONFIG }) {
  const cfg = STATE_CONFIG[state] ?? STATE_CONFIG.OFF
  const pct = Math.max(0, Math.min(1, (temp - MIN_T) / (MAX_T - MIN_T)))
  const filled = ARC_LEN * pct

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
      {/* Track arc */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${ARC_LEN} ${GAP_LEN}`}
        transform={`rotate(150, ${CX}, ${CY})`}
      />
      {/* Filled arc */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={cfg.color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${CIRC - filled}`}
        transform={`rotate(150, ${CX}, ${CY})`}
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }}
      />
      {/* Glow dot at tip */}
      {pct > 0.01 && (
        <circle
          cx={CX + R * Math.cos((150 + pct * ARC_DEG) * Math.PI / 180)}
          cy={CY + R * Math.sin((150 + pct * ARC_DEG) * Math.PI / 180)}
          r="4"
          fill={cfg.color}
          style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }}
        />
      )}
    </svg>
  )
}

// ── Online pulse dot ─────────────────────────────────────────────────────────

function StatusDot({ online }: { online: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10 }}>
      {online && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'var(--green)', opacity: 0.4,
          animation: 'pulse-ring 2s ease-out infinite',
        }} />
      )}
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: online ? 'var(--green)' : 'var(--t4)',
        flexShrink: 0,
      }} />
    </span>
  )
}

// ── Device Card ───────────────────────────────────────────────────────────────

function DeviceCard({ device, onDisconnect, index }: {
  device: IotDeviceSnapshot
  onDisconnect: () => void
  index: number
}) {
  const cfg = STATE_CONFIG[device.hvacState as keyof typeof STATE_CONFIG] ?? STATE_CONFIG.OFF
  const offline = !device.online
  const emergency = device.emergencyHeat
  const isHoneywell = device.provider === 'honeywell'

  const setpoint = device.hvacMode === 'HEAT' ? device.heatSetpointF : device.coolSetpointF

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${index * 80}ms`,
        opacity: 0,
        animationFillMode: 'forwards',
        background: 'var(--bg-card)',
        border: `1px solid ${emergency ? 'var(--red)' : 'var(--bd)'}`,
        borderRadius: 20,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        boxShadow: emergency
          ? '0 0 0 3px rgba(239,68,68,0.12), 0 4px 20px rgba(239,68,68,0.1)'
          : `0 0 0 0 transparent, 0 2px 12px rgba(0,0,0,0.06)`,
      }}
    >
      {/* State accent bar */}
      <div style={{
        height: 3,
        background: offline ? 'var(--bd)' : `linear-gradient(90deg, ${cfg.color}, ${cfg.color}80)`,
        transition: 'background 0.4s',
      }} />

      <div style={{ padding: '20px 20px 16px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <StatusDot online={device.online} />
              <span style={{
                fontSize: 14, fontWeight: 700, color: 'var(--t1)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {device.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px',
                borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase',
                background: isHoneywell ? 'rgba(37,99,235,0.1)' : 'rgba(52,168,83,0.1)',
                color: isHoneywell ? 'var(--blue)' : '#34a853',
                border: `1px solid ${isHoneywell ? 'rgba(37,99,235,0.2)' : 'rgba(52,168,83,0.2)'}`,
              }}>
                {isHoneywell ? 'Honeywell' : 'Google Nest'}
              </span>
              {offline && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 11, color: 'var(--t4)',
                }}>
                  <WifiOff size={10} /> offline
                </span>
              )}
            </div>
          </div>
          {!offline && (
            <span style={{
              fontSize: 10, color: 'var(--t4)', marginTop: 2, flexShrink: 0, marginLeft: 8,
            }}>
              {formatTime(device.lastSyncedAt)}
            </span>
          )}
        </div>

        {/* Emergency heat banner */}
        {emergency && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            padding: '10px 12px', borderRadius: 10,
            background: 'var(--red-dim)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}>
            <AlertTriangle size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', lineHeight: 1.4 }}>
              Emergency heat active — your heat pump may need service
            </span>
          </div>
        )}

        {/* Main content */}
        {offline ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '16px 0 8px', gap: 6,
          }}>
            <WifiOff size={28} style={{ color: 'var(--t4)', opacity: 0.5 }} />
            <p style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center' }}>
              Last seen {formatTime(device.lastSyncedAt)}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Temperature gauge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <TempGauge temp={device.currentTempF} state={device.hvacState as keyof typeof STATE_CONFIG} />
              {/* Center content */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{
                  fontSize: 26, fontWeight: 800, lineHeight: 1,
                  color: offline ? 'var(--t3)' : cfg.color,
                  transition: 'color 0.4s',
                }}>
                  {device.currentTempF}°
                </span>
                <span style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 500, marginTop: 1 }}>
                  now
                </span>
              </div>
            </div>

            {/* Stats column */}
            <div style={{ flex: 1, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* HVAC state badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 99, alignSelf: 'flex-start',
                background: cfg.dim, border: `1px solid ${cfg.color}30`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: '0.03em' }}>
                  {cfg.label}
                </span>
              </div>

              {/* Setpoint */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Thermometer size={12} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1 }}>Setpoint</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t2)', lineHeight: 1.2 }}>
                    {setpoint}°F
                  </div>
                </div>
              </div>

              {/* Humidity + Mode row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Droplets size={11} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{device.humidity}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wind size={11} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>{device.hvacMode}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 20px', borderTop: '1px solid var(--bd)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {!offline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Wifi size={10} style={{ color: 'var(--green)' }} />
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>
              Synced {formatTime(device.lastSyncedAt)}
            </span>
          </div>
        )}
        {offline && <div />}
        <button
          onClick={onDisconnect}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: 'var(--t4)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--t4)')}
        >
          <Trash2 size={10} />
          Disconnect
        </button>
      </div>
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--bd)',
      borderRadius: 20, overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: 'var(--bd)' }} />
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bd)', flexShrink: 0, marginTop: 3 }} />
          <div>
            <div style={{ width: 120, height: 14, borderRadius: 6, background: 'var(--bd)', marginBottom: 8 }} />
            <div style={{ width: 72, height: 18, borderRadius: 99, background: 'var(--bd)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 128, height: 128, borderRadius: '50%', background: 'var(--bg-card-2)', flexShrink: 0,
            animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ width: 64, height: 22, borderRadius: 99, background: 'var(--bd)' }} />
            <div style={{ width: 80, height: 18, borderRadius: 6, background: 'var(--bd)' }} />
            <div style={{ width: 96, height: 14, borderRadius: 6, background: 'var(--bd)' }} />
          </div>
        </div>
      </div>
      <div style={{ height: 41, borderTop: '1px solid var(--bd)', background: 'var(--bg-card-2)' }} />
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onHoneywell, onNest }: { onHoneywell: () => void; onNest: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      padding: '56px 24px',
      background: 'var(--bg-card)',
      border: '1px dashed var(--bd)',
      borderRadius: 20,
    }}>
      {/* Icon cluster */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--bg-card-2)',
          border: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Thermometer size={32} style={{ color: 'var(--t4)' }} />
        </div>
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--bg-card)', border: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wifi size={12} style={{ color: 'var(--t4)' }} />
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>
        No thermostats connected
      </h3>
      <p style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 280, lineHeight: 1.6, marginBottom: 28 }}>
        Connect your smart thermostat so your service team can monitor your home remotely and respond faster when something goes wrong.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={onHoneywell} className="btn btn-primary">
          <Plug size={13} /> Connect Honeywell
        </button>
        <button onClick={onNest} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0 16px', height: 34, borderRadius: 8,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
          background: '#34a853', color: '#fff',
          fontFamily: 'inherit',
        }}>
          <Plug size={13} /> Connect Nest
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Devices() {
  const { data, isLoading, isError, refetch, isRefetching } = useMyIotDevices()
  const disconnect = useDisconnectMyIot()
  const connectHoneywell = useConnectHoneywellPortal()
  const connectNest = useConnectNestPortal()

  const connections = data ?? []
  const allDevices = connections.flatMap(c =>
    c.devices.map((d: IotDeviceSnapshot) => ({ ...d, connProvider: c.provider }))
  )
  const totalDevices = allDevices.length
  const onlineCount = allDevices.filter(d => d.online).length
  const hasEmergency = allDevices.some(d => d.emergencyHeat)

  return (
    <div className="page">
      {/* Inline keyframe for pulse animation */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.4; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

      {/* Page header */}
      <div className="page-header">
        <div className="topbar-left">
          <h1 className="topbar-title">My Devices</h1>
          <p className="topbar-subtitle">
            {isLoading ? 'Loading…' : totalDevices === 0
              ? 'No thermostats connected'
              : `${onlineCount} of ${totalDevices} thermostat${totalDevices !== 1 ? 's' : ''} online`}
          </p>
        </div>

        <div className="page-actions">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="btn btn-secondary btn-icon"
            title="Refresh"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          </button>
          <button onClick={connectHoneywell} className="btn btn-primary btn-sm">
            <Plug size={12} /> Honeywell
          </button>
          <button onClick={connectNest} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0 12px', height: 28, borderRadius: 6,
            fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: '#34a853', color: '#fff', fontFamily: 'inherit',
          }}>
            <Plug size={12} /> Nest
          </button>
        </div>
      </div>

      {/* Emergency banner */}
      {hasEmergency && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12, marginBottom: 20,
          background: 'var(--red-dim)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>
              Emergency heat active
            </p>
            <p style={{ fontSize: 12, color: 'var(--red)', opacity: 0.8 }}>
              One or more thermostats are running on emergency heat — your heat pump may have failed. Contact your service team.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div style={{
          padding: '14px 16px', borderRadius: 12, marginBottom: 20,
          background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
          fontSize: 13, color: 'var(--red)',
        }}>
          Failed to load device data. Please refresh and try again.
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && totalDevices === 0 && (
        <EmptyState onHoneywell={connectHoneywell} onNest={connectNest} />
      )}

      {/* Device grid */}
      {!isLoading && totalDevices > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          {connections.map(conn =>
            conn.devices.map((device: IotDeviceSnapshot, idx: number) => (
              <DeviceCard
                key={device.deviceId}
                device={device}
                index={idx}
                onDisconnect={() => {
                  if (window.confirm(`Disconnect ${conn.provider} from your account?`)) {
                    disconnect.mutate(conn.provider)
                  }
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Why connect info box */}
      {!isLoading && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '16px 18px', borderRadius: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--bd)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={15} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>
              Why connect your thermostat?
            </p>
            <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
              Your service team can see live temperature readings, detect emergency heat events, and respond faster — without you needing to call.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

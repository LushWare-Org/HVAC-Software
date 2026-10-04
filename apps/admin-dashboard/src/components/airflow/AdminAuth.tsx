import { useEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import { useIsFetching } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { AF, AirflowCurve, DuctDiagram, DuctFlow, Wordmark } from './AirflowArt'

const ROOT_STYLE = {
  background: AF.navy,
  color: AF.text,
  fontFamily: "'Public Sans', system-ui, sans-serif",
  '--af-focus': AF.accent,
} as CSSProperties

/** Dark split screen: airflow diagram on the left (desktop only), form on the right. */
export function AdminAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="af-root relative min-h-screen w-full flex" style={ROOT_STYLE}>
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <AirflowCurve width={600} height={800} opacity={0.2} />
        <DuctDiagram />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full af-drift"
              style={{
                left: `${15 + i * 12}%`,
                top: `${30 + (i % 3) * 20}%`,
                background: i % 2 === 0 ? AF.supply : AF.return,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>

      <main className="w-full lg:w-[440px] xl:w-[480px] min-h-screen flex flex-col px-6 sm:px-8 lg:px-12 py-6 relative" style={{ background: AF.panel }}>
        <Wordmark />
        <div className="flex-1 flex items-center py-10">
          <div className="max-w-sm w-full mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="text-2xl font-semibold leading-tight mb-1">{title}</h1>
      <p className="text-sm mb-8" style={{ color: AF.textMuted }}>{subtitle}</p>
    </>
  )
}

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const color = tone === 'error' ? AF.red : AF.green
  const Icon = tone === 'error' ? AlertTriangle : CheckCircle2
  return (
    <div
      className="flex items-start gap-3 mb-6 px-4 py-3 rounded-lg text-sm"
      style={{ background: `${color}1f`, border: `1px solid ${color}66` }}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={16} style={{ color }} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icon: ReactNode; invalid?: boolean }

export function AuthField({ id, label, icon, invalid, type, ...rest }: FieldProps) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-medium mb-2" style={{ color: AF.textMuted }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: AF.textMuted }} aria-hidden="true">{icon}</span>
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={invalid || undefined}
          className={`af-input w-full h-12 pl-10 ${isPassword ? 'pr-12' : 'pr-3'} text-base sm:text-sm rounded-lg bg-transparent border outline-none transition-colors focus:bg-white/5`}
          style={{ borderColor: invalid ? AF.red : AF.inputBorder, color: AF.text }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/5"
            style={{ color: AF.textMuted }}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

export function AuthSubmit({ busy, busyLabel, children, disabled }: { busy: boolean; busyLabel: string; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: AF.accent, color: '#fff' }}
    >
      {busy ? (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <path d="M8 2a6 6 0 0 1 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {busyLabel}
        </>
      ) : children}
    </button>
  )
}

export function AdminLoadingScreen() {
  const rows = [
    { label: 'Jobs', color: AF.accent, delay: '0s', max: '80%' },
    { label: 'Technicians', color: AF.supply, delay: '0.25s', max: '55%' },
    { label: 'Live locations', color: AF.green, delay: '0.5s', max: '35%' },
  ]
  return (
    <div className="af-root fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-6" style={ROOT_STYLE}>
      <AirflowCurve width={1280} height={800} opacity={0.12} />
      <div className="absolute top-6 left-6 sm:left-8 z-10"><Wordmark /></div>
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="mb-10"><DuctFlow /></div>
        <div className="text-center" role="status" aria-live="polite">
          <h2 className="text-xl font-semibold mb-2">Opening your dispatch board</h2>
          <p className="text-sm" style={{ color: AF.textMuted }}>Loading today's jobs, technicians and live locations.</p>
        </div>
        <div className="mt-10 w-full space-y-3" aria-hidden="true">
          {rows.map(r => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="text-xs w-24 sm:w-28 text-right" style={{ color: AF.textMuted }}>{r.label}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full af-row-fill" style={{ background: r.color, animationDelay: r.delay, maxWidth: r.max }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Shown right after sign-in, over the dashboard as it mounts. Leaves once the
 * dashboard's first requests have settled: at least 700 ms so it never just
 * flickers, and at most 6 s so a slow service can't hold the user here.
 */
export function SignInTransition({ onDone }: { onDone: () => void }) {
  const fetching = useIsFetching()
  const started = useRef(Date.now())
  const [sawFetch, setSawFetch] = useState(false)

  useEffect(() => { if (fetching > 0) setSawFetch(true) }, [fetching])

  useEffect(() => {
    const cap = window.setTimeout(onDone, 6000)
    return () => window.clearTimeout(cap)
  }, [onDone])

  useEffect(() => {
    if (fetching > 0) return
    const settleAfter = sawFetch ? 0 : 1500
    const wait = Math.max(700 - (Date.now() - started.current), settleAfter)
    const t = window.setTimeout(onDone, wait)
    return () => window.clearTimeout(t)
  }, [fetching, sawFetch, onDone])

  return <AdminLoadingScreen />
}

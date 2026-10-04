import { useEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react'
import { useIsFetching } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Wind } from 'lucide-react'
import { AF, AirflowCurve, CurveFlow, Wordmark } from './AirflowArt'

const ROOT_STYLE = {
  color: AF.text,
  fontFamily: "'Public Sans', system-ui, sans-serif",
  '--af-focus': AF.accent,
} as CSSProperties

const VISIT_STEPS = [
  { label: 'Booked', short: 'Booked', when: 'Yesterday', state: 'done' as const },
  { label: 'Technician confirmed', short: 'Confirmed', when: 'Yesterday', state: 'done' as const },
  { label: 'On the way', short: 'On the way', when: 'Arriving 10:30 to 11:00', state: 'active' as const },
  { label: 'Work done', short: 'Done', when: 'Coming up', state: 'pending' as const },
]
const dotColor = (s: 'done' | 'active' | 'pending') => (s === 'done' ? AF.green : s === 'active' ? AF.return : AF.border)

/** An example of what a customer sees once signed in. Illustration only. */
function HomePreview() {
  return (
    <div className="max-w-md w-full" aria-hidden="true">
      <div className="p-5 rounded-2xl mb-8" style={{ background: AF.white, border: `1px solid ${AF.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wind size={18} style={{ color: AF.supply }} />
            <span className="text-sm font-medium">Your home</span>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,168,106,0.12)', color: AF.greenText }}>Comfortable</span>
        </div>
        <div className="flex items-end gap-1 h-12">
          {[0.4, 0.6, 0.8, 1, 0.9, 0.7, 0.5, 0.3, 0.4, 0.6, 0.8, 0.7].map((h, i) => (
            <div key={i} className="flex-1 af-wave" style={{ height: `${h * 100}%`, background: i % 2 === 0 ? AF.supply : AF.return, opacity: 0.45, borderRadius: 2, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs tabular-nums" style={{ color: AF.muted }}>
          <span>Supply 14°C</span>
          <span>Return 22°C</span>
        </div>
      </div>

      <div className="text-sm font-medium mb-3" style={{ color: AF.muted }}>Next visit</div>
      {VISIT_STEPS.map((step, i) => (
        <div key={step.label} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: dotColor(step.state) }} />
            {i < VISIT_STEPS.length - 1 && <div className="w-px h-12" style={{ background: step.state === 'done' ? AF.green : AF.border }} />}
          </div>
          <div className="pb-8 -mt-0.5">
            <div className="text-sm font-medium">{step.label}</div>
            <div className="text-xs tabular-nums" style={{ color: step.state === 'active' ? AF.returnText : AF.muted }}>{step.when}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VisitStrip() {
  return (
    <div className="mb-5 p-3.5 rounded-2xl" style={{ background: AF.base, border: `1px solid ${AF.border}` }} aria-hidden="true">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium" style={{ color: AF.muted }}>Next visit</span>
        <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,166,83,0.15)', color: AF.returnText }}>10:30 to 11:00</span>
      </div>
      <div className="flex items-center gap-1">
        {VISIT_STEPS.map((step, i) => (
          <div key={step.short} className={`flex items-center gap-1 ${step.state === 'active' ? 'shrink-0' : 'flex-1 min-w-0'}`}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor(step.state) }} />
            <span className="text-[11px] truncate" style={{ color: step.state === 'active' ? AF.text : AF.muted, fontWeight: step.state === 'active' ? 600 : 400 }}>{step.short}</span>
            {i < VISIT_STEPS.length - 1 && <div className="w-2 h-px shrink-0" style={{ background: step.state === 'done' ? AF.green : AF.border }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Light split screen. Desktop: form on the left, a preview of the portal on
 * the right. Phone: a slim header, a one-line visit preview, then the form.
 */
export function CustomerAuthShell({ children, preview = true }: { children: ReactNode; preview?: boolean }) {
  return (
    <div className="af-root relative min-h-screen w-full flex overflow-hidden" style={{ ...ROOT_STYLE, background: AF.base }}>
      <div className="hidden lg:block"><AirflowCurve width={1280} height={800} opacity={0.15} /></div>

      <main className="relative z-10 w-full lg:w-[520px] min-h-screen flex flex-col" style={{ background: AF.white, borderRight: `1px solid ${AF.border}` }}>
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none"><AirflowCurve width={400} height={400} opacity={0.08} /></div>
        <header className="relative h-14 lg:h-auto flex items-center justify-between px-5 lg:px-16 lg:pt-8 border-b lg:border-b-0" style={{ borderColor: AF.border }}>
          <Wordmark />
          <Wind size={18} className="lg:hidden" style={{ color: AF.supply }} aria-hidden="true" />
        </header>
        <div className="relative flex-1 flex flex-col justify-center px-6 lg:px-16 py-6 lg:py-10">
          <div className="max-w-sm w-full mx-auto">
            {preview && <div className="lg:hidden"><VisitStrip /></div>}
            {children}
          </div>
        </div>
      </main>

      <div className="hidden lg:flex flex-1 items-center justify-center px-16 relative z-10">
        {preview ? <HomePreview /> : <CurveFlow wide />}
      </div>
    </div>
  )
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="text-xl lg:text-2xl font-semibold leading-tight mb-1">{title}</h1>
      <p className="text-sm mb-6" style={{ color: AF.muted }}>{subtitle}</p>
    </>
  )
}

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const color = tone === 'error' ? AF.red : AF.greenText
  const Icon = tone === 'error' ? AlertTriangle : CheckCircle2
  return (
    <div
      className="flex items-start gap-3 mb-5 px-4 py-3 rounded-lg text-sm"
      style={{ background: `${color}12`, border: `1px solid ${color}40`, color }}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icon: ReactNode; invalid?: boolean }

export function AuthField({ id, label, icon, invalid, type, ...rest }: FieldProps) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: AF.muted }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: AF.muted }} aria-hidden="true">{icon}</span>
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={invalid || undefined}
          className="w-full h-12 text-base sm:text-sm rounded-lg bg-transparent border outline-none transition-colors focus:bg-blue-50/40"
          // Inline padding: the portal's global input rule would otherwise override the
          // utility classes and push the text under the icon.
          style={{ borderColor: invalid ? AF.red : AF.border, color: AF.text, paddingLeft: 40, paddingRight: isPassword ? 48 : 12 }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-md hover:bg-slate-100"
            style={{ color: AF.muted }}
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

export function CustomerLoadingScreen() {
  return (
    <div className="af-root fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-6" style={{ ...ROOT_STYLE, background: AF.white }}>
      <div className="lg:hidden"><AirflowCurve width={400} height={500} opacity={0.1} /></div>
      <div className="hidden lg:block absolute inset-0" style={{ background: AF.base }}><AirflowCurve width={1280} height={800} opacity={0.12} /></div>

      <header className="absolute top-0 left-0 right-0 h-14 lg:h-16 flex items-center justify-between px-5 lg:px-10 border-b z-10" style={{ borderColor: AF.border, background: AF.white }}>
        <Wordmark />
        <span className="hidden lg:inline text-sm" style={{ color: AF.muted }}>Customer portal</span>
      </header>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8 lg:mb-10">
          <span className="lg:hidden"><CurveFlow /></span>
          <span className="hidden lg:inline"><CurveFlow wide /></span>
        </div>
        <div className="text-center" role="status" aria-live="polite">
          <h2 className="text-lg lg:text-2xl font-semibold mb-1.5">Getting your home's details</h2>
          <p className="text-sm" style={{ color: AF.muted }}>Your visits and invoices will be ready in a moment.</p>
        </div>
        <div className="flex gap-2.5 mt-6 lg:mt-8" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full af-fade" style={{ background: AF.accent, animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
        <div className="hidden lg:flex mt-12 gap-5 w-[600px]" aria-hidden="true">
          {[{ label: 'Next visit', w: '70%' }, { label: 'Recent invoices', w: '50%' }, { label: 'Service history', w: '60%' }].map(card => (
            <div key={card.label} className="flex-1 p-4 rounded-xl" style={{ background: AF.white, border: `1px solid ${AF.border}` }}>
              <div className="text-xs font-medium mb-3" style={{ color: AF.muted }}>{card.label}</div>
              <div className="space-y-2">
                <div className="h-2 rounded-full af-pulse" style={{ background: AF.border, width: card.w }} />
                <div className="h-2 rounded-full af-pulse" style={{ background: AF.border, width: '40%', animationDelay: '0.3s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Shown right after sign-in until the first screen's data settles (0.7 s to 6 s). */
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

  return <CustomerLoadingScreen />
}

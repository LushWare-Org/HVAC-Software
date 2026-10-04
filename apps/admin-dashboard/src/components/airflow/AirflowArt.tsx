import { useEffect, useState } from 'react'

export const AF = {
  navy: '#0E1E2E',
  panel: '#13283E',
  text: '#D8E4F0',
  textMuted: '#A9BCCF',
  accent: '#2563EB',
  accentHover: '#1D4FD8',
  supply: '#5BB4E8',
  return: '#E8A653',
  green: '#34A86A',
  red: '#F07A7A',
  inputBorder: 'rgba(91,180,232,0.35)',
} as const

/** The SVG particle animations ignore CSS media queries, so they read this. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function AirflowLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M 6 22 Q 12 10 16 16 Q 20 22 26 10" stroke={AF.accent} strokeWidth="2" strokeLinecap="round" />
      <path d="M 6 26 Q 12 14 16 20 Q 20 26 26 14" stroke={AF.supply} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="16" cy="16" r="2.5" fill={AF.accent} />
    </svg>
  )
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <AirflowLogo size={size} />
      <span className="text-lg font-semibold tracking-tight">HVACtor</span>
    </div>
  )
}

/** Slow circulating supply (cool) and return (warm) lines behind a screen. */
export function AirflowCurve({ width, height, opacity }: { width: number; height: number; opacity: number }) {
  const w = width, h = height
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <path d={`M -20 ${h * 0.7} Q ${w * 0.3} ${h * 0.2} ${w * 0.5} ${h * 0.5} T ${w + 20} ${h * 0.3}`} stroke={AF.supply} strokeWidth="1.5" fill="none" className="af-line" />
      <path d={`M -20 ${h * 0.8} Q ${w * 0.35} ${h * 0.35} ${w * 0.55} ${h * 0.6} T ${w + 20} ${h * 0.4}`} stroke={AF.supply} strokeWidth="1" fill="none" className="af-line" style={{ animationDelay: '0.5s' }} />
      <path d={`M ${w + 20} ${h * 0.3} Q ${w * 0.7} ${h * 0.8} ${w * 0.5} ${h * 0.5} T -20 ${h * 0.7}`} stroke={AF.return} strokeWidth="1.5" fill="none" className="af-line" style={{ animationDelay: '1s' }} />
      <path d={`M ${w + 20} ${h * 0.4} Q ${w * 0.65} ${h * 0.9} ${w * 0.45} ${h * 0.6} T -20 ${h * 0.8}`} stroke={AF.return} strokeWidth="1" fill="none" className="af-line" style={{ animationDelay: '1.5s' }} />
    </svg>
  )
}

/** The main duct with supply air in, return air out, and six vents. */
export function DuctDiagram() {
  const vents = [[120, 90], [210, 90], [300, 90], [120, 330], [210, 330], [300, 330]]
  return (
    <svg width="420" height="420" viewBox="0 0 420 420" fill="none" className="relative z-10 max-w-full h-auto" aria-hidden="true">
      <rect x="60" y="160" width="300" height="100" rx="6" stroke={AF.supply} strokeWidth="1.5" opacity="0.45" />
      <g stroke={AF.supply} strokeWidth="2" opacity="0.65" strokeLinecap="round">
        <path d="M 20 210 L 55 210" className="af-line" />
        <path d="M 20 195 L 55 195" className="af-line" style={{ animationDelay: '0.3s' }} />
        <path d="M 20 225 L 55 225" className="af-line" style={{ animationDelay: '0.6s' }} />
      </g>
      <g stroke={AF.return} strokeWidth="2" opacity="0.65" strokeLinecap="round">
        <path d="M 365 210 L 400 210" className="af-line" style={{ animationDelay: '0.9s' }} />
        <path d="M 365 195 L 400 195" className="af-line" style={{ animationDelay: '1.2s' }} />
        <path d="M 365 225 L 400 225" className="af-line" style={{ animationDelay: '1.5s' }} />
      </g>
      <g stroke={AF.supply} strokeWidth="1" opacity="0.35">
        <line x1="120" y1="160" x2="120" y2="100" /><line x1="210" y1="160" x2="210" y2="100" /><line x1="300" y1="160" x2="300" y2="100" />
        <line x1="120" y1="260" x2="120" y2="320" /><line x1="210" y1="260" x2="210" y2="320" /><line x1="300" y1="260" x2="300" y2="320" />
      </g>
      {vents.map(([x, y], i) => (
        <rect key={i} x={x - 15} y={y - 8} width="30" height="16" rx="2" stroke={i < 3 ? AF.supply : AF.return} strokeWidth="1.5" opacity="0.45" />
      ))}
      <text x="22" y="186" fill={AF.supply} fontSize="10" opacity="0.7">Supply</text>
      <text x="362" y="186" fill={AF.return} fontSize="10" opacity="0.7">Return</text>
      <text x="210" y="214" fill={AF.text} fontSize="10" textAnchor="middle" opacity="0.45">Main duct</text>
    </svg>
  )
}

/** Particles carried through a duct: supply one way, return the other. */
export function DuctFlow() {
  const reduced = useReducedMotion()
  const supply = [45, 55, 65, 50, 60]
  const ret = [75, 70, 80]
  return (
    <svg width="340" height="120" viewBox="0 0 340 120" fill="none" className="max-w-full h-auto" aria-hidden="true">
      <rect x="20" y="30" width="300" height="60" rx="6" stroke={AF.supply} strokeWidth="1.5" opacity="0.3" />
      {supply.map((y, i) => (
        <circle key={`s${i}`} cx={reduced ? 60 + i * 55 : 30} cy={y} r="3" fill={AF.supply} opacity={reduced ? 1 : 0}>
          {!reduced && <animate attributeName="cx" values="30;310;310" keyTimes="0;0.8;1" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />}
          {!reduced && <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />}
        </circle>
      ))}
      {ret.map((y, i) => (
        <circle key={`r${i}`} cx={reduced ? 280 - i * 80 : 310} cy={y} r="2.5" fill={AF.return} opacity={reduced ? 0.6 : 0}>
          {!reduced && <animate attributeName="cx" values="310;30;30" keyTimes="0;0.8;1" dur="2.5s" repeatCount="indefinite" begin={`${0.15 + i * 0.3}s`} />}
          {!reduced && <animate attributeName="opacity" values="0;0.6;0.6;0" keyTimes="0;0.1;0.8;1" dur="2.5s" repeatCount="indefinite" begin={`${0.15 + i * 0.3}s`} />}
        </circle>
      ))}
      <text x="20" y="20" fill={AF.supply} fontSize="10" opacity="0.7">Supply</text>
      <text x="320" y="20" fill={AF.return} fontSize="10" opacity="0.7" textAnchor="end">Return</text>
    </svg>
  )
}

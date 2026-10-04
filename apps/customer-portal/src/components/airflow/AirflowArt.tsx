import { useEffect, useState } from 'react'

export const AF = {
  base: '#F0F5F9',
  white: '#FFFFFF',
  text: '#1E3A52',
  muted: '#4F6478',
  border: '#D5E0EB',
  accent: '#2563EB',
  supply: '#5BB4E8',
  return: '#E8A653',
  returnText: '#8A5410',
  green: '#34A86A',
  greenText: '#1F7A4B',
  red: '#C93535',
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

export function AirflowLogo({ size = 26 }: { size?: number }) {
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
      <span className="text-lg font-semibold tracking-tight" style={{ color: AF.text }}>HVACtor</span>
    </div>
  )
}

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

/** Air carried along a soft curve, cool and warm particles alternating. */
export function CurveFlow({ wide = false }: { wide?: boolean }) {
  const reduced = useReducedMotion()
  const w = wide ? 420 : 180
  const h = wide ? 120 : 80
  const mid = h / 2
  const path = wide ? `M 10 ${mid} Q 100 15 210 ${mid} T 410 ${mid}` : `M 10 ${mid} Q 60 10 90 ${mid} T 170 ${mid}`
  const delays = wide ? [0, 0.6, 1.2, 1.8, 2.4] : [0, 0.5, 1, 1.5]
  const dur = wide ? '3s' : '2.5s'
  const stillX = wide ? [60, 140, 210, 290, 360] : [40, 80, 120, 150]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="max-w-full h-auto" aria-hidden="true">
      <path d={path} stroke={AF.supply} strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      <path d={path} stroke={AF.supply} strokeWidth="2.5" strokeLinecap="round" className="af-line" />
      {delays.map((delay, i) =>
        reduced ? (
          <circle key={i} cx={stillX[i]} cy={mid} r="3" fill={i % 2 === 0 ? AF.supply : AF.return} />
        ) : (
          <circle key={i} r={wide ? 3.5 : 3} fill={i % 2 === 0 ? AF.supply : AF.return} opacity="0">
            <animateMotion path={path} dur={dur} repeatCount="indefinite" begin={`${delay}s`} />
            <animate attributeName="opacity" values="0;0.85;0.85;0" keyTimes="0;0.12;0.88;1" dur={dur} repeatCount="indefinite" begin={`${delay}s`} />
          </circle>
        ),
      )}
      {wide && <text x="10" y="112" fill="#3E7DA6" fontSize="10">Supply</text>}
      {wide && <text x="410" y="112" fill={AF.returnText} fontSize="10" textAnchor="end">Return</text>}
    </svg>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { X, Megaphone, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api'

interface Announcement {
  id: string
  title: string
  body?: string
  linkUrl?: string
  linkLabel?: string
  accentColor: string
}

const AUTO_ADVANCE_MS = 5000

export default function AnnouncementBanner() {
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['active-announcements'],
    queryFn: async () => {
      const res = await api.get('/crm/announcements/active')
      return Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [index, setIndex] = useState(0)
  // Bumping this key restarts both the auto-advance timer AND the progress bar animation
  const [timerKey, setTimerKey] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const visible = announcements.filter(a => !dismissed.has(a.id))
  const total = visible.length
  const safeIndex = Math.min(index, Math.max(0, total - 1))
  const current = visible[safeIndex]

  // Auto-advance every 5 s; reset when user navigates manually (timerKey bump)
  useEffect(() => {
    if (total <= 1) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setIndex(i => (i + 1) % total)
      setTimerKey(k => k + 1)
    }, AUTO_ADVANCE_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [total, timerKey])

  if (!current) return null

  const accent = current.accentColor || 'var(--blue)'

  const goTo = (i: number) => { setIndex(i); setTimerKey(k => k + 1) }
  const prev = () => goTo((safeIndex - 1 + total) % total)
  const next = () => goTo((safeIndex + 1) % total)
  const dismiss = () => {
    setDismissed(prev => new Set([...prev, current.id]))
    setIndex(i => Math.max(0, Math.min(i, total - 2)))
  }

  return (
    <div
      className="anim-fade-up"
      style={{
        marginBottom: 18,
        borderRadius: 14,
        border: '1px solid var(--bd)',
        background: 'var(--bg-card)',
        position: 'relative',
        overflow: 'hidden',
        // Thin left accent stripe
        boxShadow: `inset 3px 0 0 ${accent}`,
      }}
    >
      <style>{`
        @keyframes bannerSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bannerProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
        {/* Icon pill — uses CSS var so it adapts to dark themes */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'var(--bg-card-2)',
          border: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Megaphone size={17} style={{ color: accent }} />
        </div>

        {/* Slide content — key forces re-mount → restarts the CSS animation */}
        <div
          key={current.id}
          style={{ flex: 1, minWidth: 0, animation: 'bannerSlide 0.3s ease' }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {current.title}
          </div>
          {current.body && (
            <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>
              {current.body}
            </div>
          )}
        </div>

        {/* CTA */}
        {current.linkUrl && (
          <a
            href={current.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              fontSize: 12.5, fontWeight: 700, color: '#fff', textDecoration: 'none',
              background: accent, borderRadius: 8, padding: '8px 14px', flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {current.linkLabel ?? 'Learn more'} <ArrowUpRight size={13} />
          </a>
        )}

        {/* Carousel nav */}
        {total > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button
              onClick={prev}
              aria-label="Previous announcement"
              style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                cursor: 'pointer', color: 'var(--t3)', borderRadius: 7,
                width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-2)' }}
            >
              <ChevronLeft size={13} />
            </button>

            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0 4px' }}>
              {visible.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => goTo(i)}
                  aria-label={`Announcement ${i + 1}`}
                  style={{
                    width: i === safeIndex ? 18 : 6, height: 6,
                    borderRadius: 99, border: 'none', padding: 0, cursor: 'pointer',
                    // Theme-safe: active uses accent, inactive uses a border-level neutral
                    background: i === safeIndex ? accent : 'var(--bd-md)',
                    transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Next announcement"
              style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                cursor: 'pointer', color: 'var(--t3)', borderRadius: 7,
                width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-2)' }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--t4)', padding: 4, flexShrink: 0,
            display: 'flex', borderRadius: 6, transition: 'color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--t4)' }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress bar — key forces restart on each slide change / manual nav */}
      {total > 1 && (
        <div
          key={`prog-${safeIndex}-${timerKey}`}
          style={{
            position: 'absolute', bottom: 0, left: 0, height: 2, width: '100%',
            transformOrigin: 'left center',
            background: accent,
            opacity: 0.55,
            animation: `bannerProgress ${AUTO_ADVANCE_MS}ms linear forwards`,
          }}
        />
      )}
    </div>
  )
}

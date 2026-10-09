import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { X, Megaphone, ArrowUpRight, ChevronLeft, ChevronRight, Sparkles, Gift, Wrench, CalendarDays, AlertTriangle, Leaf } from 'lucide-react'
import api from '../lib/api'
import { useMyTelegram } from '../hooks/useTelegram'
import { TelegramConnectModal, TelegramMark } from './TelegramConnect'

interface Announcement {
  id: string
  title: string
  body?: string
  linkUrl?: string
  linkLabel?: string
  accentColor: string
  icon?: string
  ctaAction?: 'link' | 'telegram' | 'none'
  style?: 'card' | 'spotlight'
  dismissible?: boolean
}

const AUTO_ADVANCE_MS = 6000

function Icon({ icon, size, color }: { icon?: string; size: number; color: string }) {
  const s = { color, flexShrink: 0 }
  switch (icon) {
    case 'telegram': return <TelegramMark size={size} />
    case 'sparkles': return <Sparkles size={size} style={s} />
    case 'gift': return <Gift size={size} style={s} />
    case 'wrench': return <Wrench size={size} style={s} />
    case 'calendar': return <CalendarDays size={size} style={s} />
    case 'alert': return <AlertTriangle size={size} style={s} />
    case 'leaf': return <Leaf size={size} style={s} />
    default: return <Megaphone size={size} style={s} />
  }
}

export default function AnnouncementBanner() {
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['active-announcements'],
    queryFn: async () => {
      const res = await api.get('/crm/announcements/active')
      return Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
    },
    // Short, so a newly published announcement shows up within a minute on an open portal.
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
  const telegram = useMyTelegram()
  const [connectOpen, setConnectOpen] = useState(false)

  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem('ann-dismissed') ?? '[]')) } catch { return new Set() }
  })
  const [index, setIndex] = useState(0)
  // Bumping this key restarts both the auto-advance timer AND the progress bar animation
  const [timerKey, setTimerKey] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // "Connect Telegram" ones only make sense while Telegram is on offer and this customer isn't linked.
  const telegramOffer = !!telegram.data?.available && !telegram.data.linked
  const visible = announcements.filter(a => !dismissed.has(a.id) && (a.ctaAction !== 'telegram' || telegramOffer))
  const total = visible.length
  const safeIndex = Math.min(index, Math.max(0, total - 1))
  const current = visible[safeIndex]

  useEffect(() => {
    if (total <= 1 || paused) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setIndex(i => (i + 1) % total)
      setTimerKey(k => k + 1)
    }, AUTO_ADVANCE_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [total, timerKey, paused])

  if (!current) return connectOpen ? <TelegramConnectModal onClose={() => setConnectOpen(false)} /> : null

  const accent = current.accentColor || 'var(--blue)'
  const spotlight = current.style === 'spotlight'
  const action = current.ctaAction ?? (current.linkUrl ? 'link' : 'none')

  const goTo = (i: number) => { setIndex(i); setTimerKey(k => k + 1) }
  const prev = () => goTo((safeIndex - 1 + total) % total)
  const next = () => goTo((safeIndex + 1) % total)
  const dismiss = () => {
    const nextSet = new Set([...dismissed, current.id])
    setDismissed(nextSet)
    try { sessionStorage.setItem('ann-dismissed', JSON.stringify([...nextSet])) } catch { /* only for this view */ }
    setIndex(i => Math.max(0, Math.min(i, total - 2)))
  }

  const ctaStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', minHeight: 36,
    fontSize: 13, fontWeight: 700, textDecoration: 'none', borderRadius: 9, padding: '0 14px', flexShrink: 0, border: 'none', cursor: 'pointer',
    color: spotlight ? accent : '#fff', background: spotlight ? '#fff' : accent, font: 'inherit',
  }
  const navBtn: React.CSSProperties = {
    background: spotlight ? 'rgba(255,255,255,.18)' : 'var(--bg-card-2)', border: spotlight ? 'none' : '1px solid var(--bd)',
    cursor: 'pointer', color: spotlight ? '#fff' : 'var(--t3)', borderRadius: 7,
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <>
      <div
        className="anim-fade-up"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          marginBottom: 18,
          borderRadius: 16,
          border: spotlight ? 'none' : '1px solid var(--bd)',
          background: spotlight ? `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, #000))` : 'var(--bg-card)',
          color: spotlight ? '#fff' : undefined,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: spotlight ? `0 10px 30px color-mix(in srgb, ${accent} 30%, transparent)` : `inset 3px 0 0 ${accent}`,
        }}
      >
        <style>{`
          @keyframes bannerSlide { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes bannerProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
          @keyframes bannerOrb { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-12px, 8px); } }
          @media (prefers-reduced-motion: reduce) { .ann-anim { animation: none !important; } }
        `}</style>
        {spotlight && (
          <span aria-hidden="true" className="ann-anim" style={{ position: 'absolute', width: 180, height: 180, right: -50, top: -80, borderRadius: '50%', background: 'rgba(255,255,255,.12)', animation: 'bannerOrb 9s ease-in-out infinite' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: spotlight ? '18px 20px' : '14px 18px', flexWrap: 'wrap', position: 'relative' }}>
          <div style={{
            width: spotlight ? 46 : 36, height: spotlight ? 46 : 36, borderRadius: spotlight ? 13 : 10, flexShrink: 0,
            background: spotlight ? 'rgba(255,255,255,.18)' : 'var(--bg-card-2)', border: spotlight ? 'none' : '1px solid var(--bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon icon={current.icon} size={spotlight ? 24 : 17} color={spotlight ? '#fff' : accent} />
          </div>

          <div key={current.id} className="ann-anim" style={{ flex: '1 1 220px', minWidth: 0, animation: 'bannerSlide 0.3s ease' }}>
            <div style={{ fontSize: spotlight ? 16 : 14, fontWeight: 700, color: spotlight ? '#fff' : 'var(--t1)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
              {current.title}
            </div>
            {current.body && (
              <div style={{ fontSize: 12.5, color: spotlight ? 'rgba(255,255,255,.85)' : 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>
                {current.body}
              </div>
            )}
          </div>

          {action === 'telegram' && (
            <button style={ctaStyle} onClick={() => setConnectOpen(true)}>
              <TelegramMark size={16} color={spotlight ? accent : '#fff'} plane={spotlight ? '#fff' : accent} /> {current.linkLabel || 'Connect Telegram'}
            </button>
          )}
          {action === 'link' && current.linkUrl && (
            <a href={current.linkUrl} target="_blank" rel="noopener noreferrer" style={ctaStyle}>
              {current.linkLabel || 'Learn more'} <ArrowUpRight size={13} />
            </a>
          )}

          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <button onClick={prev} aria-label="Previous announcement" style={navBtn}><ChevronLeft size={13} /></button>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '0 4px' }}>
                {visible.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => goTo(i)}
                    aria-label={`Announcement ${i + 1}`}
                    style={{
                      width: i === safeIndex ? 18 : 6, height: 6, borderRadius: 99, border: 'none', padding: 0, cursor: 'pointer',
                      background: i === safeIndex ? (spotlight ? '#fff' : accent) : (spotlight ? 'rgba(255,255,255,.4)' : 'var(--bd-md)'),
                      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), background 0.2s',
                    }}
                  />
                ))}
              </div>
              <button onClick={next} aria-label="Next announcement" style={navBtn}><ChevronRight size={13} /></button>
            </div>
          )}

          {current.dismissible !== false && (
            <button
              onClick={dismiss}
              aria-label="Dismiss announcement"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: spotlight ? 'rgba(255,255,255,.8)' : 'var(--t4)', padding: 6, flexShrink: 0, display: 'flex', borderRadius: 6 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {total > 1 && !paused && (
          <div
            key={`prog-${safeIndex}-${timerKey}`}
            className="ann-anim"
            style={{
              position: 'absolute', bottom: 0, left: 0, height: 2, width: '100%', transformOrigin: 'left center',
              background: spotlight ? '#fff' : accent, opacity: 0.55,
              animation: `bannerProgress ${AUTO_ADVANCE_MS}ms linear forwards`,
            }}
          />
        )}
      </div>
      {connectOpen && <TelegramConnectModal onClose={() => setConnectOpen(false)} />}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Lightbulb, Video, Play, ArrowRight, Sparkles, X, ImageOff } from 'lucide-react'
import { usePosts } from '../hooks/usePosts'
import type { ContractorPost } from '../types/api'

type Filter = 'ALL' | 'TIP' | 'VIDEO'

const STAGGER_CSS = `
@keyframes tipsReveal {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tips-card {
  animation: tipsReveal 0.45s cubic-bezier(0.22,1,0.36,1) both;
}
.tips-card:nth-child(1) { animation-delay: 0.04s; }
.tips-card:nth-child(2) { animation-delay: 0.10s; }
.tips-card:nth-child(3) { animation-delay: 0.16s; }
.tips-card:nth-child(4) { animation-delay: 0.22s; }
.tips-card:nth-child(5) { animation-delay: 0.28s; }
.tips-card:nth-child(n+6) { animation-delay: 0.34s; }

.tips-card-inner {
  transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease;
}
.tips-card-inner:hover, .tips-card-inner:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
}
.tips-card-inner:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
.play-btn {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.tips-card-inner:hover .play-btn {
  transform: scale(1.12);
}
.read-arrow {
  transition: transform 0.2s ease;
  display: inline-block;
}
.tips-card-inner:hover .read-arrow {
  transform: translateX(4px);
}
.seg-btn {
  transition: background 0.15s ease, color 0.15s ease;
}
@keyframes postModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.post-modal { animation: postModalIn 0.2s cubic-bezier(0.22,1,0.36,1) both; }
`

function VideoEmbed({ url }: { url: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (ytMatch) return (
    <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`}
      style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 10, display: 'block' }}
      allowFullScreen title="Video" />
  )
  if (vimeoMatch) return (
    <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
      style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 10, display: 'block' }}
      allowFullScreen title="Video" />
  )
  return <a href={url} target="_blank" rel="noopener noreferrer"
    style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600 }}>Watch video →</a>
}

/**
 * Derive a poster image from a YouTube/Vimeo URL so video cards always render
 * as a big thumbnail box, even when the admin didn't set a hero image.
 * (Vimeo thumbnails come via vumbnail.com — no API key needed.)
 */
function videoThumbUrl(url?: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://vumbnail.com/${vimeo[1]}.jpg`
  return null
}

/** A broken image URL degrades to this placeholder instead of the browser's broken-icon box. */
function BrokenImageFallback({ isVideo }: { isVideo: boolean }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 6,
      background: 'var(--bg-card-2)', color: 'var(--t4)',
    }}>
      <ImageOff size={20} />
      <span style={{ fontSize: 11, fontWeight: 600 }}>{isVideo ? 'Video' : 'Tip'} image unavailable</span>
    </div>
  )
}

/** Clickable wrapper — makes an entire card behave like a button while keeping its custom layout. */
function ClickableCard({ onOpen, children, style }: { onOpen: () => void; children: React.ReactNode; style: React.CSSProperties }) {
  return (
    <div
      className="tips-card-inner"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      style={{ ...style, cursor: 'pointer' }}
    >
      {children}
    </div>
  )
}

function HeroCard({ post, onOpen }: { post: ContractorPost; onOpen: () => void }) {
  const isVideo = post.type === 'VIDEO'
  const [imgBroken, setImgBroken] = useState(false)
  // Videos always get a big thumbnail box — fall back to the platform poster
  // frame when no hero image was set, so the layout is consistent everywhere.
  const imageUrl = post.heroImageUrl || (isVideo ? videoThumbUrl(post.videoUrl) : null)
  const showImage = !!imageUrl && !imgBroken

  return (
    <div className="tips-card" style={{ gridColumn: '1 / -1' }}>
      <ClickableCard onOpen={onOpen} style={{
        borderRadius: 18, overflow: 'hidden',
        border: '1px solid var(--bd)',
        background: 'var(--bg-card)',
        position: 'relative',
      }}>
        {showImage ? (
          <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
            <img src={imageUrl!} alt={post.title} referrerPolicy="no-referrer"
              onError={() => setImgBroken(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                       transition: 'transform 0.4s ease' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
            }} />
            {isVideo && (
              <div className="play-btn" style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}>
                <Play size={20} fill="var(--blue)" style={{ color: 'var(--blue)', marginLeft: 3 }} />
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: isVideo ? '#93C5FD' : '#FCD34D',
                marginBottom: 8,
              }}>
                {isVideo ? <Video size={10} /> : <Lightbulb size={10} />}
                {isVideo ? 'Video Guide' : 'Expert Tip'}{post.isPinned ? ' · Featured' : ''}
              </span>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                {post.title}
              </div>
              {post.body && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.body}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12,
                fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                {isVideo ? 'Watch now' : 'Read more'} <span className="read-arrow"><ArrowRight size={12} /></span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '28px 28px',
            background: isVideo
              ? 'linear-gradient(135deg, var(--blue-dim) 0%, var(--bg-card) 60%)'
              : 'linear-gradient(135deg, var(--amber-dim) 0%, var(--bg-card) 60%)',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: isVideo ? 'var(--blue)' : 'var(--amber)', marginBottom: 10,
            }}>
              {isVideo ? <Video size={10} /> : <Lightbulb size={10} />}
              {isVideo ? 'Video Guide' : 'Expert Tip'}{post.isPinned ? ' · Featured' : ''}
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 10 }}>
              {post.title}
            </div>
            {post.body && (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--t2)', lineHeight: 1.6,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.body}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14,
              fontSize: 12, fontWeight: 700, color: isVideo ? 'var(--blue)' : 'var(--amber)' }}>
              {isVideo ? 'Watch now' : 'Read more'} <span className="read-arrow"><ArrowRight size={12} /></span>
            </div>
          </div>
        )}
      </ClickableCard>
    </div>
  )
}

function CompactCard({ post, index, onOpen }: { post: ContractorPost; index: number; onOpen: () => void }) {
  const isVideo = post.type === 'VIDEO'
  const accent = isVideo ? 'var(--blue)' : 'var(--amber)'
  const accentDim = isVideo ? 'var(--blue-dim)' : 'var(--amber-dim)'
  const [imgBroken, setImgBroken] = useState(false)
  const imageUrl = post.heroImageUrl || (isVideo ? videoThumbUrl(post.videoUrl) : null)
  const showImage = !!imageUrl && !imgBroken

  return (
    <div className="tips-card" style={{ animationDelay: `${0.04 + index * 0.06}s` }}>
      <ClickableCard onOpen={onOpen} style={{
        borderRadius: 14, overflow: 'hidden',
        border: '1px solid var(--bd)',
        background: 'var(--bg-card)',
        height: '100%',
      }}>
        {showImage ? (
          <>
            <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
              <img src={imageUrl!} alt={post.title} referrerPolicy="no-referrer"
                onError={() => setImgBroken(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {isVideo && (
                <div className="play-btn" style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.25)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Play size={14} fill={accent} style={{ color: accent, marginLeft: 2 }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
                color: accent, marginBottom: 6 }}>
                {isVideo ? 'Video' : 'Tip'}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.35,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.title}
              </div>
              {post.body && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--t3)', lineHeight: 1.55,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.body}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10,
                fontSize: 11, fontWeight: 700, color: accent }}>
                {isVideo ? 'Watch' : 'Read'} <span className="read-arrow"><ArrowRight size={11} /></span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '18px 18px', height: '100%', boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column',
            borderLeft: `3px solid ${accent}` }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: accentDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              {isVideo ? <Video size={13} style={{ color: accent }} /> : <Lightbulb size={13} style={{ color: accent }} />}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
              color: accent, marginBottom: 6 }}>
              {isVideo ? 'Video' : 'Tip'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.35, flex: 1,
              display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.title}
            </div>
            {post.body && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--t3)', lineHeight: 1.55,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {post.body}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12,
              fontSize: 11, fontWeight: 700, color: accent }}>
              {isVideo ? 'Watch' : 'Read'} <span className="read-arrow"><ArrowRight size={11} /></span>
            </div>
          </div>
        )}
      </ClickableCard>
    </div>
  )
}

/** Full post view — opened by clicking any card's image, title, or "Read more"/"Watch". */
function PostModal({ post, onClose }: { post: ContractorPost; onClose: () => void }) {
  const isVideo = post.type === 'VIDEO'
  const accent = isVideo ? 'var(--blue)' : 'var(--amber)'
  const [imgBroken, setImgBroken] = useState(false)
  const showImage = !!post.heroImageUrl && !imgBroken

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        className="post-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: 640, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--bd)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
        }}
      >
        {isVideo && post.videoUrl ? (
          <div style={{ padding: '20px 20px 0' }}>
            <VideoEmbed url={post.videoUrl} />
          </div>
        ) : showImage ? (
          <div style={{ height: 300, overflow: 'hidden' }}>
            <img src={post.heroImageUrl} alt={post.title} referrerPolicy="no-referrer"
              onError={() => setImgBroken(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : post.heroImageUrl && imgBroken ? (
          <div style={{ height: 160 }}><BrokenImageFallback isVideo={isVideo} /></div>
        ) : null}

        <div style={{ padding: '22px 26px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent,
            }}>
              {isVideo ? <Video size={11} /> : <Lightbulb size={11} />}
              {isVideo ? 'Video Guide' : 'Expert Tip'}{post.isPinned ? ' · Featured' : ''}
            </span>
            <button onClick={onClose} aria-label="Close" style={{
              background: 'var(--bg-card-2)', border: '1px solid var(--bd)', borderRadius: 8,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--t3)', flexShrink: 0,
            }}>
              <X size={14} />
            </button>
          </div>
          <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {post.title}
          </h2>
          {post.body && (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {post.body}
            </p>
          )}
          {isVideo && post.videoUrl && !post.videoUrl.match(/(youtube\.com|youtu\.be|vimeo\.com)/) && (
            <div style={{ marginTop: 16 }}>
              <a href={post.videoUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 600 }}>
                Open video →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Tips() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [openPost, setOpenPost] = useState<ContractorPost | null>(null)
  const { data: posts = [], isLoading } = usePosts(filter === 'ALL' ? undefined : filter)

  const pinnedPosts = posts.filter(p => p.isPinned)
  const regularPosts = posts.filter(p => !p.isPinned)
  const allSorted = [...pinnedPosts, ...regularPosts]

  const hero = allSorted[0] ?? null
  const rest = allSorted.slice(1)

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL',   label: 'All',    count: posts.length },
    { key: 'TIP',   label: 'Tips',   count: posts.filter(p => p.type === 'TIP').length },
    { key: 'VIDEO', label: 'Videos', count: posts.filter(p => p.type === 'VIDEO').length },
  ]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 48px' }}>
      <style>{STAGGER_CSS}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Sparkles size={13} style={{ color: 'var(--amber)' }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--amber)' }}>
            From your service team
          </span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, color: 'var(--t1)',
          letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Tips & Videos
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--t3)', lineHeight: 1.5 }}>
          Expert advice and walkthroughs curated by your technicians.
        </p>
      </div>

      {/* Segmented filter control */}
      <div style={{
        display: 'inline-flex', borderRadius: 12,
        border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
        padding: 3, marginBottom: 28, gap: 2,
      }}>
        {filters.map(({ key, label, count }) => {
          const active = filter === key
          return (
            <button key={key} className="seg-btn" onClick={() => setFilter(key)}
              style={{
                padding: '6px 16px', borderRadius: 9, border: 'none',
                background: active ? 'var(--bg-card)' : 'transparent',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                color: active ? 'var(--t1)' : 'var(--t3)',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 99, padding: '0 5px',
                  background: active ? 'var(--blue-dim)' : 'var(--bg-card)',
                  color: active ? 'var(--blue)' : 'var(--t4)',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: i === 1 ? 260 : 120, borderRadius: 14,
              background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : allSorted.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 18,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--amber-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Lightbulb size={24} style={{ color: 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>
            Nothing here yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--t4)' }}>
            Your service team will post tips and videos soon.
          </div>
        </div>
      ) : (
        <>
          {/* Hero card (first / pinned) */}
          {hero && (
            <div style={{ marginBottom: 16 }}>
              <HeroCard post={hero} onOpen={() => setOpenPost(hero)} />
            </div>
          )}

          {/* Grid of remaining posts */}
          {rest.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {rest.map((post, i) => (
                <CompactCard key={post.id} post={post} index={i} onOpen={() => setOpenPost(post)} />
              ))}
            </div>
          )}
        </>
      )}

      {openPost && <PostModal post={openPost} onClose={() => setOpenPost(null)} />}
    </div>
  )
}

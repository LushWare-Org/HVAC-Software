import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, ArrowRight, Star, X, MessageSquare } from 'lucide-react'
import { usePosts } from '../hooks/usePosts'
import type { ContractorPost } from '../types/api'

const STYLES = `
@keyframes offersReveal {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.offer-card {
  animation: offersReveal 0.45s cubic-bezier(0.22,1,0.36,1) both;
}
.offer-card:nth-child(1) { animation-delay: 0.04s; }
.offer-card:nth-child(2) { animation-delay: 0.10s; }
.offer-card:nth-child(3) { animation-delay: 0.16s; }
.offer-card:nth-child(n+4) { animation-delay: 0.22s; }

.offer-inner {
  transition: transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease;
}
.offer-inner:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px rgba(0,0,0,0.1);
}
.offer-arrow {
  transition: transform 0.18s ease;
  display: inline-flex;
  align-items: center;
}
.offer-inner:hover .offer-arrow {
  transform: translateX(5px);
}
@keyframes featuredShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.featured-badge {
  background: linear-gradient(
    90deg,
    var(--green) 0%,
    #4ade80 40%,
    var(--green) 100%
  );
  background-size: 200% auto;
  animation: featuredShimmer 3s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.offer-inner:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 2px;
}
@keyframes offerModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.offer-modal { animation: offerModalIn 0.2s cubic-bezier(0.22,1,0.36,1) both; }
`

function VoucherCard({ post, onOpen }: { post: ContractorPost; onOpen: () => void }) {
  const isFeatured = post.isPinned
  const [imgBroken, setImgBroken] = useState(false)
  const showImage = !!post.heroImageUrl && !imgBroken

  return (
    <div className="offer-card">
      <div
        className="offer-inner"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
        style={{
          borderRadius: 16,
          border: `1px solid ${isFeatured ? 'var(--green)' : 'var(--bd)'}`,
          background: 'var(--bg-card)',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
        }}>
        {/* Hero image — falls back to the text-only voucher when the URL is broken */}
        {showImage && (
          <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
            <img src={post.heroImageUrl} alt={post.title} referrerPolicy="no-referrer"
              onError={() => setImgBroken(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
            }} />
            {isFeatured && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'var(--green)', color: '#fff',
                fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '4px 10px', borderRadius: 99,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Star size={8} fill="#fff" /> Featured
              </div>
            )}
          </div>
        )}

        {/* Voucher body — split design */}
        <div style={{ display: 'flex', minHeight: 100 }}>
          {/* Left accent strip */}
          <div style={{
            width: 6, flexShrink: 0,
            background: isFeatured
              ? 'linear-gradient(180deg, var(--green) 0%, #4ade80 100%)'
              : 'var(--green)',
          }} />

          {/* Perforated divider effect */}
          <div style={{
            width: 0, flexShrink: 0, position: 'relative',
            borderLeft: '2px dashed var(--bd)',
            margin: '10px 0',
          }} />

          {/* Main content */}
          <div style={{ flex: 1, padding: '18px 20px 18px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                {isFeatured && !showImage && (
                  <span className="featured-badge" style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
                    textTransform: 'uppercase', display: 'block', marginBottom: 6,
                  }}>
                    ★ Featured Offer
                  </span>
                )}
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--green)',
                  display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
                }}>
                  <Tag size={9} /> Special Offer
                </div>
                <div style={{
                  fontSize: 17, fontWeight: 800, color: 'var(--t1)',
                  lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 8,
                }}>
                  {post.title}
                </div>
                {post.body && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                    {post.body}
                  </p>
                )}
              </div>
            </div>

            <div style={{
              marginTop: 14, paddingTop: 12,
              borderTop: '1px dashed var(--bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: 'var(--t4)' }}>Contact us to redeem</span>
              <span className="offer-arrow" style={{
                fontSize: 12, fontWeight: 700, color: 'var(--green)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Learn more <ArrowRight size={12} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Full offer view with a real path to redeem — message the service team. */
function OfferModal({ post, onClose }: { post: ContractorPost; onClose: () => void }) {
  const navigate = useNavigate()
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
        className="offer-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--bd)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
        }}
      >
        {showImage && (
          <div style={{ height: 220, overflow: 'hidden' }}>
            <img src={post.heroImageUrl} alt={post.title} referrerPolicy="no-referrer"
              onError={() => setImgBroken(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div style={{ padding: '22px 26px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--green)',
            }}>
              <Tag size={11} /> Special Offer{post.isPinned ? ' · Featured' : ''}
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

          <div style={{
            marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, color: 'var(--t4)' }}>
              Mention this offer when you contact us to redeem it.
            </span>
            <button
              onClick={() => navigate('/messages')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10, border: 'none',
                background: 'var(--green)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <MessageSquare size={14} /> Message us to redeem
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Offers() {
  const { data: posts = [], isLoading } = usePosts('OFFER')
  const [openPost, setOpenPost] = useState<ContractorPost | null>(null)

  const pinnedPosts = posts.filter(p => p.isPinned)
  const regularPosts = posts.filter(p => !p.isPinned)
  const allSorted = [...pinnedPosts, ...regularPosts]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>
      <style>{STYLES}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Star size={12} fill="var(--green)" style={{ color: 'var(--green)' }} />
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--green)',
          }}>
            Exclusive to you
          </span>
        </div>
        <h1 style={{
          margin: '0 0 6px', fontSize: 28, fontWeight: 900, color: 'var(--t1)',
          letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          Offers & Memberships
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--t3)', lineHeight: 1.5 }}>
          Special deals and service plans available just for you.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              height: 140, borderRadius: 16,
              background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
            }} />
          ))}
        </div>
      ) : allSorted.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 18,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--green-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Tag size={24} style={{ color: 'var(--green)' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t2)', marginBottom: 6 }}>
            No active offers right now
          </div>
          <div style={{ fontSize: 13, color: 'var(--t4)' }}>
            Check back soon — exclusive deals will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {allSorted.map(post => (
            <VoucherCard key={post.id} post={post} onOpen={() => setOpenPost(post)} />
          ))}
        </div>
      )}

      {openPost && <OfferModal post={openPost} onClose={() => setOpenPost(null)} />}
    </div>
  )
}

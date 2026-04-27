/**
 * ReviewModal — shared 5-star rating + comment dialog.
 *
 * Used for:
 *  - Rating a specific completed job (type='JOB' + jobId + optional technicianId)
 *  - Rating the company overall   (type='COMPANY')
 *
 * The backend upserts on (customerId, jobId) for job reviews, so opening this
 * modal for a job that already has a review pre-fills the old rating/comment
 * and submitting overwrites it — no duplicate rows.
 */

import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Star, X, Loader2 } from 'lucide-react'
import { useSubmitReview } from '../hooks/useCustomerPortal'
import type { Review, ReviewType } from '../types/api'

interface ReviewModalProps {
  open:            boolean
  onClose:         () => void
  type:            ReviewType
  jobId?:          string
  technicianId?:   string
  technicianName?: string
  existing?:       Review | null            // pre-fill values for amendments
  title?:          string                   // override default heading
  subtitle?:       string                   // override default sub-heading
  onSubmitted?:    (review: Review) => void
}

export default function ReviewModal({
  open, onClose, type, jobId, technicianId, technicianName,
  existing, title, subtitle, onSubmitted,
}: ReviewModalProps) {
  const [rating,  setRating]  = useState(existing?.rating ?? 0)
  const [hover,   setHover]   = useState(0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [err,     setErr]     = useState<string | null>(null)

  const submit = useSubmitReview()

  // Re-sync when existing changes (modal reused across jobs)
  useEffect(() => {
    if (open) {
      setRating(existing?.rating ?? 0)
      setComment(existing?.comment ?? '')
      setErr(null)
    }
  }, [open, existing?.id, existing?.rating, existing?.comment])

  if (!open) return null

  const headingDefault = type === 'COMPANY' ? 'Rate our service' : 'Rate this job'
  const subDefault     = type === 'COMPANY'
    ? 'Tell us how we did overall — your feedback helps us improve.'
    : technicianName
      ? `Share feedback about ${technicianName} and this visit.`
      : 'Share feedback about this completed job.'

  const shown = hover || rating
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  async function handleSubmit() {
    if (rating < 1) {
      setErr('Please select a rating (1-5 stars)')
      return
    }
    setErr(null)
    try {
      const result = await submit.mutateAsync({
        type,
        rating,
        comment: comment.trim() || undefined,
        jobId,
        technicianId,
        technicianName,
      })
      onSubmitted?.(result)
      onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? 'Failed to submit review')
    }
  }

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, zIndex: 1000, animation: 'revFadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          animation: 'revModalIn 0.2s ease-out', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '22px 26px 10px', display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#111827' }}>
              {title ?? headingDefault}
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: '#6B7280', lineHeight: 1.45 }}>
              {subtitle ?? subDefault}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, borderRadius: 6, color: '#9CA3AF',
            }}
          ><X size={18} /></button>
        </div>

        <div style={{ padding: '8px 26px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 3, transition: 'transform 0.1s',
                  transform: shown >= n ? 'scale(1.08)' : 'scale(1)',
                }}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={34}
                  strokeWidth={1.75}
                  fill={shown >= n ? '#F59E0B' : 'transparent'}
                  color={shown >= n ? '#F59E0B' : '#D1D5DB'}
                />
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: shown ? '#F59E0B' : '#9CA3AF', minHeight: 18 }}>
            {labels[shown] || 'Tap to rate'}
          </div>
        </div>

        <div style={{ padding: '14px 26px 4px' }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
          }}>
            Comment <span style={{ fontWeight: 400, textTransform: 'none', color: '#9CA3AF' }}>(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={type === 'COMPANY'
              ? 'What did we do well? What could be better?'
              : 'How was the service? Any details you want the team to know?'}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 9,
              border: '1px solid #D1D5DB', fontSize: 13.5, fontFamily: 'inherit',
              color: '#111827', resize: 'vertical', minHeight: 84,
              outline: 'none',
            }}
          />
          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 2 }}>
            {comment.length}/1000
          </div>
        </div>

        {err && (
          <div style={{ padding: '0 26px', color: '#B91C1C', fontSize: 12.5, fontWeight: 500 }}>{err}</div>
        )}

        <div style={{
          padding: '16px 26px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10,
          borderTop: '1px solid #F3F4F6', marginTop: 10, background: '#F9FAFB',
        }}>
          <button
            onClick={onClose}
            disabled={submit.isPending}
            style={{
              padding: '9px 18px', borderRadius: 9, border: '1px solid #D1D5DB',
              background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
              cursor: submit.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submit.isPending || rating < 1}
            style={{
              padding: '9px 22px', borderRadius: 9, border: 'none',
              background: rating < 1 ? '#9CA3AF' : '#F59E0B',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: submit.isPending || rating < 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              minWidth: 120, justifyContent: 'center',
            }}
          >
            {submit.isPending
              ? <><Loader2 size={14} className="spin" /> Submitting…</>
              : existing ? 'Update review' : 'Submit review'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes revFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes revModalIn { from { opacity: 0; transform: scale(0.95) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        .spin { animation: revSpin 0.8s linear infinite }
        @keyframes revSpin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
  return ReactDOM.createPortal(modal, document.body)
}

/**
 * Reviews tab — fully mocked/local-only, unchanged behavior (restyled only).
 * "Send Request" is a real alert(), not an API call — preserve exactly.
 */
import { Star, Mail, Plus, Trash2, CheckCircle2, MessageSquare } from 'lucide-react'
import { SectionLabel } from '../shared'

interface Review {
  id: number; rating: number; channel: string; date: string; comment: string
  replied?: boolean; showReplyPanel?: boolean; replyText?: string
}

export default function ReviewsTab({
  isEditMode, reviews, onReviewsChange,
  showRequestPanel, onToggleRequestPanel,
  requestForm, onRequestFormChange,
  customerName,
}: {
  isEditMode: boolean
  reviews: Review[]
  onReviewsChange: (updater: (prev: Review[]) => Review[]) => void
  showRequestPanel: boolean
  onToggleRequestPanel: () => void
  requestForm: { email: string; channel: string; message: string }
  onRequestFormChange: (patch: Partial<{ email: string; channel: string; message: string }>) => void
  customerName: string
}) {
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 16, borderRadius: 12, background: 'color-mix(in srgb, var(--amber) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--amber) 25%, transparent)', marginBottom: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--amber)' }}>{reviews.length > 0 ? avg.toFixed(1) : '—'}</div>
          <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} size={12} style={{ color: n <= Math.round(avg) ? 'var(--amber)' : 'var(--bd)' }} fill={n <= Math.round(avg) ? 'var(--amber)' : 'none'} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 4 }}>{reviews.length} reviews</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[5, 4, 3, 2, 1].map(n => {
            const count = reviews.filter(r => r.rating === n).length
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--t4)', width: 10 }}>{n}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-card-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--amber)', borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--t4)', width: 14 }}>{count}</span>
              </div>
            )
          })}
        </div>
        {isEditMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={onToggleRequestPanel}>
              <Mail size={12} /> {showRequestPanel ? 'Cancel Request' : 'Request Review'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderColor: 'color-mix(in srgb, var(--amber) 30%, transparent)', color: 'var(--amber)' }}
              onClick={() => onReviewsChange(prev => [{ id: Date.now(), rating: 5, channel: 'Google', date: new Date().toISOString().split('T')[0], comment: '', replied: false }, ...prev])}
            >
              <Plus size={12} /> Add Manual Review
            </button>
          </div>
        )}
      </div>

      {isEditMode && showRequestPanel && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'var(--blue-glow)', border: '1px solid var(--blue-dim)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Send Review Request to Customer
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase' }}>Customer Email</label>
            <input
              type="email" value={requestForm.email} placeholder="customer@email.com"
              onChange={e => onRequestFormChange({ email: e.target.value })}
              style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)', fontSize: 12.5 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase' }}>Message (Optional)</label>
            <textarea
              value={requestForm.message} rows={2} placeholder={`Hi ${customerName || 'there'}, we'd love your feedback! Please leave us a review.`}
              onChange={e => onRequestFormChange({ message: e.target.value })}
              style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)', fontSize: 12.5, resize: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              disabled={!requestForm.email}
              onClick={() => {
                alert(`Review request sent to ${requestForm.email}`)
                onToggleRequestPanel()
                onRequestFormChange({ email: '', channel: 'Google', message: '' })
              }}
            >
              <Mail size={12} /> Send Request
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onToggleRequestPanel}>Cancel</button>
          </div>
        </div>
      )}

      <SectionLabel icon={Star}>Customer Reviews</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map(rv => (
          <div key={rv.id} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n} disabled={!isEditMode}
                      onClick={() => onReviewsChange(prev => prev.map(x => x.id === rv.id ? { ...x, rating: n } : x))}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: isEditMode ? 'pointer' : 'default' }}
                    >
                      <Star size={16} style={{ color: n <= rv.rating ? 'var(--amber)' : 'var(--bd)' }} fill={n <= rv.rating ? 'var(--amber)' : 'none'} />
                    </button>
                  ))}
                </div>
                {isEditMode ? (
                  <textarea
                    value={rv.comment} rows={2} placeholder="Customer review text..."
                    onChange={e => onReviewsChange(prev => prev.map(x => x.id === rv.id ? { ...x, comment: e.target.value } : x))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)', fontSize: 12.5, resize: 'none' }}
                  />
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--t1)', margin: 0 }}>
                    {rv.comment ? `"${rv.comment}"` : <span style={{ color: 'var(--t4)', fontStyle: 'italic' }}>No comment yet</span>}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                <div style={{ fontSize: 11, color: 'var(--t4)' }}>{rv.date}</div>
                {isEditMode && (
                  <button
                    onClick={() => onReviewsChange(prev => prev.filter(x => x.id !== rv.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--bd)', marginTop: 6 }}>
              {rv.replied ? (
                <div style={{ width: '100%', padding: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)', borderRadius: 9 }}>
                  <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <CheckCircle2 size={12} /> Replied
                  </span>
                  {rv.replyText && <p style={{ fontSize: 12, color: 'var(--t2)', fontStyle: 'italic', margin: 0 }}>"{rv.replyText}"</p>}
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  {!rv.showReplyPanel ? (
                    <button
                      className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => onReviewsChange(prev => prev.map(x => x.id === rv.id ? { ...x, showReplyPanel: true, replyText: '' } : x))}
                    >
                      <MessageSquare size={12} /> Reply
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        value={rv.replyText || ''} rows={2} placeholder="Type your reply to this customer..."
                        onChange={e => onReviewsChange(prev => prev.map(x => x.id === rv.id ? { ...x, replyText: e.target.value } : x))}
                        style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)', fontSize: 12.5, resize: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                          disabled={!rv.replyText}
                          onClick={() => onReviewsChange(prev => prev.map(x => x.id === rv.id ? { ...x, replied: true, showReplyPanel: false } : x))}
                        >
                          <CheckCircle2 size={12} /> Submit Reply
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onReviewsChange(prev => prev.map(x => x.id === rv.id ? { ...x, showReplyPanel: false } : x))}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center' }}>
            <Star size={36} style={{ color: 'var(--t4)', opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No reviews yet</p>
            <p style={{ fontSize: 11.5, color: 'var(--t4)', marginTop: 4 }}>Request a review after job completion to build your reputation.</p>
          </div>
        )}
      </div>
    </div>
  )
}

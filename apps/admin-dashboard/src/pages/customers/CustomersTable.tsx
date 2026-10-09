/**
 * The customers table, in the same design as Jobs: one card per customer, every action
 * visible. There is nothing to unfold: a customer row has no more to say than it shows.
 */
import { Mail, RefreshCw, Send, Sparkles, Trash2, Users } from 'lucide-react'
import Avatar from '../../components/Avatar'
import { formatMoney } from '../../lib/format'
import { customerName, type Customer } from '../../types/api'
import '../jobs/jobsTable.css'
import './customersTable.css'

export function FollowupSwitch({ checked, disabled, onChange, name }: { checked: boolean; disabled?: boolean; onChange: () => void; name: string }) {
  return (
    <span className="ct-sw">
      <button
        type="button" role="switch" aria-checked={checked} disabled={disabled} className="ct-switch"
        aria-label={`Automatic follow-up for ${name}`} title={checked ? 'Follow-ups are sent automatically. Click to pause.' : 'Paused: no automatic follow-ups. Click to turn on.'}
        onClick={e => { e.stopPropagation(); onChange() }}
      />
      <span className="ct-sw-t">{checked ? 'On' : 'Off'}</span>
    </span>
  )
}

export default function CustomersTable({ customers, loading, onOpen, onDelete, onRecommend, onResend, resendingId, onToggleFollowup, togglePending, empty }: {
  customers: Customer[]
  loading: boolean
  onOpen: (c: Customer) => void
  onDelete: (c: Customer) => void
  onRecommend: (c: Customer) => void
  onResend: (c: Customer) => void
  resendingId: string | null
  onToggleFollowup: (c: Customer) => void
  togglePending: boolean
  empty: { title: string; sub?: string }
}) {
  return (
    <div className="jt" role="table" aria-label="Customers">
      <div className="ct-grid jt-head" role="row">
        <span className="jt-th" role="columnheader">Customer</span>
        <span className="jt-th" role="columnheader">Phone</span>
        <span className="jt-th" role="columnheader">Location</span>
        <span className="jt-th" role="columnheader">Status</span>
        <span className="jt-th" role="columnheader">Auto follow-up</span>
        <span className="jt-th ct-tags-col" role="columnheader">Tags</span>
        <span className="jt-th is-right" role="columnheader">Revenue</span>
        <span className="jt-th ct-since" role="columnheader">Customer since</span>
        <span className="jt-th is-right" role="columnheader">Actions</span>
      </div>

      {loading && Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="jt-row" aria-hidden="true"><div className="jt-main ct-grid"><span style={{ gridColumn: '1 / -1', height: 14, borderRadius: 6, background: 'var(--bg-hover)' }} /></div></div>
      ))}

      {!loading && customers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--t3)' }}>
          <Users size={26} style={{ opacity: 0.35, display: 'block', margin: '0 auto 10px' }} aria-hidden="true" />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)' }}>{empty.title}</div>
          {empty.sub && <div style={{ fontSize: 13, marginTop: 4 }}>{empty.sub}</div>}
        </div>
      )}

      {!loading && customers.map(c => {
        const name = customerName(c)
        const tags = (c.tags ?? []).filter((t: string) => !t.startsWith('iot:') && t !== 'portal-signup')
        const revenue = Number(c.totalRevenue ?? 0)
        const owed = Number(c.outstanding ?? 0)
        const location = [c.city, c.state].filter(Boolean).join(', ')
        const needsLogin = c.mustResetPassword || (!c.auth0UserId && !!c.email)
        return (
          <div key={c.id} role="row" className="jt-row ct-row" style={{ opacity: c.isActive ? 1 : 0.7 }} onClick={() => onOpen(c)}>
            <div className="jt-main ct-grid">
              <div className="ct-person" role="cell">
                <Avatar name={name} size={34} radius={17} fontSize={12} />
                <div className="ct-person-text">
                  <div className="jt-t1" title={name}>{name}</div>
                  <div className="jt-t2" title={c.email ?? undefined}>{c.email ?? 'No email'}</div>
                  {c.mustResetPassword && <span className="ct-warn" title="They haven't signed in yet. Resend their welcome email if it was missed.">Not signed in</span>}
                </div>
              </div>
              <div className="jt-c" role="cell">
                {c.phone
                  ? <a className="ct-phone" href={`tel:${c.phone}`} onClick={e => e.stopPropagation()}>{c.phone}</a>
                  : <button type="button" className="ct-add" onClick={e => { e.stopPropagation(); onOpen(c) }}>Add phone</button>}
              </div>
              <div className="jt-c" role="cell"><div className="jt-t1 is-soft" title={location || undefined}>{location || <span className="jt-t2">No location</span>}</div></div>
              <div className="jt-c" role="cell">
                <span className={`jl ${c.isActive ? 'ct-active' : 'ct-inactive'}`} style={{ gap: 7 }}><span className="ct-dot" />{c.isActive ? 'Active' : 'Inactive'}</span>
                <div className="jt-t2" style={{ marginTop: 2 }}>{c.type === 'COMMERCIAL' ? 'Commercial' : 'Residential'}</div>
              </div>
              <div role="cell"><FollowupSwitch name={name} checked={c.automaticFollowupEnabled ?? true} disabled={togglePending} onChange={() => onToggleFollowup(c)} /></div>
              <div className="jt-c ct-tags-col" role="cell">
                {tags.length === 0 ? <span className="jt-t2">None</span> : (
                  <div className="ct-tags">
                    {tags.slice(0, 2).map(t => <span key={t} className="ct-tag" title={t}>{t}</span>)}
                    {tags.length > 2 && <span className="ct-tag is-more" title={tags.slice(2).join(', ')}>+{tags.length - 2}</span>}
                  </div>
                )}
              </div>
              <div className="jt-c" role="cell" style={{ textAlign: 'right' }}>
                {c.invoiceCount ? (
                  <>
                    <div className="jt-t1">{formatMoney(revenue, { decimals: 0 })}</div>
                    {owed > 0 ? <div className="ct-due">{formatMoney(owed, { decimals: 0 })} owed</div> : <div className="jt-t2">Paid up</div>}
                  </>
                ) : <span className="jt-t2" title="They have no invoices yet">No invoices</span>}
              </div>
              <div className="jt-c ct-since jt-t2" role="cell">{new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="ct-actions" role="cell">
                {needsLogin && (
                  <button type="button" className="ct-icon is-warn" disabled={resendingId === c.id} aria-label={c.auth0UserId ? `Resend welcome email to ${name}` : `Send portal login to ${name}`} title={c.auth0UserId ? 'Resend welcome email' : 'Send portal login'}
                    onClick={e => { e.stopPropagation(); onResend(c) }}>
                    {resendingId === c.id ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                )}
                <button type="button" className="ct-icon is-ai" aria-label={`AI recommendations for ${name}`} title="AI recommendations" onClick={e => { e.stopPropagation(); onRecommend(c) }}><Sparkles size={15} /></button>
                {c.email && <a className="ct-icon" href={`mailto:${c.email}`} aria-label={`Email ${name}`} title="Email" onClick={e => e.stopPropagation()}><Mail size={15} /></a>}
                <button type="button" className="ct-icon is-del" aria-label={`Delete ${name}`} title="Delete customer" onClick={e => { e.stopPropagation(); onDelete(c) }}><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

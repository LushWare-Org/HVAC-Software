/**
 * Overview tab — profile fields, tags, Account Contacts (local-only, unchanged),
 * and Addresses. Extracted from the old "Contact" + "Addresses" tabs.
 */
import { useState } from 'react'
import { User, Users, MapPin, Plus, Trash2, ShieldCheck, ShieldAlert, Send, Loader2 } from 'lucide-react'
import { TagInput } from '../../../components/TagInput'
import { Field, SectionLabel, Badge, patchById, sectionCardStyle } from '../shared'
import { useResendWelcomeEmail } from '../../../hooks/useCustomers'
import { useToast } from '../../../contexts/ToastContext'
import TelegramMark from '../../../components/TelegramMark'
import { apiError, inviteSummary, useInviteToTelegram, useTelegramLinks, useTelegramStatus, useUnlinkTelegram } from '../../../hooks/useTelegram'
import '../../settings/telegram.css'

/** Telegram, when the company has a bot: linked (and how), or a one-tap invite by email. */
function TelegramCard({ customerId, email }: { customerId: string; email?: string }) {
  const status = useTelegramStatus()
  const live = !!(status.data?.connected && status.data.enabled)
  const links = useTelegramLinks(customerId, live)
  const invite = useInviteToTelegram()
  const unlink = useUnlinkTelegram()
  const { showSuccess, showError } = useToast()
  const [sent, setSent] = useState(false)
  const [confirm, setConfirm] = useState(false)
  if (!live) return null
  const link = links.data?.[0]
  return (
    <div style={sectionCardStyle}>
      <SectionLabel icon={Send}>Telegram</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
        <TelegramMark size={30} />
        <div style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5 }}>
          {links.isLoading ? 'Checking…' : link ? (
            <><span className="tg-chip is-new">Linked</span> <b style={{ color: 'var(--t1)' }}>{link.telegramName ?? 'Telegram'}</b> since {new Date(link.linkedAt).toLocaleDateString()}. Your replies reach their Telegram, and they can answer there.</>
          ) : email ? (
            <>Not on Telegram yet. Email them a one-tap link and they can get your replies on Telegram.</>
          ) : (
            <>Not on Telegram yet. Add an email address to invite them.</>
          )}
        </div>
        {link ? (
          confirm ? (
            <span style={{ display: 'inline-flex', gap: 6 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setConfirm(false)}>Keep</button>
              <button className="btn btn-sm btn-danger" disabled={unlink.isPending} onClick={() => unlink.mutate(link.id, { onSuccess: () => { setConfirm(false); showSuccess('Telegram unlinked. They still have the portal.') } })}>Unlink</button>
            </span>
          ) : <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(true)}>Unlink</button>
        ) : email && (
          <button
            disabled={invite.isPending || sent}
            onClick={() => invite.mutate({ customerIds: [customerId] }, {
              onSuccess: (r) => { setSent(true); showSuccess(r.sent ? `Sent to ${email}` : inviteSummary(r), 'Telegram invite') },
              onError: (e) => showError(apiError(e, 'The invite could not be sent.')),
            })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: sent ? 'var(--green)' : 'var(--telegram)', opacity: invite.isPending ? 0.75 : 1 }}>
            {invite.isPending ? <Loader2 size={13} className="animate-spin" /> : sent ? <ShieldCheck size={13} /> : <Send size={13} />}
            {invite.isPending ? 'Sending…' : sent ? 'Invite sent' : 'Invite to Telegram'}
          </button>
        )}
      </div>
    </div>
  )
}

interface Contact { id: number; name: string; role: string; email: string; phone: string }
interface Address { id: number | string; type: string; line1: string; line2?: string; city: string; state?: string; postcode: string; primary?: boolean }

function PortalAccountCard({ customerId, auth0UserId, mustResetPassword, lastLoginAt, email }: {
  customerId: string
  auth0UserId?: string
  mustResetPassword?: boolean
  lastLoginAt?: string
  email?: string
}) {
  const resendWelcomeEmail = useResendWelcomeEmail()
  const { showSuccess, showError } = useToast()
  const [justSent, setJustSent] = useState(false)
  // The email already signs in as another customer: ask before moving that login here.
  const [conflict, setConflict] = useState<string | null>(null)

  const send = (moveLogin = false) => {
    resendWelcomeEmail.mutate({ customerId, moveLogin }, {
      onSuccess: (res) => {
        setConflict(null)
        showSuccess(res.message, res.created ? 'Portal login created' : 'Login details sent')
        setJustSent(true)
        setTimeout(() => setJustSent(false), 4000)
      },
      onError: (err: any) => {
        const data = err?.response?.data
        if (data?.code === 'EMAIL_IN_USE') setConflict(data.message)
        else showError(data?.message ?? 'Could not send the login.')
      },
    })
  }
  const handleResend = () => send(false)

  const conflictBox = conflict && (
    <div style={{ marginTop: 10, border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: 'var(--t2)', background: 'color-mix(in srgb, var(--amber) 6%, var(--bg-card))' }}>
      {conflict}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-sm" style={{ background: 'var(--amber)', color: '#fff', border: 'none' }} disabled={resendWelcomeEmail.isPending} onClick={() => send(true)}>Move the login here</button>
        <button className="btn btn-sm btn-secondary" onClick={() => setConflict(null)}>Cancel</button>
      </div>
    </div>
  )

  if (!auth0UserId) {
    return (
      <div style={sectionCardStyle}>
        <SectionLabel icon={ShieldAlert}>Portal Account</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5 }}>
            {email
              ? <>No portal login yet. Send one and {email} gets a welcome email with a temporary password.</>
              : <>No portal login yet. Add an email address to send one.</>}
          </div>
          {email && (
            <button onClick={handleResend} disabled={resendWelcomeEmail.isPending || justSent}
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: justSent ? 'var(--green)' : 'var(--blue)', opacity: resendWelcomeEmail.isPending ? 0.75 : 1 }}>
              {resendWelcomeEmail.isPending ? <Loader2 size={13} className="animate-spin" /> : justSent ? <ShieldCheck size={13} /> : <Send size={13} />}
              {resendWelcomeEmail.isPending ? 'Sending…' : justSent ? 'Sent' : 'Send portal login'}
            </button>
          )}
        </div>
        {conflictBox}
      </div>
    )
  }

  return (
    <div style={sectionCardStyle}>
      <SectionLabel icon={mustResetPassword ? ShieldAlert : ShieldCheck}>Portal Account</SectionLabel>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
        border: '1px solid var(--bd)', borderRadius: 12, padding: '14px 16px',
        background: mustResetPassword ? 'color-mix(in srgb, var(--amber) 6%, var(--bg-card))' : 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: mustResetPassword ? 'var(--amber-dim, rgba(245,158,11,0.12))' : 'var(--green-dim, rgba(34,197,94,0.12))',
          }}>
            {mustResetPassword ? <ShieldAlert size={16} style={{ color: 'var(--amber)' }} /> : <ShieldCheck size={16} style={{ color: 'var(--green)' }} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
                {mustResetPassword ? 'Not yet logged in' : 'Active'}
              </span>
              {mustResetPassword && (
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                  padding: '1.5px 7px', borderRadius: 999,
                  background: 'color-mix(in srgb, var(--amber) 16%, transparent)', color: 'var(--amber)',
                }}>
                  Pending
                </span>
              )}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '2px 0 0' }}>
              {mustResetPassword
                ? `Welcome email was sent to ${email ?? 'their inbox'} but they haven't signed in yet.`
                : lastLoginAt
                  ? `Last signed in ${new Date(lastLoginAt).toLocaleString()}`
                  : 'Signed in previously.'}
            </p>
          </div>
        </div>
        {(
          <button
            onClick={() => { if (mustResetPassword || window.confirm('Send new login details? Their current password stops working.')) handleResend() }}
            disabled={resendWelcomeEmail.isPending || justSent}
            title="Send a fresh temporary password and welcome email"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              fontSize: 12, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer',
              padding: '8px 14px', borderRadius: 9,
              background: justSent ? 'var(--green)' : mustResetPassword ? 'var(--amber)' : 'var(--blue)',
              opacity: resendWelcomeEmail.isPending ? 0.75 : 1,
            }}
          >
            {resendWelcomeEmail.isPending
              ? <Loader2 size={13} className="animate-spin" />
              : justSent ? <ShieldCheck size={13} /> : <Send size={13} />}
            {resendWelcomeEmail.isPending ? 'Sending…' : justSent ? 'Sent' : mustResetPassword ? 'Resend Welcome Email' : 'Send new login details'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function OverviewTab({
  formData, isEditMode, onFieldChange, tags, onTagsChange, allTags,
  contacts, onContactsChange, addresses, onAddressesChange,
}: {
  formData: any
  isEditMode: boolean
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  allTags: string[]
  contacts: Contact[]
  onContactsChange: (updater: (prev: Contact[]) => Contact[]) => void
  addresses: Address[]
  onAddressesChange: (updater: (prev: Address[]) => Address[]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PortalAccountCard
        customerId={formData.id}
        auth0UserId={formData.auth0UserId}
        mustResetPassword={formData.mustResetPassword}
        lastLoginAt={formData.lastLoginAt}
        email={formData.email}
      />
      <TelegramCard customerId={formData.id} email={formData.email} />

      {/* Profile */}
      <div style={sectionCardStyle}>
        <SectionLabel icon={User}>Profile</SectionLabel>
        <div style={{ border: '1px solid var(--bd)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
            <Field label="Full Name" name="name" value={formData.name} isEdit={isEditMode} onChange={onFieldChange} />
            <Field label="Email" name="email" type="email" value={formData.email} isEdit={isEditMode} onChange={onFieldChange} />
            <Field label="Phone" name="phone" value={formData.phone} isEdit={isEditMode} onChange={onFieldChange} placeholder="+1 7700 000000" />
            <Field label="Lead Source" name="source" value={formData.source} isEdit={isEditMode} onChange={onFieldChange}
              as="select" options={['Google', 'Referral', 'Facebook', 'Yelp', 'Walk-in', 'Other']} placeholder="Select Source" />
            <Field label="Customer Type" name="type" value={formData.type} isEdit={isEditMode} onChange={onFieldChange}
              as="select" options={['RESIDENTIAL', 'COMMERCIAL']} placeholder="Select Type" />
            <Field label="Notes / Remarks" name="notes" value={formData.notes} isEdit={isEditMode} onChange={onFieldChange} as="textarea" full />
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                Tags
              </div>
              <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8 }}>
                Used for filtering, campaign segmentation and reporting. Press Enter or comma to add.
              </div>
              <TagInput tags={tags} onChange={onTagsChange} suggestions={allTags} placeholder="Type a tag and press Enter…" readOnly={!isEditMode} />
            </div>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div style={sectionCardStyle}>
        <SectionLabel
          icon={MapPin}
          action={isEditMode && (
            <button
              onClick={() => onAddressesChange(prev => [
                ...prev,
                { id: Date.now(), type: 'Site', line1: '', line2: '', city: '', postcode: '', primary: false },
              ])}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Plus size={13} /> Add Address
            </button>
          )}
        >
          Addresses
        </SectionLabel>

        {addresses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t4)', fontSize: 13 }}>
            <MapPin size={26} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div>No addresses yet.{isEditMode && <> Click <b>Add Address</b> to add one.</>}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ border: '1px solid var(--bd)', borderRadius: 11, padding: 13, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isEditMode ? (
                    <select
                      value={addr.type}
                      onChange={e => patchById(onAddressesChange, addr.id, { type: e.target.value })}
                      style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 6px', border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)' }}
                    >
                      <option>Site</option>
                      <option>Billing</option>
                      <option>Shipping</option>
                    </select>
                  ) : (
                    <Badge tone={addr.type === 'Site' ? 'blue' : 'neutral'}>{addr.type}{addr.primary ? ' · Primary' : ''}</Badge>
                  )}
                </div>
                {isEditMode && addresses.length > 1 && (
                  <button
                    onClick={() => onAddressesChange(prev => prev.filter(a => a.id !== addr.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { lbl: 'Address Line 1', key: 'line1' },
                  { lbl: 'Address Line 2', key: 'line2' },
                  { lbl: 'City', key: 'city' },
                  { lbl: 'State', key: 'state' },
                  { lbl: 'Postcode', key: 'postcode' },
                ].map(f => (
                  <Field
                    key={f.key}
                    label={f.lbl}
                    name={f.key}
                    value={(addr as any)[f.key]}
                    isEdit={isEditMode}
                    onChange={e => patchById(onAddressesChange, addr.id, { [f.key]: e.target.value } as any)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Contacts — local-only, never persisted (unchanged from before) */}
      <div style={sectionCardStyle}>
        <SectionLabel
          icon={Users}
          action={isEditMode && (
            <button
              onClick={() => onContactsChange(prev => [...prev, { id: Date.now(), name: '', role: 'Tenant', email: '', phone: '' }])}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Plus size={13} /> Add Contact
            </button>
          )}
        >
          Account Contacts
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contacts.map((c, idx) => (
            <div key={c.id} style={{ border: '1px solid var(--bd)', borderRadius: 11, padding: 13, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contact {idx + 1}
                </span>
                {isEditMode && contacts.length > 1 && (
                  <button
                    onClick={() => onContactsChange(prev => prev.filter(x => x.id !== c.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Name" name="name" value={c.name} isEdit={isEditMode}
                  onChange={e => patchById(onContactsChange, c.id, { name: e.target.value })} placeholder="Full Name" />
                <Field label="Role" name="role" value={c.role} isEdit={isEditMode} as="select" options={['Owner', 'Tenant', 'Property Manager', 'Other']}
                  onChange={e => patchById(onContactsChange, c.id, { role: e.target.value })} />
                <Field label="Email" name="email" type="email" value={c.email} isEdit={isEditMode}
                  onChange={e => patchById(onContactsChange, c.id, { email: e.target.value })} placeholder="email@example.com" />
                <Field label="Phone" name="phone" value={c.phone} isEdit={isEditMode}
                  onChange={e => patchById(onContactsChange, c.id, { phone: e.target.value })} placeholder="+44 7700 000000" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

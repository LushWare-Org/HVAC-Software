/**
 * CustomerPickerWithCreate — search existing customers, or create a brand-new one
 * in place (name/email/phone → temp-password portal account, same flow as
 * provision-lead/provision-technician) without leaving the current screen.
 *
 * Used anywhere a customer gets attached to something else (a project, a house) —
 * previously each of those screens only offered a search-existing list, forcing
 * staff to abandon the flow, create the customer in the Customers section, then
 * come back to find them.
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Search, User, UserPlus, Mail, AlertTriangle, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { useCustomers } from '../hooks/useCustomers'
import { useToast } from '../contexts/ToastContext'

export interface PickedCustomer {
  id: string
  firstName: string
  lastName: string
  email?: string
}

interface ProvisionCustomerResult {
  success: boolean
  userId: string
  customerId: string
  firstName: string
  lastName: string
  message: string
}

/** Creates a brand-new customer + portal account (temp password email) — no Lead. */
function useProvisionCustomer() {
  return useMutation({
    mutationFn: async (input: { firstName: string; lastName: string; email: string; phone?: string }) =>
      (await api.post('/crm/auth/provision-house-owner', input)).data as ProvisionCustomerResult,
  })
}

const tabBtn = (active: boolean): React.CSSProperties => active
  ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)', flex: 1, justifyContent: 'center' }
  : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)', flex: 1, justifyContent: 'center' }

export default function CustomerPickerWithCreate({ onPick, onCancel, autoFocus }: {
  onPick: (customer: PickedCustomer) => void
  onCancel?: () => void
  autoFocus?: boolean
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [search, setSearch] = useState('')
  const customersQ = useCustomers({ limit: 20, search: search || undefined })
  const provisionCustomer = useProvisionCustomer()
  const { showSuccess, showError } = useToast()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [newError, setNewError] = useState('')

  const createAndPick = async () => {
    setNewError('')
    if (!firstName.trim() || !lastName.trim()) { setNewError('First and last name are required.'); return }
    if (!email.trim()) { setNewError('Email is required to create their portal login.'); return }
    try {
      const result = await provisionCustomer.mutateAsync({
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() || undefined,
      })
      showSuccess(result.message, 'Account created')
      onPick({ id: result.customerId, firstName: result.firstName, lastName: result.lastName, email: email.trim() })
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Could not create this customer'
      setNewError(msg)
      showError(msg, 'Account creation failed')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" className="btn btn-sm" onClick={() => setMode('existing')} style={tabBtn(mode === 'existing')}>
          <User size={12} /> Select existing
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setMode('new')} style={tabBtn(mode === 'new')}>
          <UserPlus size={12} /> Create new customer
        </button>
      </div>

      {mode === 'existing' ? (
        <div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }} />
            <input
              autoFocus={autoFocus}
              className="form-input"
              style={{ paddingLeft: 30 }}
              value={search}
              placeholder="Search customers by name or email…"
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto', marginTop: 8 }}>
            {customersQ.isLoading ? (
              <span style={{ fontSize: 12, color: 'var(--t4)' }}>Searching…</span>
            ) : (customersQ.data?.data ?? []).length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--t4)' }}>No matching customers.</span>
            ) : (customersQ.data?.data ?? []).map((c: any) => (
              <button
                key={c.id}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => onPick({ id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email })}
              >
                {c.firstName} {c.lastName}{c.email ? ` · ${c.email}` : ''}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="form-input" placeholder="First name *" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus={autoFocus} />
            <input className="form-input" placeholder="Last name *" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <input type="email" className="form-input" placeholder="Email * — used for their portal login" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="form-input" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Mail size={11} /> They'll get an email with a temporary password to log into the customer portal.
          </p>
          {newError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--red-dim)', borderRadius: 'var(--r-md)', color: 'var(--red)', fontSize: 12.5 }}>
              <AlertTriangle size={12} /> {newError}
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={createAndPick} disabled={provisionCustomer.isPending} style={{ alignSelf: 'flex-start' }}>
            {provisionCustomer.isPending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
            {provisionCustomer.isPending ? 'Creating…' : 'Create & assign'}
          </button>
        </div>
      )}

      {onCancel && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} style={{ alignSelf: 'flex-start' }}>
          Cancel
        </button>
      )}
    </div>
  )
}

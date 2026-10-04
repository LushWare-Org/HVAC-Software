import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import api from '../lib/api'
import { AF } from '../components/airflow/AirflowArt'
import { AuthAlert, AuthField, AuthHeading, AuthSubmit, CustomerAuthShell } from '../components/airflow/CustomerAuth'

/** Sets a new password from the link in a "reset your password" email. */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const mismatch = confirm.length > 0 && confirm !== password

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Your new password needs at least 8 characters.'); return }
    if (password !== confirm) { setError("The two passwords don't match."); return }
    setBusy(true)
    try {
      await api.post('/crm/auth/reset-password', { token, newPassword: password })
      setDone(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(typeof msg === 'string' ? msg : "We couldn't update your password. Request a new link and try again.")
    } finally {
      setBusy(false)
    }
  }

  const button = 'w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center'

  return (
    <CustomerAuthShell preview={false}>
      <AuthHeading title="Choose a new password" subtitle="Use at least 8 characters. You'll sign in with it from now on." />

      {done ? (
        <>
          <AuthAlert tone="success">Password updated. You can sign in with it now.</AuthAlert>
          <Link to="/login" className={button} style={{ background: AF.accent, color: '#fff' }}>Go to sign in</Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <AuthField
            id="cp-reset-password" label="New password" type="password" icon={<Lock size={16} />}
            value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="new-password" autoFocus required minLength={8} disabled={busy}
          />
          <AuthField
            id="cp-reset-confirm" label="Confirm new password" type="password" icon={<Lock size={16} />}
            value={confirm} onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password" required disabled={busy} invalid={mismatch}
          />
          <AuthSubmit busy={busy} busyLabel="Saving" disabled={!password || !confirm}>Save new password</AuthSubmit>
          {error && /request a new/i.test(error) && (
            <p className="text-sm mt-4 text-center">
              <Link to="/forgot-password" className="font-medium inline-block py-2 hover:underline" style={{ color: AF.accent }}>Request a new link</Link>
            </p>
          )}
        </form>
      )}
    </CustomerAuthShell>
  )
}

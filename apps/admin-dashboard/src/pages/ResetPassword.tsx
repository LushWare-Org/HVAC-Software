import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import api from '../lib/api'
import { AF } from '../components/airflow/AirflowArt'
import { AdminAuthShell, AuthAlert, AuthField, AuthHeading, AuthSubmit } from '../components/airflow/AdminAuth'

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

  if (!token) {
    return (
      <AdminAuthShell>
        <AuthHeading title="This link is incomplete" subtitle="Open the reset link straight from your email, or request a new one." />
        <Link to="/forgot-password" className="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center" style={{ background: AF.accent, color: '#fff' }}>
          Request a new link
        </Link>
      </AdminAuthShell>
    )
  }

  return (
    <AdminAuthShell>
      <AuthHeading title="Choose a new password" subtitle="Use at least 8 characters. You'll sign in with it from now on." />

      {done ? (
        <>
          <AuthAlert tone="success">Password updated. You can sign in with it now.</AuthAlert>
          <Link to="/login" className="w-full h-12 rounded-lg font-semibold text-sm flex items-center justify-center" style={{ background: AF.accent, color: '#fff' }}>
            Go to sign in
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <AuthField
            id="reset-password" label="New password" type="password" icon={<Lock size={16} />}
            value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="new-password" autoFocus required minLength={8} disabled={busy}
          />
          <AuthField
            id="reset-confirm" label="Confirm new password" type="password" icon={<Lock size={16} />}
            value={confirm} onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password" required disabled={busy} invalid={mismatch}
          />
          <AuthSubmit busy={busy} busyLabel="Saving" disabled={!password || !confirm}>Save new password</AuthSubmit>
          {error && /request a new/i.test(error) && (
            <p className="text-sm mt-4 text-center">
              <Link to="/forgot-password" className="font-medium inline-block py-2 hover:underline" style={{ color: AF.supply }}>Request a new link</Link>
            </p>
          )}
        </form>
      )}
    </AdminAuthShell>
  )
}

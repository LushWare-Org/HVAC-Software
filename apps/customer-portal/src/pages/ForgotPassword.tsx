import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AtSign } from 'lucide-react'
import api from '../lib/api'
import { AF } from '../components/airflow/AirflowArt'
import { AuthAlert, AuthField, AuthHeading, AuthSubmit, CustomerAuthShell } from '../components/airflow/CustomerAuth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/crm/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.status === 429
        ? 'Too many requests. Wait a minute, then try again.'
        : "We couldn't send the link right now. Try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <CustomerAuthShell preview={false}>
      <AuthHeading title="Reset your password" subtitle="Enter the email you sign in with. We'll send you a link to choose a new password." />

      {sent ? (
        <AuthAlert tone="success">
          If {email.trim()} has an account, a reset link is on its way. It works once and expires in 30 minutes. Check your spam folder if it doesn't arrive.
        </AuthAlert>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <AuthField
            id="cp-forgot-email" label="Email" type="email" icon={<AtSign size={16} />}
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email" autoFocus required disabled={busy}
          />
          <AuthSubmit busy={busy} busyLabel="Sending link" disabled={!email}>Send reset link</AuthSubmit>
        </form>
      )}

      <p className="text-sm mt-5 text-center">
        <Link to="/login" className="font-medium inline-block py-2 hover:underline" style={{ color: AF.accent }}>Back to sign in</Link>
      </p>
    </CustomerAuthShell>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AF } from '../components/airflow/AirflowArt'
import { AdminAuthShell, AuthAlert, AuthField, AuthHeading, AuthSubmit } from '../components/airflow/AdminAuth'

function signInError(err: any): string {
  const msg = err?.response?.data?.message
  if (err?.response?.status === 401 && (!msg || /invalid email or password/i.test(String(msg)))) {
    return "That email and password don't match. Check them and try again."
  }
  if (!err?.response) return "We couldn't reach HVACtor. Check your connection and try again."
  return typeof msg === 'string' ? msg : 'Sign-in failed. Try again in a moment.'
}

export default function Login() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email.trim(), password, remember)
    } catch (err) {
      setError(signInError(err))
    }
  }

  return (
    <AdminAuthShell>
      <AuthHeading title="Sign in to your dispatch office" subtitle="Enter your work credentials to open today's board." />
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit} noValidate={false}>
        <AuthField
          id="admin-email" label="Email" type="email" icon={<AtSign size={16} />}
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@yourcompany.com" autoComplete="username" autoFocus required
          disabled={isLoading} invalid={!!error}
        />
        <AuthField
          id="admin-password" label="Password" type="password" icon={<Lock size={16} />}
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password" autoComplete="current-password" required
          disabled={isLoading} invalid={!!error}
        />

        <div className="flex items-center justify-between gap-3 -mt-1 mb-5">
          <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer text-sm">
            <input
              type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              className="w-[18px] h-[18px] rounded" style={{ accentColor: AF.accent }}
            />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-sm font-medium py-3 hover:underline" style={{ color: AF.supply }}>
            Forgot password?
          </Link>
        </div>

        <AuthSubmit busy={isLoading} busyLabel="Signing in" disabled={!email || !password}>Sign in</AuthSubmit>
      </form>

      <p className="text-sm mt-6 text-center leading-relaxed" style={{ color: AF.textMuted }}>
        Locked out? Your company admin can also reset your password.
      </p>
    </AdminAuthShell>
  )
}

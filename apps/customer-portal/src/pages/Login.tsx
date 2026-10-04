import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AtSign, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AF } from '../components/airflow/AirflowArt'
import { AuthAlert, AuthField, AuthHeading, AuthSubmit, CustomerAuthShell } from '../components/airflow/CustomerAuth'

function signInError(err: any): string {
  const msg = err?.response?.data?.message
  if (err?.response?.status === 401 && (!msg || /invalid email or password/i.test(String(msg)))) {
    return "That email and password don't match. Check them and try again."
  }
  if (!err?.response) return "We couldn't connect. Check your internet connection and try again."
  if (Array.isArray(msg)) return msg.join(', ')
  return typeof msg === 'string' ? msg : 'Sign-in failed. Try again in a moment.'
}

export default function Login() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email.trim(), password, remember)
      navigate(from, { replace: true })
    } catch (err) {
      setError(signInError(err))
    }
  }

  return (
    <CustomerAuthShell>
      <AuthHeading title="Sign in to see your visits and invoices" subtitle="Welcome back. Your service history is one step away." />
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      <form onSubmit={handleSubmit}>
        <AuthField
          id="cp-email" label="Email" type="email" icon={<AtSign size={16} />}
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="username" required
          disabled={isLoading} invalid={!!error}
        />
        <AuthField
          id="cp-password" label="Password" type="password" icon={<Lock size={16} />}
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password" autoComplete="current-password" required
          disabled={isLoading} invalid={!!error}
        />

        <div className="flex items-center justify-between gap-3 mb-4">
          <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer text-sm" style={{ color: AF.text }}>
            <input
              type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
              className="w-[18px] h-[18px] rounded" style={{ accentColor: AF.accent }}
            />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-sm font-medium py-3 hover:underline" style={{ color: AF.accent }}>
            Forgot password?
          </Link>
        </div>

        <AuthSubmit busy={isLoading} busyLabel="Signing in" disabled={!email || !password}>Sign in</AuthSubmit>
      </form>

      <p className="text-sm mt-5 text-center leading-relaxed" style={{ color: AF.muted }}>
        No account yet? Ask the company that services your home to invite you.
      </p>
    </CustomerAuthShell>
  )
}

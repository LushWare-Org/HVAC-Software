import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Wrench, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(loginEmail, loginPassword)
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Login failed'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  return (
    <div className="login-grid">
      <section
        className="login-hero"
        style={{
          padding: '3rem clamp(1.5rem, 4vw, 3rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 70%, #164e63 100%)',
          color: '#e2e8f0',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center' }}>
              <Wrench size={20} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>HomePulse</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Secure customer workspace</p>
            </div>
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', lineHeight: 1.2 }}>
            Track service jobs, quotes, and invoices from one place.
          </h2>
          <p style={{ margin: 0, maxWidth: 520, lineHeight: 1.65, color: '#bfdbfe' }}>
            Fast updates, clear documents, and direct communication with your service team.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          <InfoRow icon={<ShieldCheck size={15} />} title="Protected Access" body="Your account and billing data stay encrypted end-to-end." />
          <InfoRow icon={<Sparkles size={15} />} title="Live Job Visibility" body="See assignment updates, ETAs, and completed work in real time." />
        </div>
      </section>

      <section style={{ padding: '2rem clamp(1rem, 4vw, 3rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #dbeafe',
            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.12)',
            padding: '2rem',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Welcome back</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Sign in to your service portal</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'grid', gap: 14 }}>
            <Field label="Email Address">
              <input className="form-input" type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required autoFocus />
            </Field>
            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={{ paddingRight: '2.5rem' }} />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                Remember me
              </label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', height: 44, marginTop: 4, fontSize: 15 }}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            Don't have access? Contact your service provider to set up your account.
          </p>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#64748b' }}>{label}</span>
      {children}
    </label>
  )
}

function InfoRow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(191, 219, 254, 0.2)' }}>
      <div style={{ marginTop: 2 }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{title}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#bfdbfe' }}>{body}</p>
      </div>
    </div>
  )
}

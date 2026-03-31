import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Wrench, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import type { RegisterData } from '../contexts/AuthContext'

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID || 'demo-company-001'


export default function Login() {
  const { login, register, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regCity, setRegCity] = useState('')
  const [regState] = useState('')
  const [regZip, setRegZip] = useState('')

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

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (regPassword !== regConfirm) {
      setError('Passwords do not match')
      return
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    const dto: RegisterData = {
      companyId: COMPANY_ID,
      name: regName,
      email: regEmail,
      phone: regPhone || undefined,
      password: regPassword,
      address: regAddress || undefined,
      city: regCity || undefined,
      state: regState || undefined,
      zipCode: regZip || undefined,
    }

    try {
      await register(dto)
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Registration failed'
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
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>T&S Services Portal</h1>
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
            maxWidth: 520,
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #dbeafe',
            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.12)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 18 }}>
            <button
              className="btn"
              style={{
                border: 'none',
                borderRadius: 10,
                background: tab === 'login' ? '#0f172a' : 'transparent',
                color: tab === 'login' ? '#ffffff' : '#475569',
                height: 40,
                justifyContent: 'center',
                fontWeight: 600,
              }}
              onClick={() => {
                setTab('login')
                setError('')
              }}
            >
              Sign In
            </button>
            <button
              className="btn"
              style={{
                border: 'none',
                borderRadius: 10,
                background: tab === 'register' ? '#0f172a' : 'transparent',
                color: tab === 'register' ? '#ffffff' : '#475569',
                height: 40,
                justifyContent: 'center',
                fontWeight: 600,
              }}
              onClick={() => {
                setTab('register')
                setError('')
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          {tab === 'login' && (
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
              </div>

              <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', height: 42 }}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'grid', gap: 12 }}>
              <Field label="Full Name *">
                <input className="form-input" type="text" placeholder="John Smith" value={regName} onChange={e => setRegName(e.target.value)} required />
              </Field>

              <div className="register-row-2col">
                <Field label="Email *">
                  <input className="form-input" type="email" placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                </Field>
                <Field label="Phone">
                  <input className="form-input" type="tel" placeholder="+1 555 000 0000" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                </Field>
              </div>

              <Field label="Address">
                <input className="form-input" type="text" placeholder="123 Main Street" value={regAddress} onChange={e => setRegAddress(e.target.value)} />
              </Field>

              <div className="register-row-city-zip">
                <Field label="City">
                  <input className="form-input" type="text" placeholder="New York" value={regCity} onChange={e => setRegCity(e.target.value)} />
                </Field>
                <Field label="ZIP">
                  <input className="form-input" type="text" placeholder="10001" value={regZip} onChange={e => setRegZip(e.target.value)} />
                </Field>
              </div>

              <div className="register-row-2col">
                <Field label="Password *">
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={8} />
                </Field>
                <Field label="Confirm Password *">
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Repeat password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required />
                </Field>
              </div>

              <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', height: 42, marginTop: 4 }}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
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

import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, AlertCircle, LogOut } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function calcStrength(pwd: string): number {
  let s = 0
  if (pwd.length >= 8)  s++
  if (pwd.length >= 12) s++
  if (/[A-Z]/.test(pwd)) s++
  if (/[0-9]/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
const STRENGTH_COLOR = ['', 'var(--red)', '#f97316', '#eab308', 'var(--green)', '#15803d']

export default function ForceResetPassword() {
  const { user, logout, clearMustResetPassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState('')
  const [strength, setStrength]       = useState(0)

  const handleChange = (val: string) => {
    setNewPassword(val)
    setStrength(calcStrength(val))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (strength < 2) {
      setError('Please choose a stronger password — add uppercase letters, numbers, or symbols.')
      return
    }
    setIsLoading(true)
    try {
      await api.post('/crm/auth/force-reset-password', { newPassword })
      clearMustResetPassword()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-app)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--bd)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: '1px solid var(--bd)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--r-lg)',
            background: 'var(--blue-dim)',
            border: '1px solid rgba(37,99,235,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--blue)',
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>
              Set Your Password
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--t3)', lineHeight: 1.5 }}>
              Your account was set up by an admin. Create a secure password before continuing.
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '24px 32px 28px' }}>

          {/* Welcome note */}
          <div style={{
            background: 'var(--blue-dim)',
            border: '1px solid rgba(37,99,235,0.18)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--blue)',
            lineHeight: 1.5,
          }}>
            👋 Signed in as <strong>{user?.email}</strong>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* New password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--t3)',
                marginBottom: 6,
              }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => handleChange(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--t4)', padding: 2,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    height: 3, borderRadius: 4,
                    background: 'var(--bd)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${(strength / 5) * 100}%`,
                      background: STRENGTH_COLOR[strength],
                      transition: 'width 0.25s, background 0.25s',
                    }} />
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 600, color: STRENGTH_COLOR[strength] }}>
                    {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}
              <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--t4)' }}>
                Use uppercase letters, numbers & symbols for stronger security.
              </p>
            </div>

            {/* Confirm password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--t3)',
                marginBottom: 6,
              }}>
                Confirm Password
              </label>
              <input
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                placeholder="Re-enter your new password"
                required
                style={{
                  borderColor: confirm && confirm !== newPassword ? 'var(--red)' : undefined,
                }}
              />
              {confirm && confirm !== newPassword && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--red)' }}>
                  Passwords don't match yet
                </p>
              )}
              {confirm && confirm === newPassword && newPassword.length >= 8 && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                  ✓ Passwords match
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'var(--red-dim)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 'var(--r)',
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--red)',
              }}>
                <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isLoading || !newPassword || !confirm}
              style={{ width: '100%', justifyContent: 'center', height: 42, marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Updating…
                </>
              ) : 'Set Password & Continue'}
            </button>
          </form>

          {/* Sign out */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--t4)',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: 'var(--font)',
              }}
            >
              <LogOut size={13} />
              Sign out and use a different account
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

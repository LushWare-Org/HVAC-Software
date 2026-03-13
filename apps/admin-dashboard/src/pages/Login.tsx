import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid email or password'
      setError(typeof msg === 'string' ? msg : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
      <div className="w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">T&S</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">T&S Brothers CRM</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-[#111827] rounded-xl border border-gray-800 p-8 shadow-xl">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0e17] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 bg-[#0a0e17] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 bg-transparent border-0 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border-0 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-gray-600 text-xs mt-6">
          &copy; {new Date().getFullYear()} T&S Brothers Plumbing & HVAC
        </p>
      </div>
    </div>
  )
}

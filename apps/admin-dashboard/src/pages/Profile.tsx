/**
 * Profile.tsx — Current user's profile page.
 * Displays and allows editing of name, phone, and password.
 * Profile data comes from /crm/users/me (real data from the database).
 */

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Shield, Building2, Calendar, Save, Check, Loader2, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { useMyProfile, useUpdateMyProfile } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  office_manager: 'Office Manager',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
}

export default function Profile() {
  const { user: authUser } = useAuth()
  const profileQuery = useMyProfile()
  const updateProfile = useUpdateMyProfile()

  const [form, setForm] = useState({ name: '', phone: '' })
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        name: profileQuery.data.name ?? '',
        phone: profileQuery.data.phone ?? '',
      })
    }
  }, [profileQuery.data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = () => {
    setProfileError('')
    if (!form.name.trim()) { setProfileError('Name is required'); return }
    updateProfile.mutate(form, {
      onSuccess: () => {
        setSaved(true)
        setDirty(false)
        setTimeout(() => setSaved(false), 3000)
      },
      onError: (err: any) => {
        setProfileError(err?.response?.data?.message ?? 'Failed to save changes')
      },
    })
  }

  const handlePasswordChange = async () => {
    setPwError('')
    if (!pwForm.currentPassword) { setPwError('Current password is required'); return }
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) { setPwError('New password must be at least 8 characters'); return }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    setPwLoading(true)
    try {
      await api.post('/crm/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwSuccess(true)
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err: any) {
      setPwError(err?.response?.data?.message ?? 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  const profile = profileQuery.data
  const roleLabel = ROLE_LABELS[profile?.role ?? authUser?.role ?? ''] ?? profile?.role ?? authUser?.role ?? '—'
  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[var(--bd)] bg-transparent text-[var(--t1)] text-sm outline-none focus:border-[var(--blue)] transition-colors"

  return (
    <div className="anim-fade-up max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--t1)] mb-1">My Profile</h1>
      <p className="text-sm text-[var(--t3)] mb-6">Manage your personal information and account security</p>

      {/* Profile header card */}
      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] p-6 mb-5 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white text-3xl font-bold">
            {(profile?.name ?? authUser?.name ?? '?')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--t1)] truncate">{profile?.name ?? authUser?.name ?? '—'}</h2>
          <p className="text-sm text-[var(--t3)] mt-0.5">{profile?.email ?? authUser?.email ?? '—'}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Shield size={11} /> {roleLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--t3)]">
              <Calendar size={11} /> Joined {joinDate}
            </span>
            {profile?.isActive !== undefined && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${profile.isActive ? 'text-green-500' : 'text-red-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${profile.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] p-6 mb-5">
        <h3 className="text-base font-semibold text-[var(--t1)] mb-4 flex items-center gap-2">
          <User size={16} className="text-[var(--blue)]" /> Personal Information
        </h3>

        {profileError && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={14} /> {profileError}
          </div>
        )}

        {profileQuery.isLoading ? (
          <div className="flex items-center gap-2 text-[var(--t3)] text-sm py-4">
            <Loader2 size={14} className="animate-spin" /> Loading profile…
          </div>
        ) : profileQuery.isError ? (
          <div className="text-red-500 text-sm py-4 flex items-center gap-2">
            <AlertCircle size={14} /> Failed to load profile data.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)] pointer-events-none" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)] pointer-events-none" />
                <input
                  value={profile?.email ?? authUser?.email ?? ''}
                  disabled
                  className={`${inputCls} pl-9 opacity-60 cursor-not-allowed`}
                />
              </div>
              <p className="text-xs text-[var(--t3)] mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)] pointer-events-none" />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Role</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)] pointer-events-none" />
                <input
                  value={roleLabel}
                  disabled
                  className={`${inputCls} pl-9 opacity-60 cursor-not-allowed`}
                />
              </div>
            </div>
          </div>
        )}

        {!profileQuery.isLoading && !profileQuery.isError && (
          <div className="flex justify-end mt-5">
            <button
              onClick={handleSave}
              disabled={!dirty || updateProfile.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--blue)] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer border-0 hover:opacity-90 transition-opacity"
            >
              {updateProfile.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : saved ? (
                <><Check size={14} /> Saved</>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Password change */}
      <div className="bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] p-6">
        <h3 className="text-base font-semibold text-[var(--t1)] mb-4 flex items-center gap-2">
          <Lock size={16} className="text-[var(--blue)]" /> Change Password
        </h3>

        {pwError && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={14} /> {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
            <Check size={14} /> Password changed successfully
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="••••••••"
                className={`${inputCls} pr-9`}
              />
              <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--t3)] bg-transparent border-0 cursor-pointer p-0">
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Min. 8 characters"
                className={`${inputCls} pr-9`}
              />
              <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--t3)] bg-transparent border-0 cursor-pointer p-0">
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={handlePasswordChange}
            disabled={pwLoading || (!pwForm.currentPassword && !pwForm.newPassword)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--blue)] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer border-0 hover:opacity-90 transition-opacity"
          >
            {pwLoading ? <><Loader2 size={14} className="animate-spin" /> Changing…</> : <><Lock size={14} /> Change Password</>}
          </button>
        </div>
      </div>
    </div>
  )
}

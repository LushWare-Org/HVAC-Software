/**
 * ForceResetPassword — shown when an admin provisioned the account with a temp password.
 * The technician cannot navigate anywhere until they set a new password.
 * Back gesture is disabled (gestureEnabled: false on the Stack.Screen).
 */

import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import api from '@/lib/api'

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
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']

export default function ForceResetPassword() {
  const { user, token, logout, clearMustResetPassword } = useAuth()
  const router = useRouter()

  const [newPwd, setNewPwd]       = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')
  const [strength, setStrength]   = useState(0)

  const handleNewPwd = (val: string) => {
    setNewPwd(val)
    setStrength(calcStrength(val))
    setError('')
  }

  const handleSubmit = async () => {
    setError('')
    if (newPwd.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPwd !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (strength < 2) {
      setError('Please choose a stronger password — add uppercase letters, numbers, or symbols.')
      return
    }

    setIsLoading(true)
    try {
      // Pass the token explicitly — avoids any edge case where api.defaults.headers
      // was cleared by a concurrent 401 before this request fires.
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
      await api.post('/crm/auth/force-reset-password', { newPassword: newPwd }, { headers: authHeader })
      clearMustResetPassword()
      // Next onboarding step — the screen itself skips ahead to the tabs
      // when a base location is already set on the scheduling profile.
      router.replace('/setup-location')
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) {
        // Session expired — send them back to login to get a fresh token
        await logout()
        router.replace('/login')
        return
      }
      setError(err?.response?.data?.message ?? 'Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await logout(); router.replace('/login') },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Brand / icon */}
          <View style={styles.brandSection}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🔐</Text>
            </View>
            <Text style={styles.brandTitle}>Set Your Password</Text>
            <Text style={styles.brandSubtitle}>
              Your account was created by an admin.{'\n'}Set a new password before continuing.
            </Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>

            {/* Welcome chip */}
            <View style={styles.welcomeChip}>
              <Text style={styles.welcomeText}>
                👋 Signed in as <Text style={{ fontWeight: FontWeight.bold }}>{user?.email}</Text>
              </Text>
            </View>

            {/* New password */}
            <Text style={styles.label}>New Password</Text>
            <View style={styles.pwdRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={newPwd}
                onChangeText={handleNewPwd}
                secureTextEntry={!showPwd}
                placeholder="At least 8 characters"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPwd ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Strength bar */}
            {newPwd.length > 0 && (
              <View style={{ marginTop: 8, marginBottom: 4 }}>
                <View style={styles.strengthTrack}>
                  <View style={[styles.strengthFill, {
                    width: `${(strength / 5) * 100}%` as any,
                    backgroundColor: STRENGTH_COLOR[strength],
                  }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}>
                  {STRENGTH_LABEL[strength]}
                </Text>
              </View>
            )}

            <Text style={styles.hint}>Use uppercase letters, numbers & symbols for stronger security.</Text>

            {/* Confirm password */}
            <Text style={[styles.label, { marginTop: Spacing.md }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                confirm && confirm !== newPwd && { borderColor: '#fca5a5' },
              ]}
              value={confirm}
              onChangeText={t => { setConfirm(t); setError('') }}
              secureTextEntry={!showPwd}
              placeholder="Re-enter your new password"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              editable={!isLoading}
            />
            {confirm && confirm !== newPwd && (
              <Text style={[styles.hint, { color: Colors.danger }]}>Passwords don't match yet</Text>
            )}
            {confirm && confirm === newPwd && newPwd.length >= 8 && (
              <Text style={[styles.hint, { color: Colors.success }]}>✓ Passwords match</Text>
            )}

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (isLoading || !newPwd || !confirm) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !newPwd || !confirm}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.submitText}>Set Password & Continue</Text>}
            </TouchableOpacity>

          </View>

          {/* Sign out */}
          <TouchableOpacity onPress={handleLogout} style={styles.signoutBtn}>
            <Text style={styles.signoutText}>Sign out and use a different account</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.darkBackground },
  scroll:         { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing['2xl'] },

  // Brand section — matches login.tsx
  brandSection:   { alignItems: 'center', marginBottom: Spacing['2xl'] },
  iconCircle:     { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base },
  iconEmoji:      { fontSize: 32 },
  brandTitle:     { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, marginBottom: Spacing.xs },
  brandSubtitle:  { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Card — matches login.tsx formCard
  card:           { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadow.lg },

  welcomeChip:    {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
  },
  welcomeText:    { fontSize: FontSize.sm, color: Colors.primary, textAlign: 'center' },

  label:          { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: 6 },
  input:          {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  pwdRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  eyeBtn:         { padding: Spacing.sm },
  strengthTrack:  { height: 4, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  strengthFill:   { height: '100%', borderRadius: 4 },
  strengthLabel:  { fontSize: 11, fontWeight: FontWeight.semibold, marginTop: 3 },
  hint:           { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, marginBottom: 4 },

  errorBox:       { backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md, marginTop: Spacing.sm },
  errorText:      { fontSize: FontSize.sm, color: Colors.danger, fontWeight: FontWeight.medium },

  submitBtn:      { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.base, alignItems: 'center', marginTop: Spacing.base },
  submitText:     { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  btnDisabled:    { opacity: 0.5 },

  signoutBtn:     { alignItems: 'center', paddingVertical: Spacing.lg, marginTop: Spacing.sm },
  signoutText:    { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'underline' },
})

import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { Text } from '@/components/Text'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'

export default function Login() {
  const { login, isLoading, hasStoredSession, isAuthenticated, retryUnlock } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const autoTriedRef = useRef(false)

  // A valid session is on the device but locked — this is a lock screen, not
  // a login form, so it should prompt the same way the phone itself would
  // when you open it: immediately, without a tap first.
  const locked = hasStoredSession && !isAuthenticated && !showPasswordForm

  const attemptUnlock = async () => {
    setUnlocking(true)
    setError('')
    try {
      const ok = await retryUnlock()
      if (ok) {
        router.replace('/(tabs)')
      } else {
        setError('Unlock canceled.')
      }
    } finally {
      setUnlocking(false)
    }
  }

  useEffect(() => {
    if (locked && !autoTriedRef.current) {
      autoTriedRef.current = true
      void attemptUnlock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked])

  const onSubmit = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    try {
      await login(email.trim(), password)
      router.replace('/(tabs)')
    } catch (err: any) {
      // The role gate throws its own customer-facing copy; anything else is a
      // credential or network failure.
      setError(err?.message ?? 'Could not sign in. Please try again.')
    }
  }

  if (locked) {
    return (
      <View style={styles.container}>
        <View style={styles.lockCard}>
          <View style={styles.logoWrap}>
            <Logo size={56} />
          </View>
          <Text style={styles.title}>HVACtor.ai</Text>
          <Text style={styles.subtitle}>Unlock to continue where you left off</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, unlocking && styles.buttonDisabled]}
            onPress={attemptUnlock}
            disabled={unlocking}
          >
            {unlocking ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Feather name="unlock" size={16} color={Colors.textInverse} />
                <Text style={styles.buttonText}>Unlock</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAccount}
            onPress={() => setShowPasswordForm(true)}
          >
            <Text style={styles.switchAccountText}>Sign in with a different account</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Logo size={56} />
        </View>
        <Text style={styles.title}>HVACtor.ai</Text>
        <Text style={styles.subtitle}>Sign in to view your services</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          onSubmitEditing={onSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <Text style={styles.buttonText}>Sign in</Text>}
        </TouchableOpacity>

        {hasStoredSession ? (
          <TouchableOpacity style={styles.switchAccount} onPress={() => setShowPasswordForm(false)}>
            <Text style={styles.switchAccountText}>Back to unlock</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  lockCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.raised,
  },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.base },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  error: { color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    width: '100%',
    marginTop: Spacing.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textInverse, fontSize: FontSize.base, fontWeight: '600' },
  switchAccount: { marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  switchAccountText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600', textAlign: 'center' },
})

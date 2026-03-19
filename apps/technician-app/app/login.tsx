import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'

export default function LoginScreen() {
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [rejectionMsg, setRejectionMsg] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password')
      return
    }
    setError('')
    setRejectionMsg('')
    try {
      const result = await login(email.trim(), password)
      if (result.status === 'APPROVED') {
        router.replace('/(tabs)')
      } else if (result.status === 'PENDING') {
        router.replace('/pending-approval')
      } else if (result.status === 'REJECTED') {
        setRejectionMsg(result.rejectionMessage ?? 'Your application was not approved.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? 'Login failed. Please check your credentials.'
      setError(msg)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🔧</Text>
            </View>
            <Text style={styles.brandTitle}>T&S Technician</Text>
            <Text style={styles.brandSubtitle}>Field Service Management</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Enter your credentials to access your schedule</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {rejectionMsg ? (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionTitle}>Application Not Approved</Text>
                <Text style={styles.rejectionText}>{rejectionMsg}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@company.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isLoading}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                editable={!isLoading}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={() => router.push('/signup')} activeOpacity={0.85}>
            <Text style={styles.applyBtnText}>🛠  Apply to Join as a Technician</Text>
          </TouchableOpacity>

          <Text style={styles.applyHint}>
            New here? Submit your details and an admin will approve your account.
          </Text>

          <Text style={styles.footer}>Trade & Service CRM v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkBackground },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing['2xl'] },
  brandSection: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base },
  logoIcon: { fontSize: 36 },
  brandTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.white, marginBottom: Spacing.xs },
  brandSubtitle: { fontSize: FontSize.base, color: Colors.textMuted },
  formCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, ...Shadow.lg },
  formTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  formSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  errorBox: { backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.base },
  errorText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: FontWeight.medium },
  rejectionBox: { backgroundColor: '#2a0a0a', borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.danger },
  rejectionTitle: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: FontWeight.bold, marginBottom: 4 },
  rejectionText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.md },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 12, top: 12, padding: 4 },
  eyeIcon: { fontSize: 20 },
  loginBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.base, alignItems: 'center', marginTop: Spacing.xl },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.md, color: Colors.textMuted, fontSize: FontSize.sm },
  applyBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.base, alignItems: 'center' },
  applyBtnText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  applyHint: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.sm },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing['2xl'] },
})

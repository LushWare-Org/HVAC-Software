import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'

export default function PendingApprovalScreen() {
  const { pendingUser, logout, clearPendingUser } = useAuth()
  const router = useRouter()

  // Rotating gear animation
  const spin = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  const handleCheckStatus = async () => {
    // Navigate back to login to re-attempt sign in
    await clearPendingUser()
    router.replace('/login')
  }

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const firstName = pendingUser?.name?.split(' ')[0] ?? 'there'

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Animated icon */}
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulse }] }]}>
          <Animated.Text style={[styles.gearIcon, { transform: [{ rotate }] }]}>⚙️</Animated.Text>
        </Animated.View>

        {/* Status badge */}
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Pending Review</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Almost there, {firstName}!</Text>
        <Text style={styles.subheading}>
          Your application has been submitted and is awaiting admin approval.
        </Text>

        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>📧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Registered Email</Text>
              <Text style={styles.cardValue}>{pendingUser?.email ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>⏱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Review Time</Text>
              <Text style={styles.cardValue}>Typically within 24 hours</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>What happens next?</Text>
              <Text style={styles.cardValue}>
                Once approved, come back and sign in. Your account will be activated and ready to use.
              </Text>
            </View>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {[
            { n: '1', label: 'Application submitted', done: true },
            { n: '2', label: 'Admin reviews your profile', done: false },
            { n: '3', label: 'Account activated — sign in!', done: false },
          ].map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepDot, s.done && styles.stepDotDone]}>
                <Text style={[styles.stepNum, s.done && styles.stepNumDone]}>{s.done ? '✓' : s.n}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, s.done && styles.stepLineDone]} />}
              <Text style={[styles.stepLabel, s.done && styles.stepLabelDone]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckStatus} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>I've Been Approved — Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Back to Login</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkBackground },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },

  iconWrapper: { marginTop: Spacing.xl, marginBottom: Spacing.md },
  gearIcon: { fontSize: 72 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2a2000', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#f59e0b', marginBottom: Spacing.lg,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  badgeText: { fontSize: FontSize.sm, color: '#f59e0b', fontWeight: FontWeight.semibold },

  heading: {
    fontSize: FontSize['2xl'], fontWeight: FontWeight.bold,
    color: Colors.white, textAlign: 'center', marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: FontSize.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl,
  },

  card: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.md, marginBottom: Spacing.lg,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  cardIcon: { fontSize: 22, marginTop: 2 },
  cardLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  cardValue: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },

  stepsCard: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.sm, marginBottom: Spacing.xl,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  stepDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepNum: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  stepNumDone: { color: Colors.white },
  stepLine: { position: 'absolute', left: 13, top: 28, width: 2, height: 20, backgroundColor: Colors.border },
  stepLineDone: { backgroundColor: Colors.success },
  stepLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  stepLabelDone: { color: Colors.textPrimary, fontWeight: FontWeight.medium },

  primaryBtn: {
    width: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base + 2, alignItems: 'center', marginBottom: Spacing.md,
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  secondaryBtn: {
    width: '100%', borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.textMuted, fontSize: FontSize.sm },
})

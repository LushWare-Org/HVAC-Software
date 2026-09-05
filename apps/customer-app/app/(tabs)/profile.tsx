import React from 'react'
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Logo } from '@/components/Logo'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { getInitials } from '@/lib/threadActions'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'

const MORE_LINKS = [
  { label: 'Service Agreements', icon: 'file-text', href: '/agreements' },
  { label: 'My Projects', icon: 'briefcase', href: '/projects' },
  { label: 'My Property', icon: 'home', href: '/property' },
  { label: 'Offers', icon: 'tag', href: '/offers' },
  { label: 'Tips', icon: 'zap', href: '/tips' },
] as const

export default function Profile() {
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuth()
  const { isConnected } = useSocket()

  const onLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name ?? '—'}</Text>
            <Text style={styles.email}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {MORE_LINKS.map(({ label, icon, href }, i) => (
            <TouchableOpacity
              key={href}
              style={[styles.linkRow, i === MORE_LINKS.length - 1 && styles.linkRowLast]}
              onPress={() => router.push(href as never)}
            >
              <View style={styles.linkIcon}>
                <Feather name={icon as keyof typeof Feather.glyphMap} size={16} color={Colors.primary} />
              </View>
              <Text style={styles.rowLabel}>{label}</Text>
              <Feather name="chevron-right" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowLabel}>Require unlock to open</Text>
              <Text style={styles.rowSubtext}>Face ID, fingerprint, or your device passcode</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(v) => {
                void setBiometricEnabled(v)
              }}
              trackColor={{ true: Colors.primary, false: Colors.disabled }}
            />
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Live connection</Text>
            <View style={styles.connectionValue}>
              <View
                style={[
                  styles.connectionDot,
                  { backgroundColor: isConnected ? Colors.success : Colors.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.rowValue,
                  { color: isConnected ? Colors.success : Colors.textMuted },
                ]}
              >
                {isConnected ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Feather name="log-out" size={16} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.brandFooter}>
          <Logo size={28} />
          <Text style={styles.brandFooterText}>HVACtor.ai</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: '700' },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  rowValue: { fontSize: FontSize.sm, fontWeight: '600' },
  rowTextGroup: { flex: 1, paddingRight: Spacing.md },
  rowSubtext: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  connectionValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  linkRowLast: { borderBottomWidth: 0 },
  linkIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: Spacing.base,
  },
  logoutText: { color: Colors.danger, fontSize: FontSize.base, fontWeight: '600' },
  brandFooter: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxl },
  brandFooterText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
})

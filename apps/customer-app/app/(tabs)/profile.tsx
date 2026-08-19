import React from 'react'
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

export default function Profile() {
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuth()
  const { isConnected } = useSocket()

  const onLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.name}>{user?.name ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Unlock with biometrics</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={(v) => {
                void setBiometricEnabled(v)
              }}
              trackColor={{ true: Colors.primary, false: Colors.disabled }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Live connection</Text>
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

        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
  },
  rowLabel: { fontSize: FontSize.base, color: Colors.textPrimary },
  rowValue: { fontSize: FontSize.sm, fontWeight: '600' },
  logout: {
    marginTop: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  logoutText: { color: Colors.danger, fontSize: FontSize.base, fontWeight: '600' },
})

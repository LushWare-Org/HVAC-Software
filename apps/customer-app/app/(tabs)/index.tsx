import React from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useCustomerHome } from '@/hooks/useCustomerHome'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { isConnected } = useSocket()
  const { upcomingJobs, openInvoices, isLoading, isError, refetch } = useCustomerHome()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] ?? 'there'}</Text>

        <View style={styles.liveRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: isConnected ? Colors.success : Colors.textMuted },
            ]}
          />
          <Text style={styles.liveText}>
            {isConnected ? 'Live — updates arrive automatically' : 'Reconnecting…'}
          </Text>
        </View>

        {isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Could not load your latest information. Pull down to retry.
            </Text>
          </View>
        ) : null}

        <View style={styles.statRow}>
          <Stat label="Upcoming visits" value={upcomingJobs} />
          <Stat label="Open invoices" value={openInvoices} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  greeting: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  liveText: { fontSize: FontSize.sm, color: Colors.textMuted },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  stat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
})

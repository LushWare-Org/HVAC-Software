import React from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useCustomerHome } from '@/hooks/useCustomerHome'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'
import type { Job } from '@/types/api'

/** Status → badge colours, mirroring the portal's badge vocabulary. */
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: Colors.warningLight, fg: Colors.warning },
  SCHEDULED: { bg: Colors.primaryLight, fg: Colors.primaryDark },
  EN_ROUTE: { bg: Colors.infoLight, fg: Colors.info },
  ON_SITE: { bg: Colors.infoLight, fg: Colors.info },
  IN_PROGRESS: { bg: Colors.infoLight, fg: Colors.info },
  COMPLETED: { bg: Colors.successLight, fg: Colors.success },
  INVOICED: { bg: Colors.surfaceAlt, fg: Colors.textSecondary },
  PAID: { bg: Colors.successLight, fg: Colors.success },
  CANCELLED: { bg: Colors.dangerLight, fg: Colors.danger },
  ON_HOLD: { bg: Colors.warningLight, fg: Colors.warning },
}

function humanizeStatus(value: string): string {
  const lower = value.replace(/_/g, ' ').toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function formatWhen(iso?: string | null): string {
  if (!iso) return 'Not scheduled'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function JobRow({ job }: { job: Job }) {
  const s = STATUS_STYLE[job.status] ?? { bg: Colors.surfaceAlt, fg: Colors.textSecondary }
  return (
    <View style={styles.jobRow}>
      <View style={styles.jobMain}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {job.title || job.jobNumber || 'Service'}
        </Text>
        <Text style={styles.jobWhen}>{formatWhen(job.scheduledStart)}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.fg }]}>{humanizeStatus(job.status)}</Text>
      </View>
    </View>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { isConnected } = useSocket()
  const {
    activeJobs, totalJobs, openInvoices, pendingQuotes,
    recentJobs, isLoading, isError, refetch,
  } = useCustomerHome()

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
          <Stat label="Active jobs" value={activeJobs} />
          <Stat label="Quotes to review" value={pendingQuotes} />
          <Stat label="Open invoices" value={openInvoices} />
        </View>

        <Text style={styles.sectionTitle}>Recent services</Text>
        <View style={styles.card}>
          {recentJobs.length === 0 ? (
            <Text style={styles.empty}>
              {isLoading ? 'Loading your services…' : 'No services yet.'}
            </Text>
          ) : (
            recentJobs.map((job) => <JobRow key={job.id} job={job} />)
          )}
        </View>

        {totalJobs > recentJobs.length ? (
          <Text style={styles.footnote}>
            Showing {recentJobs.length} of {totalJobs} services
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  greeting: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  liveText: { fontSize: FontSize.sm, color: Colors.textMuted },
  statRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  jobMain: { flex: 1 },
  jobTitle: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '600' },
  jobWhen: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  badge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  empty: { paddingVertical: Spacing.lg, color: Colors.textMuted, fontSize: FontSize.sm },
  footnote: {
    marginTop: Spacing.md,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
})

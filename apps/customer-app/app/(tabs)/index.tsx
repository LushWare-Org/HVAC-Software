import React, { useMemo } from 'react'
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Logo } from '@/components/Logo'
import { Feather } from '@expo/vector-icons'
import { setStatusBarStyle } from 'expo-status-bar'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useCustomerHome } from '@/hooks/useCustomerHome'
import { useMyInvoices, useMyQuotes } from '@/hooks/useMyFinance'
import { useUnreadNotificationsCount, useUnreadThreadsCount } from '@/hooks/useMyMessages'
import { StatusBadge } from '@/components/StatusBadge'
import { Card } from '@/components/Card'
import { SectionHeader } from '@/components/SectionHeader'
import { QuoteCard, rankQuote } from '@/components/QuoteCard'
import { InvoiceCard, rankInvoice } from '@/components/InvoiceCard'
import { formatDate } from '@/lib/format'
import { Colors, Eyebrow, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { Job } from '@/types/api'

type QuickAction = {
  key: string
  label: string
  icon: keyof typeof Feather.glyphMap
  tint: string
  badge?: number
  onPress: () => void
}

function QuickActionTile({ action }: { action: QuickAction }) {
  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={action.onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={
        action.badge ? `${action.label}, ${action.badge} awaiting you` : action.label
      }
    >
      <View style={styles.tileIcon}>
        <Feather name={action.icon} size={22} color={action.tint} />
        {action.badge ? (
          <View style={styles.tileBadge}>
            <Text style={styles.tileBadgeText}>{action.badge > 9 ? '9+' : action.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>{action.label}</Text>
    </TouchableOpacity>
  )
}

function JobRow({ job }: { job: Job }) {
  return (
    <TouchableOpacity style={styles.jobRow} onPress={() => router.push(`/job/${job.id}`)}>
      <View style={styles.jobIcon}>
        <Feather name="tool" size={16} color={Colors.primary} />
      </View>
      <View style={styles.jobMain}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {job.title || job.jobNumber || 'Service'}
        </Text>
        <Text style={styles.jobWhen}>{formatDate(job.scheduledStart)}</Text>
      </View>
      <StatusBadge status={job.status} />
    </TouchableOpacity>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { isConnected } = useSocket()

  // The hero band sits behind the status bar, so light icons are needed here
  // specifically. expo-router's Tabs keep inactive tabs mounted, so a plain
  // <StatusBar> component here would leak "light" onto every other (white-
  // headed) screen — useFocusEffect scopes the override to only while this
  // tab is actually the one on screen, reverting on blur.
  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle('light')
      return () => setStatusBarStyle('dark')
    }, []),
  )
  const {
    activeJobs, totalJobs, openInvoices, pendingQuotes,
    recentJobs, isLoading, isError, refetch,
  } = useCustomerHome()
  const unreadThreads = useUnreadThreadsCount()
  const unreadNotifications = useUnreadNotificationsCount()
  const messagesBadge = unreadThreads + unreadNotifications

  const quotesQ = useMyQuotes()
  const invoicesQ = useMyInvoices()

  const previewQuotes = useMemo(() => {
    const list = quotesQ.data?.data ?? []
    return [...list].sort((a, b) => rankQuote(a) - rankQuote(b)).slice(0, 3)
  }, [quotesQ.data])

  const previewInvoices = useMemo(() => {
    const list = invoicesQ.data?.data ?? []
    return [...list].sort((a, b) => rankInvoice(a) - rankInvoice(b)).slice(0, 3)
  }, [invoicesQ.data])

  const actions: QuickAction[] = [
    { key: 'book', label: 'Book Service', icon: 'plus-circle', tint: Colors.primary, onPress: () => router.push('/book') },
    { key: 'quotes', label: 'Quotes', icon: 'file-text', tint: Colors.info, badge: pendingQuotes, onPress: () => router.push('/(tabs)/billing?segment=QUOTES') },
    { key: 'invoices', label: 'Invoices', icon: 'credit-card', tint: Colors.warning, badge: openInvoices, onPress: () => router.push('/(tabs)/billing?segment=INVOICES') },
    { key: 'messages', label: 'Messages', icon: 'message-circle', tint: Colors.violet, badge: messagesBadge, onPress: () => router.push('/(tabs)/messages') },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.white} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroIdentity}>
              <Logo size={30} chip />
              <View>
                <Text style={styles.eyebrow}>WELCOME BACK</Text>
                <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] ?? 'there'}</Text>
              </View>
            </View>
            <View style={styles.liveDotWrap}>
              <View style={[styles.dot, { backgroundColor: isConnected ? '#4ADE80' : 'rgba(255,255,255,0.5)' }]} />
            </View>
          </View>
          <Text style={styles.liveText}>
            {isConnected ? 'You will see updates the moment they happen' : 'Reconnecting…'}
          </Text>

          <View style={styles.tileGrid}>
            {actions.map((action) => (
              <QuickActionTile key={action.key} action={action} />
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {isError ? (
            <View style={styles.errorCard}>
              <Feather name="alert-triangle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>
                Could not load your latest information. Pull down to retry.
              </Text>
            </View>
          ) : null}

          <Card style={styles.statCard}>
            <StatCell label="Active jobs" value={activeJobs} onPress={() => router.push('/(tabs)/jobs')} />
            <View style={styles.statDivider} />
            <StatCell label="Total services" value={totalJobs} onPress={() => router.push('/(tabs)/jobs')} />
          </Card>

          <SectionHeader
            title="Recent services"
            actionLabel="See all"
            onAction={() => router.push('/(tabs)/jobs')}
          />
          <Card style={styles.listCard}>
            {recentJobs.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="clipboard" size={22} color={Colors.textMuted} />
                <Text style={styles.empty}>
                  {isLoading ? 'Loading your services…' : 'No services yet. Tap Book Service above to get started.'}
                </Text>
              </View>
            ) : (
              recentJobs.map((job, i) => (
                <View key={job.id} style={i > 0 ? styles.jobRowDivider : undefined}>
                  <JobRow job={job} />
                </View>
              ))
            )}
          </Card>
          {totalJobs > recentJobs.length ? (
            <Text style={styles.footnote}>
              Showing {recentJobs.length} of {totalJobs} services
            </Text>
          ) : null}

          {previewQuotes.length > 0 ? (
            <>
              <SectionHeader
                title="Quotes"
                actionLabel="See all"
                onAction={() => router.push('/(tabs)/billing?segment=QUOTES')}
              />
              {previewQuotes.map((q) => <QuoteCard key={q.id} quote={q} />)}
            </>
          ) : null}

          {previewInvoices.length > 0 ? (
            <>
              <SectionHeader
                title="Invoices"
                actionLabel="See all"
                onAction={() => router.push('/(tabs)/billing?segment=INVOICES')}
              />
              {previewInvoices.map((i) => <InvoiceCard key={i.id} invoice={i} />)}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCell({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.statCell}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.heroBg },
  scroll: { paddingBottom: Spacing.xxl },
  hero: {
    backgroundColor: Colors.heroBg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroIdentity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eyebrow: { ...Eyebrow, color: 'rgba(255,255,255,0.75)' },
  greeting: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textInverse, marginTop: 2 },
  liveDotWrap: { paddingTop: Spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  liveText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: Spacing.xs, marginBottom: Spacing.lg },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: { width: '22.5%', alignItems: 'center', gap: Spacing.sm },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    // Solid white, not a translucent chip — a brand-blue icon on a translucent
    // blue-tinted circle on a blue hero nearly disappears. White gives every
    // icon color real contrast, and reads as a proper button, not a hint.
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  tileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.heroBg,
  },
  tileBadgeText: { color: Colors.textInverse, fontSize: 10, fontWeight: '700' },
  tileLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textAlign: 'center' },
  body: { backgroundColor: Colors.background, padding: Spacing.lg, paddingTop: Spacing.lg },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm, flex: 1 },
  statCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border, alignSelf: 'stretch' },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  listCard: { paddingHorizontal: Spacing.base },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  jobRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  jobIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  jobMain: { flex: 1 },
  jobTitle: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '600' },
  jobWhen: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  empty: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  footnote: {
    marginTop: Spacing.md,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
})

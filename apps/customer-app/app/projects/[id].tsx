import React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { router, useLocalSearchParams } from 'expo-router'
import { useMyProjectJobs, useMyProjectMoney, useMyProjectQuotes, useMyProjects } from '@/hooks/useMyProjects'
import { StatusBadge } from '@/components/StatusBadge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDate, formatMoney } from '@/lib/format'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: projects, isLoading: projectsLoading } = useMyProjects()
  const jobsQ = useMyProjectJobs(id ?? null)
  const quotesQ = useMyProjectQuotes(id ?? null)
  const moneyQ = useMyProjectMoney(id ?? null)

  const project = projects?.find((p) => p.id === id)

  if (projectsLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    )
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errorText}>Could not find this project.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const money = moneyQ.data
  const jobs = jobsQ.data ?? []
  const quotes = quotesQ.data ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={project.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badgeRow}>
          <StatusBadge status={project.status} />
          {project.category ? <Text style={styles.meta}>{project.category}</Text> : null}
        </View>
        {project.siteAddress ? <Text style={styles.meta}>{project.siteAddress}</Text> : null}
        {project.description ? <Text style={styles.body}>{project.description}</Text> : null}

        {money ? (
          <View style={styles.moneyCard}>
            <MoneyStat label="Invoiced" value={money.invoiced} />
            <MoneyStat label="Paid" value={money.paid} />
            <MoneyStat label="Outstanding" value={money.outstanding} emphasize={money.outstanding > 0} />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Jobs</Text>
        <View style={styles.card}>
          {jobsQ.isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.sectionLoader} />
          ) : jobs.length === 0 ? (
            <Text style={styles.emptyText}>No jobs yet.</Text>
          ) : (
            jobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.row}
                onPress={() => router.push(`/job/${job.id}`)}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>{job.title}</Text>
                <StatusBadge status={job.status} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Quotes</Text>
        <View style={styles.card}>
          {quotesQ.isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.sectionLoader} />
          ) : quotes.length === 0 ? (
            <Text style={styles.emptyText}>No quotes yet.</Text>
          ) : (
            quotes.map((quote) => (
              <TouchableOpacity
                key={quote.id}
                style={styles.row}
                onPress={() => router.push(`/quote/${quote.id}`)}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {quote.quoteNumber ?? formatDate(quote.createdAt, '—')}
                </Text>
                <View style={styles.rowEnd}>
                  <Text style={styles.rowAmount}>{formatMoney(quote.total)}</Text>
                  <StatusBadge status={quote.status} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function MoneyStat({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <View style={styles.moneyStat}>
      <Text style={styles.moneyLabel}>{label}</Text>
      <Text style={[styles.moneyValue, emphasize && styles.moneyValueEmphasis]}>
        {formatMoney(value)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, gap: Spacing.base,
  },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  body: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: Spacing.md },
  moneyCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.base, marginTop: Spacing.lg, ...Shadow.card,
  },
  moneyStat: { flex: 1, alignItems: 'center' },
  moneyLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  moneyValue: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  moneyValueEmphasis: { color: Colors.danger },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary,
    marginTop: Spacing.xl, marginBottom: Spacing.xs,
  },
  sectionLoader: { paddingVertical: Spacing.base },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base, ...Shadow.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.base, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border, gap: Spacing.sm,
  },
  rowTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  rowEnd: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, paddingVertical: Spacing.base },
  errorText: { color: Colors.danger, fontSize: FontSize.base },
  secondaryBtn: { paddingVertical: Spacing.base, alignItems: 'center' },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
})

import React, { useMemo, useState } from 'react'
import {
  FlatList, RefreshControl, StyleSheet, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMyJobs } from '@/hooks/useMyJobs'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDateTime } from '@/lib/format'
import { isTerminal } from '@/lib/jobActions'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { Job } from '@/types/api'

type Filter = 'ALL' | 'ACTIVE' | 'DONE'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DONE', label: 'Completed' },
]

export default function Jobs() {
  const { data, isLoading, isError, refetch, isRefetching } = useMyJobs()
  const [filter, setFilter] = useState<Filter>('ALL')

  const jobs = useMemo(() => {
    const all = data?.data ?? []
    const sorted = [...all].sort((a, b) => {
      const at = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0
      const bt = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0
      return bt - at
    })
    if (filter === 'ACTIVE') return sorted.filter((j) => !isTerminal(j))
    if (filter === 'DONE') return sorted.filter((j) => isTerminal(j))
    return sorted
  }, [data, filter])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your services</Text>
        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/book')}>
          <Feather name="plus" size={14} color={Colors.textInverse} />
          <Text style={styles.bookBtnText}>Book</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isLoading} onRefresh={refetch} />
        }
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {!isLoading ? <Feather name="tool" size={22} color={Colors.textMuted} /> : null}
            <Text style={styles.emptyText}>
              {isLoading
                ? 'Loading your services…'
                : isError
                  ? 'Could not load your services. Pull down to retry.'
                  : filter === 'ALL'
                    ? 'No services yet. Tap Book to request one.'
                    : 'Nothing here right now.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

function JobCard({ job }: { job: Job }) {
  const pendingReschedule = Boolean(job.rescheduleState && job.rescheduleState !== 'NONE')
  return (
    <TouchableOpacity
      style={[styles.card, pendingReschedule && styles.cardAccent]}
      onPress={() => router.push(`/job/${job.id}`)}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Feather name="tool" size={14} color={Colors.primary} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {job.title || job.jobNumber || 'Service'}
        </Text>
        <StatusBadge status={job.status} />
      </View>
      <Text style={styles.cardWhen}>{formatDateTime(job.scheduledStart)}</Text>
      {job.assignedToName ? (
        <Text style={styles.cardTech}>Technician: {job.assignedToName}</Text>
      ) : null}
      {pendingReschedule ? (
        <Text style={styles.cardFlag}>Reschedule request pending</Text>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  bookBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.sm },
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primaryLight },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primaryDark },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...Shadow.card,
  },
  cardAccent: { borderLeftColor: Colors.warning },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardWhen: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },
  cardTech: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  cardFlag: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '700', marginTop: Spacing.xs },
  empty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
})

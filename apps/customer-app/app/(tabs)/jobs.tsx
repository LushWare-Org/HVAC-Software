import React, { useMemo, useState } from 'react'
import {
  Alert, FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useConfirmVisit, useMyJobs } from '@/hooks/useMyJobs'
import { StatusBadge } from '@/components/StatusBadge'
import { Avatar } from '@/components/Avatar'
import { formatVisit, humanizeStatus } from '@/lib/format'
import { canConfirm, isConfirmed } from '@/lib/confirm'
import { Colors, FontSize, Radius, Shadow, Spacing, tint } from '@/constants/theme'
import type { Job } from '@/types/api'

type Tab = 'ACTIVE' | 'UPCOMING' | 'PAST'

const LIVE = ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS']
const OPEN = ['PENDING', 'SCHEDULED', 'ON_HOLD']
const TABS: { key: Tab; label: string }[] = [
  { key: 'ACTIVE', label: 'On the way' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'PAST', label: 'Past' },
]
const TAB_STATUSES: Record<Tab, string[]> = {
  ACTIVE: LIVE,
  UPCOMING: OPEN,
  PAST: ['COMPLETED', 'INVOICED', 'PAID', 'CANCELLED'],
}

const time = (j: Job) => (j.scheduledStart ? new Date(j.scheduledStart).getTime() : null)

export default function Jobs() {
  const { data, isLoading, isError, refetch, isRefetching } = useMyJobs()
  const [tab, setTab] = useState<Tab | null>(null)
  const [statusSel, setStatusSel] = useState<string[]>([])

  const groups = useMemo(() => {
    const all = data?.data ?? []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const active = all.filter((j) => LIVE.includes(j.status))
    const upcoming = all
      .filter((j) => OPEN.includes(j.status) && (time(j) === null || (time(j) as number) >= today.getTime()))
      .sort((a, b) => (time(a) ?? Infinity) - (time(b) ?? Infinity))
    const taken = new Set([...active, ...upcoming].map((j) => j.id))
    const past = all.filter((j) => !taken.has(j.id)).sort((a, b) => (time(b) ?? 0) - (time(a) ?? 0))
    return { ACTIVE: active, UPCOMING: upcoming, PAST: past } as Record<Tab, Job[]>
  }, [data])

  // First load: land on the tab that has something to show.
  const current: Tab = tab ?? (groups.ACTIVE.length ? 'ACTIVE' : groups.UPCOMING.length ? 'UPCOMING' : 'PAST')
  const counts: Record<string, number> = {}
  for (const j of groups[current]) counts[j.status] = (counts[j.status] ?? 0) + 1
  const jobs = groups[current].filter((j) => !statusSel.length || statusSel.includes(j.status))

  const choose = (t: Tab) => { setTab(t); setStatusSel([]) }
  const toggleStatus = (s: string) => setStatusSel((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your services</Text>
        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/book')}>
          <Feather name="plus" size={14} color={Colors.textInverse} />
          <Text style={styles.bookBtnText}>Book</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => {
          const on = current === t.key
          return (
            <TouchableOpacity key={t.key} onPress={() => choose(t.key)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
              <View style={[styles.count, on && styles.countOn]}>
                <Text style={[styles.countText, on && styles.countTextOn]}>{isLoading ? '…' : groups[t.key].length}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {TAB_STATUSES[current].map((s) => {
            const on = statusSel.includes(s)
            return (
              <TouchableOpacity key={s} onPress={() => toggleStatus(s)} style={[styles.chip, on && styles.chipOn, !counts[s] && !on && styles.chipEmpty]} accessibilityState={{ selected: on }}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{humanizeStatus(s)}</Text>
                <Text style={[styles.chipCount, on && styles.chipTextOn]}>{counts[s] ?? 0}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching && !isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {!isLoading ? <Feather name="tool" size={22} color={Colors.textMuted} /> : null}
            <Text style={styles.emptyText}>
              {isLoading
                ? 'Loading your services…'
                : isError
                  ? 'Could not load your services. Pull down to retry.'
                  : statusSel.length
                    ? 'Nothing matches that filter.'
                    : current === 'PAST'
                      ? 'No past services yet.'
                      : 'Nothing here. Tap Book to request a service.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

function JobCard({ job }: { job: Job }) {
  const confirm = useConfirmVisit()
  const pendingReschedule = Boolean(job.rescheduleState && job.rescheduleState !== 'NONE')
  const booked = job.status === 'SCHEDULED' && !!job.assignedToId
  const onConfirm = () =>
    confirm.mutate(job.id, {
      onError: (err: any) => Alert.alert('Could not confirm', err?.response?.data?.message ?? 'Please try again.'),
    })
  return (
    <TouchableOpacity style={[styles.card, pendingReschedule && styles.cardAccent]} onPress={() => router.push(`/job/${job.id}`)} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle} numberOfLines={2}>{job.title || job.jobNumber || 'Service'}</Text>
          {job.jobNumber ? <Text style={styles.cardSub}>{job.jobNumber}</Text> : null}
        </View>
        <StatusBadge status={job.status} />
      </View>

      <View style={styles.cardMeta}>
        <Feather name="calendar" size={13} color={Colors.textMuted} />
        <Text style={styles.cardWhen}>{formatVisit(job)}</Text>
      </View>
      <View style={styles.cardMeta}>
        {job.assignedToName
          ? <><Avatar name={job.assignedToName} size={22} /><Text style={styles.cardTech}>{job.assignedToName}</Text></>
          : <Text style={styles.cardTechNone}>Technician to be assigned</Text>}
      </View>

      {booked ? (
        <View style={styles.confirmRow}>
          {isConfirmed(job)
            ? (
              <View style={[styles.pill, { backgroundColor: tint(Colors.success, 0.12) }]}>
                <Feather name="check" size={12} color={Colors.success} />
                <Text style={[styles.pillText, { color: Colors.success }]}>Time confirmed</Text>
              </View>
            )
            : canConfirm(job) ? (
              <>
                <View style={[styles.pill, { backgroundColor: tint(Colors.warning, 0.12) }]}>
                  <Text style={[styles.pillText, { color: Colors.warning }]}>Please confirm</Text>
                </View>
                <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} disabled={confirm.isPending} accessibilityRole="button">
                  <Text style={styles.confirmBtnText}>{confirm.isPending ? 'Confirming…' : 'Confirm this time'}</Text>
                </TouchableOpacity>
              </>
            ) : null}
        </View>
      ) : null}
      {pendingReschedule ? <Text style={styles.cardFlag}>Reschedule request pending</Text> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary,
    borderRadius: Radius.pill, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
  },
  bookBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.sm },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginTop: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.md, marginRight: Spacing.lg, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabOn: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextOn: { color: Colors.textPrimary },
  count: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 1 },
  countOn: { backgroundColor: tint(Colors.primary, 0.12) },
  countText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  countTextOn: { color: Colors.primary },
  chips: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.pill, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: tint(Colors.primary, 0.08) },
  chipEmpty: { opacity: 0.5 },
  chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  chipTextOn: { color: Colors.primary },
  chipCount: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.md, gap: 8, ...Shadow.card },
  cardAccent: { borderLeftWidth: 3, borderLeftColor: Colors.warning },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardWhen: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  cardTech: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardTechNone: { fontSize: FontSize.sm, color: Colors.textMuted },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: FontSize.xs, fontWeight: '700' },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8, marginLeft: 'auto' },
  confirmBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.sm },
  cardFlag: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '700' },
  empty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
})

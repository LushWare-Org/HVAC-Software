import React, { useState } from 'react'
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet,
  TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { useLocalSearchParams } from 'expo-router'
import {
  useMyJob, useCancelJob, useUpdatePreferredTime, useRequestReschedule,
  CUSTOMER_RESCHEDULE_REASONS, type CustomerRescheduleReason,
} from '@/hooks/useMyJobs'
import { StatusBadge } from '@/components/StatusBadge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDateTime, humanizeStatus } from '@/lib/format'
import { availableActions } from '@/lib/jobActions'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'

/** Next few days, each with a morning/afternoon window, for proposing a time. */
function nextSlots(count = 6) {
  const slots: { label: string; startAt: Date; endAt: Date }[] = []
  for (let day = 1; slots.length < count; day += 1) {
    for (const [label, startHour, endHour] of [
      ['Morning', 9, 12],
      ['Afternoon', 13, 17],
    ] as const) {
      const startAt = new Date()
      startAt.setDate(startAt.getDate() + day)
      startAt.setHours(startHour, 0, 0, 0)
      const endAt = new Date(startAt)
      endAt.setHours(endHour, 0, 0, 0)
      slots.push({
        label: `${startAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${label}`,
        startAt,
        endAt,
      })
      if (slots.length >= count) break
    }
  }
  return slots
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: job, isLoading, isError, refetch, isRefetching } = useMyJob(id)

  const cancelJob = useCancelJob()
  const updatePreferredTime = useUpdatePreferredTime()
  const requestReschedule = useRequestReschedule()

  const [picking, setPicking] = useState<null | 'PREFERRED' | 'RESCHEDULE'>(null)
  const [reasonCode, setReasonCode] = useState<CustomerRescheduleReason>('CUSTOMER_UNAVAILABLE')

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !job) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errorText}>Could not load this service.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => refetch()}>
          <Text style={styles.secondaryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const actions = availableActions(job)
  const busy =
    cancelJob.isPending || updatePreferredTime.isPending || requestReschedule.isPending

  const onCancel = () => {
    Alert.alert(
      'Cancel this service?',
      'We will let the team know. You can always book again later.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel service',
          style: 'destructive',
          onPress: () => {
            cancelJob.mutate(
              { jobId: job.id },
              {
                onError: (err: any) =>
                  Alert.alert(
                    'Could not cancel',
                    err?.response?.data?.message ?? 'Please try again.',
                  ),
              },
            )
          },
        },
      ],
    )
  }

  const onPickSlot = (startAt: Date, endAt: Date) => {
    const onError = (err: any) =>
      Alert.alert('Could not update', err?.response?.data?.message ?? 'Please try again.')

    if (picking === 'PREFERRED') {
      updatePreferredTime.mutate(
        { jobId: job.id, preferredStart: startAt.toISOString(), preferredEnd: endAt.toISOString() },
        { onSuccess: () => setPicking(null), onError },
      )
      return
    }
    requestReschedule.mutate(
      {
        jobId: job.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        reasonCode,
      },
      {
        onSuccess: () => {
          setPicking(null)
          Alert.alert('Request sent', 'The team will confirm your new time shortly.')
        },
        onError,
      },
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={job.title || 'Service'} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.badgeRow}>
          <StatusBadge status={job.status} />
          {job.jobNumber ? <Text style={styles.jobNumber}>{job.jobNumber}</Text> : null}
        </View>

        {job.rescheduleState && job.rescheduleState !== 'NONE' ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              A reschedule request is awaiting confirmation from the team.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Row label="When" value={formatDateTime(job.scheduledStart)} />
          <Row label="Technician" value={job.assignedToName || 'Not assigned yet'} />
          <Row label="Address" value={job.serviceAddress || '—'} />
          {job.description ? <Row label="Details" value={job.description} /> : null}
        </View>

        {actions.length > 0 ? (
          <View style={styles.actions}>
            {actions.includes('CHANGE_PREFERRED_TIME') ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                disabled={busy}
                onPress={() => setPicking('PREFERRED')}
              >
                <Text style={styles.primaryBtnText}>Change preferred time</Text>
              </TouchableOpacity>
            ) : null}

            {actions.includes('REQUEST_RESCHEDULE') ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                disabled={busy}
                onPress={() => setPicking('RESCHEDULE')}
              >
                <Text style={styles.primaryBtnText}>Request a new time</Text>
              </TouchableOpacity>
            ) : null}

            {actions.includes('CANCEL') ? (
              <TouchableOpacity style={styles.dangerBtn} disabled={busy} onPress={onCancel}>
                <Text style={styles.dangerBtnText}>Cancel service</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {picking ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {picking === 'PREFERRED' ? 'Pick a preferred time' : 'Propose a new time'}
            </Text>

            {picking === 'RESCHEDULE' ? (
              <View style={styles.reasonRow}>
                {CUSTOMER_RESCHEDULE_REASONS.map((r) => {
                  const active = reasonCode === r.code
                  return (
                    <TouchableOpacity
                      key={r.code}
                      onPress={() => setReasonCode(r.code)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ) : null}

            {nextSlots().map((s) => (
              <TouchableOpacity
                key={s.startAt.toISOString()}
                style={styles.slot}
                disabled={busy}
                onPress={() => onPickSlot(s.startAt, s.endAt)}
              >
                <Text style={styles.slotText}>{s.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPicking(null)}>
              <Text style={styles.secondaryBtnText}>Never mind</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {job.statusHistory && job.statusHistory.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>History</Text>
            <View style={styles.card}>
              {job.statusHistory.slice(-6).reverse().map((h, i) => (
                <View key={h.id ?? `${h.toStatus}-${i}`} style={styles.historyRow}>
                  <Text style={styles.historyStatus}>{humanizeStatus(h.toStatus)}</Text>
                  <Text style={styles.historyWhen}>{formatDateTime(h.createdAt, '—')}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {busy ? <ActivityIndicator style={styles.busy} color={Colors.primary} /> : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.base,
  },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  jobNumber: { fontSize: FontSize.xs, color: Colors.textMuted },
  notice: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginTop: Spacing.base,
  },
  noticeText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
    ...Shadow.card,
  },
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  rowValue: { fontSize: FontSize.base, color: Colors.textPrimary },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  actions: { marginTop: Spacing.lg, gap: Spacing.md },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.base },
  dangerBtn: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  dangerBtnText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.base },
  secondaryBtn: { paddingVertical: Spacing.base, alignItems: 'center' },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingVertical: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primaryDark },
  slot: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  slotText: { fontSize: FontSize.base, color: Colors.textPrimary },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  historyStatus: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  historyWhen: { fontSize: FontSize.xs, color: Colors.textMuted },
  errorText: { color: Colors.danger, fontSize: FontSize.base },
  busy: { marginTop: Spacing.lg },
})

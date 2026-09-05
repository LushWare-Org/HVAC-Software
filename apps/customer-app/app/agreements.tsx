import React, { useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { useConfirmAgreement, useMyAgreements } from '@/hooks/useMyAgreements'
import { StatusBadge } from '@/components/StatusBadge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDate, formatMoney } from '@/lib/format'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { MyAgreement } from '@/types/api'

const INTERVALS: Record<string, string> = {
  MONTHLY: 'Every month',
  BI_MONTHLY: 'Every 2 months',
  QUARTERLY: 'Every 3 months',
  BI_ANNUAL: 'Twice a year',
  ANNUAL: 'Once a year',
}

function needsConfirmation(a: MyAgreement): boolean {
  return !a.customerConfirmedAt && (a.status === 'DRAFT' || a.status === 'SENT') && !!a.confirmToken
}

export default function Agreements() {
  const { data, isLoading, isError, refetch, isRefetching } = useMyAgreements()
  const confirm = useConfirmAgreement()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const agreements = data?.data ?? []

  const onConfirm = (agreement: MyAgreement) => {
    if (!agreement.confirmToken) return
    confirm.mutate(
      { token: agreement.confirmToken, confirmedByName: name.trim() || undefined },
      {
        onSuccess: () => {
          setConfirmingId(null)
          setName('')
          Alert.alert('Confirmed', `${agreement.name} is now active. We'll schedule your visits.`)
        },
        onError: (err: any) =>
          Alert.alert(
            'Could not confirm',
            err?.response?.data?.message ?? 'Please try again, or call our office.',
          ),
      },
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Service Agreements" />

      <FlatList
        data={agreements}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching && !isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.emptyText}>
                {isError ? 'Could not load your agreements. Pull down to retry.' : 'No agreements on file yet.'}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const freq = item.serviceInterval === 'CUSTOM'
            ? (item.serviceIntervalDays ? `Every ${item.serviceIntervalDays} days` : null)
            : INTERVALS[item.serviceInterval ?? ''] ?? null
          const awaiting = needsConfirmation(item)
          const confirming = confirmingId === item.id

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                <StatusBadge status={item.status} />
              </View>

              {item.serviceType ? <Text style={styles.meta}>{item.serviceType}</Text> : null}
              {freq ? <Text style={styles.meta}>{freq}</Text> : null}
              {item.visitsIncluded != null ? (
                <Text style={styles.meta}>
                  {item.visitsUsed} of {item.visitsIncluded} visits used
                </Text>
              ) : null}
              <Text style={styles.meta}>Starts {formatDate(item.startDate, '—')}</Text>
              {item.nextServiceDate ? (
                <Text style={styles.meta}>Next visit {formatDate(item.nextServiceDate, '—')}</Text>
              ) : null}
              {item.value != null ? (
                <Text style={styles.amount}>{formatMoney(item.value)}</Text>
              ) : null}

              {item.customerConfirmedAt ? (
                <Text style={styles.confirmedNote}>
                  Confirmed {formatDate(item.customerConfirmedAt, '—')}
                </Text>
              ) : null}

              {awaiting && !confirming ? (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => setConfirmingId(item.id)}
                >
                  <Text style={styles.confirmBtnText}>Review &amp; confirm</Text>
                </TouchableOpacity>
              ) : null}

              {confirming ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmLabel}>Your name (signs the agreement)</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Full name"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.confirmHint}>
                    By confirming you accept the plan terms above.
                  </Text>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    disabled={confirm.isPending}
                    onPress={() => onConfirm(item)}
                  >
                    {confirm.isPending ? (
                      <ActivityIndicator color={Colors.textInverse} />
                    ) : (
                      <Text style={styles.confirmBtnText}>Confirm agreement</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setConfirmingId(null); setName('') }}
                  >
                    <Text style={styles.cancelBtnText}>Not now</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  amount: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  confirmedNote: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '700', marginTop: Spacing.sm },
  confirmBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm,
    alignItems: 'center', marginTop: Spacing.base,
  },
  confirmBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.sm },
  confirmBox: { marginTop: Spacing.base, paddingTop: Spacing.base, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  confirmLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm,
    color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  confirmHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  cancelBtnText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
})

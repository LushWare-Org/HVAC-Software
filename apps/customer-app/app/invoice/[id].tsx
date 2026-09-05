import React, { useState } from 'react'
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { useLocalSearchParams } from 'expo-router'
import { useApproveInvoice, useDeclineInvoice, useMyInvoice } from '@/hooks/useMyFinance'
import { StatusBadge } from '@/components/StatusBadge'
import { LineItems } from '@/components/LineItems'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { canDecideInvoice, outstandingAmount } from '@/lib/financeActions'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: invoice, isLoading, isError, refetch, isRefetching } = useMyInvoice(id)
  const approve = useApproveInvoice()
  const decline = useDeclineInvoice()

  const [disputing, setDisputing] = useState(false)
  const [reason, setReason] = useState('')

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !invoice) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errorText}>Could not load this invoice.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => refetch()}>
          <Text style={styles.secondaryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const busy = approve.isPending || decline.isPending
  const outstanding = outstandingAmount(invoice)
  const onError = (err: any) =>
    Alert.alert('Could not save', err?.response?.data?.message ?? 'Please try again.')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={invoice.invoiceNumber} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.badgeRow}>
          <StatusBadge status={invoice.status} />
          {invoice.dueDate ? (
            <Text style={styles.meta}>Due {formatDate(invoice.dueDate, '—')}</Text>
          ) : null}
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            {outstanding > 0 ? 'Amount due' : 'Total'}
          </Text>
          <Text style={styles.amountValue}>
            {formatMoney(outstanding > 0 ? outstanding : invoice.total, invoice.currency)}
          </Text>
          {outstanding > 0 && Number(invoice.amountPaid ?? 0) > 0 ? (
            <Text style={styles.amountMeta}>
              {formatMoney(invoice.amountPaid, invoice.currency)} paid of{' '}
              {formatMoney(invoice.total, invoice.currency)}
            </Text>
          ) : null}
        </View>

        <LineItems
          items={invoice.lineItems}
          currency={invoice.currency}
          subtotal={invoice.subtotal}
          taxAmount={invoice.taxAmount}
          total={invoice.total}
        />

        {invoice.payments && invoice.payments.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Payments received</Text>
            <View style={styles.card}>
              {invoice.payments.map((p) => (
                <View key={p.id} style={styles.paymentRow}>
                  <View style={styles.paymentMain}>
                    <Text style={styles.paymentAmount}>
                      {formatMoney(p.amount, invoice.currency)}
                    </Text>
                    <Text style={styles.paymentMeta}>
                      {formatDateTime(p.paidAt ?? p.createdAt, '—')}
                      {p.paymentMethod ? ` · ${p.paymentMethod}` : ''}
                    </Text>
                  </View>
                  {p.receiptNumber ? (
                    <Text style={styles.receipt}>{p.receiptNumber}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        ) : null}

        {invoice.declinedAt ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              You raised a query on this invoice on {formatDate(invoice.declinedAt, '—')}.
              {invoice.declineReason ? ` “${invoice.declineReason}”` : ''}
            </Text>
          </View>
        ) : invoice.approvedAt ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              You approved this invoice on {formatDate(invoice.approvedAt, '—')}.
            </Text>
          </View>
        ) : null}

        {canDecideInvoice(invoice) && !disputing ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              disabled={busy}
              onPress={() =>
                approve.mutate(invoice.id, {
                  onSuccess: () =>
                    Alert.alert('Approved', 'Thank you. This invoice is approved for payment.'),
                  onError,
                })
              }
            >
              <Text style={styles.primaryBtnText}>Approve invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerBtn}
              disabled={busy}
              onPress={() => setDisputing(true)}
            >
              <Text style={styles.dangerBtnText}>Query this invoice</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {disputing ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What looks wrong?</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Tell us what to check"
              placeholderTextColor={Colors.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
            />
            <TouchableOpacity
              style={styles.dangerBtn}
              disabled={busy}
              onPress={() =>
                decline.mutate(
                  { invoiceId: invoice.id, reason: reason.trim() || undefined },
                  {
                    onSuccess: () => {
                      setDisputing(false)
                      setReason('')
                      Alert.alert('Sent', 'The team will review and get back to you.')
                    },
                    onError,
                  },
                )
              }
            >
              <Text style={styles.dangerBtnText}>Send query</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDisputing(false)}>
              <Text style={styles.secondaryBtnText}>Never mind</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {outstanding > 0 ? (
          <Text style={styles.payHint}>
            To pay this invoice, open it in the customer portal on the web.
          </Text>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.base,
    ...Shadow.raised,
  },
  amountLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '700' },
  amountValue: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  amountMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    marginTop: Spacing.base,
    ...Shadow.card,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  paymentMain: { flex: 1 },
  paymentAmount: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '600' },
  paymentMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  receipt: { fontSize: FontSize.xs, color: Colors.textMuted },
  notice: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginTop: Spacing.lg,
  },
  noticeText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
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
    marginTop: Spacing.sm,
  },
  dangerBtnText: { color: Colors.danger, fontWeight: '700', fontSize: FontSize.base },
  secondaryBtn: { paddingVertical: Spacing.base, alignItems: 'center' },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  payHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.base },
  busy: { marginTop: Spacing.lg },
})

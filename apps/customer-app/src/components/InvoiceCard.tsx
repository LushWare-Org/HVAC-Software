import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Text } from '@/components/Text'
import { StatusBadge } from '@/components/StatusBadge'
import { outstandingAmount } from '@/lib/financeActions'
import { formatDate, formatMoney } from '@/lib/format'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { Invoice } from '@/types/api'

/** Shared between Home's preview strip and Billing's full list. */
export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const outstanding = outstandingAmount(invoice)
  const overdue = invoice.status === 'OVERDUE'
  return (
    <TouchableOpacity
      style={[styles.card, overdue && styles.cardAccentDanger]}
      onPress={() => router.push(`/invoice/${invoice.id}`)}
    >
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, styles.cardIconWarning]}>
          <Feather name="credit-card" size={14} color={Colors.warning} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>{invoice.invoiceNumber}</Text>
        <StatusBadge status={invoice.status} />
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardMeta}>
          {invoice.dueDate ? `Due ${formatDate(invoice.dueDate, '—')}` : formatDate(invoice.createdAt, '—')}
        </Text>
        <Text style={styles.cardAmount}>
          {formatMoney(outstanding > 0 ? outstanding : invoice.total, invoice.currency)}
        </Text>
      </View>
      {overdue ? <Text style={styles.cardOverdue}>Overdue</Text> : null}
    </TouchableOpacity>
  )
}

/** Sort order: overdue first, then open, then everything else — newest first within each group. */
export function rankInvoice(i: Invoice): number {
  const overdue = i.status === 'OVERDUE' ? 0 : i.status === 'SENT' || i.status === 'PARTIALLY_PAID' ? 1 : 2
  const when = i.createdAt ? -new Date(i.createdAt).getTime() : 0
  return overdue * 1e15 + when
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...Shadow.card,
  },
  cardAccentDanger: { borderLeftColor: Colors.danger },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.infoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconWarning: { backgroundColor: Colors.warningLight },
  cardTitle: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardBottom: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.sm,
  },
  cardMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardAmount: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardOverdue: { fontSize: FontSize.xs, color: Colors.danger, fontWeight: '700', marginTop: Spacing.sm },
})

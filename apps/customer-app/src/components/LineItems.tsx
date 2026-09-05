import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/Text'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'
import { formatMoney } from '@/lib/format'
import type { LineItem } from '@/types/api'

function num(v: string | number | null | undefined): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0)
  return Number.isFinite(n) ? n : 0
}

/** Line items plus a totals block — shared by quote and invoice detail. */
export function LineItems({
  items,
  currency,
  subtotal,
  taxAmount,
  discountAmount,
  total,
}: {
  items?: LineItem[]
  currency?: string | null
  subtotal?: string | number | null
  taxAmount?: string | number | null
  discountAmount?: string | number | null
  total: string | number
}) {
  const rows = items ?? []
  return (
    <View style={styles.card}>
      {rows.length === 0 ? (
        <Text style={styles.none}>No itemised breakdown provided.</Text>
      ) : (
        rows.map((li, i) => (
          <View key={li.id ?? `${li.description}-${i}`} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.desc}>{li.description}</Text>
              <Text style={styles.qty}>
                {num(li.quantity)} × {formatMoney(li.unitPrice, currency)}
              </Text>
            </View>
            <Text style={styles.lineTotal}>
              {formatMoney(li.lineTotal ?? num(li.quantity) * num(li.unitPrice), currency)}
            </Text>
          </View>
        ))
      )}

      {subtotal !== undefined && subtotal !== null ? (
        <Total label="Subtotal" value={formatMoney(subtotal, currency)} />
      ) : null}
      {discountAmount !== undefined && discountAmount !== null && num(discountAmount) > 0 ? (
        <Total label="Discount" value={`− ${formatMoney(discountAmount, currency)}`} />
      ) : null}
      {taxAmount !== undefined && taxAmount !== null ? (
        <Total label="Tax" value={formatMoney(taxAmount, currency)} />
      ) : null}
      <Total label="Total" value={formatMoney(total, currency)} emphasis />
    </View>
  )
}

function Total({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={[styles.totalRow, emphasis && styles.totalRowEmphasis]}>
      <Text style={[styles.totalLabel, emphasis && styles.totalLabelEmphasis]}>{label}</Text>
      <Text style={[styles.totalValue, emphasis && styles.totalValueEmphasis]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
  },
  none: { paddingVertical: Spacing.base, color: Colors.textMuted, fontSize: FontSize.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  rowMain: { flex: 1 },
  desc: { fontSize: FontSize.base, color: Colors.textPrimary },
  qty: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  lineTotal: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  totalRowEmphasis: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.base,
    marginTop: Spacing.xs,
  },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  totalLabelEmphasis: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '700' },
  totalValue: { fontSize: FontSize.sm, color: Colors.textSecondary },
  totalValueEmphasis: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: '700' },
})

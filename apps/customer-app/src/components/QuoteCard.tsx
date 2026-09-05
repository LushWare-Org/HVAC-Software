import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Text } from '@/components/Text'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate, formatMoney } from '@/lib/format'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { Quote } from '@/types/api'

/** Shared between Home's preview strip and Billing's full list. */
export function QuoteCard({ quote }: { quote: Quote }) {
  const awaiting = quote.status === 'SENT' || quote.status === 'VIEWED'
  return (
    <TouchableOpacity
      style={[styles.card, awaiting && styles.cardAccent]}
      onPress={() => router.push(`/quote/${quote.id}`)}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Feather name="file-text" size={14} color={Colors.info} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {quote.title || quote.quoteNumber}
        </Text>
        <StatusBadge status={quote.status} />
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardMeta}>{quote.quoteNumber} · {formatDate(quote.createdAt, '—')}</Text>
        <Text style={styles.cardAmount}>{formatMoney(quote.total, quote.currency)}</Text>
      </View>
      {awaiting ? <Text style={styles.cardCta}>Awaiting your decision</Text> : null}
    </TouchableOpacity>
  )
}

/** Sort order: awaiting-you first, then newest first — used by Home and Billing alike. */
export function rankQuote(q: Quote): number {
  const awaiting = q.status === 'SENT' || q.status === 'VIEWED' ? 0 : 1
  const when = q.createdAt ? -new Date(q.createdAt).getTime() : 0
  return awaiting * 1e15 + when
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
  cardAccent: { borderLeftColor: Colors.info },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.infoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardBottom: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.sm,
  },
  cardMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardAmount: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardCta: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700', marginTop: Spacing.sm },
})

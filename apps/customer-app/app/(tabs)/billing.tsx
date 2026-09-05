import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import { useMyInvoices, useMyQuotes } from '@/hooks/useMyFinance'
import { QuoteCard, rankQuote } from '@/components/QuoteCard'
import { InvoiceCard, rankInvoice } from '@/components/InvoiceCard'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

type Segment = 'QUOTES' | 'INVOICES'

/**
 * Quotes and invoices share one tab: they are the same mental task ("what do I
 * owe / what am I being offered"), and it keeps the tab bar to four items with
 * room for Messages later.
 */
export default function Billing() {
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: string }>()
  const [segment, setSegment] = useState<Segment>(
    segmentParam === 'INVOICES' ? 'INVOICES' : 'QUOTES',
  )

  // A quick-action link (e.g. Home's "Invoices" tile) can arrive after this
  // screen is already mounted from a previous tab switch — react to the param
  // changing, not just its value at mount.
  useEffect(() => {
    if (segmentParam === 'INVOICES' || segmentParam === 'QUOTES') setSegment(segmentParam)
  }, [segmentParam])

  const quotesQ = useMyQuotes()
  const invoicesQ = useMyInvoices()

  const quotes = useMemo(() => {
    const list = quotesQ.data?.data ?? []
    // Anything still awaiting the customer comes first.
    return [...list].sort((a, b) => rankQuote(a) - rankQuote(b))
  }, [quotesQ.data])

  const invoices = useMemo(() => {
    const list = invoicesQ.data?.data ?? []
    return [...list].sort((a, b) => rankInvoice(a) - rankInvoice(b))
  }, [invoicesQ.data])

  const active = segment === 'QUOTES' ? quotesQ : invoicesQ

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Billing</Text>

      <View style={styles.segments}>
        {(['QUOTES', 'INVOICES'] as Segment[]).map((s) => {
          const on = segment === s
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSegment(s)}
              style={[styles.segment, on && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, on && styles.segmentTextActive]}>
                {s === 'QUOTES' ? 'Quotes' : 'Invoices'}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {segment === 'QUOTES' ? (
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={quotesQ.isRefetching && !quotesQ.isLoading}
              onRefresh={quotesQ.refetch}
            />
          }
          renderItem={({ item }) => <QuoteCard quote={item} />}
          ListEmptyComponent={<Empty query={active} kind="quotes" />}
        />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={invoicesQ.isRefetching && !invoicesQ.isLoading}
              onRefresh={invoicesQ.refetch}
            />
          }
          renderItem={({ item }) => <InvoiceCard invoice={item} />}
          ListEmptyComponent={<Empty query={active} kind="invoices" />}
        />
      )}
    </SafeAreaView>
  )
}

function Empty({ query, kind }: { query: { isLoading: boolean; isError: boolean }; kind: string }) {
  return (
    <View style={styles.empty}>
      {!query.isLoading ? (
        <Feather name={kind === 'quotes' ? 'file-text' : 'credit-card'} size={22} color={Colors.textMuted} />
      ) : null}
      <Text style={styles.emptyText}>
        {query.isLoading
          ? `Loading your ${kind}…`
          : query.isError
            ? `Could not load your ${kind}. Pull down to retry.`
            : `No ${kind} yet.`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  segments: {
    flexDirection: 'row',
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 3,
  },
  segment: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: Colors.primaryLight },
  segmentText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  segmentTextActive: { color: Colors.primaryDark },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
})

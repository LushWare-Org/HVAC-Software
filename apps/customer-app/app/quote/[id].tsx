import React, { useState } from 'react'
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { useLocalSearchParams } from 'expo-router'
import { useApproveQuote, useDeclineQuote, useMyQuote } from '@/hooks/useMyFinance'
import { StatusBadge } from '@/components/StatusBadge'
import { LineItems } from '@/components/LineItems'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDate } from '@/lib/format'
import { canDecideQuote, isQuoteDecided } from '@/lib/financeActions'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'

export default function QuoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: quote, isLoading, isError, refetch, isRefetching } = useMyQuote(id)
  const approve = useApproveQuote()
  const decline = useDeclineQuote()

  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !quote) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errorText}>Could not load this quote.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => refetch()}>
          <Text style={styles.secondaryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const busy = approve.isPending || decline.isPending
  const onError = (err: any) =>
    Alert.alert('Could not save', err?.response?.data?.message ?? 'Please try again.')

  const onApprove = () => {
    Alert.alert('Accept this quote?', 'The team will be notified and will schedule the work.', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () =>
          approve.mutate(quote.id, {
            onSuccess: () => Alert.alert('Accepted', 'Thank you. We will be in touch shortly.'),
            onError,
          }),
      },
    ])
  }

  const onDecline = () => {
    decline.mutate(
      { quoteId: quote.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setDeclining(false)
          setReason('')
        },
        onError,
      },
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={quote.title || quote.quoteNumber} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.badgeRow}>
          <StatusBadge status={quote.status} />
          <Text style={styles.meta}>{quote.quoteNumber}</Text>
        </View>

        {quote.validUntil ? (
          <Text style={styles.meta}>Valid until {formatDate(quote.validUntil, '—')}</Text>
        ) : null}

        {quote.description ? <Text style={styles.body}>{quote.description}</Text> : null}

        <LineItems
          items={quote.lineItems}
          currency={quote.currency}
          subtotal={quote.subtotal}
          discountAmount={quote.discountAmount}
          taxAmount={quote.taxAmount}
          total={quote.total}
        />

        {quote.terms ? (
          <>
            <Text style={styles.sectionTitle}>Terms</Text>
            <View style={styles.card}>
              <Text style={styles.body}>{quote.terms}</Text>
            </View>
          </>
        ) : null}

        {isQuoteDecided(quote) ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              You {quote.status === 'ACCEPTED' ? 'accepted' : 'declined'} this quote
              {quote.approvedAt ? ` on ${formatDate(quote.approvedAt, '—')}` : ''}.
            </Text>
          </View>
        ) : null}

        {canDecideQuote(quote) && !declining ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={onApprove}>
              <Text style={styles.primaryBtnText}>Accept quote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerBtn}
              disabled={busy}
              onPress={() => setDeclining(true)}
            >
              <Text style={styles.dangerBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {declining ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Why are you declining?</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Optional, helps us quote better next time"
              placeholderTextColor={Colors.textMuted}
              value={reason}
              onChangeText={setReason}
              multiline
            />
            <TouchableOpacity style={styles.dangerBtn} disabled={busy} onPress={onDecline}>
              <Text style={styles.dangerBtnText}>Confirm decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDeclining(false)}>
              <Text style={styles.secondaryBtnText}>Never mind</Text>
            </TouchableOpacity>
          </View>
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
  meta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  body: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    paddingVertical: Spacing.md,
  },
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
  errorText: { color: Colors.danger, fontSize: FontSize.base },
  busy: { marginTop: Spacing.lg },
})

/**
 * Notification detail — full title/body with a back button. Opening one
 * marks it read (the list refreshes via the mark-read mutation's
 * invalidation, so the unread badge drops immediately).
 */
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useNotifications, useMarkRead } from '@/hooks/useNotifications'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatRelative } from '@/utils/format'

const TYPE_ICONS: Record<string, string> = {
  JOB_ASSIGNED: '📋',
  job_assigned: '📋',
  JOB_UPDATED: '🔄',
  JOB_CANCELLED: '❌',
  SCHEDULE_CHANGE: '📅',
  MESSAGE: '💬',
  PAYMENT: '💰',
  EXPENSE_APPROVED: '✅',
  EXPENSE_REJECTED: '❌',
  SYSTEM: '⚙️',
}

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useNotifications({ limit: 100 })
  const markRead = useMarkRead()

  const notification = data?.data?.find((n) => n.id === id)

  // Mark read once, on open.
  const marked = useRef(false)
  useEffect(() => {
    if (notification && !notification.isRead && !marked.current) {
      marked.current = true
      markRead.mutate(notification.id)
    }
  }, [notification])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading && !notification ? (
        <LoadingSpinner message="Loading…" />
      ) : !notification ? (
        <View style={styles.missing}>
          <Text style={styles.missingText}>This notification is no longer available.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{TYPE_ICONS[notification.type ?? ''] ?? '🔔'}</Text>
          </View>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.time}>{formatRelative(notification.createdAt)}</Text>
          <View style={styles.card}>
            <Text style={styles.text}>{notification.body}</Text>
          </View>
          {notification.referenceType === 'JOB' && notification.referenceId && (
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push(`/job/${notification.referenceId}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaText}>Open job</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 64 },
  backText: { fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.semibold },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  body: { padding: Spacing.base, alignItems: 'center' },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  icon: { fontSize: 30 },
  title: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, textAlign: 'center', marginBottom: 4,
  },
  time: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.base },
  card: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.base,
  },
  text: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  cta: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  ctaText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  missingText: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center' },
})

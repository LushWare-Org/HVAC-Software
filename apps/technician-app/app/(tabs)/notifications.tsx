import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatRelative } from '@/utils/format'
import type { Notification } from '@/types/api'

const TYPE_ICONS: Record<string, string> = {
  JOB_ASSIGNED: '📋',
  JOB_UPDATED: '🔄',
  JOB_CANCELLED: '❌',
  SCHEDULE_CHANGE: '📅',
  MESSAGE: '💬',
  PAYMENT: '💰',
  EXPENSE_APPROVED: '✅',
  EXPENSE_REJECTED: '❌',
  SYSTEM: '⚙️',
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { data: notifData, isLoading, refetch } = useNotifications()
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()

  const notifications = notifData?.data ?? []
  const hasUnread = notifications.some((n) => !n.isRead)

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handlePress = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markRead.mutate(notification.id)
    }

    // Deep link
    if (notification.referenceType === 'JOB' && notification.referenceId) {
      router.push(`/job/${notification.referenceId}`)
    } else if (notification.referenceType === 'THREAD' && notification.referenceId) {
      router.push(`/message/${notification.referenceId}`)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !notifData ? (
        <LoadingSpinner message="Loading notifications..." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.isRead && styles.notifUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.notifIcon}>
                {TYPE_ICONS[item.type ?? ''] ?? '🔔'}
              </Text>
              <View style={styles.notifContent}>
                <Text
                  style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.notifBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.notifTime}>{formatRelative(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="🔔"
              title="No notifications"
              subtitle="You're all caught up! New alerts will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  markAllBtn: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  listContent: {
    paddingBottom: 30,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notifUnread: {
    backgroundColor: '#F0F7FF',
  },
  notifIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notifTitleUnread: {
    fontWeight: FontWeight.semibold,
  },
  notifBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginLeft: Spacing.sm,
  },
})

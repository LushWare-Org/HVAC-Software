import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  useCreateMyThread,
  useMarkAllMyNotificationsRead,
  useMarkMyNotificationRead,
  useMyNotifications,
  useMyThreads,
  useUnreadNotificationsCount,
} from '@/hooks/useMyMessages'
import { useMyJobs } from '@/hooks/useMyJobs'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, getThreadTitle, isTechThread, sortThreads } from '@/lib/threadActions'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { MessageThread, Notification } from '@/types/api'

type Segment = 'CHAT' | 'NOTIFICATIONS'

function fmtTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * One Messages tab, split Chat/Notifications the same way Billing splits
 * Quotes/Invoices — the two are read in the same sitting but act differently.
 */
export default function Messages() {
  const { user } = useAuth()
  const [segment, setSegment] = useState<Segment>('CHAT')
  const [showNewChat, setShowNewChat] = useState(false)

  const threadsQ = useMyThreads()
  const notificationsQ = useMyNotifications(50)
  const unreadNotifications = useUnreadNotificationsCount()
  const markRead = useMarkMyNotificationRead()
  const markAllRead = useMarkAllMyNotificationsRead()
  const createThread = useCreateMyThread()
  const jobsQ = useMyJobs()

  const threads = useMemo(() => sortThreads(threadsQ.data?.data ?? []), [threadsQ.data])
  const notifications = notificationsQ.data?.data ?? []

  const assignedTechs = useMemo(() => {
    const seen = new Set<string>()
    const techs: string[] = []
    for (const job of jobsQ.data?.data ?? []) {
      const name = job.assignedToName
      if (name && !seen.has(name)) {
        seen.add(name)
        techs.push(name)
      }
    }
    return techs
  }, [jobsQ.data])

  const startAdminChat = () => {
    createThread.mutate(
      { customerId: user?.customerId, customerName: user?.name },
      { onSuccess: (thread) => { setShowNewChat(false); router.push(`/thread/${thread.id}`) } },
    )
  }

  const startTechChat = (techName: string) => {
    createThread.mutate(
      {
        customerId: user?.customerId,
        customerName: user?.name,
        subject: `Chat with Technician: ${techName}`,
      },
      { onSuccess: (thread) => { setShowNewChat(false); router.push(`/thread/${thread.id}`) } },
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newBtnRow} onPress={() => setShowNewChat(true)}>
          <Feather name="edit" size={14} color={Colors.primary} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segments}>
        {(['CHAT', 'NOTIFICATIONS'] as Segment[]).map((s) => {
          const on = segment === s
          const count = s === 'NOTIFICATIONS' ? unreadNotifications : 0
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSegment(s)}
              style={[styles.segment, on && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, on && styles.segmentTextActive]}>
                {s === 'CHAT' ? 'Chat' : 'Notifications'}
                {count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {segment === 'CHAT' ? (
        <FlatList
          data={threads}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={threadsQ.isRefetching && !threadsQ.isLoading}
              onRefresh={threadsQ.refetch}
            />
          }
          renderItem={({ item }) => <ThreadRow thread={item} />}
          ListEmptyComponent={
            <Empty query={threadsQ} kind="conversations" onStart={() => setShowNewChat(true)} />
          }
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={notificationsQ.isRefetching && !notificationsQ.isLoading}
              onRefresh={notificationsQ.refetch}
            />
          }
          ListHeaderComponent={
            unreadNotifications > 0 ? (
              <TouchableOpacity
                style={styles.markAllBtn}
                disabled={markAllRead.isPending}
                onPress={() => markAllRead.mutate()}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => !item.isRead && markRead.mutate(item.id)}
            />
          )}
          ListEmptyComponent={<Empty query={notificationsQ} kind="notifications" />}
        />
      )}

      <Modal
        visible={showNewChat}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewChat(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowNewChat(false)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>New conversation</Text>
            <Text style={styles.modalSubtitle}>Who would you like to message?</Text>

            <TouchableOpacity
              style={styles.modalOption}
              disabled={createThread.isPending}
              onPress={startAdminChat}
            >
              <View style={styles.avatar}>
                <Feather name="headphones" size={16} color={Colors.primary} />
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>Support</Text>
                <Text style={styles.rowPreview}>Questions, billing, account help</Text>
              </View>
            </TouchableOpacity>

            {assignedTechs.map((name) => (
              <TouchableOpacity
                key={name}
                style={styles.modalOption}
                disabled={createThread.isPending}
                onPress={() => startTechChat(name)}
              >
                <View style={[styles.avatar, styles.avatarTech]}>
                  <Text style={[styles.avatarText, styles.avatarTextTech]}>{getInitials(name)}</Text>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{name}</Text>
                  <Text style={styles.rowPreview}>Technician</Text>
                </View>
              </TouchableOpacity>
            ))}

            {createThread.isPending ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.sm }} />
            ) : null}

            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowNewChat(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

function ThreadRow({ thread }: { thread: MessageThread }) {
  const title = getThreadTitle(thread)
  const tech = isTechThread(thread)
  const unread = thread.unreadCount ?? 0
  return (
    <TouchableOpacity style={styles.row} onPress={() => router.push(`/thread/${thread.id}`)}>
      <View style={[styles.avatar, tech && styles.avatarTech]}>
        <Text style={[styles.avatarText, tech && styles.avatarTextTech]}>
          {getInitials(title)}
        </Text>
      </View>
      <View style={styles.rowMain}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, unread > 0 && styles.rowTitleUnread]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.rowTime}>{fmtTime(thread.lastMessageAt ?? thread.updatedAt)}</Text>
        </View>
        <Text style={styles.rowPreview} numberOfLines={1}>
          {thread.lastMessageBody || 'No messages yet'}
        </Text>
      </View>
      {unread > 0 ? (
        <View style={styles.unreadDot}>
          <Text style={styles.unreadDotText}>{unread}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}

function NotificationRow({
  notification, onPress,
}: { notification: Notification; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.row, !notification.isRead && styles.rowUnreadBg]}
      onPress={onPress}
      disabled={notification.isRead}
    >
      <View style={styles.avatar}>
        <Feather name="bell" size={16} color={Colors.primary} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.rowPreview} numberOfLines={2}>{notification.body}</Text>
        <Text style={styles.rowTime}>{fmtTime(notification.createdAt)}</Text>
      </View>
      {!notification.isRead ? <View style={styles.smallDot} /> : null}
    </TouchableOpacity>
  )
}

function Empty({
  query, kind, onStart,
}: { query: { isLoading: boolean; isError: boolean }; kind: string; onStart?: () => void }) {
  return (
    <View style={styles.empty}>
      {query.isLoading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <>
          <Feather
            name={kind === 'notifications' ? 'bell' : 'message-circle'}
            size={22}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyText}>
            {query.isError
              ? `Could not load your ${kind}. Pull down to retry.`
              : `No ${kind} yet.`}
          </Text>
          {!query.isError && onStart ? (
            <TouchableOpacity style={styles.newBtnRow} onPress={onStart}>
              <Feather name="edit" size={14} color={Colors.primary} />
              <Text style={styles.newBtnText}>Start a conversation</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  newBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  newBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  rowUnreadBg: { backgroundColor: Colors.primaryLight },
  avatar: {
    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTech: { backgroundColor: Colors.violetLight },
  avatarText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  avatarTextTech: { color: Colors.violet },
  rowMain: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  rowTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  rowTitleUnread: { fontWeight: '700' },
  rowTime: { fontSize: FontSize.xs, color: Colors.textMuted, flexShrink: 0 },
  rowPreview: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  unreadDot: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  unreadDotText: { color: Colors.textInverse, fontSize: FontSize.xs, fontWeight: '700' },
  smallDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, flexShrink: 0, marginTop: 4 },
  markAllBtn: { alignSelf: 'flex-end', paddingVertical: Spacing.sm, marginBottom: Spacing.xs },
  markAllText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
  empty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.md },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalCancel: { alignItems: 'center', paddingTop: Spacing.base },
  modalCancelText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
})

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useThreads, useCreateThread } from '@/hooks/useMessages'
import { useMyJobs } from '@/hooks/useJobs'
import { useAuth } from '@/contexts/AuthContext'
import { useSocketContext } from '@/contexts/SocketContext'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatRelative, getInitials, truncate } from '@/utils/format'
import type { MessageThread } from '@/types/api'

export default function MessagesScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const qc = useQueryClient()
  const { onNewMessage } = useSocketContext()

  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [startingChat, setStartingChat] = useState<string | null>(null) // customerId being started

  const { data: threadsData, isLoading, refetch } = useThreads({ limit: 50 })
  const { data: jobsData } = useMyJobs({ limit: 100 })
  const createThread = useCreateThread()

  const threads = threadsData?.data ?? []
  const myJobs = jobsData?.data ?? []

  // ── Real-time: when a new message arrives, update the thread list cache ──────
  useEffect(() => {
    const unsub = onNewMessage(({ threadId, message }) => {
      qc.setQueryData<{ data: MessageThread[]; total: number; page: number; limit: number }>(
        queryKeys.threads({}),
        (old) => {
          if (!old) return old
          const updated = old.data.map((t) => {
            if (t.id !== threadId) return t
            return {
              ...t,
              lastMessageBody: message.body,
              lastMessageAt: message.createdAt,
              // Increment unread if the message is INBOUND (from customer/other)
              unreadCount:
                message.direction === 'INBOUND'
                  ? (t.unreadCount ?? 0) + 1
                  : t.unreadCount ?? 0,
            }
          })
          // Bubble updated thread to the top
          const idx = updated.findIndex((t) => t.id === threadId)
          if (idx > 0) {
            const [moved] = updated.splice(idx, 1)
            updated.unshift(moved)
          }
          return { ...old, data: updated }
        },
      )
    })
    return unsub
  }, [onNewMessage, qc])

  // ── Threads I should see ─────────────────────────────────────────────────────
  // STRICT privacy rule: only threads where I am explicitly a participant.
  // This prevents techs from seeing admin↔customer support threads or other
  // techs' private chats, even if they share a customer. Own threads are
  // created with `participantIds: [user.id]` by useCreateThread.
  const myThreads = useMemo(() => {
    const uid = user?.id
    if (!uid) return []
    return threads.filter((t) => (t.participantIds ?? []).includes(uid))
  }, [threads, user?.id])

  // Customer IDs I already have a private thread with (for "Start a chat" de-dupe)
  const myCustomerIds = useMemo(() => {
    const ids = new Set<string>()
    myThreads.forEach((t) => { if (t.customerId) ids.add(t.customerId) })
    return ids
  }, [myThreads])

  // ── Customers with a job but no thread yet ───────────────────────────────────
  const customersWithoutThread = useMemo(() => {
    const threadCustomerIds = new Set(myThreads.map((t) => t.customerId).filter(Boolean))
    const seen = new Set<string>()
    const result: { customerId: string; customerName: string; jobTitle: string }[] = []
    myJobs.forEach((j) => {
      if (j.customerId && !threadCustomerIds.has(j.customerId) && !seen.has(j.customerId)) {
        seen.add(j.customerId)
        result.push({ customerId: j.customerId, customerName: j.customerName ?? 'Customer', jobTitle: j.title })
      }
    })
    return result
  }, [myJobs, myThreads])

  // ── Search filter ────────────────────────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    if (!search.trim()) return myThreads
    const q = search.trim().toLowerCase()
    return myThreads.filter((t) => {
      const name = getThreadDisplayName(t).toLowerCase()
      const preview = (t.lastMessageBody ?? '').toLowerCase()
      const subject = (t.subject ?? '').toLowerCase()
      return name.includes(q) || preview.includes(q) || subject.includes(q)
    })
  }, [myThreads, search])

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return customersWithoutThread
    const q = search.trim().toLowerCase()
    return customersWithoutThread.filter(
      (c) => c.customerName.toLowerCase().includes(q) || c.jobTitle.toLowerCase().includes(q),
    )
  }, [customersWithoutThread, search])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleStartChat = useCallback(async (customerId: string, customerName: string) => {
    setStartingChat(customerId)
    try {
      const thread = await createThread.mutateAsync({ customerId, customerName })
      router.push(`/message/${thread.id}`)
    } catch (err: any) {
      // Server may return existing thread ID in error body
      const existing = err?.response?.data?.id ?? err?.response?.data?.existingThreadId
      if (existing) router.push(`/message/${existing}`)
    } finally {
      setStartingChat(null)
    }
  }, [createThread, router])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getThreadDisplayName(t: MessageThread): string {
    if (t.customerId && t.customerName) return t.customerName
    if (t.subject) return t.subject
    if (t.participantNames?.length) {
      return t.participantNames.filter((n) => n !== user?.name).join(', ') || 'Team Chat'
    }
    return 'Conversation'
  }

  function isStaffThread(t: MessageThread): boolean {
    return !t.customerId && (t.participantIds?.length ?? 0) > 0
  }

  // ── Render helpers ────────────────────────────────────────────────────────────
  const renderThread = ({ item }: { item: MessageThread }) => {
    const relatedJob = item.customerId
      ? myJobs.find((j) => j.customerId === item.customerId)
      : undefined
    const displayName = getThreadDisplayName(item)
    const staff = isStaffThread(item)
    const hasUnread = (item.unreadCount ?? 0) > 0

    return (
      <TouchableOpacity
        style={styles.threadCard}
        onPress={() => router.push(`/message/${item.id}`)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatar,
            hasUnread && styles.avatarUnread,
            staff && styles.avatarStaff,
          ]}
        >
          <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
        </View>

        <View style={styles.threadContent}>
          <View style={styles.threadTopRow}>
            <Text
              style={[styles.threadName, hasUnread && styles.threadNameUnread]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={styles.threadTime}>
              {formatRelative(item.lastMessageAt ?? item.createdAt)}
            </Text>
          </View>

          {staff && (
            <Text style={[styles.threadMeta, { color: '#7C3AED' }]} numberOfLines={1}>
              Team Chat
            </Text>
          )}
          {relatedJob && !staff && (
            <Text style={[styles.threadMeta, { color: Colors.primary }]} numberOfLines={1}>
              📋 {relatedJob.title}
            </Text>
          )}

          <View style={styles.threadBottomRow}>
            <Text
              style={[styles.threadPreview, hasUnread && styles.threadPreviewUnread]}
              numberOfLines={1}
            >
              {item.lastMessageBody ? truncate(item.lastMessageBody, 55) : 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {(item.unreadCount ?? 0) > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderContact = (c: { customerId: string; customerName: string; jobTitle: string }) => {
    const busy = startingChat === c.customerId
    return (
      <TouchableOpacity
        key={c.customerId}
        style={styles.startChatCard}
        onPress={() => handleStartChat(c.customerId, c.customerName)}
        activeOpacity={0.7}
        disabled={busy}
      >
        <View style={styles.startChatAvatar}>
          <Text style={styles.startChatAvatarText}>{getInitials(c.customerName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.startChatName}>{c.customerName}</Text>
          <Text style={styles.startChatJob} numberOfLines={1}>
            📋 {c.jobTitle}
          </Text>
        </View>
        {busy ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <View style={styles.startChatBtn}>
            <Text style={styles.startChatBtnText}>💬 Chat</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // ── Header component (search + contacts) ─────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* New conversations section (customers without thread) */}
      {filteredContacts.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Start a conversation</Text>
          {filteredContacts.map(renderContact)}
        </View>
      )}

      {/* Existing threads label */}
      {filteredThreads.length > 0 && (
        <Text style={styles.sectionLabel}>
          {search.trim() ? `Results (${filteredThreads.length})` : 'Recent conversations'}
        </Text>
      )}
    </View>
  )

  // ── Empty state ───────────────────────────────────────────────────────────────
  const showEmpty = !isLoading && filteredThreads.length === 0 && filteredContacts.length === 0
  const emptyTitle = search.trim()
    ? 'No results'
    : 'No messages yet'
  const emptySubtitle = search.trim()
    ? `No conversations matching "${search}"`
    : 'When you are assigned jobs, you can message customers and team members here.'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Messages</Text>
          <Text style={styles.pageSubtitle}>Customer &amp; team conversations</Text>
        </View>
        {myThreads.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{myThreads.length}</Text>
          </View>
        )}
      </View>

      {isLoading && !threadsData ? (
        <LoadingSpinner message="Loading messages..." />
      ) : showEmpty ? (
        <View style={{ flex: 1 }}>
          {/* Show search bar even in empty state */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search conversations..."
                placeholderTextColor={Colors.textMuted}
                clearButtonMode="while-editing"
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Text style={styles.clearBtn}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>
          <EmptyState icon="💬" title={emptyTitle} subtitle={emptySubtitle} />
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            filteredContacts.length === 0 ? (
              <View style={styles.emptyThreads}>
                <Text style={styles.emptyThreadsText}>
                  {search.trim() ? `No conversations match "${search}"` : 'No conversations yet'}
                </Text>
              </View>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 1,
  },
  countPill: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countPillText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Search
  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingLeft: Spacing.sm,
  },

  // Sections
  sectionBlock: {
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },

  // Start chat cards
  startChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  startChatAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  startChatAvatarText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  startChatName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  startChatJob: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  startChatBtn: {
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startChatBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Thread rows
  listContent: { paddingBottom: 40 },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarUnread: { backgroundColor: Colors.primary },
  avatarStaff: { backgroundColor: '#7C3AED' },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  threadContent: { flex: 1 },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  threadName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  threadNameUnread: { fontWeight: FontWeight.bold },
  threadTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  threadMeta: { fontSize: FontSize.xs, marginBottom: 2 },
  threadBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadPreview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  threadPreviewUnread: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },

  emptyThreads: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyThreadsText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
})

import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { useThreads, useCreateThread } from '@/hooks/useMessages'
import { useMyJobs } from '@/hooks/useJobs'
import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatRelative, getInitials, truncate } from '@/utils/format'
import type { MessageThread, Job } from '@/types/api'

export default function MessagesScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: threadsData, isLoading, refetch } = useThreads({ limit: 50 })
  const { data: jobsData } = useMyJobs({ limit: 100 })
  const createThread = useCreateThread()

  const threads = threadsData?.data ?? []
  const myJobs = jobsData?.data ?? []

  // Get customer IDs from my assigned jobs
  const myCustomerIds = useMemo(() => {
    const ids = new Set<string>()
    myJobs.forEach((j) => {
      if (j.customerId) ids.add(j.customerId)
    })
    return ids
  }, [myJobs])

  // Filter threads: only show threads for MY customers (from assigned jobs)
  // OR threads where I'm a participant
  const myThreads = useMemo(() => {
    return threads.filter((t) => {
      // Thread for a customer whose job I'm assigned to
      if (t.customerId && myCustomerIds.has(t.customerId)) return true
      // Thread I participated in (check messages)
      return false
    })
  }, [threads, myCustomerIds])

  // Customers I have jobs with but NO thread yet — so tech can start a conversation
  const customersWithoutThread = useMemo(() => {
    const threadCustomerIds = new Set(myThreads.map((t) => t.customerId))
    const seen = new Set<string>()
    const result: { customerId: string; customerName: string; jobTitle: string }[] = []
    myJobs.forEach((j) => {
      if (j.customerId && !threadCustomerIds.has(j.customerId) && !seen.has(j.customerId)) {
        seen.add(j.customerId)
        result.push({
          customerId: j.customerId,
          customerName: j.customerName ?? 'Customer',
          jobTitle: j.title,
        })
      }
    })
    return result
  }, [myJobs, myThreads])

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleStartChat = async (customerId: string, customerName: string) => {
    try {
      const thread = await createThread.mutateAsync({ customerId, customerName })
      router.push(`/message/${thread.id}`)
    } catch (err: any) {
      // If thread already exists, comms service returns it
      if (err?.response?.data?.id) {
        router.push(`/message/${err.response.data.id}`)
      }
    }
  }

  const renderThread = ({ item }: { item: MessageThread }) => {
    // Find what job this thread relates to
    const relatedJob = myJobs.find((j) => j.customerId === item.customerId)

    return (
      <TouchableOpacity
        style={styles.threadCard}
        onPress={() => router.push(`/message/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, (item.unreadCount ?? 0) > 0 && styles.avatarUnread]}>
          <Text style={styles.avatarText}>{getInitials(item.customerName)}</Text>
        </View>

        {/* Content */}
        <View style={styles.threadContent}>
          <View style={styles.threadTopRow}>
            <Text
              style={[styles.threadName, (item.unreadCount ?? 0) > 0 && styles.threadNameUnread]}
              numberOfLines={1}
            >
              {item.customerName ?? 'Unknown'}
            </Text>
            <Text style={styles.threadTime}>
              {formatRelative(item.lastMessageAt ?? item.createdAt)}
            </Text>
          </View>
          {relatedJob && (
            <Text style={styles.jobRef} numberOfLines={1}>
              📋 {relatedJob.title}
            </Text>
          )}
          <View style={styles.threadBottomRow}>
            <Text style={styles.threadPreview} numberOfLines={1}>
              {item.lastMessageBody ? truncate(item.lastMessageBody, 60) : 'No messages yet'}
            </Text>
            {(item.unreadCount ?? 0) > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Conversations with your assigned customers</Text>
      </View>

      {isLoading && !threadsData ? (
        <LoadingSpinner message="Loading messages..." />
      ) : (
        <FlatList
          data={myThreads}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            customersWithoutThread.length > 0 ? (
              <View style={styles.startChatSection}>
                <Text style={styles.sectionLabel}>Start a conversation</Text>
                {customersWithoutThread.map((c) => (
                  <TouchableOpacity
                    key={c.customerId}
                    style={styles.startChatCard}
                    onPress={() => handleStartChat(c.customerId, c.customerName)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.startChatAvatar}>
                      <Text style={styles.startChatAvatarText}>{getInitials(c.customerName)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.startChatName}>{c.customerName}</Text>
                      <Text style={styles.startChatJob} numberOfLines={1}>📋 {c.jobTitle}</Text>
                    </View>
                    <Text style={styles.startChatBtn}>💬 Chat</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            customersWithoutThread.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No messages yet"
                subtitle="When you're assigned jobs, you can message customers directly from here."
              />
            ) : null
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
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 30,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  startChatSection: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.md,
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarUnread: {
    backgroundColor: Colors.primary,
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  threadContent: {
    flex: 1,
  },
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
  },
  threadNameUnread: {
    fontWeight: FontWeight.bold,
  },
  threadTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  jobRef: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    marginBottom: 2,
  },
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
})

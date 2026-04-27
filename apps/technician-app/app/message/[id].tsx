import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useThreadDetail, useSendMessage, useMarkThreadRead, useDeleteThread } from '@/hooks/useMessages'
import { useSocketContext } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatTime, getInitials } from '@/utils/format'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import type { ThreadMessage, MessageThread } from '@/types/api'

// ── Typing indicator dots (3 animated dots) ──────────────────────────────────

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      )
    const a = anim(dot1, 0)
    const b = anim(dot2, 150)
    const c = anim(dot3, 300)
    a.start()
    b.start()
    c.start()
    return () => { a.stop(); b.stop(); c.stop() }
  }, [])

  return (
    <View style={typingStyles.row}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  )
}

const typingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
})

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const qc = useQueryClient()
  const flatListRef = useRef<FlatList>(null)

  const [messageText, setMessageText] = useState('')
  // Map of userId → userName for people currently typing (exclude self)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const { data: thread, isLoading } = useThreadDetail(id ?? '')
  const sendMessageMutation = useSendMessage()
  const markRead = useMarkThreadRead()
  const deleteThreadMutation = useDeleteThread()

  const { isConnected, joinThread, leaveThread, onNewMessage, onTyping, sendTyping } = useSocketContext()

  // ── Join / leave thread room ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    if (isConnected) joinThread(id)
    return () => { if (id) leaveThread(id) }
  }, [id, isConnected, joinThread, leaveThread])

  // ── Listen for incoming messages via WebSocket ────────────────────────────
  useEffect(() => {
    if (!id) return
    const unsub = onNewMessage(({ threadId, message }) => {
      if (threadId !== id) return
      qc.setQueryData<MessageThread>(queryKeys.threadDetail(id), (old) => {
        if (!old) return old
        const existing = old.messages ?? []
        // Skip duplicates (optimistic or already present)
        if (existing.some((m) => m.id === message.id)) return old
        // Also skip if we have a temp message with same body (our own send)
        const hasTempMatch = existing.some(
          (m) => m.id.startsWith('temp-') && m.body === message.body,
        )
        if (hasTempMatch) return old
        return {
          ...old,
          messages: [...existing, message],
          lastMessageBody: message.body,
          lastMessageAt: message.createdAt,
        }
      })
      // Scroll to bottom on new message
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80)
    })
    return unsub
  }, [id, onNewMessage, qc])

  // ── Listen for typing events ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const unsub = onTyping(({ threadId, userId, userName, isTyping: typing }) => {
      if (threadId !== id) return
      if (userId === user?.id) return // ignore self
      setTypingUsers((prev) => {
        const next = { ...prev }
        if (typing) {
          next[userId] = userName
          // Auto-clear if no follow-up typing event in 3 s
          clearTimeout(typingTimers.current[userId])
          typingTimers.current[userId] = setTimeout(() => {
            setTypingUsers((p) => { const n = { ...p }; delete n[userId]; return n })
          }, 3000)
        } else {
          clearTimeout(typingTimers.current[userId])
          delete next[userId]
        }
        return next
      })
    })
    return () => {
      unsub()
      // Clear all timers on unmount
      Object.values(typingTimers.current).forEach(clearTimeout)
    }
  }, [id, onTyping, user?.id])

  // ── Mark thread as read on open ───────────────────────────────────────────
  useEffect(() => {
    if (id && thread?.unreadCount && thread.unreadCount > 0) {
      markRead.mutate(id)
    }
  }, [id, thread?.unreadCount])

  // ── Scroll to bottom when messages change ────────────────────────────────
  useEffect(() => {
    if ((thread?.messages?.length ?? 0) > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50)
    }
  // Depend on actual message count, not a boolean expression
  }, [thread?.messages?.length])

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !id) return
    const text = messageText.trim()
    setMessageText('')
    sendTyping(id, false) // stop typing indicator
    try {
      await sendMessageMutation.mutateAsync({ threadId: id, body: text })
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80)
    } catch {
      setMessageText(text) // restore on failure
    }
  }, [messageText, id, sendMessageMutation, sendTyping])

  // ── Thread meta ───────────────────────────────────────────────────────────
  const isStaffThread = !thread?.customerId && (thread?.participantIds?.length ?? 0) > 0
  const threadDisplayName = isStaffThread
    ? (() => {
        // Staff↔staff: show the other participant's name(s) so each side sees
        // "Colleague Name" not the thread subject
        const others = (thread?.participantNames ?? []).filter((n) => n !== user?.name)
        return others.length > 0
          ? others.join(', ')
          : (thread?.subject ?? 'Team Chat')
      })()
    : // Customer thread: tech always sees the customer's name, not the subject
      (thread?.customerName ?? thread?.customerPhone ?? 'Customer')

  const messages = thread?.messages ?? []

  // Names of people currently typing
  const typingNames = Object.values(typingUsers)
  const typingLabel =
    typingNames.length === 1
      ? `${typingNames[0]} is typing`
      : typingNames.length > 1
      ? 'Several people are typing'
      : null

  // ── Render message bubble ─────────────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: ThreadMessage; index: number }) => {
    const isMine = isStaffThread
      ? item.senderId === user?.id
      : item.direction === 'OUTBOUND'

    // Group: show avatar only for first message in a consecutive block from same sender
    const prevItem = messages[index - 1]
    const isFirstInGroup =
      !prevItem ||
      (isStaffThread
        ? prevItem.senderId !== item.senderId
        : prevItem.direction !== item.direction)

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        {/* Avatar on left side for inbound */}
        {!isMine && (
          <View style={[styles.msgAvatar, !isFirstInGroup && styles.msgAvatarHidden]}>
            {isFirstInGroup ? (
              <Text style={styles.msgAvatarText}>
                {getInitials(item.senderName ?? threadDisplayName)}
              </Text>
            ) : null}
          </View>
        )}

        <View style={styles.bubbleWrapper}>
          {/* Sender name in staff/group thread */}
          {!isMine && isFirstInGroup && isStaffThread && item.senderName && (
            <Text style={styles.senderLabel}>{item.senderName}</Text>
          )}

          <View style={[styles.bubble, isMine ? styles.bubbleOut : styles.bubbleIn]}>
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextOut]}>
              {item.body}
            </Text>
            <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeOut]}>
              {formatTime(item.createdAt)}
              {isMine && item.status === 'SENT'      && '  ✓'}
              {isMine && item.status === 'DELIVERED' && '  ✓✓'}
              {isMine && item.status === 'READ'      && '  ✓✓'}
              {isMine && item.status === 'FAILED'    && '  ✗'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading conversation..." />
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={[styles.headerAvatar, isStaffThread && styles.headerAvatarStaff]}>
          <Text style={styles.headerAvatarText}>{getInitials(threadDisplayName)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {threadDisplayName}
          </Text>
          <View style={styles.headerStatusRow}>
            <View style={[styles.statusDot, isConnected ? styles.statusDotOnline : styles.statusDotOffline]} />
            <Text style={[styles.headerStatus, isConnected ? styles.headerStatusOnline : styles.headerStatusOffline]}>
              {isConnected ? 'Connected' : 'Reconnecting…'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowDeleteConfirm(true)}
          hitSlop={8}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* ── Delete confirmation modal ── */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Conversation</Text>
            <Text style={styles.modalBody}>
              This will permanently delete all messages in this conversation. You can always start a new one.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDelete]}
                disabled={deleteThreadMutation.isPending}
                onPress={() => {
                  if (!id) return
                  deleteThreadMutation.mutate(id, {
                    onSuccess: () => {
                      setShowDeleteConfirm(false)
                      router.back()
                    },
                    onError: () => setShowDeleteConfirm(false),
                  })
                }}
              >
                <Text style={styles.modalBtnDeleteText}>
                  {deleteThreadMutation.isPending ? 'Deleting…' : 'Delete Forever'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Messages + input ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {/* Typing indicator */}
        {typingLabel && (
          <View style={styles.typingRow}>
            <TypingDots />
            <Text style={styles.typingLabel}>{typingLabel}</Text>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text)
              if (id) sendTyping(id, text.length > 0)
            }}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="default"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!messageText.trim() || sendMessageMutation.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>
              {sendMessageMutation.isPending ? '⏳' : '➤'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { paddingRight: Spacing.sm, paddingVertical: 4 },
  backText: { fontSize: 30, color: Colors.primary, lineHeight: 34 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerAvatarStaff: { backgroundColor: '#7C3AED' },
  headerAvatarText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  headerInfo: { flex: 1 },
  headerName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusDotOnline: { backgroundColor: Colors.success },
  statusDotOffline: { backgroundColor: Colors.textMuted },
  headerStatus: { fontSize: FontSize.xs },
  headerStatusOnline: { color: Colors.success },
  headerStatusOffline: { color: Colors.textMuted },

  // Messages list
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
    maxWidth: '82%',
  },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  msgAvatarHidden: { backgroundColor: 'transparent' },
  msgAvatarText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white },

  bubbleWrapper: { flex: 1 },
  senderLabel: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: 3,
    marginLeft: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: '100%',
  },
  bubbleIn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleOut: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  bubbleTextOut: { color: Colors.white },
  bubbleTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  bubbleTimeOut: { color: 'rgba(255,255,255,0.65)' },

  // Empty
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    gap: 8,
  },
  typingLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.sm,
    gap: Spacing.sm,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.disabled },
  sendBtnText: { fontSize: 18, color: Colors.white },

  // Delete button in header
  deleteBtn: {
    paddingLeft: Spacing.sm,
    paddingVertical: 4,
  },
  deleteBtnText: { fontSize: 18 },

  // Delete confirmation modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#ef4444',
    marginBottom: Spacing.sm,
  },
  modalBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBtnCancelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  modalBtnDelete: {
    backgroundColor: '#ef4444',
  },
  modalBtnDeleteText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
})

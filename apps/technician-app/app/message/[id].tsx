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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useThreadDetail, useSendMessage, useMarkThreadRead } from '@/hooks/useMessages'
import { useSocket } from '@/hooks/useSocket'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatTime, getInitials } from '@/utils/format'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import type { ThreadMessage, MessageThread } from '@/types/api'

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [messageText, setMessageText] = useState('')
  const flatListRef = useRef<FlatList>(null)
  const qc = useQueryClient()

  const { data: thread, isLoading } = useThreadDetail(id ?? '')
  const sendMessageMutation = useSendMessage()
  const markRead = useMarkThreadRead()

  // WebSocket
  const { isConnected, joinThread, leaveThread, onNewMessage, sendTyping } = useSocket()

  // Join thread room on mount
  useEffect(() => {
    if (id && isConnected) {
      joinThread(id)
      return () => leaveThread(id)
    }
  }, [id, isConnected])

  // Listen for new messages via WebSocket and update cache
  useEffect(() => {
    if (!id) return
    const unsub = onNewMessage((data) => {
      if (data.threadId !== id) return
      // Only add if message isn't from us (avoids duplicate from optimistic update)
      qc.setQueryData<MessageThread>(queryKeys.threadDetail(id), (old) => {
        if (!old) return old
        const existing = old.messages ?? []
        // Skip if we already have this message (optimistic or duplicate)
        if (existing.some((m) => m.id === data.message.id)) return old
        // Also skip temp messages that match the same body (our optimistic msg)
        return {
          ...old,
          messages: [...existing, data.message],
          lastMessageBody: data.message.body,
          lastMessageAt: data.message.createdAt,
        }
      })
    })
    return unsub
  }, [id, onNewMessage])

  // Mark thread as read on mount
  useEffect(() => {
    if (id && thread?.unreadCount && thread.unreadCount > 0) {
      markRead.mutate(id)
    }
  }, [id, thread?.unreadCount])

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !id) return
    const text = messageText.trim()
    setMessageText('')

    try {
      await sendMessageMutation.mutateAsync({ threadId: id, body: text })
    } catch {
      setMessageText(text) // Restore on failure
    }
  }, [messageText, id])

  // Determine display name for the thread
  const isStaffThread = !thread?.customerId && (thread?.participantIds?.length ?? 0) > 0
  const threadDisplayName = isStaffThread
    ? thread?.subject ??
      thread?.participantNames?.filter((n) => n !== user?.name).join(', ') ??
      'Team Chat'
    : thread?.customerName ?? 'Conversation'

  const messages = thread?.messages ?? []

  const renderMessage = ({ item }: { item: ThreadMessage }) => {
    // In staff threads, check senderId; in customer threads, check direction
    const isMine = isStaffThread
      ? item.senderId === user?.id
      : item.direction === 'OUTBOUND'

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMine && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {getInitials(item.senderName ?? threadDisplayName)}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleOut : styles.bubbleIn]}>
          {/* Show sender name in group/staff threads */}
          {!isMine && isStaffThread && item.senderName && (
            <Text style={styles.senderLabel}>{item.senderName}</Text>
          )}
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextOut]}>
            {item.body}
          </Text>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeOut]}>
            {formatTime(item.createdAt)}
            {item.status === 'DELIVERED' && ' \u2713\u2713'}
            {item.status === 'READ' && ' \u2713\u2713'}
            {item.status === 'FAILED' && ' \u2715'}
          </Text>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading conversation..." />
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2039'}</Text>
        </TouchableOpacity>
        <View style={[styles.headerAvatar, isStaffThread && styles.headerAvatarStaff]}>
          <Text style={styles.headerAvatarText}>{getInitials(threadDisplayName)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {threadDisplayName}
          </Text>
          <Text style={styles.headerStatus}>
            {isConnected ? '\u25CF Connected' : '\u25CB Connecting...'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />

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
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            <Text style={styles.sendBtnText}>
              {sendMessageMutation.isPending ? '\u23F3' : '\u27A4'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

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
  backText: { fontSize: 28, color: Colors.primary, fontWeight: FontWeight.medium },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerAvatarStaff: {
    backgroundColor: '#7C3AED', // Purple for staff threads
  },
  headerAvatarText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  headerInfo: { flex: 1 },
  headerName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  headerStatus: { fontSize: FontSize.xs, color: Colors.success },

  // Messages
  messagesList: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '80%',
  },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  msgAvatarText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white },

  bubble: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
  senderLabel: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bubbleTextOut: {
    color: Colors.white,
  },
  bubbleTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeOut: {
    color: 'rgba(255,255,255,0.7)',
  },

  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

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
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  sendBtnText: {
    fontSize: 18,
    color: Colors.white,
  },
})

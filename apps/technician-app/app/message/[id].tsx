import React, { useState, useEffect, useRef } from 'react'
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
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { useThreadDetail, useSendMessage, useMarkThreadRead } from '@/hooks/useMessages'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatTime, formatDate, getInitials } from '@/utils/format'
import type { ThreadMessage } from '@/types/api'

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [messageText, setMessageText] = useState('')
  const flatListRef = useRef<FlatList>(null)

  const { data: thread, isLoading } = useThreadDetail(id!)
  const sendMessage = useSendMessage()
  const markRead = useMarkThreadRead()

  // Mark thread as read on mount
  useEffect(() => {
    if (id && thread?.unreadCount && thread.unreadCount > 0) {
      markRead.mutate(id)
    }
  }, [id, thread?.unreadCount])

  const handleSend = async () => {
    if (!messageText.trim() || !id) return
    const text = messageText.trim()
    setMessageText('')
    try {
      await sendMessage.mutateAsync({ threadId: id, body: text })
    } catch {
      setMessageText(text) // Restore on failure
    }
  }

  const messages = thread?.messages ?? []

  const renderMessage = ({ item }: { item: ThreadMessage }) => {
    const isOutbound = item.direction === 'OUTBOUND'

    return (
      <View style={[styles.msgRow, isOutbound ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isOutbound && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>{getInitials(thread?.customerName)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isOutbound ? styles.bubbleOut : styles.bubbleIn]}>
          <Text style={[styles.bubbleText, isOutbound && styles.bubbleTextOut]}>
            {item.body}
          </Text>
          <Text style={[styles.bubbleTime, isOutbound && styles.bubbleTimeOut]}>
            {formatTime(item.createdAt)}
            {item.status === 'DELIVERED' && ' ✓✓'}
            {item.status === 'READ' && ' ✓✓'}
            {item.status === 'FAILED' && ' ✕'}
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
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{getInitials(thread?.customerName)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {thread?.customerName ?? 'Conversation'}
          </Text>
          <Text style={styles.headerStatus}>
            {thread?.status === 'ACTIVE' ? '● Active' : thread?.status}
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
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
          >
            <Text style={styles.sendBtnText}>
              {sendMessage.isPending ? '⏳' : '➤'}
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
    paddingVertical: Spacing.md,
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

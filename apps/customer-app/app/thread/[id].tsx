import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import {
  useMarkMyThreadRead, useMyThread, useSendMyThreadMessage,
} from '@/hooks/useMyMessages'
import { queryClient } from '@/lib/queryClient'
import { getInitials, getThreadTitle, isTechThread } from '@/lib/threadActions'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'
import type { ThreadMessage } from '@/types/api'

function fmtTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { isConnected, joinThread, leaveThread, sendTyping, onNewMessage, onTyping } = useSocket()

  const { data: thread, isLoading, isError, refetch } = useMyThread(id)
  const sendMutation = useSendMyThreadMessage()
  const markRead = useMarkMyThreadRead()

  const [text, setText] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const listRef = useRef<FlatList>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingSentRef = useRef(false)

  const messages = thread?.messages ?? []

  useEffect(() => {
    if (!id) return
    joinThread(id)
    return () => leaveThread(id)
  }, [id, joinThread, leaveThread])

  useEffect(() => {
    if (id && (thread?.unreadCount ?? 0) > 0) markRead.mutate(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, thread?.unreadCount])

  useEffect(() => {
    const unsub = onNewMessage(({ threadId, message }) => {
      if (threadId !== id) return
      queryClient.setQueryData(['threads', 'detail', threadId], (old: any) => {
        if (!old) return old
        const msgs: ThreadMessage[] = old.messages ?? []
        if (msgs.find((m) => m.id === message.id)) return old
        return { ...old, messages: [...msgs, message] }
      })
      queryClient.invalidateQueries({ queryKey: ['threads', 'list'] })
    })
    return unsub
  }, [onNewMessage, id])

  useEffect(() => {
    const unsub = onTyping(({ threadId, userName, isTyping }) => {
      if (threadId !== id) return
      if (isTyping) {
        setTypingUser(userName)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000)
      } else {
        setTypingUser(null)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      }
    })
    return unsub
  }, [onTyping, id])

  const handleTypingChange = useCallback((val: string) => {
    setText(val)
    if (!id) return
    if (!typingSentRef.current) {
      typingSentRef.current = true
      sendTyping(id, true)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingSentRef.current = false
      sendTyping(id, false)
    }, 2000)
  }, [id, sendTyping])

  const send = () => {
    const body = text.trim()
    if (!id || !body) return
    sendMutation.mutate({ threadId: id, body })
    setText('')
    typingSentRef.current = false
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendTyping(id, false)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !thread) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errorText}>Could not load this conversation.</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => refetch()}>
          <Text style={styles.secondaryBtnText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const title = getThreadTitle(thread)
  const tech = isTechThread(thread)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.avatar, tech && styles.avatarTech]}>
            <Text style={[styles.avatarText, tech && styles.avatarTextTech]}>
              {getInitials(title)}
            </Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>
              {tech ? 'Technician' : 'Support Team'} · {isConnected ? 'Live' : 'Connecting…'}
            </Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No messages yet. Say hello 👋</Text>
        }
        renderItem={({ item }) => {
          const mine = item.direction === 'INBOUND' || item.senderId === user?.id
          return (
            <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              {!mine && item.senderName ? (
                <Text style={styles.senderName}>{item.senderName}</Text>
              ) : null}
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
              </View>
              <Text style={styles.bubbleTime}>{fmtTime(item.createdAt)}</Text>
            </View>
          )
        }}
        ListFooterComponent={
          typingUser ? (
            <View style={[styles.bubbleRow, styles.bubbleRowTheirs]}>
              <Text style={styles.senderName}>{typingUser} is typing…</Text>
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTypingChange}
            placeholder="Type your message…"
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
            disabled={!text.trim() || sendMutation.isPending}
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Feather name="send" size={18} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, gap: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  back: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  headerSpacer: { width: 44 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTech: { backgroundColor: '#EDE9FE' },
  avatarText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  avatarTextTech: { color: '#7C3AED' },
  headerTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  messages: { padding: Spacing.base, paddingBottom: Spacing.lg, flexGrow: 1 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.xl },
  bubbleRow: { marginBottom: Spacing.sm, maxWidth: '78%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 3, paddingHorizontal: 4 },
  bubble: { borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Colors.surfaceAlt, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMine: { color: Colors.textInverse },
  bubbleTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 3, paddingHorizontal: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.disabled },
  errorText: { color: Colors.danger, fontSize: FontSize.base },
  secondaryBtn: { paddingVertical: Spacing.base, alignItems: 'center' },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
})

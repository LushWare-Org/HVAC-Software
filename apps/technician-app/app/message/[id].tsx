/**
 * One conversation. A bubble is mine when its senderMemberKey equals the
 * conversation's myMemberKey; office messages show who wrote them.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { chatLive, fetchOlder, useChatAction, useConversation, useMarkChatRead, useSendChat } from '@/chat/useChat'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatTime, getInitials } from '@/utils/format'
import type { ChatMessage } from '@/types/api'

const dayLabel = (iso: string) => {
  const d = new Date(iso); const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const detail = useConversation(id ?? null)
  const send = useSendChat()
  const markRead = useMarkChatRead()
  const action = useChatAction()
  const d = detail.data
  const [text, setText] = useState('')
  const [older, setOlder] = useState<ChatMessage[]>([])
  const [olderMore, setOlderMore] = useState<boolean | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [typing, setTyping] = useState<string | null>(null)
  const listRef = useRef<FlatList<ChatMessage>>(null)
  const typingSent = useRef(0)

  useEffect(() => { if (id) chatLive.focus(id); return () => { chatLive.focus(null) } }, [id])
  useEffect(() => {
    if (!d || !id) return
    const me = d.members.find((m) => m.isMe)
    if (me && me.lastReadSeq < d.lastSeq) markRead.mutate({ conversationId: id, seq: d.lastSeq })
  }, [id, d?.lastSeq]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => chatLive.onTyping((e) => { if (e.conversationId === id && e.memberKey !== d?.myMemberKey) setTyping(e.typing ? e.name : null) }), [id, d?.myMemberKey])
  useEffect(() => { if (!typing) return; const t = setTimeout(() => setTyping(null), 5000); return () => clearTimeout(t) }, [typing])

  const messages = useMemo(() => {
    if (!d) return []
    return [...older.filter((m) => !d.messages.some((x) => x.id === m.id)), ...d.messages]
  }, [d, older])
  // Newest at the bottom: the list is inverted, so it gets the reverse.
  const inverted = useMemo(() => [...messages].reverse(), [messages])

  const loadOlder = useCallback(async () => {
    if (!id || loadingOlder || !messages.length) return
    const more = olderMore ?? d?.hasMore
    if (!more) return
    setLoadingOlder(true)
    try {
      const res = await fetchOlder(id, messages[0].seq)
      setOlder((o) => [...res.data, ...o])
      setOlderMore(res.hasMore)
    } finally {
      setLoadingOlder(false)
    }
  }, [id, loadingOlder, messages, olderMore, d?.hasMore])

  if (detail.isLoading && !d) return <LoadingSpinner message="Loading conversation..." />
  if (detail.isError || !d) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.muted}>This conversation isn't available.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>Go back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const others = d.members.filter((m) => !m.isMe)
  const seenUpTo = others.length ? Math.max(...others.map((m) => m.lastReadSeq)) : 0
  const lastMine = [...messages].reverse().find((m) => m.senderMemberKey === d.myMemberKey && !m.pending)

  const submit = () => {
    const body = text.trim()
    if (!body || !id) return
    send.mutate({ conversationId: id, body })
    setText('')
    chatLive.typing(id, false)
  }

  const menu = () => Alert.alert(d.title, undefined, [
    { text: d.muted ? 'Turn notifications on' : 'Mute notifications', onPress: () => action.mutate({ conversationId: id!, action: d.muted ? 'unmute' : 'mute' }) },
    ...(d.myMemberKey !== 'office' ? [{ text: 'Hide from my list', style: 'destructive' as const, onPress: () => action.mutate({ conversationId: id!, action: 'hide' }, { onSuccess: () => router.back() }) }] : []),
    { text: 'Cancel', style: 'cancel' as const },
  ])

  const renderItem = ({ item: m, index }: { item: ChatMessage; index: number }) => {
    const prev = inverted[index + 1] // older neighbour
    const mine = m.senderMemberKey === d.myMemberKey
    const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
    const showName = !mine && (!prev || prev.senderName !== m.senderName || prev.senderMemberKey !== m.senderMemberKey || newDay)
    return (
      <View>
        {newDay && <Text style={styles.day}>{dayLabel(m.createdAt)}</Text>}
        <View style={[styles.msgRow, mine ? styles.right : styles.left, showName && { marginTop: 8 }]}>
          <View style={{ maxWidth: '82%' }}>
            {showName && <Text style={styles.sender}>{m.senderKind === 'KELVIN' ? '✨ Kelvin' : m.senderName}</Text>}
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, m.pending && { opacity: 0.7 }]}>
              {m.jobNumber ? <Text style={[styles.jobChip, mine && { color: '#dbeafe' }]}>About {m.jobNumber}</Text> : null}
              <Text style={[styles.body, mine && styles.bodyMine, m.deletedAt && { fontStyle: 'italic' }]}>
                {m.deletedAt ? 'Message deleted' : linkify(m.body, mine)}
              </Text>
            </View>
            <View style={[styles.meta, mine && { justifyContent: 'flex-end' }]}>
              {m.failed ? (
                <Pressable onPress={() => send.mutate({ conversationId: id!, body: m.body, clientId: m.clientId ?? undefined })} hitSlop={10}>
                  <Text style={[styles.metaText, { color: Colors.danger }]}>Not sent. Tap to retry</Text>
                </Pressable>
              ) : (
                <Text style={styles.metaText}>
                  {m.pending ? 'Sending…' : formatTime(m.createdAt)}{m.editedAt && !m.deletedAt ? ' · edited' : ''}
                  {mine && m.id === lastMine?.id ? (seenUpTo >= m.seq ? '  ✓✓ Seen' : '  ✓ Sent') : ''}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} accessibilityLabel="Back"><Text style={styles.headerBack}>‹</Text></TouchableOpacity>
        <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>{getInitials(d.title)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{d.title}</Text>
          <Text style={[styles.headerSub, typing && { color: Colors.primary }]} numberOfLines={1}>{typing ? `${typing} is typing…` : d.subtitle}</Text>
        </View>
        <TouchableOpacity onPress={menu} style={styles.headerBtn} accessibilityLabel="Conversation options"><Text style={styles.headerMenu}>⋯</Text></TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={inverted}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: Spacing.md }}
          onEndReached={loadOlder}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingOlder ? <ActivityIndicator style={{ margin: 12 }} color={Colors.primary} /> : null}
          ListEmptyComponent={<View style={[styles.center, { transform: [{ scaleY: -1 }] }]}>{detail.isPlaceholderData ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.muted}>No messages yet. Say hello.</Text>}</View>}
          keyboardShouldPersistTaps="handled"
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input} value={text} multiline maxLength={4000} placeholder={`Message ${d.title}`} placeholderTextColor={Colors.textMuted}
            onChangeText={(v) => { setText(v); if (id && Date.now() - typingSent.current > 2500) { typingSent.current = Date.now(); chatLive.typing(id, true) } }}
          />
          <TouchableOpacity style={[styles.send, !text.trim() && { opacity: 0.5 }]} onPress={submit} disabled={!text.trim()} accessibilityLabel="Send">
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/** Links (e.g. a customer's location link) open in the browser. */
function linkify(text: string, mine: boolean) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((p, i) => (/^https?:\/\//.test(p)
    ? <Text key={i} style={{ textDecorationLine: 'underline', color: mine ? Colors.white : Colors.primary }} onPress={() => Linking.openURL(p)}>{p}</Text>
    : p))
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  backBtn: { marginTop: Spacing.md, paddingHorizontal: 18, paddingVertical: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.primary },
  backBtnText: { color: Colors.white, fontWeight: FontWeight.semibold },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerBack: { fontSize: 32, color: Colors.primary, marginTop: -4 },
  headerMenu: { fontSize: 24, color: Colors.textSecondary },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: Colors.white, fontWeight: FontWeight.semibold },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  day: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, marginVertical: Spacing.sm },
  msgRow: { flexDirection: 'row', marginTop: 2 },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  sender: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, marginLeft: 6, marginBottom: 2 },
  bubble: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16 },
  bubbleMine: { backgroundColor: Colors.primary, borderTopRightRadius: 6 },
  bubbleTheirs: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderTopLeftRadius: 6 },
  jobChip: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.textMuted, marginBottom: 2 },
  body: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 21 },
  bodyMine: { color: Colors.white },
  meta: { flexDirection: 'row', marginTop: 2, marginHorizontal: 6 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm, gap: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, minHeight: 48, maxHeight: 140, borderRadius: 22, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 13, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.background },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: Colors.white, fontSize: 20 },
})

/**
 * One conversation, with the office or a technician. A bubble is mine when its
 * senderMemberKey equals the conversation's myMemberKey.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Text } from '@/components/Text'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'
import { chatLive, fetchOlder, useChatAction, useConversation, useMarkChatRead, useSendChat } from '@/chat/useChat'
import { getInitials } from '@/lib/threadActions'
import type { ChatMessage } from '@/types/api'

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const dayLabel = (iso: string) => {
  const d = new Date(iso); const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>()
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
  const typingSent = useRef(0)

  useEffect(() => { if (id) chatLive.focus(id); return () => { chatLive.focus(null) } }, [id])
  useEffect(() => {
    if (!d || !id) return
    const me = d.members.find((m) => m.isMe)
    if (me && me.lastReadSeq < d.lastSeq) markRead.mutate({ conversationId: id, seq: d.lastSeq })
  }, [id, d?.lastSeq]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => chatLive.onTyping((e) => { if (e.conversationId === id && e.memberKey !== d?.myMemberKey) setTyping(e.typing ? e.name : null) }), [id, d?.myMemberKey])
  useEffect(() => { if (!typing) return; const t = setTimeout(() => setTyping(null), 5000); return () => clearTimeout(t) }, [typing])

  const messages = useMemo(() => (d ? [...older.filter((m) => !d.messages.some((x) => x.id === m.id)), ...d.messages] : []), [d, older])
  const inverted = useMemo(() => [...messages].reverse(), [messages])

  const loadOlder = useCallback(async () => {
    if (!id || loadingOlder || !messages.length || !(olderMore ?? d?.hasMore)) return
    setLoadingOlder(true)
    try {
      const res = await fetchOlder(id, messages[0].seq)
      setOlder((o) => [...res.data, ...o])
      setOlderMore(res.hasMore)
    } finally {
      setLoadingOlder(false)
    }
  }, [id, loadingOlder, messages, olderMore, d?.hasMore])

  if (detail.isLoading && !d) {
    return <SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator color={Colors.primary} /></SafeAreaView>
  }
  if (detail.isError || !d) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.muted}>This conversation isn't available.</Text>
        <TouchableOpacity style={styles.retry} onPress={() => router.back()}><Text style={styles.retryText}>Go back</Text></TouchableOpacity>
      </SafeAreaView>
    )
  }

  const tech = d.kind === 'CUSTOMER_TECH'
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
    { text: 'Hide from my list', style: 'destructive', onPress: () => action.mutate({ conversationId: id!, action: 'hide' }, { onSuccess: () => router.back() }) },
    { text: 'Cancel', style: 'cancel' },
  ])

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="chevron-left" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <View style={[styles.avatar, tech && styles.avatarTech]}>
          {tech ? <Text style={[styles.avatarText, styles.avatarTextTech]}>{getInitials(d.title)}</Text> : <Feather name="headphones" size={16} color={Colors.primary} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{d.title}</Text>
          <Text style={[styles.headerSub, typing ? { color: Colors.primary } : null]} numberOfLines={1}>{typing ? `${typing} is typing…` : d.subtitle}</Text>
        </View>
        <TouchableOpacity onPress={menu} style={styles.iconBtn} accessibilityLabel="Conversation options">
          <Feather name="more-horizontal" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={inverted}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          onEndReached={loadOlder}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingOlder ? <ActivityIndicator style={{ margin: 12 }} color={Colors.primary} /> : null}
          ListEmptyComponent={<View style={{ transform: [{ scaleY: -1 }] }}>{detail.isPlaceholderData ? <ActivityIndicator color={Colors.primary} style={{ margin: 24 }} /> : <Text style={styles.muted}>No messages yet. Say hello 👋</Text>}</View>}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: m, index }) => {
            const prev = inverted[index + 1]
            const mine = m.senderMemberKey === d.myMemberKey
            const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
            const showName = !mine && (!prev || prev.senderName !== m.senderName || prev.senderMemberKey !== m.senderMemberKey || newDay)
            return (
              <View>
                {newDay ? <Text style={styles.day}>{dayLabel(m.createdAt)}</Text> : null}
                <View style={[styles.bubbleRow, mine ? styles.mine : styles.theirs]}>
                  {showName ? <Text style={styles.senderName}>{m.senderKind === 'KELVIN' ? 'Kelvin' : m.senderName}</Text> : null}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, m.pending ? { opacity: 0.7 } : null]}>
                    {m.jobNumber ? <Text style={[styles.jobChip, mine ? { color: Colors.primaryLight } : null]}>About {m.jobNumber}</Text> : null}
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine, m.deletedAt ? { fontStyle: 'italic' } : null]}>
                      {m.deletedAt ? 'Message deleted' : linkify(m.body, mine)}
                    </Text>
                  </View>
                  {m.failed ? (
                    <Pressable onPress={() => send.mutate({ conversationId: id!, body: m.body, clientId: m.clientId ?? undefined })} hitSlop={10}>
                      <Text style={[styles.bubbleTime, { color: Colors.danger }]}>Not sent. Tap to retry</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.bubbleTime}>
                      {m.pending ? 'Sending…' : fmtTime(m.createdAt)}{m.editedAt && !m.deletedAt ? ' · edited' : ''}
                      {mine && m.id === lastMine?.id ? (seenUpTo >= m.seq ? ' · Seen' : ' · Sent') : ''}
                    </Text>
                  )}
                </View>
              </View>
            )
          }}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input} value={text} multiline maxLength={4000} placeholder="Type your message…" placeholderTextColor={Colors.textMuted}
            onChangeText={(v) => { setText(v); if (id && Date.now() - typingSent.current > 2500) { typingSent.current = Date.now(); chatLive.typing(id, true) } }}
          />
          <TouchableOpacity style={[styles.send, !text.trim() && { opacity: 0.5 }]} onPress={submit} disabled={!text.trim()} accessibilityLabel="Send">
            <Feather name="send" size={18} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/** Links in messages (e.g. "where should we come?") open in the browser. */
function linkify(text: string, mine: boolean) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((p, i) => (/^https?:\/\//.test(p)
    ? <Text key={i} style={{ textDecorationLine: 'underline', color: mine ? Colors.textInverse : Colors.primary }} onPress={() => Linking.openURL(p)}>{p}</Text>
    : p))
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.xl },
  retry: { marginTop: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 18, paddingVertical: 12 },
  retryText: { color: Colors.textInverse, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarTech: { backgroundColor: Colors.violetLight },
  avatarText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  avatarTextTech: { color: Colors.violet },
  headerTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  messages: { padding: Spacing.md },
  day: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginVertical: Spacing.sm },
  bubbleRow: { marginTop: 4, maxWidth: '84%' },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginBottom: 2, marginLeft: 6 },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleMine: { backgroundColor: Colors.primary, borderTopRightRadius: 6 },
  bubbleTheirs: { backgroundColor: Colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, borderTopLeftRadius: 6 },
  jobChip: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 2 },
  bubbleText: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextMine: { color: Colors.textInverse },
  bubbleTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2, marginHorizontal: 6 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  input: { flex: 1, minHeight: 46, maxHeight: 140, borderRadius: 22, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: FontSize.base, color: Colors.textPrimary, backgroundColor: Colors.background },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
})

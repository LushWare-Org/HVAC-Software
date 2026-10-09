/**
 * Messages: my conversation with the office, private chats with customers I've
 * worked for, and team chats. The server only returns conversations I'm in.
 */
import React, { useCallback, useMemo, useState } from 'react'
import { TelegramCard } from '@/chat/TelegramCard'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useChatContacts, useConversations, useOpenConversation } from '@/chat/useChat'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatRelative, getInitials, truncate } from '@/utils/format'
import type { ChatConversation } from '@/types/api'

const KIND_LABEL: Record<ChatConversation['kind'], string> = {
  TECH_OFFICE: 'Office', CUSTOMER_TECH: 'Customer', CUSTOMER_OFFICE: 'Customer', STAFF_DIRECT: 'Team', STAFF_GROUP: 'Team group',
}
const KIND_COLOR: Record<ChatConversation['kind'], string> = {
  TECH_OFFICE: Colors.primary, CUSTOMER_TECH: '#0891B2', CUSTOMER_OFFICE: '#0891B2', STAFF_DIRECT: '#7C3AED', STAFF_GROUP: '#7C3AED',
}

export default function MessagesScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const list = useConversations()
  const contacts = useChatContacts()
  const open = useOpenConversation()

  const conversations = list.data?.data ?? []
  const q = search.trim().toLowerCase()
  const filtered = useMemo(
    () => (!q ? conversations : conversations.filter((c) => c.title.toLowerCase().includes(q) || (c.lastMessagePreview ?? '').toLowerCase().includes(q))),
    [conversations, q],
  )

  // People I can message who I don't have a conversation with yet.
  const haveCustomer = new Set(conversations.filter((c) => c.kind === 'CUSTOMER_TECH').map((c) => c.customerId))
  const hasOffice = conversations.some((c) => c.kind === 'TECH_OFFICE')
  const newCustomers = (contacts.data?.customers ?? []).filter((c) => !haveCustomer.has(c.customerId) && (!q || c.name.toLowerCase().includes(q)))

  const start = useCallback((key: string, v: Parameters<typeof open.mutate>[0]) => {
    setStarting(key)
    open.mutate(v, {
      onSuccess: (d) => router.push(`/message/${d.id}`),
      onSettled: () => setStarting(null),
    })
  }, [open, router])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([list.refetch(), contacts.refetch()])
    setRefreshing(false)
  }, [list, contacts])

  const header = (
    <View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search messages" placeholderTextColor={Colors.textMuted} autoCorrect={false} returnKeyType="search" />
          {search.length > 0 && <Pressable onPress={() => setSearch('')} hitSlop={10}><Text style={styles.clear}>✕</Text></Pressable>}
        </View>
      </View>
      {!q && <TelegramCard />}
      {!hasOffice && !q && (
        <StartRow label={contacts.data?.office.name ?? 'The office'} sub="Message the office" busy={starting === 'office'} onPress={() => start('office', { with: 'office' })} />
      )}
      {newCustomers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Customers you've worked for</Text>
          {newCustomers.slice(0, 8).map((c) => (
            <StartRow key={c.customerId} label={c.name} sub="Start a private chat" busy={starting === c.customerId} onPress={() => start(c.customerId, { with: 'customer', customerId: c.customerId })} />
          ))}
        </View>
      )}
      {filtered.length > 0 && <Text style={styles.sectionLabel}>{q ? `Results (${filtered.length})` : 'Conversations'}</Text>}
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Messages</Text>
        <Text style={styles.pageSubtitle}>Office, customers and team</Text>
      </View>
      {list.isLoading && !list.data ? (
        <LoadingSpinner message="Loading messages..." />
      ) : list.isError && !list.data ? (
        <EmptyState icon="⚠️" title="Couldn't load messages" subtitle="Pull down to try again." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={header}
          renderItem={({ item }) => <Row c={item} onPress={() => router.push(`/message/${item.id}`)} />}
          ListEmptyComponent={!newCustomers.length && hasOffice ? <EmptyState icon="💬" title={q ? 'No results' : 'No messages yet'} subtitle={q ? `Nothing matches "${search}"` : 'Conversations with the office, customers and your team show here.'} /> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </SafeAreaView>
  )
}

function Row({ c, onPress }: { c: ChatConversation; onPress: () => void }) {
  const unread = c.unread > 0
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7} accessibilityLabel={`${c.title}${unread ? `, ${c.unread} unread` : ''}`}>
      <View style={[styles.avatar, { backgroundColor: KIND_COLOR[c.kind] }]}><Text style={styles.avatarText}>{getInitials(c.title)}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={[styles.name, unread && styles.nameUnread]} numberOfLines={1}>{c.title}</Text>
          <Text style={[styles.time, unread && { color: Colors.primary }]}>{c.lastMessageAt ? formatRelative(c.lastMessageAt) : ''}</Text>
        </View>
        <Text style={[styles.kind, { color: KIND_COLOR[c.kind] }]}>{KIND_LABEL[c.kind]}{c.muted ? ' · muted' : ''}</Text>
        <View style={styles.rowTop}>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
            {c.lastMessagePreview ? truncate(`${c.lastSenderName ? `${c.lastSenderName}: ` : ''}${c.lastMessagePreview}`, 60) : 'No messages yet'}
          </Text>
          {unread && <View style={[styles.badge, c.muted && { backgroundColor: Colors.textMuted }]}><Text style={styles.badgeText}>{c.unread > 99 ? '99+' : c.unread}</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  )
}

function StartRow({ label, sub, busy, onPress }: { label: string; sub: string; busy: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.startRow} onPress={onPress} disabled={busy} activeOpacity={0.7}>
      <View style={styles.startAvatar}><Text style={styles.startAvatarText}>{getInitials(label)}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{label}</Text>
        <Text style={styles.kind}>{sub}</Text>
      </View>
      {busy ? <ActivityIndicator size="small" color={Colors.primary} /> : <View style={styles.startBtn}><Text style={styles.startBtnText}>Message</Text></View>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  pageHeader: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  pageTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 1 },
  searchRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, minHeight: 48 },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: 0 },
  clear: { fontSize: 14, color: Colors.textMuted, paddingLeft: Spacing.sm },
  section: { marginBottom: Spacing.sm },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, minHeight: 72 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  nameUnread: { fontWeight: FontWeight.bold },
  time: { fontSize: FontSize.xs, color: Colors.textMuted },
  kind: { fontSize: FontSize.xs, color: Colors.textMuted, marginVertical: 1 },
  preview: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  previewUnread: { color: Colors.textPrimary, fontWeight: FontWeight.medium },
  badge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: Spacing.sm },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold },
  startRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, minHeight: 64 },
  startAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  startAvatarText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  startBtn: { backgroundColor: '#eff6ff', borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10 },
  startBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
})

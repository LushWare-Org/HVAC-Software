/**
 * Telegram in the app: "Connect Telegram" opens Telegram with a one-time link;
 * back in the app it notices the link and shows it, with a way to disconnect.
 */
import React, { useEffect, useRef } from 'react'
import { ActivityIndicator, Alert, Animated, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Colors } from '@/constants/theme'

const TELEGRAM = '#229ED9'
const key = ['telegram', 'me']

interface MyTelegram { available: boolean; bot?: { username: string; name: string }; linked?: boolean; telegramName?: string | null }

export function TelegramCard() {
  const me = useQuery<MyTelegram>({ queryKey: key, queryFn: async () => (await api.get('/comms/telegram/me')).data, staleTime: 5 * 60_000, retry: false })
  const link = useMutation({ mutationFn: async () => (await api.post('/comms/telegram/me/link')).data as { url: string } })
  const unlink = useMutation({
    mutationFn: async () => (await api.delete('/comms/telegram/me/link')).data,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: key }) },
  })
  const pop = useRef(new Animated.Value(1)).current
  const wasLinked = useRef(me.data?.linked)

  // Coming back from Telegram: check whether they pressed Start.
  useEffect(() => {
    const refetch = me.refetch
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void refetch() })
    return () => sub.remove()
  }, [me.refetch])
  useEffect(() => {
    if (me.data?.linked && wasLinked.current === false) {
      pop.setValue(0.6)
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start()
    }
    wasLinked.current = me.data?.linked
  }, [me.data?.linked, pop])

  const d = me.data
  if (!d?.available) return null

  const connect = () => link.mutate(undefined, {
    onSuccess: async ({ url }) => {
      try { await Linking.openURL(url) } catch { Alert.alert('Telegram', 'Install Telegram first, then try again.') }
    },
    onError: () => Alert.alert('Telegram', "The link couldn't be made. Try again."),
  })
  const disconnect = () => Alert.alert('Stop Telegram messages?', 'You keep everything here in the app.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Disconnect', style: 'destructive', onPress: () => unlink.mutate() },
  ])

  if (d.linked) {
    return (
      <Animated.View style={[styles.card, styles.linked, { transform: [{ scale: pop }] }]}>
        <View style={styles.mark}><Feather name="send" size={14} color="#fff" style={styles.plane} /></View>
        <Text style={styles.linkedText} numberOfLines={2}>Replies also arrive in your Telegram{d.telegramName ? ` (${d.telegramName})` : ''}.</Text>
        <Pressable onPress={disconnect} hitSlop={8} accessibilityRole="button" accessibilityLabel="Disconnect Telegram">
          <Text style={styles.ghost}>{unlink.isPending ? '…' : 'Disconnect'}</Text>
        </Pressable>
      </Animated.View>
    )
  }
  return (
    <View style={styles.card}>
      <View style={[styles.mark, styles.markBig]}><Feather name="send" size={18} color="#fff" style={styles.plane} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Prefer Telegram?</Text>
        <Text style={styles.sub}>Get office messages on Telegram, and reply from there.</Text>
      </View>
      <Pressable onPress={connect} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} accessibilityRole="button" accessibilityLabel="Connect Telegram">
        {link.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Connect</Text>}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 8, marginBottom: 4, padding: 12, borderRadius: 14, backgroundColor: '#E8F5FC', borderWidth: 1, borderColor: '#B9E1F4' },
  linked: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: Colors.border, paddingVertical: 10 },
  mark: { width: 26, height: 26, borderRadius: 13, backgroundColor: TELEGRAM, alignItems: 'center', justifyContent: 'center' },
  markBig: { width: 36, height: 36, borderRadius: 18 },
  plane: { transform: [{ rotate: '-20deg' }], marginLeft: -2 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 12.5, color: Colors.textMuted, marginTop: 2, lineHeight: 17 },
  linkedText: { flex: 1, fontSize: 12.5, color: Colors.textMuted },
  btn: { minHeight: 44, minWidth: 84, paddingHorizontal: 14, borderRadius: 10, backgroundColor: TELEGRAM, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ghost: { fontSize: 12.5, fontWeight: '600', color: Colors.textMuted, paddingVertical: 8 },
})

import React, { useEffect, useRef, useState } from 'react'
import {
  KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing, FadeIn, FadeInDown, ZoomIn, interpolate, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue,
  withRepeat, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, FontSize, FontWeight } from '@/constants/theme'
import { getNavigationUrl } from '@/utils/jobHelpers'
import KelvinFace from './KelvinFace'
import { useKelvin } from './KelvinProvider'
import { useKelvinChat, type KelvinCard, type Turn } from './useKelvinChat'
import { K, MOOD_LINE, type Mood } from './tokens'
import { buzz, hush, say, useListening, voiceAvailable } from './voice'

const SPRING = { damping: 22, stiffness: 220, mass: 0.9 }

function greeting(name?: string) {
  const h = new Date().getHours()
  const part = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
  const first = (name ?? '').trim().split(/\s+/)[0]
  return `${part}${first ? `, ${first}` : ''}.`
}

/** Kelvin's sheet: slides up over the app; talk or type; changes come as cards to confirm. */
export default function KelvinSheet() {
  const k = useKelvin()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const reduce = useReducedMotion()
  const [input, setInput] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [pleased, setPleased] = useState(false)
  const [visible, setVisible] = useState(false)
  const scroll = useRef<ScrollView>(null)
  const job = k?.screenJob ?? null

  const y = useSharedValue(height)
  const backdrop = useSharedValue(0)

  const chat = useKelvinChat({
    onReply: (text, spoken) => {
      if (!(spoken || k?.readAloud)) return
      say(text, { start: () => setSpeaking(true), done: () => setSpeaking(false) })
    },
    onConfirmed: ({ ok, navigateTo }) => {
      buzz(ok ? 'success' : 'error')
      if (ok) { setPleased(true); setTimeout(() => setPleased(false), 2400) }
      if (ok && navigateTo) {
        const url = getNavigationUrl(navigateTo)
        if (url) setTimeout(() => Linking.openURL(url).catch(() => {}), 900)
      }
    },
  })
  const listen = useListening((text) => { void chat.send(text, job, true) })

  // Open and close with a spring; the Modal stays mounted until the slide-out ends.
  useEffect(() => {
    if (!k) return
    if (k.isOpen) {
      setVisible(true)
      y.value = reduce ? 0 : withSpring(0, SPRING)
      backdrop.value = withTiming(1, { duration: 220 })
      const r = k.takeRequest()
      if (r?.ask) void chat.send(r.ask, job, false)
      else if (r?.listen && voiceAvailable) void listen.start()
    } else {
      hush()
      listen.cancel()
      backdrop.value = withTiming(0, { duration: 180 })
      y.value = withTiming(height, { duration: reduce ? 0 : 240, easing: Easing.in(Easing.cubic) }, (done) => { if (done) runOnJS(setVisible)(false) })
    }
  }, [k?.isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60) }, [chat.turns.length, chat.partial])

  const close = () => k?.close()
  const drag = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => { y.value = Math.max(0, e.translationY) })
    .onEnd((e) => {
      if (e.translationY > 140 || e.velocityY > 900) runOnJS(close)()
      else y.value = withSpring(0, SPRING)
    })

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value * 0.45 }))

  if (!k?.enabled || !visible) return null

  const mood: Mood = listen.listening ? 'listening' : chat.streaming ? 'thinking' : speaking ? 'speaking' : pleased ? 'pleased' : 'idle'
  const shown = chat.turns.filter((t) => !t.hidden)
  const send = () => { if (input.trim()) { hush(); void chat.send(input, job, false); setInput('') } }
  const quick = [
    { icon: 'time-outline' as const, label: "What's next?", ask: "What's next on my day?" },
    { icon: 'document-text-outline' as const, label: job ? `Brief me on ${job.jobNumber}` : 'Brief me', ask: job ? `Brief me on ${job.jobNumber}` : 'Brief me on my next visit' },
    { icon: 'navigate-outline' as const, label: "I'm on my way", ask: job ? `I'm on my way to ${job.jobNumber}` : "I'm on my way to my next visit" },
    { icon: 'checkmark-done-outline' as const, label: 'Finish this job', ask: job ? `Help me finish ${job.jobNumber}` : 'Help me finish the job I am on' },
  ]

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close Kelvin" />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { marginTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 12) }, sheetStyle]}>
          <GestureDetector gesture={drag}>
            <View>
              <View style={styles.grabber} />
              <View style={styles.head}>
                <KelvinFace size={48} mood={mood} level={listen.level} />
                <View style={styles.headText}>
                  <Text style={styles.name}>Kelvin</Text>
                  <Text style={styles.moodLine}>{chat.status || MOOD_LINE[mood]}</Text>
                </View>
                <Pressable
                  onPress={() => { buzz('tap'); if (k.readAloud) hush(); k.setReadAloud(!k.readAloud) }}
                  style={styles.iconBtn} accessibilityRole="switch" accessibilityState={{ checked: k.readAloud }}
                  accessibilityLabel="Read replies aloud"
                >
                  <Ionicons name={k.readAloud ? 'volume-high' : 'volume-mute'} size={22} color={k.readAloud ? Colors.textPrimary : Colors.textMuted} />
                </Pressable>
                <Pressable onPress={close} style={styles.iconBtn} accessibilityLabel="Close Kelvin">
                  <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
                </Pressable>
              </View>
              {job && (
                <View style={styles.chip}>
                  <Ionicons name="briefcase-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.chipText} numberOfLines={1}>{job.jobNumber}{job.customerName ? ` · ${job.customerName}` : ''}</Text>
                </View>
              )}
            </View>
          </GestureDetector>

          <ScrollView ref={scroll} style={styles.fill} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
            {shown.length === 0 && !chat.streaming && (
              <Animated.View entering={reduce ? undefined : FadeIn.duration(260)}>
                <Text style={styles.hello}>{greeting(user?.name)}</Text>
                <Text style={styles.helloSub}>{voiceAvailable ? 'Hold the mic and talk, or tap one of these.' : 'Ask me anything, or tap one of these.'}</Text>
                <View style={styles.tiles}>
                  {quick.map((q, i) => (
                    <Animated.View key={q.label} entering={reduce ? undefined : FadeInDown.delay(60 * i).springify().damping(16)} style={styles.tileWrap}>
                      <Pressable onPress={() => { buzz('tap'); void chat.send(q.ask, job, false) }} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                        <Ionicons name={q.icon} size={22} color={K.k1900} />
                        <Text style={styles.tileText}>{q.label}</Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            )}
            {shown.map((t, i) => t.card
              ? <Card key={t.card.id} card={t.card} onConfirm={(c) => { buzz('start'); void chat.confirm(c) }} onCancel={(c) => { buzz('tap'); chat.cancel(c) }} />
              : <Bubble key={i} turn={t} reduce={reduce} />)}
            {chat.streaming && (chat.partial
              ? <Bubble turn={{ role: 'assistant', content: chat.partial }} reduce />
              : <Thinking />)}
          </ScrollView>

          {listen.listening ? (
            <Animated.View entering={reduce ? undefined : FadeInDown.springify().damping(18)} style={styles.listenPanel}>
              <Waveform level={listen.level} />
              <Text style={styles.heard} numberOfLines={3}>{listen.heard || 'Listening…'}</Text>
              <View style={styles.listenActions}>
                <Pressable onPress={() => listen.cancel()} style={styles.iconBtn} accessibilityLabel="Stop without sending">
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => listen.stop()} style={[styles.mic, styles.micLive]} accessibilityLabel="Send what I said">
                  <Ionicons name="arrow-up" size={26} color="#fff" />
                </Pressable>
                <View style={styles.iconBtn} />
              </View>
            </Animated.View>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask Kelvin…"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                multiline
                onSubmitEditing={send}
                accessibilityLabel="Message Kelvin"
              />
              {input.trim() || !voiceAvailable ? (
                <Pressable onPress={send} disabled={!input.trim() || chat.streaming} style={[styles.mic, styles.sendBtn, (!input.trim() || chat.streaming) && styles.disabled]} accessibilityLabel="Send">
                  <Ionicons name="arrow-up" size={24} color="#fff" />
                </Pressable>
              ) : (
                <MicButton onPress={() => void listen.start()} disabled={chat.streaming} />
              )}
            </View>
          )}
          {listen.error && !listen.listening && <Text style={styles.error}>{listen.error}</Text>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function MicButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const pulse = useSharedValue(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false)
  }, [reduce])
  const ring = useAnimatedStyle(() => ({ opacity: interpolate(pulse.value, [0, 1], [0.35, 0]), transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.6]) }] }))
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.micWrap, pressed && { transform: [{ scale: 0.94 }] }]} accessibilityLabel="Talk to Kelvin">
      <Animated.View style={[StyleSheet.absoluteFill, styles.micRing, ring]} />
      <View style={[styles.mic, disabled && styles.disabled]}>
        <Ionicons name="mic" size={26} color="#fff" />
      </View>
    </Pressable>
  )
}

/** Bars that move with the technician's voice. */
function Waveform({ level }: { level: SharedValue<number> }) {
  const t = useSharedValue(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    t.value = withRepeat(withTiming(Math.PI * 2, { duration: 1100, easing: Easing.linear }), -1, false)
  }, [reduce])
  return (
    <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: 11 }, (_, i) => <Bar key={i} i={i} t={t} level={level} />)}
    </View>
  )
}

function Bar({ i, t, level }: { i: number; t: SharedValue<number>; level: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const wave = 0.5 + 0.5 * Math.sin(t.value + i * 0.7)
    const centre = 1 - Math.abs(i - 5) / 7
    return { height: 6 + (8 + level.value * 46) * wave * centre }
  })
  const colors = [K.k10000, K.k6500, K.k5000, K.k3200, K.k1900]
  return <Animated.View style={[styles.bar, { backgroundColor: colors[Math.abs(5 - i) % colors.length] }, style]} />
}

function Thinking() {
  return (
    <Animated.View entering={FadeIn} style={[styles.bubble, styles.kelvinBubble, styles.thinking]}>
      {[0, 1, 2].map((i) => <Dot key={i} i={i} />)}
    </Animated.View>
  )
}

function Dot({ i }: { i: number }) {
  const v = useSharedValue(0)
  useEffect(() => { v.value = withRepeat(withTiming(1, { duration: 520 + i * 90 }), -1, true) }, [])
  const s = useAnimatedStyle(() => ({ opacity: 0.35 + v.value * 0.65, transform: [{ translateY: -v.value * 4 }] }))
  return <Animated.View style={[styles.dot, s]} />
}

function Bubble({ turn, reduce }: { turn: Turn; reduce: boolean }) {
  const mine = turn.role === 'user'
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.springify().damping(18)}
      style={[styles.bubble, mine ? styles.myBubble : styles.kelvinBubble]}
    >
      {mine && turn.spoken && <Ionicons name="mic" size={13} color="rgba(255,255,255,0.8)" style={{ marginBottom: 2 }} />}
      <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{turn.content.replace(/[*_`#]/g, '')}</Text>
    </Animated.View>
  )
}

function Card({ card, onConfirm, onCancel }: { card: KelvinCard; onConfirm: (c: KelvinCard) => void; onCancel: (c: KelvinCard) => void }) {
  const reduce = useReducedMotion()
  const sweep = useSharedValue(0)
  useEffect(() => {
    if (card.state === 'running' && !reduce) sweep.value = withRepeat(withTiming(1, { duration: 900 }), -1, false)
    else sweep.value = 0
  }, [card.state, reduce])
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(sweep.value, [0, 1], [-120, 320]) }] }))
  const done = card.state === 'done'
  const failed = card.state === 'failed'
  return (
    <Animated.View entering={reduce ? undefined : FadeInDown.springify().damping(15)} style={[styles.card, done && styles.cardDone, failed && styles.cardFailed]}>
      <View style={[styles.cardAccent, { backgroundColor: done ? K.pleased : failed ? Colors.danger : K.k1900 }]} />
      <Text style={styles.cardTitle}>{card.title}</Text>
      {card.lines.map((l, i) => <Text key={i} style={styles.cardLine}>{l}</Text>)}
      {card.state === 'pending' && (
        <>
          <View style={styles.cardNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.cardNoteText}>Nothing changes until you confirm</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable onPress={() => onConfirm(card)} style={({ pressed }) => [styles.confirm, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
            <Pressable onPress={() => onCancel(card)} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </>
      )}
      {card.state === 'running' && (
        <View style={styles.running}>
          <Animated.View style={[styles.sweep, sweepStyle]} />
          <Text style={styles.runningText}>Working on it…</Text>
        </View>
      )}
      {(done || failed) && (
        <View style={styles.result}>
          <Animated.View entering={reduce ? undefined : ZoomIn.springify().damping(9)}>
            <Ionicons name={done ? 'checkmark-circle' : 'alert-circle'} size={24} color={done ? K.pleased : Colors.danger} />
          </Animated.View>
          <Text style={[styles.resultText, { color: done ? K.pleased : Colors.danger }]}>{card.result}</Text>
        </View>
      )}
      {card.state === 'cancelled' && <Text style={styles.cardLine}>Cancelled. Nothing changed.</Text>}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: '#000' },
  sheet: { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: Colors.border, marginTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headText: { flex: 1 },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  moodLine: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  iconBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginLeft: 16, marginBottom: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, maxWidth: '90%' },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  thread: { padding: 16, gap: 10, flexGrow: 1 },
  hello: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 8 },
  helloSub: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileWrap: { width: '48%', flexGrow: 1 },
  tile: { minHeight: 88, padding: 14, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomWidth: 3, gap: 10, justifyContent: 'space-between' },
  tileText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 6 },
  kelvinBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: FontSize.md, lineHeight: 24, color: Colors.textPrimary },
  thinking: { flexDirection: 'row', gap: 6, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textMuted },
  card: { alignSelf: 'stretch', backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16, paddingLeft: 20, gap: 4, overflow: 'hidden' },
  cardDone: { borderColor: '#BBF7D0' },
  cardFailed: { borderColor: '#FECACA' },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  cardLine: { fontSize: FontSize.base, lineHeight: 22, color: Colors.textSecondary },
  cardNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  cardNoteText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  confirm: { flex: 1, minHeight: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  cancel: { minHeight: 56, paddingHorizontal: 22, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  cancelText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  running: { marginTop: 12, minHeight: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sweep: { position: 'absolute', top: 0, bottom: 0, width: 120, backgroundColor: 'rgba(255,255,255,0.55)' },
  runningText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primaryDark },
  result: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10 },
  resultText: { flex: 1, fontSize: FontSize.base, lineHeight: 22, fontWeight: FontWeight.medium },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 8 },
  input: { flex: 1, minHeight: 52, maxHeight: 130, borderRadius: 26, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, fontSize: FontSize.md, color: Colors.textPrimary },
  micWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  micRing: { borderRadius: 28, backgroundColor: K.k1900 },
  mic: { width: 56, height: 56, borderRadius: 28, backgroundColor: K.k1900, alignItems: 'center', justifyContent: 'center' },
  micLive: { width: 68, height: 68, borderRadius: 34 },
  sendBtn: { backgroundColor: Colors.primary },
  disabled: { opacity: 0.4 },
  listenPanel: { marginHorizontal: 12, marginTop: 6, padding: 16, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 12 },
  wave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 64 },
  bar: { width: 6, borderRadius: 3 },
  heard: { fontSize: FontSize.lg, lineHeight: 28, color: Colors.textPrimary, textAlign: 'center', fontWeight: FontWeight.medium },
  listenActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  error: { fontSize: FontSize.sm, color: Colors.danger, textAlign: 'center', marginTop: 6, paddingHorizontal: 16 },
})

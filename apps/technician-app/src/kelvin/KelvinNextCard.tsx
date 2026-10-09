import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { Colors, FontSize, FontWeight } from '@/constants/theme'
import type { Job } from '@/types/api'
import KelvinFace from './KelvinFace'
import { useKelvin } from './KelvinProvider'
import { K } from './tokens'
import { buzz } from './voice'

const clock = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '')

/**
 * Kelvin on the home screen: one line about right now, and the two things a
 * technician most likely wants next, a tap away.
 */
export default function KelvinNextCard({ active, next }: { active?: Job; next?: Job }) {
  const k = useKelvin()
  const reduce = useReducedMotion()
  if (!k?.enabled) return null

  const who = (j: Job) => j.customerName ?? j.title
  let line: string
  let actions: Array<{ label: string; ask: string; primary?: boolean }>
  if (active && (active.status === 'ON_SITE' || active.status === 'IN_PROGRESS')) {
    line = `You're with ${who(active)}. When you're done, just tell me what you used.`
    actions = [{ label: 'Finish up', ask: `Help me finish ${active.jobNumber}`, primary: true }, { label: 'Brief me', ask: `Brief me on ${active.jobNumber}` }]
  } else if (active) {
    line = `On the way to ${who(active)}. Want the quick brief before you get there?`
    actions = [{ label: 'Brief me', ask: `Brief me on ${active.jobNumber}`, primary: true }, { label: "I've arrived", ask: `I've arrived at ${active.jobNumber}` }]
  } else if (next) {
    line = `Next up at ${clock(next.scheduledStart)}: ${who(next)}, ${next.title}.`
    actions = [{ label: "I'm on my way", ask: `I'm on my way to ${next.jobNumber}`, primary: true }, { label: 'Brief me', ask: `Brief me on ${next.jobNumber}` }]
  } else {
    line = 'Nothing else booked today. Nice work.'
    actions = [{ label: "What's tomorrow?", ask: 'What does tomorrow look like?', primary: true }]
  }

  return (
    <Animated.View entering={reduce ? undefined : FadeInDown.delay(150).springify().damping(16)} style={styles.card}>
      <View style={styles.scale} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {[K.k1900, K.k3200, K.k5000, K.k10000].map((c) => <View key={c} style={[styles.scaleBit, { backgroundColor: c }]} />)}
      </View>
      <View style={styles.row}>
        <Pressable onPress={() => { buzz('tap'); k.open() }} accessibilityLabel="Open Kelvin" hitSlop={8}>
          <KelvinFace size={48} mood={active ? 'speaking' : 'idle'} />
        </Pressable>
        <View style={styles.body}>
          <Text style={styles.by}>Kelvin</Text>
          <Text style={styles.line}>{line}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => { buzz('tap'); k.open({ ask: a.ask }) }}
            style={({ pressed }) => [styles.btn, a.primary && styles.btnPrimary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={[styles.btnText, a.primary && styles.btnTextPrimary]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  scale: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, flexDirection: 'row' },
  scaleBit: { flex: 1 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  body: { flex: 1 },
  by: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  line: { fontSize: FontSize.md, lineHeight: 23, color: Colors.textPrimary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  btnPrimary: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  btnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  btnTextPrimary: { color: '#fff' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
})

import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing, cancelAnimation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated'
import { K, type Mood } from './tokens'

/** Seconds per turn of his dial: slow when idle, fast while thinking. 0 = still. */
const SPIN: Record<Mood, number> = { idle: 14, listening: 5, thinking: 1.1, speaking: 3, pleased: 0, urgent: 1.6 }

/**
 * Kelvin: a thermostat dial with eyes. The dial turns with what he is doing,
 * the eyes blink, grow with the technician's voice while listening, bob while
 * he talks, and become happy arcs when something is done.
 */
export default function KelvinFace({ size = 48, mood = 'idle', level }: {
  size?: number
  mood?: Mood
  /** Microphone level, 0 to 1, while listening. */
  level?: SharedValue<number>
}) {
  const reduce = useReducedMotion()
  const spin = useSharedValue(0)
  const blink = useSharedValue(1)
  const look = useSharedValue(0)
  const bob = useSharedValue(0)
  const happy = useSharedValue(mood === 'pleased' ? 1 : 0)
  const fallback = useSharedValue(0)
  const voice = level ?? fallback

  useEffect(() => {
    cancelAnimation(spin)
    const secs = SPIN[mood]
    if (reduce || !secs) return
    spin.value = spin.value % 360
    spin.value = withRepeat(withTiming(spin.value + 360, { duration: secs * 1000, easing: Easing.linear }), -1, false)
  }, [mood, reduce])

  useEffect(() => {
    if (reduce) return
    blink.value = withRepeat(withSequence(withDelay(2600, withTiming(1, { duration: 1 })), withTiming(0.1, { duration: 80 }), withTiming(1, { duration: 110 })), -1, false)
    return () => cancelAnimation(blink)
  }, [reduce])

  useEffect(() => {
    cancelAnimation(look)
    cancelAnimation(bob)
    look.value = withTiming(0, { duration: 150 })
    bob.value = withTiming(0, { duration: 150 })
    if (reduce) return
    if (mood === 'thinking') look.value = withRepeat(withSequence(withTiming(-1, { duration: 450 }), withTiming(1, { duration: 450 })), -1, true)
    if (mood === 'speaking') bob.value = withRepeat(withSequence(withTiming(-1, { duration: 160 }), withTiming(0.4, { duration: 200 })), -1, true)
  }, [mood, reduce])

  useEffect(() => { happy.value = withSpring(mood === 'pleased' ? 1 : 0, { damping: 12 }) }, [mood])

  const ring = Math.max(3, Math.round(size * 0.1))
  const eyeW = Math.max(3, size * 0.1)
  const eyeH = Math.max(5, size * 0.18)

  const dial = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }))
  const halo = useAnimatedStyle(() => ({
    opacity: mood === 'listening' ? 0.25 + voice.value * 0.5 : 0,
    transform: [{ scale: 1 + (mood === 'listening' ? voice.value * 0.35 : 0) }],
  }))
  const eyes = useAnimatedStyle(() => ({
    transform: [{ translateX: look.value * size * 0.06 }, { translateY: bob.value * size * 0.03 }],
  }))
  const eye = useAnimatedStyle(() => {
    const grow = mood === 'listening' ? 1 + voice.value * 0.45 : 1
    return {
      height: interpolate(happy.value, [0, 1], [eyeH, eyeH * 0.45]),
      borderBottomLeftRadius: interpolate(happy.value, [0, 1], [eyeW, 1]),
      borderBottomRightRadius: interpolate(happy.value, [0, 1], [eyeW, 1]),
      transform: [{ scaleY: happy.value > 0.5 ? 1 : blink.value * grow }, { scaleX: grow }],
    }
  })

  const pleased = mood === 'pleased'
  const ringColors = pleased
    ? { borderTopColor: K.pleased, borderRightColor: K.pleased, borderBottomColor: K.pleased, borderLeftColor: K.pleased }
    : mood === 'idle'
      ? { borderTopColor: K.k6500, borderRightColor: K.k10000, borderBottomColor: K.k6500, borderLeftColor: K.k10000 }
      : { borderTopColor: K.k1900, borderRightColor: K.k3200, borderBottomColor: K.k10000, borderLeftColor: K.k5000 }

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel="Kelvin">
      <Animated.View style={[StyleSheet.absoluteFill, styles.round, { backgroundColor: K.k10000 }, halo]} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.round, { borderWidth: ring }, ringColors, dial]} />
      <View style={[styles.round, styles.disc, { top: ring, left: ring, right: ring, bottom: ring }]}>
        <Animated.View style={[styles.eyes, { gap: size * 0.12 }, eyes]}>
          <Animated.View style={[{ width: eyeW, borderRadius: eyeW, backgroundColor: K.eye }, eye]} />
          <Animated.View style={[{ width: eyeW, borderRadius: eyeW, backgroundColor: K.eye }, eye]} />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  round: { borderRadius: 9999 },
  disc: { position: 'absolute', backgroundColor: K.ink, alignItems: 'center', justifyContent: 'center' },
  eyes: { flexDirection: 'row', alignItems: 'center' },
})

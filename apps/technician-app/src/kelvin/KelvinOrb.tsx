import React, { useEffect } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import KelvinFace from './KelvinFace'
import { useKelvin } from './KelvinProvider'
import { buzz, voiceAvailable } from './voice'

const SIZE = 64
const EDGE = 12

/**
 * Kelvin's face, floating over every screen. Drag him anywhere; he springs to
 * the nearest edge. Tap to open; hold to start talking straight away.
 */
export default function KelvinOrb() {
  const k = useKelvin()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const reduce = useReducedMotion()
  const minY = insets.top + 72
  const maxY = height - insets.bottom - 96 - SIZE
  const x = useSharedValue(width - SIZE - EDGE)
  const y = useSharedValue(maxY)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)
  const scale = useSharedValue(reduce ? 1 : 0)
  const shown = useSharedValue(1)

  // A small hello when he first appears.
  useEffect(() => {
    if (reduce) return
    scale.value = withDelay(400, withSequence(withSpring(1.12, { damping: 8 }), withSpring(1, { damping: 12 })))
  }, [reduce])

  useEffect(() => { shown.value = withTiming(k?.isOpen ? 0 : 1, { duration: 160 }) }, [k?.isOpen])

  const open = (listen: boolean) => { buzz(listen ? 'start' : 'tap'); k?.open(listen ? { listen: true } : undefined) }

  const pan = Gesture.Pan()
    .minDistance(6)
    .onStart(() => { startX.value = x.value; startY.value = y.value; scale.value = withSpring(1.08) })
    .onUpdate((e) => { x.value = startX.value + e.translationX; y.value = startY.value + e.translationY })
    .onEnd((e) => {
      const toRight = x.value + SIZE / 2 + e.velocityX * 0.1 > width / 2
      x.value = withSpring(toRight ? width - SIZE - EDGE : EDGE, { velocity: e.velocityX, damping: 18 })
      y.value = withSpring(Math.min(maxY, Math.max(minY, y.value + e.velocityY * 0.08)), { velocity: e.velocityY, damping: 18 })
      scale.value = withSpring(1)
    })
  const tap = Gesture.Tap().onEnd(() => runOnJS(open)(false))
  const hold = Gesture.LongPress().minDuration(300).onStart(() => { scale.value = withSpring(1.15); runOnJS(open)(voiceAvailable) }).onFinalize(() => { scale.value = withSpring(1) })

  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value * (0.8 + shown.value * 0.2) }],
  }))

  if (!k?.enabled) return null
  return (
    <GestureDetector gesture={Gesture.Race(pan, Gesture.Exclusive(hold, tap))}>
      <Animated.View
        style={[styles.orb, style]}
        pointerEvents={k.isOpen ? 'none' : 'auto'}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Kelvin"
        accessibilityHint={voiceAvailable ? 'Tap to open, hold to talk' : 'Tap to open'}
        onAccessibilityTap={() => open(false)}
      >
        <KelvinFace size={52} />
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, borderRadius: SIZE / 2,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
})

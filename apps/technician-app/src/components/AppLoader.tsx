import React, { useEffect } from 'react'
import { View, Image, Text, StyleSheet } from 'react-native'
import Animated, {
  Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated'

const NAVY = '#0E1E2E'
const BLUE = '#2563EB'
const SKY = '#5BB4E8'
const logo = require('../../assets/logo.png')

/** One looping 0→1 value; each loader derives its motion from it. */
function useLoop(ms: number, delay = 0) {
  const v = useSharedValue(0)
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1, false))
    return () => cancelAnimation(v)
  }, [])
  return v
}

function Breeze() {
  const bob = useSharedValue(0)
  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })), -1)
    return () => cancelAnimation(bob)
  }, [])
  const mark = useAnimatedStyle(() => ({ transform: [{ translateY: -8 * bob.value }] }))
  return (
    <View style={s.center}>
      <Animated.Image source={logo} style={[s.logo, mark]} resizeMode="contain" />
      <View style={s.airRow}>
        {[0, 1, 2].map((i) => <AirLine key={i} delay={i * 350} width={120 - i * 24} />)}
      </View>
    </View>
  )
}

function AirLine({ delay, width }: { delay: number; width: number }) {
  const t = useLoop(1500, delay)
  const st = useAnimatedStyle(() => ({
    opacity: t.value < 0.5 ? t.value * 2 : (1 - t.value) * 2,
    transform: [{ translateX: -40 + 80 * t.value }],
  }))
  return <Animated.View style={[s.air, { width }, st]} />
}

/** The screen shown while the app opens. */
export function AppLoader() {
  return (
    <View style={s.root}>
      <Breeze />
      <Text style={s.word}>HVACtor<Text style={s.ai}>.ai</Text></Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  logo: { width: 150, height: 150 },
  airRow: { marginTop: 20, alignItems: 'center', gap: 8, height: 36 },
  air: { height: 4, borderRadius: 2, backgroundColor: SKY },
  word: { marginTop: 28, fontSize: 28, fontWeight: '700', color: NAVY, letterSpacing: 0.3 },
  ai: { color: BLUE },
})

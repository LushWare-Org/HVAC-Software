import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Text } from '@/components/Text'
import { Colors } from '@/constants/theme'

/** Plain, calm colours: one solid colour per person, never a gradient. */
const PALETTE = ['#0E7490', '#2563EB', '#047857', '#B45309', '#9D174D', '#1D4ED8']

function colourFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

/** A person's photo, or their initials on a plain colour. */
export function Avatar({ name, uri, size = 30 }: { name?: string | null; uri?: string | null; size?: number }) {
  const label = name?.trim() || '?'
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={label} />
  const initials = label.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: colourFor(label) }]}>
      <Text style={[styles.text, { fontSize: Math.round(size * 0.4) }]}>{label === '?' ? '?' : initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.white, fontWeight: '700' },
})

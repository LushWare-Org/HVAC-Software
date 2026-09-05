import React from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Colors, Radius, Shadow } from '@/constants/theme'

/**
 * The one card surface used everywhere — soft elevation instead of the flat
 * 1px borders screens used to hand-roll individually. `style` merges on top,
 * so a screen can still add padding/margin without redefining the shell.
 */
export function Card({
  children, style,
}: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
})

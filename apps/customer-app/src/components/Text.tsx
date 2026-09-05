import React from 'react'
import { StyleSheet, Text as RNText, type TextProps } from 'react-native'
import { Fonts } from '@/constants/theme'

/**
 * Drop-in replacement for RN's `Text` that applies Poppins automatically.
 *
 * Custom fonts require an exact family name per weight (there is no numeric
 * `fontWeight` axis the way there is for the system font), so every screen
 * would otherwise need to know the five Poppins family names in `theme.ts`.
 * Instead: flatten the incoming style, read whatever `fontWeight` it already
 * declares (screens keep writing normal `fontWeight: '700'` etc.), and swap
 * in the matching `fontFamily` — falling back to Regular when none is set.
 */
export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {}
  const weight = String(flat.fontWeight ?? '400') as keyof typeof Fonts
  const fontFamily = Fonts[weight] ?? Fonts['400']
  return <RNText {...props} style={[style, { fontFamily }]} />
}

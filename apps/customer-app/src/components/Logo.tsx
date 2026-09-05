import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Colors, Shadow } from '@/constants/theme'

const mark = require('../../assets/images/logo-mark.png')

/**
 * The HVACtor.ai mark. `chip` wraps it in a white rounded backdrop — needed
 * anywhere it sits on the brand-blue hero, since the logo's light-blue half
 * has almost no contrast directly against that background (same problem the
 * Android adaptive icon background hit — see app.json's white backgroundColor
 * fix). On a plain white/light surface, `chip={false}` renders the mark bare.
 */
export function Logo({ size = 40, chip = false }: { size?: number; chip?: boolean }) {
  if (!chip) {
    return <Image source={mark} style={{ width: size, height: size }} resizeMode="contain" />
  }
  const chipSize = size * 1.6
  return (
    <View style={[styles.chip, { width: chipSize, height: chipSize, borderRadius: chipSize / 4 }]}>
      <Image source={mark} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
})

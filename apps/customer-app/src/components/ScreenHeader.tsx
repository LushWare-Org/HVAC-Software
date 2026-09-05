import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Text } from '@/components/Text'
import { Colors, FontSize, Spacing } from '@/constants/theme'

/**
 * The back-arrow + centered title bar used by every pushed (non-tab) screen.
 * Was hand-duplicated per screen with a text "‹ Back" — one real back-chevron
 * icon reads as native, and centering the title properly (not just visually
 * close) took a real spacer, not eyeballed padding.
 */
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.back}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Feather name="chevron-left" size={26} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.side}>{right}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  back: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  side: { width: 44, alignItems: 'flex-end' },
})

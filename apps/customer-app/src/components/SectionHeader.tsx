import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text } from '@/components/Text'
import { Colors, FontSize, Spacing } from '@/constants/theme'

/** Consistent section title + optional "See all" link, used across every list screen. */
export function SectionHeader({
  title, actionLabel, onAction,
}: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  action: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
})

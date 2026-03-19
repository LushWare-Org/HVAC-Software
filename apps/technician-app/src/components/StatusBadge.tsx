import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { StatusColors } from '@/constants/theme'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = StatusColors[status] ?? StatusColors.PENDING
  const label = status.replace(/_/g, ' ')

  return (
    <View style={[
      styles.badge,
      { backgroundColor: colors.bg },
      size === 'sm' && styles.badgeSm,
    ]}>
      <Text style={[
        styles.text,
        { color: colors.text },
        size === 'sm' && styles.textSm,
      ]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textSm: {
    fontSize: 10,
  },
})

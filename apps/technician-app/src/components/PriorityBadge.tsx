import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { PriorityColors } from '@/constants/theme'
import type { JobPriority } from '@/types/api'

interface PriorityBadgeProps {
  priority: JobPriority
}

const ICONS: Record<string, string> = {
  LOW: '↓',
  NORMAL: '●',
  HIGH: '▲',
  EMERGENCY: '⚡',
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colors = PriorityColors[priority] ?? PriorityColors.NORMAL

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {ICONS[priority] ?? '●'} {priority}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
})

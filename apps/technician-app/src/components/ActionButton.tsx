import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'

interface ActionButtonProps {
  label: string
  onPress: () => void
  color?: string
  textColor?: string
  icon?: string
  loading?: boolean
  disabled?: boolean
  variant?: 'filled' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function ActionButton({
  label,
  onPress,
  color = Colors.primary,
  textColor,
  icon,
  loading = false,
  disabled = false,
  variant = 'filled',
  size = 'md',
  fullWidth = false,
}: ActionButtonProps) {
  const isDisabled = disabled || loading
  const finalTextColor = textColor ?? (variant === 'filled' ? Colors.white : color)

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'filled' && { backgroundColor: color },
        variant === 'outline' && { borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        size === 'sm' && styles.sm,
        size === 'lg' && styles.lg,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={finalTextColor} />
      ) : (
        <>
          {icon && <Text style={[styles.icon, { color: finalTextColor }]}>{icon}</Text>}
          <Text style={[
            styles.text,
            { color: finalTextColor },
            size === 'sm' && styles.textSm,
            size === 'lg' && styles.textLg,
          ]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  textSm: {
    fontSize: FontSize.sm,
  },
  textLg: {
    fontSize: FontSize.md,
  },
})

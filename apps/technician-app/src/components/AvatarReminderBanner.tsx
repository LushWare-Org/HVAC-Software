/**
 * AvatarReminderBanner — nudges technicians without a profile photo.
 * Customers see the photo in "your technician is on the way" emails, so we
 * remind on every app launch; dismissing hides it for the session only.
 */
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useUserProfile } from '@/hooks/useProfile'

// Module-level: survives navigation, resets on app relaunch.
let dismissedThisSession = false

export function AvatarReminderBanner() {
  const router = useRouter()
  const { data: me } = useUserProfile()
  const [, force] = useState(0)

  if (!me || me.avatarUrl || dismissedThisSession) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📸</Text>
      <TouchableOpacity style={styles.textWrap} onPress={() => router.push('/(tabs)/profile')}>
        <Text style={styles.title}>Add your photo</Text>
        <Text style={styles.subtitle}>
          Customers see who's coming when you're en route — add a photo from your profile.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => { dismissedThisSession = true; force(n => n + 1) }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: BorderRadius.md,
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#9A3412' },
  subtitle: { fontSize: FontSize.sm, color: '#B45309', marginTop: 2 },
  dismiss: { fontSize: FontSize.lg, color: '#B45309', paddingHorizontal: Spacing.xs },
})

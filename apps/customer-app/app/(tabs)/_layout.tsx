import React from 'react'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { Colors } from '@/constants/theme'

/**
 * Emoji tab icons keep M2 dependency-free; M3 swaps in a proper icon set when
 * the remaining tabs (Jobs, Quotes, Invoices, Messages) arrive.
 */
function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Icon glyph="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon glyph="👤" color={color} /> }}
      />
    </Tabs>
  )
}

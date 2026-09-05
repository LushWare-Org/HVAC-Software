import React from 'react'
import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useUnreadThreadsCount, useUnreadNotificationsCount } from '@/hooks/useMyMessages'
import { Colors } from '@/constants/theme'

export default function TabsLayout() {
  const unreadThreads = useUnreadThreadsCount()
  const unreadNotifications = useUnreadNotificationsCount()
  const messagesBadge = unreadThreads + unreadNotifications

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
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Services', tabBarIcon: ({ color, size }) => <Feather name="tool" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="billing"
        options={{ title: 'Billing', tabBarIcon: ({ color, size }) => <Feather name="file-text" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" size={size} color={color} />,
          tabBarBadge: messagesBadge > 0 ? messagesBadge : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tabs>
  )
}

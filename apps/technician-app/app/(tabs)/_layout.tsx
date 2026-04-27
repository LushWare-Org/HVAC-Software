import React from 'react'
import { Tabs } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight } from '@/constants/theme'
import { useUnreadCount } from '@/hooks/useNotifications'
import { useUnreadThreadsCount } from '@/hooks/useMessages'

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icon}
    </Text>
  )
}

function NotificationTabIcon({ focused }: { focused: boolean }) {
  const unreadCount = useUnreadCount()

  return (
    <View>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  )
}

function MessagesTabIcon({ focused }: { focused: boolean }) {
  const unreadCount = useUnreadThreadsCount()

  return (
    <View>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>💬</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Van Stock',
          tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => <MessagesTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <NotificationTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
})

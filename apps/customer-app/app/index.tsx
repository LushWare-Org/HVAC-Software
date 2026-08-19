import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors } from '@/constants/theme'

export default function Index() {
  const { isAuthenticated, isInitializing } = useAuth()

  // isInitializing covers the secure-store read AND the biometric prompt, so we
  // must not redirect to /login while the user is still unlocking.
  if (isInitializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
})

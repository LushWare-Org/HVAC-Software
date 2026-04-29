import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { Colors } from '@/constants/theme'

/**
 * Root index — redirect based on auth state
 */
export default function Index() {
  const { isAuthenticated, isInitializing, mustResetPassword } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitializing) return

    if (isAuthenticated) {
      if (mustResetPassword) {
        router.replace('/force-reset-password')
      } else {
        router.replace('/(tabs)')
      }
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, isInitializing, mustResetPassword])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBackground,
  },
})

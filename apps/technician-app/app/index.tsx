import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@/contexts/AuthContext'
import { useTechnicianProfile } from '@/hooks/useProfile'
import { Colors } from '@/constants/theme'

/**
 * Root index — redirect based on auth state.
 * Onboarding order: password reset → base location → tabs.
 */
export default function Index() {
  const { isAuthenticated, isInitializing, mustResetPassword } = useAuth()
  const techProfile = useTechnicianProfile()
  const router = useRouter()

  useEffect(() => {
    if (isInitializing) return

    if (isAuthenticated) {
      if (mustResetPassword) {
        router.replace('/force-reset-password')
        return
      }
      // Wait for the scheduling profile (cached across launches) so a tech who
      // quit mid-onboarding is sent back to the location step. Errors/404 fail
      // open to the tabs — this must never lock a technician out.
      if (techProfile.isLoading) return
      if (techProfile.data && !techProfile.data.currentLocation) {
        router.replace('/setup-location')
      } else {
        router.replace('/(tabs)')
      }
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, isInitializing, mustResetPassword, techProfile.isLoading, techProfile.data])

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

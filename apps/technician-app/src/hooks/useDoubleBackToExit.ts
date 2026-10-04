import { useCallback, useRef } from 'react'
import { BackHandler, Platform, ToastAndroid } from 'react-native'
import { useFocusEffect } from 'expo-router'

const EXIT_WINDOW_MS = 2000

/**
 * On the home screen, the Android back button never navigates. One press only
 * warns; a second press within two seconds leaves the app. Leaving keeps the
 * session, so reopening lands back on the dashboard, never on sign-in.
 */
export function useDoubleBackToExit() {
  const lastPress = useRef(0)

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now()
        if (now - lastPress.current < EXIT_WINDOW_MS) {
          BackHandler.exitApp()
          return true
        }
        lastPress.current = now
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT)
        return true
      })
      return () => sub.remove()
    }, []),
  )
}

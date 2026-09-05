import React from 'react'
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text } from '@/components/Text'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

interface Props {
  children: React.ReactNode
}

interface State {
  error: Error | null
}

/**
 * Root-level crash guard. An uncaught render error anywhere in the tree would
 * otherwise leave the customer on a blank or native red-box screen with no
 * way back in — this swaps in a plain-language recovery screen instead.
 *
 * Deliberately local-only: no crash-reporting SDK is wired into this app yet,
 * so the error is logged to the console (visible in `expo start` / EAS build
 * logs) rather than shipped anywhere.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.content}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.body}>
              We hit a snag showing this screen. Your data is safe. Try again, and if it
              keeps happening, restart the app.
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.reset}>
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  icon: { fontSize: 40, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  body: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  buttonText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.base },
})

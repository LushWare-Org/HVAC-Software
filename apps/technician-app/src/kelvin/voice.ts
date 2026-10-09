/**
 * Voice for Kelvin: speech to text, reading replies aloud, and haptics.
 *
 * Each native module is loaded lazily inside try/catch. A build without them
 * (an older app reached by an over-the-air update, or Expo Go) gets Kelvin
 * without voice instead of a crash: `voiceAvailable` is false and the mic hides.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSharedValue, withTiming } from 'react-native-reanimated'

type Recognition = {
  start(o: Record<string, unknown>): void
  stop(): void
  abort(): void
  requestPermissionsAsync(): Promise<{ granted: boolean }>
  isRecognitionAvailable(): boolean
  addListener(event: string, cb: (e: any) => void): { remove(): void }
}

// Literal requires: the bundler only includes modules it can see by name.
const recognition: Recognition | null = (() => { try { return require('expo-speech-recognition').ExpoSpeechRecognitionModule } catch { return null } })()
const speech: { speak(t: string, o?: any): void; stop(): Promise<void> } | null = (() => { try { return require('expo-speech') } catch { return null } })()
const haptics: any = (() => { try { return require('expo-haptics') } catch { return null } })()

export const voiceAvailable = (() => {
  try { return !!recognition?.isRecognitionAvailable() } catch { return false }
})()

/** A small physical tick: light for a tap, success or error for an outcome. */
export function buzz(kind: 'tap' | 'start' | 'success' | 'error') {
  if (!haptics) return
  try {
    if (kind === 'tap') void haptics.selectionAsync()
    else if (kind === 'start') void haptics.impactAsync(haptics.ImpactFeedbackStyle.Medium)
    else void haptics.notificationAsync(kind === 'success' ? haptics.NotificationFeedbackType.Success : haptics.NotificationFeedbackType.Error)
  } catch { /* no haptics on this device */ }
}

/** Reads a reply aloud, without markdown symbols. */
export function say(text: string, on: { start?: () => void; done?: () => void } = {}) {
  if (!speech) { on.done?.(); return }
  const plain = text.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim()
  if (!plain) { on.done?.(); return }
  try {
    void speech.stop()
    speech.speak(plain, { rate: 1.02, onStart: on.start, onDone: on.done, onStopped: on.done, onError: on.done })
  } catch { on.done?.() }
}

export function hush() {
  try { void speech?.stop() } catch { /* nothing playing */ }
}

/**
 * Listening: live words while the technician talks, and the mic level (0 to 1)
 * for Kelvin's eyes and the waveform. onFinal gets the whole sentence.
 */
export function useListening(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState('')
  const [error, setError] = useState<string | null>(null)
  const level = useSharedValue(0)
  const finalRef = useRef(onFinal)
  finalRef.current = onFinal
  const textRef = useRef('')
  const sentRef = useRef(false)

  useEffect(() => {
    if (!recognition) return
    const subs = [
      recognition.addListener('start', () => { setListening(true); setError(null) }),
      recognition.addListener('result', (e: any) => {
        const t = String(e?.results?.[0]?.transcript ?? '')
        textRef.current = t
        setHeard(t)
        if (e?.isFinal && t.trim() && !sentRef.current) { sentRef.current = true; finalRef.current(t.trim()) }
      }),
      recognition.addListener('volumechange', (e: any) => {
        // -2 (silence) to 10 (loud), to 0..1.
        level.value = withTiming(Math.max(0, Math.min(1, (Number(e?.value) + 2) / 12)), { duration: 90 })
      }),
      recognition.addListener('error', (e: any) => {
        if (e?.error !== 'no-speech' && e?.error !== 'aborted') setError("I didn't catch that. Try again, or type it.")
      }),
      recognition.addListener('end', () => {
        setListening(false)
        level.value = withTiming(0, { duration: 200 })
        // Some phones end without a final result: send what was heard.
        if (!sentRef.current && textRef.current.trim()) { sentRef.current = true; finalRef.current(textRef.current.trim()) }
      }),
    ]
    return () => subs.forEach((s) => s.remove())
  }, [])

  const start = useCallback(async () => {
    if (!recognition) return false
    hush()
    const perm = await recognition.requestPermissionsAsync().catch(() => ({ granted: false }))
    if (!perm.granted) { setError('Allow the microphone in Settings to talk to Kelvin.'); return false }
    textRef.current = ''
    sentRef.current = false
    setHeard('')
    buzz('start')
    try {
      recognition.start({ lang: 'en-US', interimResults: true, continuous: false, addsPunctuation: true, volumeChangeEventOptions: { enabled: true, intervalMillis: 90 } })
      return true
    } catch {
      setError("The microphone isn't available right now.")
      return false
    }
  }, [])

  const stop = useCallback(() => { try { recognition?.stop() } catch { /* already stopped */ } }, [])
  const cancel = useCallback(() => { sentRef.current = true; try { recognition?.abort() } catch { /* already stopped */ } }, [])

  return { listening, heard, error, level, start, stop, cancel }
}

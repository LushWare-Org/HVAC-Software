/**
 * Kelvin's own colours: the colour-temperature scale, from candle (1900 K) to
 * sky (10000 K). Used only for him, so he reads as one character everywhere.
 */
export const K = {
  k1900: '#FF7A1A',
  k3200: '#FFB15C',
  k5000: '#FFE2B8',
  k6500: '#EEF2FF',
  k10000: '#8FB0FF',
  ink: '#0F172A',
  eye: '#FFFFFF',
  pleased: '#16A34A',
} as const

export type Mood = 'idle' | 'listening' | 'thinking' | 'speaking' | 'pleased' | 'urgent'

/** One spoken-style status line per mood, under his name. */
export const MOOD_LINE: Record<Mood, string> = {
  idle: 'Here to help',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Talking…',
  pleased: 'Done',
  urgent: 'Needs you',
}

// ============================================================
// HVACtor.ai Customer App — Design Tokens
// Mirrors the customer portal's CSS variables (src/index.css) so
// web and mobile are visibly the same product.
// ============================================================

export const Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',

  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#0891B2',
  infoLight: '#CFFAFE',
  // Reserved for technician-thread accents and the Messages quick action —
  // keeps "a human is on the other end" visually distinct from money/status.
  violet: '#7C3AED',
  violetLight: '#EDE9FE',

  white: '#FFFFFF',
  // A soft blue tint (matches the portal's --bg-active) instead of flat gray —
  // white cards need a canvas with some color in it to read as cards at all.
  background: '#EEF2FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  border: '#E5E7EB',
  // Rounded hero bands (Home, screen headers) sit on solid brand blue.
  heroBg: '#2563EB',

  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  disabled: '#D1D5DB',
} as const

/** One consistent elevation for cards — replaces ad-hoc flat 1px borders. */
export const Shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
} as const

/** Small tracked uppercase label — used above section titles for structure. */
export const Eyebrow = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
} as const

/**
 * Poppins, matching the portal's --font. Custom fonts need an exact family
 * name per weight — numeric `fontWeight` is ignored (and can synthetically
 * re-bold on iOS) once `fontFamily` is set, so `components/Text.tsx` reads
 * whatever `fontWeight` a style already declares and maps it through here
 * instead of every screen needing to know the family names below exist.
 */
export const Fonts = {
  '400': 'Poppins_400Regular',
  normal: 'Poppins_400Regular',
  '500': 'Poppins_500Medium',
  '600': 'Poppins_600SemiBold',
  '700': 'Poppins_700Bold',
  bold: 'Poppins_700Bold',
  '800': 'Poppins_800ExtraBold',
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 24,
  pill: 999,
} as const

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
} as const

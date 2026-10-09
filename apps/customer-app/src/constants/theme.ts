// ============================================================
// HVACtor.ai Customer App — Design Tokens
// Mirrors the customer portal's CSS variables (src/index.css) so
// web and mobile are visibly the same product.
// ============================================================

export const Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',

  // Same semantic colours as the portal's light theme.
  success: '#047857',
  successLight: '#E3F6EC',
  warning: '#B45309',
  warningLight: '#FEF1D6',
  danger: '#D12C2C',
  dangerLight: '#FDE8E8',
  info: '#0E7490',
  infoLight: '#DDF4F9',
  // Reserved for technician-thread accents and the Messages quick action —
  // keeps "a human is on the other end" visually distinct from money/status.
  violet: '#6D28D9',
  violetLight: '#EFEAFD',

  white: '#FFFFFF',
  // A white page like the portal's light theme: cards keep their edge with a
  // hairline border and a soft shadow instead of a tinted canvas.
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7FA',
  border: '#E8EBF0',
  // Rounded hero bands (Home, screen headers) sit on solid brand blue.
  heroBg: '#2563EB',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  disabled: '#D1D5DB',
} as const

/** One consistent elevation for cards — replaces ad-hoc flat 1px borders. */
export const Shadow = {
  card: {
    borderWidth: 1,
    borderColor: '#E8EBF0',
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

/** A colour with some opacity, as rgba: the soft tint behind a status colour. */
export function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

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

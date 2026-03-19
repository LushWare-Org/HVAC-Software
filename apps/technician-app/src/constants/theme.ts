// ============================================================
// T&S Technician App — Design Tokens
// ============================================================

export const Colors = {
  // Brand
  primary: '#2563EB',       // Blue-600
  primaryDark: '#1D4ED8',   // Blue-700
  primaryLight: '#DBEAFE',  // Blue-100

  // Status colors
  success: '#16A34A',       // Green-600
  successLight: '#DCFCE7',  // Green-100
  warning: '#F59E0B',       // Amber-500
  warningLight: '#FEF3C7',  // Amber-100
  danger: '#DC2626',        // Red-600
  dangerLight: '#FEE2E2',   // Red-100
  info: '#0891B2',          // Cyan-600
  infoLight: '#CFFAFE',     // Cyan-100

  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',    // Slate-50
  surface: '#FFFFFF',
  border: '#E2E8F0',        // Slate-200
  borderLight: '#F1F5F9',   // Slate-100
  textPrimary: '#0F172A',   // Slate-900
  textSecondary: '#64748B',  // Slate-500
  textMuted: '#94A3B8',     // Slate-400
  textInverse: '#FFFFFF',
  disabled: '#CBD5E1',      // Slate-300

  // Dark mode
  darkBackground: '#0F172A', // Slate-900
  darkSurface: '#1E293B',   // Slate-800
  darkBorder: '#334155',    // Slate-700
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
} as const

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const

// Priority colors
export const PriorityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: '#F1F5F9', text: '#64748B' },
  NORMAL: { bg: '#DBEAFE', text: '#2563EB' },
  HIGH: { bg: '#FEF3C7', text: '#D97706' },
  EMERGENCY: { bg: '#FEE2E2', text: '#DC2626' },
}

// Job status colors
export const StatusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#F1F5F9', text: '#64748B' },
  SCHEDULED: { bg: '#DBEAFE', text: '#2563EB' },
  EN_ROUTE: { bg: '#FEF3C7', text: '#D97706' },
  ON_SITE: { bg: '#CFFAFE', text: '#0891B2' },
  IN_PROGRESS: { bg: '#CFFAFE', text: '#0891B2' },
  COMPLETED: { bg: '#DCFCE7', text: '#16A34A' },
  INVOICED: { bg: '#E0E7FF', text: '#4F46E5' },
  PAID: { bg: '#DCFCE7', text: '#15803D' },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626' },
  ON_HOLD: { bg: '#FEF3C7', text: '#92400E' },
  ASSIGNED: { bg: '#DBEAFE', text: '#2563EB' },
  SUGGESTED: { bg: '#F1F5F9', text: '#64748B' },
  APPROVED: { bg: '#DCFCE7', text: '#16A34A' },
  REJECTED: { bg: '#FEE2E2', text: '#DC2626' },
}

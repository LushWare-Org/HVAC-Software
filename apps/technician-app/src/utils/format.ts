import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

/**
 * Format a currency value
 */
export function formatCurrency(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num)
}

/**
 * Format date for display: "Today", "Tomorrow", "Mar 16", etc.
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

/**
 * Format time: "9:30 AM"
 */
export function formatTime(dateStr?: string): string {
  if (!dateStr) return '—'
  return format(parseISO(dateStr), 'h:mm a')
}

/**
 * Format date + time: "Mar 16, 9:30 AM"
 */
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = parseISO(dateStr)
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

/**
 * Relative time: "5 min ago", "2 hours ago"
 */
export function formatRelative(dateStr?: string): string {
  if (!dateStr) return '—'
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
}

/**
 * Format time window: "9:30 AM – 11:00 AM"
 */
export function formatTimeWindow(start?: string, end?: string): string {
  if (!start) return '—'
  const startStr = formatTime(start)
  if (!end) return startStr
  return `${startStr} – ${formatTime(end)}`
}

/**
 * Format distance in km
 */
export function formatDistance(km?: number): string {
  if (km === undefined || km === null) return '—'
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)} km`
}

/**
 * Format duration in minutes to human-readable
 */
export function formatDuration(mins?: number): string {
  if (!mins) return '—'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

/**
 * Format phone number for display
 */
export function formatPhone(phone?: string): string {
  if (!phone) return '—'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

/**
 * Get initials from a name
 */
export function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '…'
}

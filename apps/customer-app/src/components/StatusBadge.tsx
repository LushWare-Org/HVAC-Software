import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Text } from '@/components/Text'
import { Colors, FontSize, Radius, tint } from '@/constants/theme'
import { humanizeStatus } from '@/lib/format'

/**
 * The same status labels as the portal: a small ring or symbol that shows how far something has
 * got, inside a pill tinted with the status colour. Colour is never the only signal: there is
 * always the word, and the ring changes shape (dashed, ring, dot, check, cross, pause).
 */
type Glyph = 'dashed' | 'ring' | 'dot' | 'check' | 'cross' | 'pause' | 'clock'
interface Look { color: string; glyph: Glyph; label?: string }

const LOOK: Record<string, Look> = {
  PENDING: { color: Colors.warning, glyph: 'dashed' },
  SCHEDULED: { color: Colors.primary, glyph: 'ring' },
  EN_ROUTE: { color: Colors.info, glyph: 'dot' },
  ON_SITE: { color: Colors.info, glyph: 'dot' },
  IN_PROGRESS: { color: Colors.primary, glyph: 'dot' },
  COMPLETED: { color: Colors.success, glyph: 'check' },
  INVOICED: { color: Colors.violet, glyph: 'ring' },
  PAID: { color: Colors.success, glyph: 'check' },
  CANCELLED: { color: Colors.danger, glyph: 'cross' },
  ON_HOLD: { color: Colors.textMuted, glyph: 'pause' },
  // Quotes and invoices
  DRAFT: { color: Colors.textMuted, glyph: 'dashed' },
  SENT: { color: Colors.warning, glyph: 'ring', label: 'Waiting for you' },
  VIEWED: { color: Colors.primary, glyph: 'dot' },
  ACCEPTED: { color: Colors.success, glyph: 'check' },
  DECLINED: { color: Colors.danger, glyph: 'cross' },
  OVERDUE: { color: Colors.danger, glyph: 'clock' },
  PARTIALLY_PAID: { color: Colors.primary, glyph: 'dot', label: 'Part paid' },
  VOID: { color: Colors.textMuted, glyph: 'cross' },
  EXPIRED: { color: Colors.danger, glyph: 'clock' },
  CONVERTED: { color: Colors.success, glyph: 'check' },
  // Agreements, projects, issue reports
  ACTIVE: { color: Colors.success, glyph: 'dot' },
  PLANNING: { color: Colors.info, glyph: 'dashed' },
  PENDING_RENEWAL: { color: Colors.warning, glyph: 'clock' },
  RENEWED: { color: Colors.success, glyph: 'check' },
  OPEN: { color: Colors.danger, glyph: 'dashed' },
  ACKNOWLEDGED: { color: Colors.warning, glyph: 'ring' },
  RESOLVED: { color: Colors.success, glyph: 'check' },
}

function Symbol({ glyph, color }: { glyph: Glyph; color: string }) {
  if (glyph === 'check' || glyph === 'cross' || glyph === 'pause' || glyph === 'clock') {
    const name = glyph === 'check' ? 'check' : glyph === 'cross' ? 'x' : glyph === 'pause' ? 'pause' : 'clock'
    return (
      <View style={[styles.ring, { borderColor: color, backgroundColor: glyph === 'check' ? color : 'transparent' }]}>
        <Feather name={name} size={9} color={glyph === 'check' ? Colors.white : color} />
      </View>
    )
  }
  return (
    <View style={[styles.ring, { borderColor: color, borderStyle: glyph === 'dashed' ? 'dashed' : 'solid' }]}>
      {glyph === 'dot' ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
    </View>
  )
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = String(status ?? '').toUpperCase()
  const look = LOOK[key] ?? { color: Colors.textSecondary, glyph: 'ring' as Glyph }
  return (
    <View
      accessible
      accessibilityLabel={`Status: ${label ?? look.label ?? humanizeStatus(key)}`}
      style={[styles.badge, { backgroundColor: tint(look.color, 0.1), borderColor: tint(look.color, 0.4) }]}
    >
      <Symbol glyph={look.glyph} color={look.color} />
      <Text style={styles.text}>{label ?? look.label ?? humanizeStatus(key)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingLeft: 7,
    paddingRight: 10,
    paddingVertical: 3,
  },
  ring: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textPrimary },
})

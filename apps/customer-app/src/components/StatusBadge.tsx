import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/Text'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'
import { humanizeStatus } from '@/lib/format'

/** Mirrors the portal's badge vocabulary so both clients read the same. */
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: Colors.warningLight, fg: Colors.warning },
  SCHEDULED: { bg: Colors.primaryLight, fg: Colors.primaryDark },
  EN_ROUTE: { bg: Colors.infoLight, fg: Colors.info },
  ON_SITE: { bg: Colors.infoLight, fg: Colors.info },
  IN_PROGRESS: { bg: Colors.infoLight, fg: Colors.info },
  COMPLETED: { bg: Colors.successLight, fg: Colors.success },
  INVOICED: { bg: Colors.surfaceAlt, fg: Colors.textSecondary },
  PAID: { bg: Colors.successLight, fg: Colors.success },
  CANCELLED: { bg: Colors.dangerLight, fg: Colors.danger },
  ON_HOLD: { bg: Colors.warningLight, fg: Colors.warning },
  // Finance statuses reuse the same palette.
  SENT: { bg: Colors.primaryLight, fg: Colors.primaryDark },
  VIEWED: { bg: Colors.primaryLight, fg: Colors.primaryDark },
  ACCEPTED: { bg: Colors.successLight, fg: Colors.success },
  DECLINED: { bg: Colors.dangerLight, fg: Colors.danger },
  OVERDUE: { bg: Colors.dangerLight, fg: Colors.danger },
  PARTIALLY_PAID: { bg: Colors.warningLight, fg: Colors.warning },
  VOID: { bg: Colors.surfaceAlt, fg: Colors.textMuted },
  DRAFT: { bg: Colors.surfaceAlt, fg: Colors.textMuted },
  // Agreement + project statuses reuse the same palette.
  ACTIVE: { bg: Colors.successLight, fg: Colors.success },
  PLANNING: { bg: Colors.infoLight, fg: Colors.info },
  PENDING_RENEWAL: { bg: Colors.warningLight, fg: Colors.warning },
  RENEWED: { bg: Colors.successLight, fg: Colors.success },
  EXPIRED: { bg: Colors.dangerLight, fg: Colors.danger },
  // Issue report statuses.
  OPEN: { bg: Colors.dangerLight, fg: Colors.danger },
  ACKNOWLEDGED: { bg: Colors.warningLight, fg: Colors.warning },
  RESOLVED: { bg: Colors.successLight, fg: Colors.success },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: Colors.surfaceAlt, fg: Colors.textSecondary }
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{humanizeStatus(status)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: { fontSize: FontSize.xs, fontWeight: '700' },
})

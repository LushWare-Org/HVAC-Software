import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { formatTimeWindow, formatDate } from '@/utils/format'
import type { Job } from '@/types/api'

interface JobCardProps {
  job: Job
  showDate?: boolean
  assignment?: { distanceKm?: number }
}

export function JobCard({ job, showDate = false, assignment }: JobCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/job/${job.id}`)}
    >
      {/* Top row: job number + status */}
      <View style={styles.topRow}>
        <Text style={styles.jobNumber}>{job.jobNumber}</Text>
        <StatusBadge status={job.status} size="sm" />
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>{job.title}</Text>

      {/* Customer + address */}
      {job.customerName && (
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <Text style={styles.infoText} numberOfLines={1}>{job.customerName}</Text>
        </View>
      )}

      {job.serviceAddress && (
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText} numberOfLines={1}>{job.serviceAddress}</Text>
        </View>
      )}

      {/* Time + priority row */}
      <View style={styles.bottomRow}>
        <View style={styles.timeRow}>
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={styles.timeText}>
            {showDate && `${formatDate(job.scheduledStart)} · `}
            {formatTimeWindow(job.scheduledStart, job.scheduledEnd)}
          </Text>
        </View>

        <View style={styles.badges}>
          {assignment?.distanceKm !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {assignment.distanceKm < 1
                  ? `${Math.round(assignment.distanceKm * 1000)}m`
                  : `${assignment.distanceKm.toFixed(1)} km`}
              </Text>
            </View>
          )}
          <PriorityBadge priority={job.priority} />
        </View>
      </View>

      {/* Trade type chip */}
      {job.jobType && (
        <View style={styles.tradeChip}>
          <Text style={styles.tradeText}>
            {job.jobType.icon ?? '🔧'} {job.jobType.name}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobNumber: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    fontSize: 13,
    marginRight: 6,
    width: 20,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  timeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  tradeChip: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tradeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
})

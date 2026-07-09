import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useMyJobs } from '@/hooks/useJobs'
import { useMyAssignments } from '@/hooks/useSchedule'
import { useTechnicianProfile } from '@/hooks/useProfile'
import { useGPSTracking } from '@/hooks/useGPS'
import { uploadPendingAvatarIfAny } from '@/hooks/useAvatar'
import { AvatarReminderBanner } from '@/components/AvatarReminderBanner'
import { JobCard } from '@/components/JobCard'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ActionButton } from '@/components/ActionButton'
import { formatDate, getInitials } from '@/utils/format'
import { isActiveJob, sortByScheduledTime, getNavigationUrl } from '@/utils/jobHelpers'
import type { Job, DispatchAssignment } from '@/types/api'

export default function HomeScreen() {
  const { user } = useAuth()
  const router = useRouter()

  // Data
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useMyJobs({ limit: 50 })
  const { data: assignments, refetch: refetchAssignments } = useMyAssignments('ASSIGNED,EN_ROUTE,ON_SITE')
  const { data: techProfile } = useTechnicianProfile()

  // Filter today's jobs — only show truly today's work + in-progress jobs
  const todayStr = new Date().toISOString().slice(0, 10)
  const todaysJobs = useMemo(() => {
    if (!jobsData?.data) return []
    return sortByScheduledTime(
      jobsData.data.filter((j) => {
        // Currently in-progress always shows
        if (j.status === 'EN_ROUTE' || j.status === 'ON_SITE' || j.status === 'IN_PROGRESS') return true
        // Scheduled for today
        if (j.scheduledStart?.startsWith(todayStr)) return true
        // No schedule but still pending
        if (!j.scheduledStart && j.status === 'PENDING') return true
        return false
      }),
    )
  }, [jobsData, todayStr])

  // Assignment map for distance info
  const assignmentMap = useMemo(() => {
    const map: Record<string, DispatchAssignment> = {}
    if (assignments) {
      (Array.isArray(assignments) ? assignments : []).forEach((a) => {
        map[a.jobId] = a
      })
    }
    return map
  }, [assignments])

  // Active job (EN_ROUTE or ON_SITE)
  const activeJob = todaysJobs.find(
    (j) => j.status === 'EN_ROUTE' || j.status === 'ON_SITE' || j.status === 'IN_PROGRESS',
  )

  // Next upcoming job
  const nextJob = todaysJobs.find((j) => j.status === 'SCHEDULED')

  // Completed today count
  const completedToday = todaysJobs.filter((j) => j.status === 'COMPLETED').length

  // GPS tracking: active when there's an EN_ROUTE or ON_SITE job
  const hasActiveRoute = todaysJobs.some((j) => j.status === 'EN_ROUTE')
  const hasOnSite = todaysJobs.some((j) => j.status === 'ON_SITE')
  useGPSTracking(
    hasActiveRoute || hasOnSite,
    hasActiveRoute ? 'high' : 'balanced',
  )

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Photo picked at signup couldn't upload then (account pending approval) —
  // push it up now that we're authenticated.
  const pendingAvatarChecked = React.useRef(false)
  React.useEffect(() => {
    if (pendingAvatarChecked.current) return
    pendingAvatarChecked.current = true
    uploadPendingAvatarIfAny()
  }, [])

  const [refreshing, setRefreshing] = React.useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchJobs(), refetchAssignments()])
    setRefreshing(false)
  }

  if (jobsLoading && !jobsData) {
    return <LoadingSpinner fullScreen message="Loading schedule..." />
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name ?? 'Technician'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </TouchableOpacity>
        </View>

        {/* Photo reminder — shown each launch until a profile photo exists */}
        <AvatarReminderBanner />

        {/* Date */}
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todaysJobs.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.warning }]}>
              {todaysJobs.filter((j) => isActiveJob(j.status)).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{completedToday}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {techProfile?.rating ? techProfile.rating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Active Job Banner */}
        {activeJob && (
          <TouchableOpacity
            style={styles.activeJobBanner}
            onPress={() => router.push(`/job/${activeJob.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.activePulse} />
            <View style={styles.activeContent}>
              <Text style={styles.activeLabel}>
                {activeJob.status === 'EN_ROUTE' ? '🚗 En Route' : '📍 On Site'}
              </Text>
              <Text style={styles.activeTitle} numberOfLines={1}>{activeJob.title}</Text>
              <Text style={styles.activeAddress} numberOfLines={1}>
                {activeJob.serviceAddress ?? activeJob.customerName}
              </Text>
            </View>
            <Text style={styles.activeArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Next Up */}
        {!activeJob && nextJob && (
          <View style={styles.nextUpSection}>
            <Text style={styles.sectionTitle}>⏭️ Next Up</Text>
            <JobCard job={nextJob} assignment={assignmentMap[nextJob.id]} />
            {nextJob.serviceAddress && (
              <View style={styles.navBtnContainer}>
                <ActionButton
                  label="Get Directions"
                  icon="🗺️"
                  onPress={() => {
                    const url = getNavigationUrl(
                      nextJob.serviceAddress,
                      nextJob.serviceLatitude,
                      nextJob.serviceLongitude,
                    )
                    if (url) Linking.openURL(url)
                  }}
                  variant="outline"
                  size="sm"
                />
              </View>
            )}
          </View>
        )}

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {todaysJobs.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="No jobs scheduled today"
              subtitle="Enjoy your day off! New assignments will appear here."
            />
          ) : (
            todaysJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                assignment={assignmentMap[job.id]}
              />
            ))
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xs,
    marginBottom: Spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeJobBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadow.md,
  },
  activePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
    marginRight: Spacing.md,
  },
  activeContent: {
    flex: 1,
  },
  activeLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  activeTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  activeAddress: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  activeArrow: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: FontWeight.bold,
    marginLeft: Spacing.sm,
  },
  nextUpSection: {
    marginBottom: Spacing.base,
  },
  navBtnContainer: {
    paddingHorizontal: Spacing.base,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
})

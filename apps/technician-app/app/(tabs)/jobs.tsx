import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useMyJobs } from '@/hooks/useJobs'
import { JobCard } from '@/components/JobCard'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { isCompletedJob, isInProgressJob, isMissedJob, jobLocalDate, localDateStr, sortByScheduledTime } from '@/utils/jobHelpers'
import type { Job } from '@/types/api'

type TabKey = 'today' | 'missed' | 'upcoming' | 'completed'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: '📅' },
  { key: 'missed', label: 'Missed', icon: '⚠️' },
  { key: 'upcoming', label: 'Upcoming', icon: '⏭️' },
  { key: 'completed', label: 'Completed', icon: '✅' },
]

export default function JobsScreen() {
  // The Home screen's "Missed" card opens this tab straight on Missed.
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam === 'missed' ? 'missed' : 'today')
  useEffect(() => { if (tabParam === 'missed') setActiveTab('missed') }, [tabParam])
  const [search, setSearch] = useState('')

  const { data: jobsData, isLoading, refetch } = useMyJobs({ limit: 100 })

  const todayStr = localDateStr(new Date())

  const filteredJobs = useMemo(() => {
    if (!jobsData?.data) return []

    let jobs = jobsData.data

    // Tab filter
    switch (activeTab) {
      case 'today':
        // Only what is for today: work in progress, today's schedule, and jobs with no date yet.
        // Past-dated open jobs are "Missed", shown on their own tab so Today stays honest.
        jobs = jobs.filter((j) => {
          if (isCompletedJob(j.status) || j.status === 'CANCELLED') return false
          if (isInProgressJob(j.status)) return true
          const jobDate = jobLocalDate(j.scheduledStart)
          return !jobDate || jobDate === todayStr
        })
        break
      case 'missed':
        jobs = jobs.filter((j) => isMissedJob(j, todayStr))
        break
      case 'upcoming':
        jobs = jobs.filter((j) => {
          if (isCompletedJob(j.status) || j.status === 'CANCELLED') return false
          if (isInProgressJob(j.status)) return false
          const jobDate = jobLocalDate(j.scheduledStart)
          // Future local dates only (not today)
          return !!jobDate && jobDate > todayStr
        })
        break
      case 'completed':
        jobs = jobs.filter((j) => isCompletedJob(j.status))
        break
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.jobNumber.toLowerCase().includes(q) ||
          j.customerName?.toLowerCase().includes(q) ||
          j.serviceAddress?.toLowerCase().includes(q),
      )
    }

    // Missed: the longest-waiting first.
    if (activeTab === 'missed') return sortByScheduledTime(jobs)
    return activeTab === 'completed'
      ? [...jobs].sort((a, b) => {
          const aDate = a.completedAt ?? a.updatedAt
          const bDate = b.completedAt ?? b.updatedAt
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        })
      : sortByScheduledTime(jobs)
  }, [jobsData, activeTab, search, todayStr])

  const missedCount = useMemo(() => (jobsData?.data ?? []).filter((j) => isMissedJob(j, todayStr)).length, [jobsData, todayStr])

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <Text style={styles.headerCount}>{filteredJobs.length} jobs</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search jobs, customers, addresses..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.filter((tab) => tab.key !== 'missed' || missedCount > 0 || activeTab === 'missed').map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.icon} {tab.label}{tab.key === 'missed' && missedCount > 0 ? ` (${missedCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Job List */}
      {isLoading && !jobsData ? (
        <LoadingSpinner message="Loading jobs..." />
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobCard job={item} showDate={activeTab !== 'today'} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === 'completed' ? '📊' : activeTab === 'missed' ? '✅' : '📋'}
              title={
                activeTab === 'today'
                  ? 'No jobs for today'
                  : activeTab === 'missed'
                    ? 'Nothing missed'
                    : activeTab === 'upcoming'
                      ? 'No upcoming jobs'
                      : 'No completed jobs yet'
              }
              subtitle={
                search
                  ? 'Try adjusting your search terms'
                  : activeTab === 'missed'
                    ? 'You are all caught up.'
                    : 'Jobs assigned to you will appear here'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  searchRow: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  listContent: {
    paddingBottom: 30,
  },
})

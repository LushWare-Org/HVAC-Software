import React, { useState, useMemo } from 'react'
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
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useMyJobs } from '@/hooks/useJobs'
import { JobCard } from '@/components/JobCard'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { isActiveJob, isCompletedJob, sortByScheduledTime } from '@/utils/jobHelpers'
import type { Job } from '@/types/api'

type TabKey = 'today' | 'upcoming' | 'completed'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: '📅' },
  { key: 'upcoming', label: 'Upcoming', icon: '⏭️' },
  { key: 'completed', label: 'Completed', icon: '✅' },
]

export default function JobsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const [search, setSearch] = useState('')

  const { data: jobsData, isLoading, refetch } = useMyJobs({ limit: 100 })

  // LOCAL calendar date, not UTC. `toISOString()` gave the UTC date, so an
  // 11 PM job (UTC+5:30) carried tomorrow's UTC date and landed in the wrong
  // tab. All bucketing below compares dates in the device's timezone.
  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const todayStr = localDateStr(new Date())
  const jobLocalDate = (iso?: string | null) => (iso ? localDateStr(new Date(iso)) : null)

  const filteredJobs = useMemo(() => {
    if (!jobsData?.data) return []

    let jobs = jobsData.data

    // Tab filter
    switch (activeTab) {
      case 'today':
        jobs = jobs.filter((j) => {
          if (isCompletedJob(j.status) || j.status === 'CANCELLED') return false
          // Currently in-progress jobs always show in Today
          if (j.status === 'EN_ROUTE' || j.status === 'ON_SITE' || j.status === 'IN_PROGRESS') return true
          const jobDate = jobLocalDate(j.scheduledStart)
          // No schedule yet → needs attention today
          if (!jobDate) return true
          // Today's schedule, plus OVERDUE (past-dated, still open) jobs —
          // previously these vanished from every tab.
          return jobDate <= todayStr
        })
        break
      case 'upcoming':
        jobs = jobs.filter((j) => {
          if (isCompletedJob(j.status) || j.status === 'CANCELLED') return false
          if (j.status === 'EN_ROUTE' || j.status === 'ON_SITE' || j.status === 'IN_PROGRESS') return false
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

    return activeTab === 'completed'
      ? [...jobs].sort((a, b) => {
          const aDate = a.completedAt ?? a.updatedAt
          const bDate = b.completedAt ?? b.updatedAt
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        })
      : sortByScheduledTime(jobs)
  }, [jobsData, activeTab, search, todayStr])

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
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.icon} {tab.label}
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
              icon={activeTab === 'completed' ? '📊' : '📋'}
              title={
                activeTab === 'today'
                  ? 'No jobs for today'
                  : activeTab === 'upcoming'
                    ? 'No upcoming jobs'
                    : 'No completed jobs yet'
              }
              subtitle={
                search
                  ? 'Try adjusting your search terms'
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

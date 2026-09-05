import React from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMyProjects } from '@/hooks/useMyProjects'
import { StatusBadge } from '@/components/StatusBadge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDate } from '@/lib/format'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'

export default function Projects() {
  const { data, isLoading, isError, refetch, isRefetching } = useMyProjects()
  const projects = data ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="My Projects" />

      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching && !isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Feather name="briefcase" size={22} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  {isError ? 'Could not load your projects. Pull down to retry.' : 'No projects on file yet.'}
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/projects/${item.id}`)}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <StatusBadge status={item.status} />
            </View>
            {item.category ? <Text style={styles.meta}>{item.category}</Text> : null}
            {item.siteAddress ? <Text style={styles.meta} numberOfLines={1}>{item.siteAddress}</Text> : null}
            <Text style={styles.meta}>
              {item.startDate ? `Started ${formatDate(item.startDate, '—')}` : 'Not started yet'}
              {item.targetEndDate ? ` · Target ${formatDate(item.targetEndDate, '—')}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  empty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
})

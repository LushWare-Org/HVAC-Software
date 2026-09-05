import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet,
  TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { usePosts } from '@/hooks/usePosts'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDate } from '@/lib/format'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { ContractorPost, PostType } from '@/types/api'

/** Shared feed for Offers and Tips — same shape, different post type and copy. */
export function PostFeed({
  type, title, emptyText,
}: { type: PostType; title: string; emptyText: string }) {
  const { data, isLoading, isError, refetch, isRefetching } = usePosts(type)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const posts = useMemo(() => {
    const list = data ?? []
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime()
    })
  }, [data])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={title} />

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching && !isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Feather name="tag" size={22} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  {isError ? `Could not load ${title.toLowerCase()}. Pull down to retry.` : emptyText}
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
          />
        )}
      />
    </SafeAreaView>
  )
}

function PostCard({
  post, expanded, onToggle,
}: { post: ContractorPost; expanded: boolean; onToggle: () => void }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardInner}
        onPress={onToggle}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${post.title}${expanded ? ', expanded' : ''}`}
        accessibilityHint={expanded ? 'Double tap to collapse' : 'Double tap to read more'}
      >
        {post.heroImageUrl ? (
          <Image
            source={{ uri: post.heroImageUrl }}
            style={styles.hero}
            resizeMode="cover"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
        <View style={styles.cardBody}>
          {post.isPinned ? (
            <View style={styles.pinnedBadge}>
              <Text style={styles.pinnedBadgeText}>Featured</Text>
            </View>
          ) : null}
          <Text style={styles.cardTitle}>{post.title}</Text>
          {post.body ? (
            <Text style={styles.cardText} numberOfLines={expanded ? undefined : 2}>
              {post.body}
            </Text>
          ) : null}
          <Text style={styles.cardDate}>{formatDate(post.publishedAt ?? post.createdAt, '—')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  // Shadow lives on the outer, unclipped View; overflow:hidden (needed to
  // round the hero image's corners) goes on cardInner instead — the two
  // can't share a view, or the OS clips the shadow along with the image.
  card: { borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadow.card },
  cardInner: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden' },
  hero: { width: '100%', height: 140, backgroundColor: Colors.surfaceAlt },
  cardBody: { padding: Spacing.base },
  pinnedBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.successLight, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, marginBottom: Spacing.xs,
  },
  pinnedBadgeText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '700' },
  cardTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 20 },
  cardDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
})

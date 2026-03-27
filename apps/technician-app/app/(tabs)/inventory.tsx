import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useLocations, useVanStock, useMyMovements, toNumber } from '@/hooks/useInventory'
import type { StockLevel, StockMovement } from '@/hooks/useInventory'
import { useAuth } from '@/contexts/AuthContext'
import { formatRelative } from '@/utils/format'

type TabKey = 'stock' | 'history'

export default function InventoryScreen() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('stock')
  const [search, setSearch] = useState('')

  // Find my van location
  const { data: locations, isLoading: locsLoading } = useLocations()
  const vanLocation = useMemo(
    () => locations?.find((l) => l.type === 'VAN' && l.technicianId === user?.id),
    [locations, user?.id],
  )

  // Van stock
  const { data: stockData, isLoading: stockLoading, refetch: refetchStock } = useVanStock(vanLocation?.id)
  const stockItems = useMemo(() => {
    const items = stockData?.data ?? []
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (sl) =>
        sl.inventoryItem?.name?.toLowerCase().includes(q) ||
        sl.inventoryItem?.sku?.toLowerCase().includes(q),
    )
  }, [stockData, search])

  // Movement history
  const { data: movementsData, isLoading: movementsLoading, refetch: refetchMovements } = useMyMovements(vanLocation?.id)
  const movements = movementsData?.data ?? []

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchStock(), refetchMovements()])
    setRefreshing(false)
  }

  const isLoading = locsLoading || stockLoading

  // Stats
  const totalItems = stockItems.length
  const lowStockCount = stockItems.filter(
    (sl) => sl.inventoryItem && toNumber(sl.quantity) <= (sl.inventoryItem.reorderPoint ?? 0),
  ).length
  const totalQty = stockItems.reduce((sum, sl) => sum + toNumber(sl.quantity), 0)

  if (isLoading) return <LoadingSpinner fullScreen message="Loading van stock..." />

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Van Stock</Text>
        <Text style={styles.headerSub}>
          {vanLocation ? vanLocation.name : 'No van assigned'}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{totalItems}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{Math.round(totalQty)}</Text>
          <Text style={styles.statLabel}>Total Qty</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: lowStockCount > 0 ? Colors.dangerLight : Colors.successLight }]}>
          <Text style={[styles.statValue, { color: lowStockCount > 0 ? Colors.danger : Colors.success }]}>
            {lowStockCount}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stock' && styles.tabActive]}
          onPress={() => setActiveTab('stock')}
        >
          <Text style={[styles.tabText, activeTab === 'stock' && styles.tabTextActive]}>
            Stock Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'stock' ? (
        <>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <FlatList
            data={stockItems}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <StockItemRow item={item} />}
            ListEmptyComponent={
              <EmptyState icon="📦" title="No stock in van" subtitle="Stock will appear here when transferred from warehouse" />
            }
          />
        </>
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MovementRow item={item} />}
          ListEmptyComponent={
            <EmptyState icon="📋" title="No movements yet" subtitle="Stock transfers and consumption will appear here" />
          }
        />
      )}
    </SafeAreaView>
  )
}

function StockItemRow({ item }: { item: StockLevel }) {
  const qty = toNumber(item.quantity)
  const reserved = toNumber(item.reservedQty)
  const available = qty - reserved
  const isLow = item.inventoryItem && qty <= (item.inventoryItem.reorderPoint ?? 0)

  return (
    <View style={[styles.card, isLow && styles.cardLow]}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName} numberOfLines={1}>{item.inventoryItem?.name ?? 'Unknown'}</Text>
        <View style={[styles.categoryBadge, getCategoryColor(item.inventoryItem?.category)]}>
          <Text style={styles.categoryText}>{item.inventoryItem?.category ?? '-'}</Text>
        </View>
      </View>
      <Text style={styles.sku}>{item.inventoryItem?.sku ?? ''}</Text>
      <View style={styles.qtyRow}>
        <View style={styles.qtyCol}>
          <Text style={styles.qtyLabel}>On Hand</Text>
          <Text style={[styles.qtyValue, isLow && { color: Colors.danger }]}>{qty}</Text>
        </View>
        <View style={styles.qtyCol}>
          <Text style={styles.qtyLabel}>Reserved</Text>
          <Text style={styles.qtyValue}>{reserved}</Text>
        </View>
        <View style={styles.qtyCol}>
          <Text style={styles.qtyLabel}>Available</Text>
          <Text style={[styles.qtyValue, { color: available > 0 ? Colors.success : Colors.danger }]}>
            {available}
          </Text>
        </View>
      </View>
      {isLow && (
        <View style={styles.lowBadge}>
          <Text style={styles.lowBadgeText}>⚠️ Low Stock</Text>
        </View>
      )}
    </View>
  )
}

function MovementRow({ item }: { item: StockMovement }) {
  const icons: Record<string, string> = {
    INTAKE: '📥',
    TRANSFER: '🔄',
    CONSUME: '🔧',
    ADJUST: '📐',
    RETURN: '↩️',
  }
  const colors: Record<string, string> = {
    INTAKE: Colors.success,
    TRANSFER: Colors.primary,
    CONSUME: Colors.warning,
    ADJUST: Colors.info,
    RETURN: Colors.textSecondary,
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>
          {icons[item.movementType] ?? '•'} {item.inventoryItem?.name ?? 'Unknown'}
        </Text>
        <Text style={[styles.movementType, { color: colors[item.movementType] ?? Colors.textSecondary }]}>
          {item.movementType}
        </Text>
      </View>
      <View style={styles.movementDetails}>
        <Text style={styles.movementQty}>Qty: {toNumber(item.quantity)}</Text>
        {item.fromLocation && <Text style={styles.movementLoc}>From: {item.fromLocation.name}</Text>}
        {item.toLocation && <Text style={styles.movementLoc}>To: {item.toLocation.name}</Text>}
      </View>
      <View style={styles.movementFooter}>
        <Text style={styles.movementBy}>{item.performedByName}</Text>
        <Text style={styles.movementTime}>{formatRelative(item.createdAt)}</Text>
      </View>
      {item.notes && <Text style={styles.movementNotes}>{item.notes}</Text>}
    </View>
  )
}

function getCategoryColor(category?: string) {
  switch (category) {
    case 'PART': return { backgroundColor: '#DBEAFE' }
    case 'MATERIAL': return { backgroundColor: '#D1FAE5' }
    case 'TOOL': return { backgroundColor: '#FEF3C7' }
    case 'CONSUMABLE': return { backgroundColor: '#F3E8FF' }
    default: return { backgroundColor: '#F1F5F9' }
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: { backgroundColor: Colors.white, ...Shadow.sm },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  searchBar: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLow: { borderColor: Colors.danger, borderWidth: 1.5 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  sku: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: { fontSize: 10, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  qtyRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.base,
  },
  qtyCol: { alignItems: 'center' },
  qtyLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  qtyValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  lowBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  lowBadgeText: { fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.semibold },
  movementType: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  movementDetails: { marginTop: 4 },
  movementQty: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  movementLoc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  movementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  movementBy: { fontSize: FontSize.xs, color: Colors.textMuted },
  movementTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  movementNotes: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
})

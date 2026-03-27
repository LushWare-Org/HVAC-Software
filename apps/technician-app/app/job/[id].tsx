import React, { useState, useMemo, useCallback, ErrorInfo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  RefreshControl,
  Dimensions,
  Switch,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'

// Safely import MapView — wrap in try/catch so the screen doesn't crash
let MapView: any = null
let Marker: any = null
try {
  const maps = require('react-native-maps')
  MapView = maps.default
  Marker = maps.Marker
} catch {
  // Maps not available — will show fallback
}
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { StatusBadge } from '@/components/StatusBadge'
import { PriorityBadge } from '@/components/PriorityBadge'
import { ActionButton } from '@/components/ActionButton'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'

import { useJobDetail, useUpdateJobStatus, useUpdateJob, useUpdateCustomFields } from '@/hooks/useJobs'
import { useWorkOrdersByJob, useCompleteTask, useAddLineItem, useRemoveLineItem, usePriceBook, useCheckIn, useCheckOut } from '@/hooks/useWorkOrders'
import { useJobAssignments, useUpdateAssignmentStatus } from '@/hooks/useSchedule'
import { useCustomerDetail } from '@/hooks/useCustomer'
import { useLocations, useMyVanLocation, useVanStock, useReturnStock, toNumber } from '@/hooks/useInventory'

import {
  formatDateTime,
  formatTimeWindow,
  formatDuration,
  formatDistance,
  formatCurrency,
  formatPhone,
  formatRelative,
} from '@/utils/format'
import {
  getJobAction,
  areRequiredTasksComplete,
  getTaskProgress,
  calculateLineItemsTotal,
  getNavigationUrl,
} from '@/utils/jobHelpers'
import type { Job, WorkOrder, LineItemCategory, TaskCompletion, CustomFieldDef, CustomFieldValue } from '@/types/api'

type TabKey = 'overview' | 'checklist' | 'parts' | 'equipment' | 'stock' | 'notes'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📋' },
  { key: 'checklist', label: 'Checklist', icon: '✅' },
  { key: 'parts', label: 'Parts', icon: '🔧' },
  { key: 'equipment', label: 'Equipment', icon: '⚙️' },
  { key: 'stock', label: 'Stock', icon: '📦' },
  { key: 'notes', label: 'Notes', icon: '📒' },
]

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function JobDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  // Data
  const { data: job, isLoading: jobLoading, refetch, error: jobError } = useJobDetail(id)
  const { data: workOrders } = useWorkOrdersByJob(id)
  const { data: assignments } = useJobAssignments(id)
  const { data: customer } = useCustomerDetail(job?.customerId)

  // Mutations
  const updateJobStatus = useUpdateJobStatus()
  const updateAssignmentStatus = useUpdateAssignmentStatus()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()

  const workOrder = workOrders?.[0]
  const assignment = assignments?.[0]

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // Handle primary action button (Start Route / Arrived / Complete)
  const handlePrimaryAction = useCallback(async () => {
    if (!job || !assignment) return
    const action = getJobAction(job.status)
    if (!action) return

    try {
      // Completion validation
      if (action.nextStatus === 'COMPLETED') {
        if (workOrder && !areRequiredTasksComplete(workOrder)) {
          Alert.alert(
            'Required Tasks Incomplete',
            'Please complete all required checklist tasks before finishing the job.',
          )
          return
        }

        // Confirm completion
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Complete Job?',
            'Are you sure you want to mark this job as complete?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Complete', onPress: () => resolve(true) },
            ],
          )
        })
        if (!confirmed) return

        // Check out work order
        if (workOrder) {
          await checkOut.mutateAsync({ workOrderId: workOrder.id })
        }
      }

      // Update assignment status
      await updateAssignmentStatus.mutateAsync({
        assignmentId: assignment.id,
        status: action.assignmentStatus,
      })

      // Update job status
      await updateJobStatus.mutateAsync({
        jobId: job.id,
        status: action.nextStatus,
        note: `Technician: ${action.label}`,
      })

      // Check in on arrival
      if (action.nextStatus === 'ON_SITE' && workOrder) {
        await checkIn.mutateAsync(workOrder.id)
      }

      // Open navigation on Start Route
      if (action.nextStatus === 'EN_ROUTE') {
        const url = getNavigationUrl(job.serviceAddress, job.serviceLatitude, job.serviceLongitude)
        if (url) Linking.openURL(url)
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update job status')
    }
  }, [job, assignment, workOrder])

  const action = job ? getJobAction(job.status) : null
  const isActionLoading =
    updateJobStatus.isPending || updateAssignmentStatus.isPending || checkIn.isPending || checkOut.isPending

  if (!id) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: Colors.primary, fontSize: 16, marginBottom: 20 }}>‹ Back</Text>
          </TouchableOpacity>
          <EmptyState icon="❌" title="Invalid job ID" subtitle="Please go back and try again" />
        </View>
      </SafeAreaView>
    )
  }

  if (jobLoading) {
    return <LoadingSpinner fullScreen message="Loading job..." />
  }

  if (!job || jobError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: Colors.primary, fontSize: 16, marginBottom: 20 }}>‹ Back</Text>
          </TouchableOpacity>
          <EmptyState icon="❌" title="Job not found" subtitle="This job may have been removed or you don't have access." />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{job.jobNumber}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
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
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <OverviewTab job={job} customer={customer} assignment={assignment} workOrder={workOrder} />
        )}
        {activeTab === 'checklist' && (
          <ChecklistTab workOrder={workOrder} />
        )}
        {activeTab === 'parts' && (
          <PartsTab workOrder={workOrder} />
        )}
        {activeTab === 'equipment' && (
          <EquipmentTab customer={customer} />
        )}
        {activeTab === 'stock' && (
          <VanStockTab job={job} workOrder={workOrder} />
        )}
        {activeTab === 'notes' && (
          <NotesTab job={job} />
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action button */}
      {action && (
        <View style={styles.bottomAction}>
          <ActionButton
            label={action.label}
            icon={action.icon}
            color={action.color}
            onPress={handlePrimaryAction}
            loading={isActionLoading}
            fullWidth
            size="lg"
          />
        </View>
      )}
    </SafeAreaView>
  )
}

// ===== OVERVIEW TAB =====
function OverviewTab({
  job,
  customer,
  assignment,
  workOrder,
}: {
  job: Job
  customer: any
  assignment: any
  workOrder?: WorkOrder
}) {
  const taskProgress = getTaskProgress(workOrder)

  return (
    <View>
      {/* Title + Status */}
      <View style={styles.titleSection}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={job.status} />
          <PriorityBadge priority={job.priority} />
        </View>
        {job.description && (
          <Text style={styles.description}>{job.description}</Text>
        )}
      </View>

      {/* Map Preview */}
      {(() => {
        const lat = typeof job.serviceLatitude === 'string' ? parseFloat(job.serviceLatitude) : job.serviceLatitude
        const lng = typeof job.serviceLongitude === 'string' ? parseFloat(job.serviceLongitude) : job.serviceLongitude
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null
        return (
          <View style={styles.mapContainer}>
            {MapView && Marker ? (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={job.title}
                  description={job.serviceAddress}
                />
              </MapView>
            ) : (
              <View style={[styles.map, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📍</Text>
                <Text style={{ color: '#6b7280', fontSize: 13 }}>
                  {job.serviceAddress ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.directionsBtn}
              onPress={() => {
                const url = getNavigationUrl(job.serviceAddress, lat, lng)
                if (url) Linking.openURL(url)
              }}
            >
              <Text style={styles.directionsBtnText}>🗺️ Get Directions</Text>
            </TouchableOpacity>
          </View>
        )
      })()}

      {/* Service Address (fallback if no coordinates) */}
      {job.serviceAddress && !(job.serviceLatitude && job.serviceLongitude) && (
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            const url = getNavigationUrl(job.serviceAddress)
            if (url) Linking.openURL(url)
          }}
        >
          <Text style={styles.cardLabel}>📍 Service Address</Text>
          <Text style={styles.cardValue}>{job.serviceAddress}</Text>
          <Text style={styles.linkText}>Tap for directions →</Text>
        </TouchableOpacity>
      )}

      {/* Assignment Info */}
      {assignment && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📊 Assignment Details</Text>
          <View style={styles.detailGrid}>
            <DetailItem label="Distance" value={formatDistance(assignment.distanceKm)} />
            <DetailItem label="Scheduled" value={formatTimeWindow(assignment.scheduledStart, assignment.scheduledEnd)} />
            {assignment.assignedByName && (
              <DetailItem label="Assigned by" value={assignment.assignedByName} />
            )}
          </View>
        </View>
      )}

      {/* Schedule */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>🕐 Schedule</Text>
        <View style={styles.detailGrid}>
          <DetailItem label="Window" value={formatTimeWindow(job.scheduledStart, job.scheduledEnd)} />
          <DetailItem label="Est. Duration" value={formatDuration(job.estimatedDuration)} />
          {job.jobType && <DetailItem label="Type" value={`${job.jobType.icon ?? '🔧'} ${job.jobType.name}`} />}
        </View>
      </View>

      {/* Progress */}
      {workOrder && taskProgress.total > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📊 Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(taskProgress.completed / taskProgress.total) * 100}%`,
                  backgroundColor:
                    taskProgress.completed === taskProgress.total ? Colors.success : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {taskProgress.completed}/{taskProgress.total} tasks • {formatCurrency(calculateLineItemsTotal(workOrder))} in parts/labour
          </Text>
        </View>
      )}

      {/* Customer Info */}
      {customer && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>👤 Customer</Text>
          <Text style={styles.customerName}>
            {customer.firstName} {customer.lastName}
          </Text>
          {customer.phone && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${customer.phone}`)}
            >
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactLink}>{formatPhone(customer.phone)}</Text>
            </TouchableOpacity>
          )}
          {customer.email && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${customer.email}`)}
            >
              <Text style={styles.contactIcon}>✉️</Text>
              <Text style={styles.contactLink}>{customer.email}</Text>
            </TouchableOpacity>
          )}
          {customer.mobile && customer.mobile !== customer.phone && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${customer.mobile}`)}
            >
              <Text style={styles.contactIcon}>📱</Text>
              <Text style={styles.contactLink}>{formatPhone(customer.mobile)}</Text>
            </TouchableOpacity>
          )}

          {/* Equipment */}
          {customer.equipment?.length > 0 && (
            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>Equipment on Site</Text>
              {customer.equipment.map((eq: any) => (
                <View key={eq.id} style={styles.equipmentItem}>
                  <Text style={styles.equipmentType}>{eq.type}</Text>
                  <Text style={styles.equipmentDetail}>
                    {[eq.brand, eq.model, eq.serialNo].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Status Timeline */}
      {job.statusHistory && job.statusHistory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📜 Status History</Text>
          {job.statusHistory.map((entry, i) => (
            <View key={entry.id} style={styles.historyItem}>
              <View style={[styles.historyDot, i === 0 && styles.historyDotActive]} />
              <View style={styles.historyContent}>
                <View style={styles.historyRow}>
                  <StatusBadge status={entry.toStatus} size="sm" />
                  <Text style={styles.historyTime}>{formatRelative(entry.createdAt)}</Text>
                </View>
                {entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
                {entry.changedByName && (
                  <Text style={styles.historyBy}>by {entry.changedByName}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

// ===== CHECKLIST TAB =====
function ChecklistTab({ workOrder }: { workOrder?: WorkOrder }) {
  const completeTask = useCompleteTask()

  if (!workOrder || !workOrder.tasks?.length) {
    return <EmptyState icon="✅" title="No checklist" subtitle="No tasks assigned for this job." />
  }

  const progress = getTaskProgress(workOrder)

  const handleToggleTask = async (task: TaskCompletion) => {
    try {
      await completeTask.mutateAsync({
        workOrderId: workOrder.id,
        taskCompletionId: task.id,
        isCompleted: !task.isCompleted,
      })
    } catch {
      Alert.alert('Error', 'Failed to update task')
    }
  }

  return (
    <View>
      {/* Progress header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressHeaderText}>
          {progress.completed}/{progress.total} tasks complete
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(progress.completed / progress.total) * 100}%`,
                backgroundColor:
                  progress.completed === progress.total ? Colors.success : Colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Tasks */}
      {workOrder.tasks
        .sort((a, b) => a.taskOrder - b.taskOrder)
        .map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskCard, task.isCompleted && styles.taskCardCompleted]}
            onPress={() => handleToggleTask(task)}
            activeOpacity={0.7}
          >
            {/* Checkbox */}
            <View style={[styles.checkbox, task.isCompleted && styles.checkboxChecked]}>
              {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>

            <View style={styles.taskContent}>
              <View style={styles.taskTitleRow}>
                <Text
                  style={[styles.taskName, task.isCompleted && styles.taskNameCompleted]}
                  numberOfLines={2}
                >
                  {task.taskName}
                </Text>
                {task.isRequired && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                )}
              </View>

              {task.description && (
                <Text style={styles.taskDescription}>{task.description}</Text>
              )}

              {/* Safety note */}
              {task.safetyNote && (
                <View style={styles.safetyBanner}>
                  <Text style={styles.safetyText}>⚠️ {task.safetyNote}</Text>
                </View>
              )}

              {/* Photo required indicator */}
              {task.photoRequired && !task.photoUrl && (
                <Text style={styles.photoRequired}>📷 Photo required</Text>
              )}
              {task.photoUrl && (
                <Text style={styles.photoTaken}>📷 Photo attached</Text>
              )}

              {/* Estimated time */}
              {task.estimatedMins && (
                <Text style={styles.taskEstimate}>~{task.estimatedMins} min</Text>
              )}

              {/* Task notes */}
              {task.notes && (
                <Text style={styles.taskNotes}>📝 {task.notes}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
    </View>
  )
}

// ===== PARTS & LABOUR TAB =====
function PartsTab({ workOrder }: { workOrder?: WorkOrder }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newItem, setNewItem] = useState({
    description: '',
    category: 'PART' as LineItemCategory,
    quantity: '1',
    unitPrice: '',
  })

  const addLineItem = useAddLineItem()
  const removeLineItem = useRemoveLineItem()
  const { data: priceBookData } = usePriceBook(searchQuery || undefined)

  const total = calculateLineItemsTotal(workOrder)

  const handleAddItem = async () => {
    if (!workOrder) return
    if (!newItem.description || !newItem.unitPrice) {
      Alert.alert('Error', 'Please fill in description and unit price')
      return
    }

    try {
      await addLineItem.mutateAsync({
        workOrderId: workOrder.id,
        item: {
          description: newItem.description,
          category: newItem.category,
          quantity: parseInt(newItem.quantity) || 1,
          unitPrice: parseFloat(newItem.unitPrice) || 0,
        },
      })
      setNewItem({ description: '', category: 'PART', quantity: '1', unitPrice: '' })
      setShowAddForm(false)
    } catch {
      Alert.alert('Error', 'Failed to add item')
    }
  }

  const handleRemoveItem = (lineItemId: string) => {
    if (!workOrder) return
    Alert.alert('Remove Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeLineItem.mutate({ workOrderId: workOrder.id, lineItemId }),
      },
    ])
  }

  const handleSelectPriceBookItem = (item: any) => {
    setNewItem({
      description: item.name,
      category: item.category,
      quantity: '1',
      unitPrice: String(item.unitPrice),
    })
    setSearchQuery('')
  }

  if (!workOrder) {
    return <EmptyState icon="🔧" title="No work order" subtitle="Parts & labour tracking will be available once the work order is created." />
  }

  return (
    <View>
      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Parts & Labour</Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
      </View>

      {/* Line items */}
      {workOrder.lineItems?.map((item) => (
        <View key={item.id} style={styles.lineItemCard}>
          <View style={styles.lineItemContent}>
            <View style={styles.lineItemTop}>
              <Text style={styles.lineItemDesc} numberOfLines={1}>{item.description}</Text>
              <StatusBadge status={item.category} size="sm" />
            </View>
            <View style={styles.lineItemBottom}>
              <Text style={styles.lineItemQty}>
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={styles.lineItemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {workOrder.lineItems?.length === 0 && !showAddForm && (
        <EmptyState icon="🔧" title="No items yet" subtitle="Add parts and labour used on this job." />
      )}

      {/* Add Item */}
      {showAddForm ? (
        <View style={styles.addItemForm}>
          <Text style={styles.addItemTitle}>Add Item</Text>

          {/* Price book search */}
          <TextInput
            style={styles.textInput}
            placeholder="🔍 Search price book..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (priceBookData?.data?.length ?? 0) > 0 && (
            <View style={styles.priceBookResults}>
              {priceBookData!.data.slice(0, 5).map((pbItem) => (
                <TouchableOpacity
                  key={pbItem.id}
                  style={styles.priceBookItem}
                  onPress={() => handleSelectPriceBookItem(pbItem)}
                >
                  <Text style={styles.pbItemName}>{pbItem.name}</Text>
                  <Text style={styles.pbItemPrice}>{formatCurrency(pbItem.unitPrice)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            style={styles.textInput}
            placeholder="Description"
            value={newItem.description}
            onChangeText={(v) => setNewItem({ ...newItem, description: v })}
          />

          {/* Category picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {(['PART', 'LABOUR', 'MATERIAL', 'EQUIPMENT_RENTAL', 'OTHER'] as LineItemCategory[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, newItem.category === cat && styles.catChipActive]}
                onPress={() => setNewItem({ ...newItem, category: cat })}
              >
                <Text style={[styles.catChipText, newItem.category === cat && styles.catChipTextActive]}>
                  {cat.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.qtyPriceRow}>
            <View style={styles.qtyField}>
              <Text style={styles.fieldLabel}>Qty</Text>
              <TextInput
                style={styles.textInput}
                value={newItem.quantity}
                onChangeText={(v) => setNewItem({ ...newItem, quantity: v })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.priceField}>
              <Text style={styles.fieldLabel}>Unit Price ($)</Text>
              <TextInput
                style={styles.textInput}
                value={newItem.unitPrice}
                onChangeText={(v) => setNewItem({ ...newItem, unitPrice: v })}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          </View>

          <View style={styles.addItemBtns}>
            <ActionButton label="Cancel" variant="outline" size="sm" onPress={() => setShowAddForm(false)} />
            <ActionButton
              label="Add Item"
              size="sm"
              onPress={handleAddItem}
              loading={addLineItem.isPending}
            />
          </View>
        </View>
      ) : (
        <View style={styles.addBtnContainer}>
          <ActionButton
            label="+ Add Part / Labour"
            variant="outline"
            onPress={() => setShowAddForm(true)}
            fullWidth
          />
        </View>
      )}
    </View>
  )
}

// ===== CUSTOM FIELDS TAB =====
function CustomFieldsTab({ job }: { job: Job }) {
  const updateFields = useUpdateCustomFields()
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(() => {
    const vals: Record<string, unknown> = {}
    job.customFieldValues?.forEach((fv) => {
      vals[fv.fieldDefId] = fv.value
    })
    return vals
  })
  const [hasChanges, setHasChanges] = useState(false)

  if (!job.customFieldValues?.length) {
    return (
      <EmptyState
        icon="📝"
        title="No custom fields"
        subtitle="No trade-specific fields configured for this job type."
      />
    )
  }

  const handleSave = async () => {
    const fields = Object.entries(fieldValues).map(([fieldDefId, value]) => ({
      fieldDefId,
      value,
    }))
    try {
      await updateFields.mutateAsync({ jobId: job.id, fields })
      setHasChanges(false)
      Alert.alert('Saved', 'Custom fields updated')
    } catch {
      Alert.alert('Error', 'Failed to save custom fields')
    }
  }

  const updateField = (fieldDefId: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [fieldDefId]: value }))
    setHasChanges(true)
  }

  return (
    <View>
      {job.customFieldValues.map((fv) => (
        <View key={fv.fieldDefId} style={styles.customFieldCard}>
          <Text style={styles.customFieldLabel}>
            {fv.label}
            {/* Can't check isRequired from customFieldValues alone, but show it if available */}
          </Text>

          {fv.fieldType === 'TEXT' && (
            <TextInput
              style={styles.textInput}
              value={String(fieldValues[fv.fieldDefId] ?? '')}
              onChangeText={(v) => updateField(fv.fieldDefId, v)}
              placeholder={`Enter ${fv.label.toLowerCase()}`}
            />
          )}

          {fv.fieldType === 'TEXTAREA' && (
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={String(fieldValues[fv.fieldDefId] ?? '')}
              onChangeText={(v) => updateField(fv.fieldDefId, v)}
              placeholder={`Enter ${fv.label.toLowerCase()}`}
              multiline
              numberOfLines={4}
            />
          )}

          {fv.fieldType === 'NUMBER' && (
            <TextInput
              style={styles.textInput}
              value={String(fieldValues[fv.fieldDefId] ?? '')}
              onChangeText={(v) => updateField(fv.fieldDefId, parseFloat(v) || v)}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          )}

          {fv.fieldType === 'BOOLEAN' && (
            <Switch
              value={Boolean(fieldValues[fv.fieldDefId])}
              onValueChange={(v) => updateField(fv.fieldDefId, v)}
              trackColor={{ true: Colors.primary, false: Colors.disabled }}
            />
          )}

          {fv.fieldType === 'SELECT' && (
            <View style={styles.selectOptions}>
              {(() => {
                try {
                  const options = typeof fv.value === 'string' ? [] : []
                  // Options would come from CustomFieldDef.options, but we show current value
                  return (
                    <TextInput
                      style={styles.textInput}
                      value={String(fieldValues[fv.fieldDefId] ?? '')}
                      onChangeText={(v) => updateField(fv.fieldDefId, v)}
                      placeholder={`Select ${fv.label.toLowerCase()}`}
                    />
                  )
                } catch {
                  return null
                }
              })()}
            </View>
          )}

          {fv.fieldType === 'DATE' && (
            <TextInput
              style={styles.textInput}
              value={String(fieldValues[fv.fieldDefId] ?? '')}
              onChangeText={(v) => updateField(fv.fieldDefId, v)}
              placeholder="YYYY-MM-DD"
            />
          )}
        </View>
      ))}

      {hasChanges && (
        <View style={styles.saveFieldsBtnContainer}>
          <ActionButton
            label="Save Fields"
            onPress={handleSave}
            loading={updateFields.isPending}
            fullWidth
          />
        </View>
      )}
    </View>
  )
}

// ===== NOTES TAB =====
function NotesTab({ job }: { job: Job }) {
  const updateJob = useUpdateJob()
  const [notes, setNotes] = useState(job.notes ?? '')
  const [internalNotes, setInternalNotes] = useState(job.internalNotes ?? '')
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async () => {
    try {
      await updateJob.mutateAsync({
        jobId: job.id,
        data: { notes, internalNotes },
      })
      setHasChanges(false)
      Alert.alert('Saved', 'Notes updated')
    } catch {
      Alert.alert('Error', 'Failed to save notes')
    }
  }

  return (
    <View>
      {/* Job Notes */}
      <View style={styles.notesCard}>
        <Text style={styles.notesLabel}>📝 Job Notes</Text>
        <Text style={styles.notesHelp}>Visible to customer</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={(v) => { setNotes(v); setHasChanges(true) }}
          placeholder="Add notes about the work performed..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Internal Notes */}
      <View style={styles.notesCard}>
        <Text style={styles.notesLabel}>🔒 Internal Notes</Text>
        <Text style={styles.notesHelp}>Only visible to your team</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={internalNotes}
          onChangeText={(v) => { setInternalNotes(v); setHasChanges(true) }}
          placeholder="Add internal notes (parts needed, follow-up, etc.)..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {hasChanges && (
        <View style={styles.saveFieldsBtnContainer}>
          <ActionButton
            label="Save Notes"
            onPress={handleSave}
            loading={updateJob.isPending}
            fullWidth
          />
        </View>
      )}

      {/* Status history */}
      {job.statusHistory && job.statusHistory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📜 Activity Log</Text>
          {job.statusHistory.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <View style={styles.historyRow}>
                  <StatusBadge status={entry.toStatus} size="sm" />
                  <Text style={styles.historyTime}>{formatRelative(entry.createdAt)}</Text>
                </View>
                {entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

// ===== EQUIPMENT TAB =====
function EquipmentTab({ customer }: { customer: any }) {
  if (!customer) {
    return <EmptyState icon="⚙️" title="Loading customer…" subtitle="Customer data is being fetched." />
  }

  const equipment: any[] = customer.equipment ?? []

  if (equipment.length === 0) {
    return (
      <EmptyState
        icon="⚙️"
        title="No equipment on record"
        subtitle="This customer has no equipment registered. Equipment can be added from the admin dashboard."
      />
    )
  }

  const FIELD_LABELS: Record<string, string> = {
    type: 'Type',
    brand: 'Brand',
    model: 'Model',
    serialNo: 'Serial No.',
    installDate: 'Install Date',
    warrantyExpiry: 'Warranty',
    location: 'Location',
    notes: 'Notes',
  }

  return (
    <View>
      <Text style={eqStyles.header}>⚙️ Customer Equipment ({equipment.length})</Text>
      {equipment.map((eq, idx) => (
        <View key={eq.id ?? idx} style={eqStyles.card}>
          <View style={eqStyles.cardHeader}>
            <Text style={eqStyles.eqType}>{eq.type ?? 'Equipment'}</Text>
            {eq.brand && <Text style={eqStyles.eqBrand}>{eq.brand}</Text>}
          </View>

          {(['model', 'serialNo', 'location'] as const).map((field) =>
            eq[field] ? (
              <View key={field} style={eqStyles.row}>
                <Text style={eqStyles.label}>{FIELD_LABELS[field]}</Text>
                <Text style={eqStyles.value}>{eq[field]}</Text>
              </View>
            ) : null,
          )}

          {eq.installDate && (
            <View style={eqStyles.row}>
              <Text style={eqStyles.label}>Install Date</Text>
              <Text style={eqStyles.value}>
                {new Date(eq.installDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          )}

          {eq.warrantyExpiry && (
            <View style={eqStyles.row}>
              <Text style={eqStyles.label}>Warranty</Text>
              <Text style={[
                eqStyles.value,
                new Date(eq.warrantyExpiry) < new Date() ? eqStyles.expired : eqStyles.valid,
              ]}>
                {new Date(eq.warrantyExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                {new Date(eq.warrantyExpiry) < new Date() ? ' (Expired)' : ' (Active)'}
              </Text>
            </View>
          )}

          {eq.notes && (
            <View style={eqStyles.notesBox}>
              <Text style={eqStyles.notesText}>📝 {eq.notes}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

const eqStyles = StyleSheet.create({
  header: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold as any,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  eqType: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold as any,
    color: Colors.textPrimary,
  },
  eqBrand: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold as any,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold as any,
    flex: 1,
    textAlign: 'right',
  },
  expired: { color: '#dc2626' },
  valid: { color: '#16a34a' },
  notesBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  notesText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
})

// ===== VAN STOCK TAB =====
function VanStockTab({ job, workOrder }: { job: Job; workOrder?: WorkOrder }) {
  const vanLocation = useMyVanLocation()
  const { data: stockData, isLoading } = useVanStock(vanLocation?.id)
  const { data: allLocations } = useLocations()
  const updateJob = useUpdateJob()
  const returnStock = useReturnStock()
  const stockItems = stockData?.data ?? []
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null)
  const [returnQty, setReturnQty] = useState<Record<string, number>>({})

  // Find warehouse to return to
  const warehouse = (allLocations ?? []).find((l: any) => l.type === 'WAREHOUSE')

  const stocksCollected = (job.tags ?? []).includes('stocks-collected')

  // Match work order line items (parts) against van stock
  const requiredParts = (workOrder?.lineItems ?? []).filter(li => li.category === 'PART' || li.category === 'MATERIAL')

  const handleMarkCollected = () => {
    const currentTags = job.tags ?? []
    if (!currentTags.includes('stocks-collected')) {
      updateJob.mutate({
        jobId: job.id,
        data: { tags: [...currentTags, 'stocks-collected'] } as any,
      })
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading van stock..." />
  }

  if (!vanLocation) {
    return (
      <EmptyState
        icon="🚚"
        title="No van assigned"
        subtitle="Contact your dispatcher to set up your van stock location."
      />
    )
  }

  return (
    <View>
      {/* Stocks Collected Banner */}
      {stocksCollected ? (
        <View style={stockStyles.collectedBanner}>
          <Text style={stockStyles.collectedText}>✅ Stocks Collected</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={stockStyles.collectBtn}
          onPress={handleMarkCollected}
          disabled={updateJob.isPending}
          activeOpacity={0.7}
        >
          <Text style={stockStyles.collectBtnText}>
            {updateJob.isPending ? '⏳ Updating…' : '📦 Mark Stocks Collected'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Required Parts for this Job */}
      {requiredParts.length > 0 && (
        <View style={stockStyles.section}>
          <Text style={stockStyles.sectionTitle}>📋 Required Parts for This Job</Text>
          {requiredParts.map((part) => {
            const vanItem = stockItems.find(s =>
              s.inventoryItem?.name?.toLowerCase() === part.description?.toLowerCase()
            )
            const inVan = vanItem ? toNumber(vanItem.quantity) : 0
            const needed = part.quantity ?? 1
            const sufficient = inVan >= needed
            return (
              <View key={part.id} style={[stockStyles.stockRow, !sufficient && stockStyles.stockRowWarning]}>
                <View style={{ flex: 1 }}>
                  <Text style={stockStyles.itemName}>{part.description}</Text>
                  <Text style={stockStyles.itemMeta}>Need: {needed} · In van: {inVan}</Text>
                </View>
                <View style={[stockStyles.statusDot, { backgroundColor: sufficient ? Colors.success : '#ef4444' }]} />
              </View>
            )
          })}
        </View>
      )}

      {/* Full Van Stock with return capability */}
      <View style={stockStyles.section}>
        <Text style={stockStyles.sectionTitle}>🚚 My Van Stock ({stockItems.length} items)</Text>
        {!warehouse && stockItems.length > 0 && (
          <Text style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 8 }}>
            ℹ️ Return to warehouse: contact dispatcher to link warehouse location.
          </Text>
        )}
        {stockItems.length === 0 && (
          <EmptyState icon="📦" title="Van is empty" subtitle="No stock has been transferred to your van yet." />
        )}
        {stockItems.map((sl) => {
          const qty = toNumber(sl.quantity)
          const item = sl.inventoryItem
          const isLow = item && qty <= (item.reorderPoint ?? 0)
          const isExpanded = expandedReturnId === sl.id
          const maxReturn = qty
          const qtyToReturn = returnQty[sl.id] ?? 1

          const handleReturn = async () => {
            if (!vanLocation || !warehouse) return
            try {
              await returnStock.mutateAsync({
                inventoryItemId: sl.inventoryItemId,
                fromLocationId: vanLocation.id,
                toLocationId: warehouse.id,
                quantity: qtyToReturn,
                notes: `Return from Job ${job.jobNumber ?? job.id.slice(0, 8)}`,
              })
              setExpandedReturnId(null)
            } catch {
              Alert.alert('Error', 'Failed to return stock. Please try again.')
            }
          }

          return (
            <View key={sl.id}>
              <View style={[stockStyles.stockRow, isLow && stockStyles.stockRowWarning]}>
                <View style={{ flex: 1 }}>
                  <Text style={stockStyles.itemName}>{item?.name ?? 'Unknown'}</Text>
                  <Text style={stockStyles.itemMeta}>{item?.sku} · {item?.category}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[stockStyles.qtyText, isLow && { color: '#f59e0b' }]}>{qty}</Text>
                    <Text style={stockStyles.unitText}>{item?.unit ?? 'pcs'}</Text>
                  </View>
                  {warehouse && qty > 0 && (
                    <TouchableOpacity
                      style={stockStyles.returnBadge}
                      onPress={() => {
                        setExpandedReturnId(isExpanded ? null : sl.id)
                        setReturnQty(prev => ({ ...prev, [sl.id]: 1 }))
                      }}
                    >
                      <Text style={stockStyles.returnBadgeText}>↩ Return</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Return form inline */}
              {isExpanded && warehouse && (
                <View style={stockStyles.returnForm}>
                  <Text style={stockStyles.returnFormTitle}>Return to Warehouse</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity
                      style={stockStyles.qtyBtn}
                      onPress={() => setReturnQty(prev => ({ ...prev, [sl.id]: Math.max(1, (prev[sl.id] ?? 1) - 1) }))}
                    >
                      <Text style={stockStyles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={stockStyles.returnQtyText}>{qtyToReturn} / {maxReturn}</Text>
                    <TouchableOpacity
                      style={stockStyles.qtyBtn}
                      onPress={() => setReturnQty(prev => ({ ...prev, [sl.id]: Math.min(maxReturn, (prev[sl.id] ?? 1) + 1) }))}
                    >
                      <Text style={stockStyles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[stockStyles.confirmReturnBtn, returnStock.isPending && { opacity: 0.6 }]}
                      onPress={handleReturn}
                      disabled={returnStock.isPending}
                    >
                      <Text style={stockStyles.confirmReturnText}>
                        {returnStock.isPending ? 'Returning…' : 'Confirm Return'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const stockStyles = StyleSheet.create({
  collectedBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  collectedText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold as any,
    color: '#16a34a',
  },
  collectBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  collectBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold as any,
    color: '#fff',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold as any,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stockRowWarning: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold as any,
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  qtyText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold as any,
    color: Colors.textPrimary,
  },
  unitText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: Spacing.sm,
  },
  returnBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  returnBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold as any,
    color: Colors.primary,
  },
  returnForm: {
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  returnFormTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold as any,
    color: Colors.primary,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    fontWeight: FontWeight.bold as any,
  },
  returnQtyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold as any,
    color: Colors.textPrimary,
    minWidth: 50,
    textAlign: 'center',
  },
  confirmReturnBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  confirmReturnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold as any,
    color: Colors.white,
  },
})

// ===== STYLES =====
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { paddingVertical: 4, paddingRight: Spacing.md },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  topBarTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  // Tabs
  tabScroll: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: 4,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },

  content: { flex: 1, paddingTop: Spacing.md },

  // Bottom action
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadow.lg,
  },

  // Overview
  titleSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
  jobTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Map
  mapContainer: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: { width: '100%', height: 180 },
  directionsBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  directionsBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  cardValue: { fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: 4 },
  linkText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium, marginTop: 4 },

  // Detail grid
  detailGrid: { gap: Spacing.sm },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  detailValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary },

  // Progress
  progressHeader: { paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
  progressHeaderText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  progressBar: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 6 },

  // Customer
  customerName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactIcon: { fontSize: 16, marginRight: 8, width: 24 },
  contactLink: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },

  equipmentSection: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  equipmentTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  equipmentItem: { marginBottom: Spacing.sm },
  equipmentType: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  equipmentDetail: { fontSize: FontSize.xs, color: Colors.textMuted },

  // History
  historyItem: { flexDirection: 'row', marginBottom: Spacing.md },
  historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.disabled, marginRight: Spacing.md, marginTop: 4 },
  historyDotActive: { backgroundColor: Colors.primary },
  historyContent: { flex: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  historyTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  historyNote: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  historyBy: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  // Checklist
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  taskCardCompleted: { backgroundColor: '#F8FFF8', borderColor: Colors.successLight },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.disabled,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold },
  taskContent: { flex: 1 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  taskName: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary, flex: 1 },
  taskNameCompleted: { textDecorationLine: 'line-through', color: Colors.textMuted },
  requiredBadge: { backgroundColor: Colors.dangerLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  requiredText: { fontSize: 10, fontWeight: FontWeight.semibold, color: Colors.danger },
  taskDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  safetyBanner: { backgroundColor: '#FEF3C7', borderRadius: BorderRadius.sm, padding: Spacing.sm, marginTop: 4 },
  safetyText: { fontSize: FontSize.sm, color: '#92400E', fontWeight: FontWeight.medium },
  photoRequired: { fontSize: FontSize.xs, color: Colors.warning, marginTop: 4, fontWeight: FontWeight.medium },
  photoTaken: { fontSize: FontSize.xs, color: Colors.success, marginTop: 4, fontWeight: FontWeight.medium },
  taskEstimate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  taskNotes: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },

  // Parts
  totalCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  totalAmount: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  lineItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  lineItemContent: { flex: 1 },
  lineItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  lineItemDesc: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  lineItemBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  lineItemQty: { fontSize: FontSize.sm, color: Colors.textSecondary },
  lineItemTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  removeBtnText: { fontSize: 12, color: Colors.danger, fontWeight: FontWeight.bold },

  addBtnContainer: { paddingHorizontal: Spacing.base, marginTop: Spacing.sm },

  addItemForm: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  addItemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  priceBookResults: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceBookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pbItemName: { fontSize: FontSize.sm, color: Colors.textPrimary },
  pbItemPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  catScroll: { maxHeight: 40 },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  catChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  catChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  qtyPriceRow: { flexDirection: 'row', gap: Spacing.md },
  qtyField: { flex: 1 },
  priceField: { flex: 2 },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4, fontWeight: FontWeight.medium },
  addItemBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },

  // Custom fields
  customFieldCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customFieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  selectOptions: {},
  saveFieldsBtnContainer: { paddingHorizontal: Spacing.base, marginTop: Spacing.base },

  // Notes
  notesCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 2 },
  notesHelp: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },

  // Shared
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
})

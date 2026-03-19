import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme'
import { useCreateExpense, useMyExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/contexts/AuthContext'
import { ActionButton } from '@/components/ActionButton'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency, formatRelative } from '@/utils/format'
import type { ExpenseCategory, Expense } from '@/types/api'

const CATEGORIES: { key: ExpenseCategory; label: string; icon: string }[] = [
  { key: 'PARTS', label: 'Parts', icon: '🔩' },
  { key: 'FUEL', label: 'Fuel', icon: '⛽' },
  { key: 'TOOLS', label: 'Tools', icon: '🔧' },
  { key: 'SUBCONTRACTOR', label: 'Subcontractor', icon: '👷' },
  { key: 'PERMITS', label: 'Permits', icon: '📄' },
  { key: 'OTHER', label: 'Other', icon: '📦' },
]

export default function CreateExpenseScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const createExpense = useCreateExpense()
  const { data: expensesData } = useMyExpenses({ limit: 10 })

  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [category, setCategory] = useState<ExpenseCategory>('PARTS')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [vendor, setVendor] = useState('')
  const [jobId, setJobId] = useState('')
  const [isReimbursable, setIsReimbursable] = useState(true)
  const [receiptUri, setReceiptUri] = useState<string | null>(null)

  const handlePickReceipt = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    try {
      await createExpense.mutateAsync({
        technicianId: user?.id,
        category,
        description: description.trim(),
        amount: parseFloat(amount),
        vendor: vendor.trim() || undefined,
        jobId: jobId.trim() || undefined,
        receiptUrl: receiptUri ?? undefined,
        expenseDate: new Date().toISOString(),
        isReimbursable,
      })
      Alert.alert('Success', 'Expense submitted for approval')
      setMode('list')
      setDescription('')
      setAmount('')
      setVendor('')
      setJobId('')
      setReceiptUri(null)
    } catch {
      Alert.alert('Error', 'Failed to create expense')
    }
  }

  const expenses = expensesData?.data ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity onPress={() => setMode(mode === 'list' ? 'create' : 'list')}>
          <Text style={styles.toggleBtn}>{mode === 'list' ? '+ New' : 'List'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {mode === 'create' ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>New Expense</Text>

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catBtn, category === cat.key && styles.catBtnActive]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catLabel, category === cat.key && styles.catLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Replacement capacitor for AC unit"
            />

            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount ($) *</Text>
            <TextInput
              style={styles.textInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            {/* Vendor */}
            <Text style={styles.fieldLabel}>Vendor</Text>
            <TextInput
              style={styles.textInput}
              value={vendor}
              onChangeText={setVendor}
              placeholder="e.g., HVAC Parts Direct"
            />

            {/* Job ID (optional) */}
            <Text style={styles.fieldLabel}>Job ID (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={jobId}
              onChangeText={setJobId}
              placeholder="Link to a job"
            />

            {/* Reimbursable */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Reimbursable</Text>
              <Switch
                value={isReimbursable}
                onValueChange={setIsReimbursable}
                trackColor={{ true: Colors.primary, false: Colors.disabled }}
              />
            </View>

            {/* Receipt Photo */}
            <TouchableOpacity style={styles.receiptBtn} onPress={handlePickReceipt}>
              <Text style={styles.receiptBtnText}>
                {receiptUri ? '📷 Receipt attached ✓' : '📷 Take Receipt Photo'}
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <View style={styles.submitContainer}>
              <ActionButton
                label="Submit Expense"
                onPress={handleSubmit}
                loading={createExpense.isPending}
                fullWidth
                size="lg"
              />
            </View>
          </View>
        ) : (
          <View>
            {/* Expenses List */}
            {expenses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💰</Text>
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>Tap "+ New" to log an expense</Text>
              </View>
            ) : (
              expenses.map((expense: Expense) => (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseTop}>
                    <Text style={styles.expenseDesc} numberOfLines={1}>{expense.description}</Text>
                    <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                  </View>
                  <View style={styles.expenseBottom}>
                    <View style={styles.expenseMeta}>
                      {expense.category && <StatusBadge status={expense.category} size="sm" />}
                      {expense.vendor && (
                        <Text style={styles.expenseVendor}>{expense.vendor}</Text>
                      )}
                    </View>
                    <View style={styles.expenseRight}>
                      <StatusBadge status={expense.status} size="sm" />
                      <Text style={styles.expenseDate}>{formatRelative(expense.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.medium },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  toggleBtn: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  form: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  formTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  catBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  catIcon: { fontSize: 16 },
  catLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  catLabelActive: { color: Colors.primary, fontWeight: FontWeight.semibold },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  switchLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },

  receiptBtn: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  receiptBtnText: { fontSize: FontSize.base, color: Colors.textSecondary },

  submitContainer: { marginTop: Spacing.xl },

  // Expense list
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },

  expenseCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expenseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  expenseDesc: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary, flex: 1 },
  expenseAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginLeft: Spacing.sm },
  expenseBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  expenseVendor: { fontSize: FontSize.xs, color: Colors.textMuted },
  expenseRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  expenseDate: { fontSize: FontSize.xs, color: Colors.textMuted },
})

import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  useMyComponentEquipment, useMyComponents, useMyComponentServiceLog,
  useMyIssueReports, useReportIssue,
} from '@/hooks/useMyComponent'
import { StatusBadge } from '@/components/StatusBadge'
import { ScreenHeader } from '@/components/ScreenHeader'
import { formatDate } from '@/lib/format'
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/constants/theme'
import type { MyIssueReport } from '@/types/api'

export default function Property() {
  const { data: components, isLoading } = useMyComponents()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const [errorCode, setErrorCode] = useState('')
  const [description, setDescription] = useState('')

  const activeComponentId = activeId ?? components?.[0]?.id ?? null
  const component = components?.find((c) => c.id === activeComponentId) ?? components?.[0]

  const equipmentQ = useMyComponentEquipment(activeComponentId)
  const serviceLogQ = useMyComponentServiceLog(activeComponentId)
  const issuesQ = useMyIssueReports()
  const reportIssue = useReportIssue(activeComponentId ?? '')

  const componentIssues = useMemo(
    () => (issuesQ.data ?? []).filter((i) => i.componentId === activeComponentId),
    [issuesQ.data, activeComponentId],
  )

  const submitIssue = () => {
    if (!description.trim()) {
      Alert.alert('Add a description', 'Tell us what\'s wrong so we can help.')
      return
    }
    reportIssue.mutate(
      { errorCode: errorCode.trim() || undefined, description: description.trim() },
      {
        onSuccess: () => {
          setReporting(false)
          setErrorCode('')
          setDescription('')
          Alert.alert('Reported', 'Thanks! The team will take a look.')
        },
        onError: (err: any) =>
          Alert.alert('Could not send', err?.response?.data?.message ?? 'Please try again.'),
      },
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="My Property" />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : !components || components.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="home" size={22} color={Colors.textMuted} />
          <Text style={styles.emptyText}>
            Nothing on file yet. Once your service company links you to a property, it'll show up here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {components.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.switcher}>
              {components.map((c) => {
                const on = c.id === activeComponentId
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setActiveId(c.id)}
                    style={[styles.switcherChip, on && styles.switcherChipActive]}
                  >
                    <Text style={[styles.switcherChipText, on && styles.switcherChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          ) : null}

          {component ? (
            <>
              <Text style={styles.componentLabel}>{component.label}</Text>
              <Text style={styles.meta}>{component.projectName}</Text>

              <Text style={styles.sectionTitle}>Equipment</Text>
              <View style={styles.card}>
                {equipmentQ.isLoading ? (
                  <ActivityIndicator color={Colors.primary} style={styles.sectionLoader} />
                ) : (equipmentQ.data ?? []).length === 0 ? (
                  <Text style={styles.emptyRowText}>No equipment on file.</Text>
                ) : (
                  (equipmentQ.data ?? []).map((eq) => (
                    <View key={eq.id} style={styles.row}>
                      <View style={styles.rowIcon}>
                        <Feather name="wind" size={14} color={Colors.primary} />
                      </View>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>
                          {eq.brand || eq.model ? `${eq.brand ?? ''} ${eq.model ?? ''}`.trim() : eq.type}
                        </Text>
                        <Text style={styles.rowMeta}>
                          {eq.type}
                          {eq.serialNo ? ` · S/N ${eq.serialNo}` : ''}
                        </Text>
                        {eq.warrantyEnd ? (
                          <Text style={styles.rowMeta}>Warranty until {formatDate(eq.warrantyEnd, '—')}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
              </View>

              <Text style={styles.sectionTitle}>Service history</Text>
              <View style={styles.card}>
                {serviceLogQ.isLoading ? (
                  <ActivityIndicator color={Colors.primary} style={styles.sectionLoader} />
                ) : (serviceLogQ.data ?? []).length === 0 ? (
                  <Text style={styles.emptyRowText}>No service visits yet.</Text>
                ) : (
                  (serviceLogQ.data ?? []).map((j) => (
                    <TouchableOpacity key={j.id} style={styles.row} onPress={() => router.push(`/job/${j.id}`)}>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{j.title}</Text>
                        <Text style={styles.rowMeta}>{formatDate(j.scheduledStart, 'Not scheduled')}</Text>
                      </View>
                      <StatusBadge status={j.status} />
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={styles.issuesHeader}>
                <Text style={styles.sectionTitle}>Issue reports</Text>
                {!reporting ? (
                  <TouchableOpacity style={styles.reportLinkRow} onPress={() => setReporting(true)}>
                    <Feather name="alert-circle" size={14} color={Colors.primary} />
                    <Text style={styles.reportLink}>Report an issue</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {reporting ? (
                <View style={styles.card}>
                  <Text style={styles.fieldLabel}>Error code (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={errorCode}
                    onChangeText={setErrorCode}
                    placeholder="e.g. E4"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={[styles.fieldLabel, styles.fieldSpacing]}>What's wrong?</Text>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the issue"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.submitBtn}
                    disabled={reportIssue.isPending}
                    onPress={submitIssue}
                  >
                    {reportIssue.isPending ? (
                      <ActivityIndicator color={Colors.textInverse} />
                    ) : (
                      <Text style={styles.submitBtnText}>Send report</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setReporting(false); setErrorCode(''); setDescription('') }}
                  >
                    <Text style={styles.cancelBtnText}>Never mind</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.card}>
                  {componentIssues.length === 0 ? (
                    <Text style={styles.emptyRowText}>No issues reported.</Text>
                  ) : (
                    componentIssues.map((issue: MyIssueReport) => (
                      <View key={issue.id} style={styles.row}>
                        <View style={styles.rowMain}>
                          <Text style={styles.rowTitle} numberOfLines={2}>
                            {issue.description || issue.errorCode || 'Issue reported'}
                          </Text>
                          <Text style={styles.rowMeta}>{formatDate(issue.createdAt, '—')}</Text>
                        </View>
                        <StatusBadge status={issue.status} />
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { marginTop: Spacing.xl },
  empty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  switcher: { marginBottom: Spacing.md },
  switcherChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt, marginRight: Spacing.sm,
  },
  switcherChipActive: { backgroundColor: Colors.primary },
  switcherChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  switcherChipTextActive: { color: Colors.textInverse },
  componentLabel: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary,
    marginTop: Spacing.xl, marginBottom: Spacing.xs,
  },
  sectionLoader: { paddingVertical: Spacing.base },
  issuesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reportLink: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base, padding: Spacing.base, ...Shadow.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border, gap: Spacing.sm,
  },
  rowIcon: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  rowMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyRowText: { color: Colors.textMuted, fontSize: FontSize.sm, paddingVertical: Spacing.sm },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.xs },
  fieldSpacing: { marginTop: Spacing.base },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm,
    color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm,
    alignItems: 'center', marginTop: Spacing.base,
  },
  submitBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.sm },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm, marginTop: Spacing.xs },
  cancelBtnText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
})

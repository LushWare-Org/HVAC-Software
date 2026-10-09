import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight } from '@/constants/theme'
import { useProject, useProjectUnit } from '@/hooks/useProjects'

/** On a project visit: which project and which house or unit, with the site notes. */
export function ProjectJobCard({ projectId, componentId }: { projectId: string; componentId?: string | null }) {
  const { data: project } = useProject(projectId)
  const { data: unit } = useProjectUnit(componentId)
  const [showNotes, setShowNotes] = useState(false)
  if (!project) return null
  const notes = [unit?.notes, project.notes].filter(Boolean).join('\n\n')
  return (
    <View style={styles.card} accessible accessibilityLabel={`Part of the ${project.name} project${unit ? `, ${unit.label}` : ''}`}>
      <View style={styles.row}>
        <Ionicons name="construct-outline" size={18} color={Colors.warning} />
        <Text style={styles.label}>Project</Text>
      </View>
      <Text style={styles.name}>{project.name}</Text>
      {unit ? (
        <Text style={styles.unit}>{unit.label}{unit.ownerName ? ` · ${unit.ownerName}` : ''}{unit.openIssueCount ? ` · ${unit.openIssueCount} open issue${unit.openIssueCount === 1 ? '' : 's'}` : ''}</Text>
      ) : null}
      {project.siteAddress ? <Text style={styles.meta}>{project.siteAddress}</Text> : null}
      {notes ? (
        <Pressable onPress={() => setShowNotes((v) => !v)} accessibilityRole="button" accessibilityLabel={showNotes ? 'Hide site notes' : 'Show site notes'}>
          <Text style={styles.notes} numberOfLines={showNotes ? undefined : 2}>{notes}</Text>
          <Text style={styles.more}>{showNotes ? 'Show less' : 'Site notes'}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: '#FDE68A' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#92400E' },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  unit: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: '#92400E', marginTop: 2 },
  meta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  notes: { fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 8, lineHeight: 19 },
  more: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: '#92400E', marginTop: 4, minHeight: 24 },
})

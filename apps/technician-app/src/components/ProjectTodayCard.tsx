import React from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { Colors, FontSize, FontWeight } from '@/constants/theme'
import { useMyProjectToday } from '@/hooks/useProjects'
import { getNavigationUrl } from '@/utils/jobHelpers'

/**
 * Today's project site, when this technician is on a project crew: they're
 * reserved for it all day, so it leads the home screen with directions.
 */
export function ProjectTodayCard() {
  const { data: project } = useMyProjectToday()
  const reduce = useReducedMotion()
  if (!project) return null
  const url = getNavigationUrl(project.siteAddress ?? undefined, project.latitude ?? undefined, project.longitude ?? undefined)
  const others = project.crewCount - 1
  return (
    <Animated.View entering={reduce ? undefined : FadeInDown.delay(100).springify().damping(16)} style={styles.card}
      accessible accessibilityLabel={`Today you're on the ${project.name} project`}>
      <View style={styles.row}>
        <View style={styles.icon}><Ionicons name="construct" size={22} color="#fff" /></View>
        <View style={styles.body}>
          <Text style={styles.kicker}>Today you're on</Text>
          <Text style={styles.name} numberOfLines={2}>{project.name}</Text>
          {project.siteAddress ? <Text style={styles.meta} numberOfLines={2}>{project.siteAddress}</Text> : null}
          <Text style={styles.meta}>{others > 0 ? `With ${others} other${others === 1 ? '' : 's'} on the crew` : 'Just you on the crew today'}</Text>
        </View>
      </View>
      {url ? (
        <Pressable onPress={() => Linking.openURL(url).catch(() => {})} style={({ pressed }) => [styles.btn, pressed && styles.pressed]} accessibilityRole="button">
          <Ionicons name="navigate" size={18} color={Colors.textPrimary} />
          <Text style={styles.btnText}>Directions to site</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 5, borderLeftColor: Colors.warning },
  row: { flexDirection: 'row', gap: 14 },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  kicker: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 1 },
  meta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  btn: { marginTop: 14, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
})

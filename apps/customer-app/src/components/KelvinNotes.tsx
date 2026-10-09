import React, { useEffect, useState } from 'react'
import { LayoutAnimation, Platform, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { router, type Href } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Text } from '@/components/Text'
import api from '@/lib/api'
import { useCompanySettings } from '@/hooks/useCompanySettings'
import { getDismissedNotes, setDismissedNotes } from '@/lib/storage'
import { Colors, FontSize, Radius, Shadow, Spacing, tint } from '@/constants/theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface Fix { label: string; request?: string; href?: string }
interface Note { id: string; urgency: 'urgent' | 'soon'; title: string; why?: string; fixes: Fix[] }

/** Where a portal link goes in the app. Anything unknown is simply not offered. */
export function routeFor(href?: string): Href | null {
  if (!href) return null
  if (href.startsWith('/invoices')) return '/(tabs)/billing?segment=INVOICES' as Href
  if (href.startsWith('/quotes')) return '/(tabs)/billing?segment=QUOTES' as Href
  if (href.startsWith('/jobs')) return '/(tabs)/jobs' as Href
  if (href.startsWith('/messages')) return '/(tabs)/messages' as Href
  return null
}

/** Kelvin's face: two eyes on a plain blue disc. */
function Face({ hot }: { hot?: boolean }) {
  return (
    <View style={[styles.face, hot && styles.faceHot]}>
      <View style={styles.eye} /><View style={styles.eye} />
    </View>
  )
}

/**
 * Kelvin's notes on Home as a digest: one card, a line per note, tap a line to see why and what you
 * can do. Shows only for companies that have Kelvin, and only when he has something to say.
 */
export function KelvinNotes() {
  const { data: company } = useCompanySettings()
  const on = company?.features?.kelvin === true
  const [gone, setGone] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => { void getDismissedNotes().then(setGone) }, [])

  const q = useQuery<{ notes: Note[] }>({
    queryKey: ['kelvin', 'notes'],
    queryFn: async () => (await api.get('/chat/kelvin/portal')).data,
    enabled: on,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  })
  const notes = (q.data?.notes ?? []).filter((n) => !gone.includes(n.id))
  if (!on || !notes.length) return null
  const urgent = notes.filter((n) => n.urgency === 'urgent').length

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((cur) => (cur === id ? null : id))
  }
  const dismiss = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const next = [...gone, id]
    setGone(next)
    void setDismissedNotes(next)
  }

  return (
    <View style={styles.card} accessibilityLabel="From Kelvin">
      <View style={styles.head}>
        <Face hot={urgent > 0} />
        <Text style={styles.headTitle}>Kelvin has {notes.length} {notes.length === 1 ? 'thing' : 'things'} for you</Text>
        {urgent > 0 ? <View style={styles.urgentTag}><Text style={styles.urgentText}>{urgent} urgent</Text></View> : null}
      </View>

      {notes.map((n) => {
        const isOpen = open === n.id
        const hot = n.urgency === 'urgent'
        const links = n.fixes.map((f) => ({ f, to: routeFor(f.href) })).filter((x) => x.to)
        const needsTeam = n.fixes.some((f) => f.request && !f.href)
        return (
          <View key={n.id} style={[styles.row, hot && styles.rowHot]}>
            <TouchableOpacity style={styles.line} onPress={() => toggle(n.id)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
              <Face hot={hot} />
              <Text style={styles.title} numberOfLines={isOpen ? undefined : 2}>{n.title}</Text>
              <Feather name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {isOpen ? (
              <View style={styles.more}>
                {n.why ? <Text style={styles.why}>{n.why}</Text> : null}
                <View style={styles.actions}>
                  {links.map(({ f, to }, i) => (
                    <TouchableOpacity key={f.label} style={[styles.btn, i === 0 && styles.btnPrimary]} onPress={() => router.push(to as Href)}>
                      <Text style={[styles.btnText, i === 0 && styles.btnTextPrimary]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {needsTeam ? (
                    <TouchableOpacity style={[styles.btn, links.length === 0 && styles.btnPrimary]} onPress={() => router.push('/(tabs)/messages' as Href)}>
                      <Text style={[styles.btnText, links.length === 0 && styles.btnTextPrimary]}>Message the team</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => dismiss(n.id)} accessibilityRole="button">
                    <Text style={styles.dismiss}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.base, gap: Spacing.sm, ...Shadow.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: 4, paddingBottom: 2 },
  headTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  urgentTag: { backgroundColor: tint(Colors.warning, 0.14), borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
  urgentText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.warning },
  row: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface },
  rowHot: { borderColor: tint(Colors.warning, 0.4) },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, minHeight: 56 },
  title: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  more: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  why: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm },
  btn: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface },
  btnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  btnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  btnTextPrimary: { color: Colors.textInverse },
  dismiss: { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'underline', paddingHorizontal: 4 },
  face: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  faceHot: { backgroundColor: Colors.warning },
  eye: { width: 4, height: 7, borderRadius: 2, backgroundColor: Colors.white },
})

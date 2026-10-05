import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking, Animated, AccessibilityInfo } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { useCustomerDetail } from '@/hooks/useCustomer'
import { getNavigationUrl } from '@/utils/jobHelpers'
import type { Job, DispatchAssignment } from '@/types/api'

/** Minutes since an ISO time, refreshed every 30s so the label keeps up. */
function useMinutesSince(iso?: string | null) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  if (!iso) return null
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
}

/** A soft pulse on the status dot, off when the phone asks for reduced motion. */
function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return
      loop = Animated.loop(Animated.sequence([
        Animated.timing(scale, { toValue: 1.8, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]))
      loop.start()
    })
    return () => loop?.stop()
  }, [scale])
  const opacity = scale.interpolate({ inputRange: [1, 1.8], outputRange: [0.5, 0] })
  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotRing, { backgroundColor: color, opacity, transform: [{ scale }] }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  )
}

/**
 * The job the technician is driving to or working on, at the top of the home
 * screen. Everything they need next is one tap away: directions, the customer,
 * and the job itself (where they mark arrived or finish).
 */
export function ActiveJobHero({ job, assignment }: { job: Job; assignment?: DispatchAssignment }) {
  const router = useRouter()
  const { data: customer } = useCustomerDetail(job.customerId)
  const driving = job.status === 'EN_ROUTE'
  const tone = driving ? Colors.info : Colors.warning
  const toneLight = driving ? Colors.infoLight : Colors.warningLight
  const mins = useMinutesSince(driving ? assignment?.enRouteAt : assignment?.onSiteAt)
  const phone = (customer as { phone?: string } | undefined)?.phone
  const navUrl = getNavigationUrl(job.serviceAddress, job.serviceLatitude, job.serviceLongitude)
  const openJob = () => router.push(`/job/${job.id}`)

  const status = driving ? 'Driving to job' : 'On site'
  const since = mins === null ? '' : driving ? `Left ${mins} min ago` : `Working for ${mins} min`

  return (
    <View style={[styles.card, { borderColor: tone }]}>
      <TouchableOpacity onPress={openJob} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`${status}: ${job.title}. Open job`}>
        <View style={[styles.band, { backgroundColor: toneLight }]}>
          <PulseDot color={tone} />
          <Text style={[styles.status, { color: tone }]}>{status}</Text>
          {since ? <Text style={styles.since}>{since}</Text> : null}
        </View>
        <View style={styles.body}>
          <Text style={styles.jobNo}>{job.jobNumber}</Text>
          <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
          {job.customerName ? <Text style={styles.customer} numberOfLines={1}>{job.customerName}</Text> : null}
          {job.serviceAddress ? <Text style={styles.address} numberOfLines={2}>{job.serviceAddress}</Text> : null}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        {driving && navUrl ? (
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => Linking.openURL(navUrl)} accessibilityRole="button">
            <Text style={styles.btnOutlineText}>Directions</Text>
          </TouchableOpacity>
        ) : null}
        {phone ? (
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => Linking.openURL(`tel:${phone}`)} accessibilityRole="button" accessibilityLabel={`Call ${job.customerName ?? 'customer'}`}>
            <Text style={styles.btnOutlineText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, { backgroundColor: tone }]} onPress={openJob} accessibilityRole="button">
          <Text style={styles.btnPrimaryText}>{driving ? 'Open job, mark arrived' : 'Open job'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 2,
    overflow: 'hidden', ...Shadow.md,
  },
  band: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  dotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  status: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  since: { marginLeft: 'auto', fontSize: FontSize.sm, color: Colors.textSecondary },
  body: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, gap: 2 },
  jobNo: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  customer: { fontSize: FontSize.base, color: Colors.textPrimary, marginTop: 2 },
  address: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.base },
  btn: { minHeight: 48, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, alignItems: 'center', justifyContent: 'center' },
  btnOutline: { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  btnOutlineText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  btnPrimary: { flexGrow: 1 },
  btnPrimaryText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
})

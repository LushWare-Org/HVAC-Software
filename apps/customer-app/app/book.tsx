import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Text'
import MapView, { Marker, type Region } from 'react-native-maps'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { useBookService } from '@/hooks/useMyJobs'
import { useMyJobs } from '@/hooks/useMyJobs'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

/** Same morning/afternoon windows the web booking flow offers. */
const WINDOWS = [
  { key: 'morning', label: 'Morning', hour: 9, endHour: 12, range: '9am – 12pm' },
  { key: 'afternoon', label: 'Afternoon', hour: 13, endHour: 17, range: '1pm – 5pm' },
] as const

function nextDays(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

export default function BookService() {
  const book = useBookService()
  const { data: jobsData } = useMyJobs()

  // Seed the address from the customer's most recent job — for most customers
  // this is "my house", so the common path needs no typing and no map pan.
  const lastJob = useMemo(() => {
    const jobs = jobsData?.data ?? []
    return jobs.find((j) => j.serviceAddress) ?? null
  }, [jobsData])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState(lastJob?.serviceAddress ?? '')
  const [addressTouched, setAddressTouched] = useState(false)
  const [day, setDay] = useState<Date | null>(null)
  const [windowKey, setWindowKey] = useState<(typeof WINDOWS)[number]['key']>('morning')
  const [locating, setLocating] = useState(false)

  const [region, setRegion] = useState<Region>({
    latitude: lastJob?.serviceLatitude ?? 6.9271,
    longitude: lastJob?.serviceLongitude ?? 79.8612,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  })

  // Only adopt the seeded address until the customer edits it themselves.
  const effectiveAddress = addressTouched ? address : (address || lastJob?.serviceAddress || '')

  const useMyLocation = async () => {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Location off', 'Allow location access, or drag the pin to your address.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({})
      setRegion((r) => ({
        ...r,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }))
    } catch {
      Alert.alert('Could not get location', 'Drag the pin to your address instead.')
    } finally {
      setLocating(false)
    }
  }

  const canSubmit = Boolean(title.trim() && effectiveAddress.trim() && day)

  const onSubmit = () => {
    if (!canSubmit || !day) return
    const w = WINDOWS.find((x) => x.key === windowKey)!
    const preferred = new Date(day)
    preferred.setHours(w.hour, 0, 0, 0)

    book.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        serviceAddress: effectiveAddress.trim(),
        serviceLatitude: region.latitude,
        serviceLongitude: region.longitude,
        preferredStart: preferred.toISOString(),
      },
      {
        onSuccess: (job) => {
          // Land on the new job so the customer sees it exists straight away.
          router.replace(`/job/${job.id}`)
        },
        onError: (err: any) =>
          Alert.alert(
            'Could not book',
            err?.response?.data?.message ?? 'Please try again in a moment.',
          ),
      },
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Book a service" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>What do you need?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. AC not cooling"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Anything we should know? (optional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Describe the problem"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Preferred day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
            {nextDays().map((d) => {
              const active = day?.toDateString() === d.toDateString()
              return (
                <TouchableOpacity
                  key={d.toISOString()}
                  onPress={() => setDay(d)}
                  style={[styles.dayChip, active && styles.chipActive]}
                >
                  <Text style={[styles.dayChipDow, active && styles.chipTextActive]}>
                    {d.toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dayChipNum, active && styles.chipTextActive]}>
                    {d.getDate()}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <Text style={styles.label}>Preferred time</Text>
          <View style={styles.windowRow}>
            {WINDOWS.map((w) => {
              const active = windowKey === w.key
              return (
                <TouchableOpacity
                  key={w.key}
                  onPress={() => setWindowKey(w.key)}
                  style={[styles.windowChip, active && styles.chipActive]}
                >
                  <Text style={[styles.windowLabel, active && styles.chipTextActive]}>
                    {w.label}
                  </Text>
                  <Text style={[styles.windowRange, active && styles.chipTextActive]}>
                    {w.range}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={styles.label}>Service address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            placeholderTextColor={Colors.textMuted}
            value={effectiveAddress}
            onChangeText={(t) => {
              setAddressTouched(true)
              setAddress(t)
            }}
          />

          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
            >
              <Marker
                coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                draggable
                onDragEnd={(e) =>
                  setRegion((r) => ({ ...r, ...e.nativeEvent.coordinate }))
                }
              />
            </MapView>
          </View>
          <View style={styles.mapActions}>
            <Text style={styles.hint}>Drag the pin to fine-tune where we should come.</Text>
            <TouchableOpacity onPress={useMyLocation} disabled={locating}>
              <Text style={styles.link}>
                {locating ? 'Locating…' : 'Use my location'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submit, (!canSubmit || book.isPending) && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={!canSubmit || book.isPending}
          >
            {book.isPending
              ? <ActivityIndicator color={Colors.textInverse} />
              : <Text style={styles.submitText}>Request this service</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  dayRow: { flexGrow: 0 },
  dayChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    alignItems: 'center',
    minWidth: 60,
  },
  dayChipDow: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  dayChipNum: { fontSize: FontSize.lg, color: Colors.textPrimary, fontWeight: '700' },
  windowRow: { flexDirection: 'row', gap: Spacing.sm },
  windowChip: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  windowLabel: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  windowRange: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipTextActive: { color: Colors.primaryDark },
  mapWrap: {
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  map: { flex: 1 },
  mapActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  hint: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted },
  link: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  submit: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.base },
})

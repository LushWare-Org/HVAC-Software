/**
 * SetupLocation — blocking first-login step after the forced password reset.
 *
 * Admins no longer set a technician's base location when provisioning the
 * account; the technician sets it here (GPS one-tap, map pin, or address
 * search) before entering the app. Until it's saved the tech is excluded
 * from smart dispatch auto-assignment.
 *
 * Never traps the tech: if the scheduling profile already has a location,
 * or the profile can't be loaded at all, we route straight to the tabs.
 * Back gesture is disabled (gestureEnabled: false on the Stack.Screen).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps'
import { useTechnicianProfile, useUpdateBaseLocation } from '@/hooks/useProfile'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'

interface GeoResult { lat: string; lon: string; display_name: string }

const DEFAULT_REGION: Region = { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.08, longitudeDelta: 0.08 }

export default function SetupLocation() {
  const router = useRouter()
  const { data: techProfile, isLoading: profileLoading, isError: profileError } = useTechnicianProfile()
  const updateBaseLocation = useUpdateBaseLocation()

  const mapRef = useRef<MapView>(null)
  const [pin, setPin]                 = useState<{ latitude: number; longitude: number } | null>(null)
  const [address, setAddress]         = useState('')
  const [mapRegion, setMapRegion]     = useState<Region>(DEFAULT_REGION)
  const [search, setSearch]           = useState('')
  const [results, setResults]         = useState<GeoResult[]>([])
  const [searching, setSearching]     = useState(false)
  const [reversing, setReversing]     = useState(false)
  const [fetchingGps, setFetchingGps] = useState(false)
  const [saving, setSaving]           = useState(false)

  // Already located (e.g. relaunch after saving) or profile unavailable → don't trap
  useEffect(() => {
    if (profileLoading) return
    if (profileError || techProfile === null || techProfile?.currentLocation) {
      router.replace('/(tabs)')
    }
  }, [profileLoading, profileError, techProfile])

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      if (place) return [place.street, place.city, place.region].filter(Boolean).join(', ')
    } catch {}
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }, [])

  // Tap map → pin + reverse geocode
  const handleMapPress = useCallback(async (e: MapPressEvent) => {
    const coord = e.nativeEvent.coordinate
    setPin(coord)
    setResults([])
    setReversing(true)
    setMapRegion((r) => ({ ...coord, latitudeDelta: r.latitudeDelta, longitudeDelta: r.longitudeDelta }))
    const label = await reverseGeocode(coord.latitude, coord.longitude)
    setAddress(label)
    setSearch(label)
    setReversing(false)
  }, [reverseGeocode])

  // Search bar → Nominatim forward geocode → results dropdown
  const handleSearch = useCallback(async () => {
    const q = search.trim()
    if (!q) return
    setSearching(true)
    setResults([])
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'TSCRMTechApp/1.0' } },
      )
      const data: GeoResult[] = await res.json()
      setResults(data)
    } catch {
      Alert.alert('Search Failed', 'Could not search location. Check your internet connection.')
    } finally {
      setSearching(false)
    }
  }, [search])

  const handleSelectResult = useCallback((result: GeoResult) => {
    const coord = { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }
    const label = result.display_name.split(',').slice(0, 3).join(',').trim()
    setPin(coord)
    setAddress(label)
    setSearch(label)
    setResults([])
    const region: Region = { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    setMapRegion(region)
    mapRef.current?.animateToRegion(region, 500)
  }, [])

  // GPS one-tap
  const handleUseCurrentGPS = useCallback(async () => {
    setFetchingGps(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission was denied — you can still drop a pin on the map or search for your address.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setPin(coord)
      setResults([])
      const region: Region = { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 }
      setMapRegion(region)
      mapRef.current?.animateToRegion(region, 500)
      const label = await reverseGeocode(coord.latitude, coord.longitude)
      setAddress(label)
      setSearch(label)
    } catch {
      Alert.alert('Error', 'Could not get current location. Drop a pin on the map instead.')
    } finally {
      setFetchingGps(false)
    }
  }, [reverseGeocode])

  const handleSave = async () => {
    if (!pin) {
      Alert.alert('No Location', 'Use "My Location", tap the map, or search for your address first.')
      return
    }
    if (!techProfile?.id) {
      Alert.alert('Error', 'Technician profile not found. Please try again.')
      return
    }
    setSaving(true)
    try {
      await updateBaseLocation.mutateAsync({
        technicianId: techProfile.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
      })
      router.replace('/(tabs)')
    } catch {
      Alert.alert('Error', 'Failed to save your location. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>📍</Text>
          <Text style={styles.headerTitle}>Set Your Base Location</Text>
          <Text style={styles.headerSub}>
            This is where you usually start your day — dispatch uses it to assign nearby jobs.
            You can change it anytime from your Profile.
          </Text>
        </View>

        {/* GPS one-tap */}
        <TouchableOpacity
          style={[styles.gpsBtn, fetchingGps && styles.btnDisabled]}
          onPress={handleUseCurrentGPS}
          disabled={fetchingGps || saving}
        >
          {fetchingGps
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.gpsBtnText}>🎯  Use My Current Location</Text>}
        </TouchableOpacity>

        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search address or area…"
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.searchBtn, (searching || reversing) && styles.btnDisabled]}
            onPress={handleSearch}
            disabled={searching || reversing || saving}
          >
            {searching
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.searchBtnText}>🔍</Text>}
          </TouchableOpacity>
        </View>

        {/* Search results */}
        {results.length > 0 && (
          <View style={styles.results}>
            {results.map((r, i) => (
              <TouchableOpacity key={i} style={styles.resultRow} onPress={() => handleSelectResult(r)}>
                <Text style={styles.resultText} numberOfLines={2}>{r.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Map */}
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
          >
            {pin && <Marker coordinate={pin} />}
          </MapView>
        </View>
        <Text style={styles.mapHint}>Tap the map to drop or adjust the pin</Text>

        {/* Selected address */}
        {pin && (
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>SELECTED LOCATION</Text>
            <Text style={styles.addressText}>
              {reversing ? 'Resolving address…' : (address || `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`)}
            </Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, (!pin || saving) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!pin || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Save & Continue</Text>}
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  headerEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  gpsBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  gpsBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  searchRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { fontSize: FontSize.md, color: '#fff' },
  results: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  resultRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  resultText: { fontSize: FontSize.sm, color: Colors.textPrimary },
  mapWrap: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: { width: '100%', height: 300 },
  mapHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  addressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  addressLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  addressText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 19 },
  saveBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  btnDisabled: { opacity: 0.55 },
})

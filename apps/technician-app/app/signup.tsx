import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'

const SKILL_OPTIONS = [
  'HVAC', 'Plumbing', 'Electrical', 'Gas Fitting', 'Refrigeration',
  'Solar', 'Roofing', 'Carpentry', 'Painting', 'Tiling',
  'Landscaping', 'Pest Control', 'Security Systems', 'General Maintenance',
]

const TOTAL_STEPS = 3
const DEFAULT_REGION: Region = { latitude: -33.8688, longitude: 151.2093, latitudeDelta: 0.1, longitudeDelta: 0.1 }

interface GeoResult { place_id: number; display_name: string; lat: string; lon: string }

export default function SignupScreen() {
  const { registerTechnician, isLoading } = useAuth()
  const router = useRouter()
  const mapRef = useRef<MapView>(null)

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  // Step 1
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Step 3 — map
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION)
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)

  const companyId = process.env.EXPO_PUBLIC_COMPANY_ID ?? 'co-demo-001'

  // ---- Validation ----
  const validateStep = (): boolean => {
    setError('')
    if (step === 1) {
      if (!name.trim()) { setError('Full name is required'); return false }
      if (!email.trim() || !email.includes('@')) { setError('Valid email is required'); return false }
      if (!phone.trim()) { setError('Phone number is required'); return false }
      if (password.length < 8) { setError('Password must be at least 8 characters'); return false }
      if (password !== confirmPassword) { setError('Passwords do not match'); return false }
    }
    if (step === 2) {
      if (selectedSkills.length === 0) { setError('Select at least one skill'); return false }
    }
    if (step === 3) {
      if (!pin) { setError('Please drop a pin on your location or use "My Location"'); return false }
    }
    return true
  }

  const nextStep = () => { if (validateStep()) setStep(s => s + 1) }

  const toggleSkill = (skill: string) =>
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])

  // ---- Map: tap to pin ----
  const handleMapPress = useCallback(async (e: MapPressEvent) => {
    const coord = e.nativeEvent.coordinate
    setPin(coord)
    // Reverse geocode
    try {
      const [place] = await Location.reverseGeocodeAsync(coord)
      if (place) {
        setLocationLabel([place.street, place.city, place.region].filter(Boolean).join(', '))
      }
    } catch {}
  }, [])

  // ---- Map: search via Nominatim ----
  const handleSearch = useCallback(async () => {
    const q = search.trim()
    if (!q) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'TSCRMTechApp/1.0' } }
      )
      const data: GeoResult[] = await res.json()
      setSearchResults(data)
    } catch {
      setError('Search failed. Check your internet connection.')
    } finally {
      setSearching(false)
    }
  }, [search])

  const handleSelectResult = (result: GeoResult) => {
    const coord = { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }
    setPin(coord)
    setLocationLabel(result.display_name.split(',').slice(0, 3).join(','))
    const region: Region = { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    setMapRegion(region)
    mapRef.current?.animateToRegion(region, 600)
    setSearchResults([])
    setSearch('')
  }

  // ---- Map: use current location ----
  const handleMyLocation = async () => {
    setLocating(true)
    setError('')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setError('Location permission denied'); return }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setPin(coord)
      const region: Region = { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 }
      setMapRegion(region)
      mapRef.current?.animateToRegion(region, 600)
      const [place] = await Location.reverseGeocodeAsync(coord)
      if (place) setLocationLabel([place.street, place.city, place.region].filter(Boolean).join(', '))
    } catch { setError('Could not get location') }
    finally { setLocating(false) }
  }

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!validateStep()) return
    setError('')
    try {
      await registerTechnician({
        companyId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        skills: selectedSkills,
        latitude: pin!.latitude,
        longitude: pin!.longitude,
      })
      router.replace('/pending-approval')
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Registration failed')
    }
  }

  const stepTitles = ['Personal Info', 'Your Skills', 'Your Location']
  const stepSubs = ['Create your technician account', 'Select your trade skills', 'Pin your home base on the map']

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoCircle}><Text style={styles.logoIcon}>🔧</Text></View>
          <Text style={styles.brandTitle}>Join T&S</Text>
        </View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <React.Fragment key={i}>
              <View style={[styles.dot, i < step && styles.dotDone, i === step - 1 && styles.dotActive]}>
                <Text style={[styles.dotText, (i < step || i === step - 1) && styles.dotTextActive]}>
                  {i < step - 1 ? '✓' : i + 1}
                </Text>
              </View>
              {i < TOTAL_STEPS - 1 && <View style={[styles.progressLine, i < step - 1 && styles.progressLineDone]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Step title */}
        <View style={styles.titleBlock}>
          <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>
          <Text style={styles.stepSub}>{stepSubs[step - 1]}</Text>
        </View>

        {/* Error */}
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠ {error}</Text></View> : null}

        {/* ---- Step 1 ---- */}
        {step === 1 && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. David Chen" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} autoCapitalize="words" />
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>Phone *</Text>
              <TextInput style={styles.input} placeholder="(555) 000-0000" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Text style={styles.label}>Password * (min 8 chars)</Text>
              <View style={styles.passwordRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Minimum 8 characters" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)}>
                  <Text>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput style={styles.input} placeholder="Repeat password" placeholderTextColor={Colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={nextStep} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/login')} style={styles.signinLink}>
              <Text style={styles.signinLinkText}>Already have an account? <Text style={styles.signinLinkBold}>Sign In</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ---- Step 2 ---- */}
        {step === 2 && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.skillsHint}>Select all trades that apply — you can update these later.</Text>
              <View style={styles.skillGrid}>
                {SKILL_OPTIONS.map(skill => (
                  <TouchableOpacity key={skill} style={[styles.skillChip, selectedSkills.includes(skill) && styles.skillChipOn]} onPress={() => toggleSkill(skill)} activeOpacity={0.7}>
                    <Text style={[styles.skillChipText, selectedSkills.includes(skill) && styles.skillChipTextOn]}>{skill}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedSkills.length > 0 && <Text style={styles.selectedCount}>{selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected</Text>}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={nextStep} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Continue →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ---- Step 3: Map ---- */}
        {step === 3 && (
          <View style={{ flex: 1 }}>
            {/* Search bar */}
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search suburb, city, or address…"
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                {searching ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.searchBtnText}>🔍</Text>}
              </TouchableOpacity>
            </View>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.resultsDropdown}>
                <FlatList
                  data={searchResults}
                  keyExtractor={item => String(item.place_id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectResult(item)}>
                      <Text style={styles.resultIcon}>📍</Text>
                      <Text style={styles.resultText} numberOfLines={2}>{item.display_name}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.resultDivider} />}
                />
              </View>
            )}

            {/* Map */}
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {pin && (
                <Marker coordinate={pin} title="Your base location" pinColor={Colors.primary} />
              )}
            </MapView>

            {/* Bottom overlay */}
            <View style={styles.mapOverlay}>
              {pin ? (
                <View style={styles.pinInfo}>
                  <Text style={styles.pinInfoIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pinInfoLabel} numberOfLines={1}>{locationLabel || 'Location pinned'}</Text>
                    <Text style={styles.pinInfoCoords}>{pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setPin(null); setLocationLabel('') }}>
                    <Text style={styles.clearPin}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.tapHint}>Tap anywhere on the map to drop your pin</Text>
              )}

              <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation} disabled={locating}>
                {locating ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.myLocationIcon}>◎</Text>}
                <Text style={styles.myLocationText}>{locating ? 'Getting location…' : 'Use My Location'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, (!pin || isLoading) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!pin || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Submit Application ✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkBackground },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm, position: 'relative' },
  backBtn: { position: 'absolute', left: Spacing.xl, padding: Spacing.sm },
  backIcon: { fontSize: 22, color: Colors.textSecondary },
  logoCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  logoIcon: { fontSize: 18 },
  brandTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },

  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  dotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotActive: { borderColor: Colors.primary },
  dotText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  dotTextActive: { color: Colors.primary },
  progressLine: { width: 40, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  progressLineDone: { backgroundColor: Colors.primary },

  titleBlock: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  stepSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },

  errorBox: { marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.sm, padding: Spacing.md },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },

  scrollPad: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.md, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: 6, marginTop: Spacing.md },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: FontSize.base, color: Colors.textPrimary },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: Spacing.sm },

  skillsHint: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  skillChipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  skillChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  skillChipTextOn: { color: Colors.white, fontWeight: FontWeight.semibold },
  selectedCount: { fontSize: FontSize.xs, color: Colors.primary, marginTop: Spacing.md, textAlign: 'center' },

  nextBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.base + 2, alignItems: 'center', marginBottom: Spacing.md },
  nextBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  signinLink: { alignItems: 'center', marginTop: Spacing.sm },
  signinLinkText: { fontSize: FontSize.sm, color: Colors.textMuted },
  signinLinkBold: { color: Colors.primary, fontWeight: FontWeight.semibold },

  // Map step
  searchBar: { flexDirection: 'row', margin: Spacing.md, gap: 8 },
  searchInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Platform.OS === 'ios' ? Spacing.md : 8, fontSize: FontSize.sm, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, justifyContent: 'center', alignItems: 'center', minWidth: 44 },
  searchBtnText: { fontSize: 18 },

  resultsDropdown: { position: 'absolute', top: 74, left: Spacing.md, right: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, zIndex: 999, maxHeight: 220, ...Shadow.lg, borderWidth: 1, borderColor: Colors.border },
  resultItem: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, gap: 8 },
  resultIcon: { fontSize: 16, marginTop: 2 },
  resultText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  resultDivider: { height: 1, backgroundColor: Colors.border },

  mapOverlay: { backgroundColor: Colors.darkBackground, padding: Spacing.md, gap: 10 },
  tapHint: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, paddingVertical: Spacing.sm },
  pinInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.success },
  pinInfoIcon: { fontSize: 22 },
  pinInfoLabel: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  pinInfoCoords: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  clearPin: { fontSize: 18, color: Colors.textMuted, padding: 4 },

  myLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  myLocationIcon: { fontSize: 18, color: Colors.primary },
  myLocationText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  submitBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.md, paddingVertical: Spacing.base, alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  btnDisabled: { opacity: 0.4 },
})

import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile, useTechnicianProfile, useUpdateProfile, useChangePassword, useUpdateBaseLocation } from '@/hooks/useProfile'
import { useMyExpenses } from '@/hooks/useExpenses'
import { useMyReviews, useMyReviewStats } from '@/hooks/useReviews'
import { ActionButton } from '@/components/ActionButton'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getInitials, formatPhone } from '@/utils/format'

const DEFAULT_REGION: Region = { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.08, longitudeDelta: 0.08 }
interface GeoResult { place_id: number; display_name: string; lat: string; lon: string }

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { data: techProfile } = useTechnicianProfile()
  const { data: expensesData } = useMyExpenses({ limit: 5 })
  const { data: myReviews } = useMyReviews()
  const { data: reviewStats } = useMyReviewStats()
  const updateProfile      = useUpdateProfile()
  const changePassword     = useChangePassword()
  const updateBaseLocation = useUpdateBaseLocation()

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user?.name ?? '')
  const [editPhone, setEditPhone] = useState(user?.phone ?? '')

  // Base location edit mode
  const mapRef = useRef<MapView>(null)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [locPin, setLocPin]                       = useState<{ latitude: number; longitude: number } | null>(null)
  const [locAddress, setLocAddress]               = useState('')   // human-readable label
  const [locSearch, setLocSearch]                 = useState('')
  const [locResults, setLocResults]               = useState<GeoResult[]>([])
  const [locSearching, setLocSearching]           = useState(false)
  const [locReversing, setLocReversing]           = useState(false)
  const [locFetchingGps, setLocFetchingGps]       = useState(false)
  const [mapRegion, setMapRegion]                 = useState<Region>(DEFAULT_REGION)
  const [viewAddress, setViewAddress]             = useState('')   // shown in read-only view

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ name: editName, phone: editPhone })
      setIsEditing(false)
      Alert.alert('Success', 'Profile updated')
    } catch {
      Alert.alert('Error', 'Failed to update profile')
    }
  }

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }
    if (newPwd.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    try {
      await changePassword.mutateAsync({ currentPassword: currentPwd, newPassword: newPwd })
      setShowPasswordForm(false)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      Alert.alert('Success', 'Password changed successfully')
    } catch {
      Alert.alert('Error', 'Failed to change password. Check your current password.')
    }
  }

  // ── Base location handlers ────────────────────────────────────────────────

  // Reverse-geocode lat/lng → human address label
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      if (place) return [place.street, place.city, place.region].filter(Boolean).join(', ')
    } catch {}
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }, [])

  // Resolve the view-mode address label once techProfile loads
  useEffect(() => {
    const lat = techProfile?.currentLocation?.lat
    const lng = techProfile?.currentLocation?.lng
    if (lat && lng && !viewAddress) {
      reverseGeocode(lat, lng).then(setViewAddress)
    }
  }, [techProfile?.currentLocation?.lat, techProfile?.currentLocation?.lng])

  const openLocationEdit = () => {
    const lat = techProfile?.currentLocation?.lat
    const lng = techProfile?.currentLocation?.lng
    if (lat && lng) {
      const coord = { latitude: lat, longitude: lng }
      setLocPin(coord)
      setLocAddress(viewAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      const region: Region = { ...coord, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      setMapRegion(region)
    }
    setLocSearch('')
    setLocResults([])
    setIsEditingLocation(true)
  }

  // Tap map → pin + reverse geocode
  const handleMapPress = useCallback(async (e: MapPressEvent) => {
    const coord = e.nativeEvent.coordinate
    setLocPin(coord)
    setLocReversing(true)
    const region: Region = { ...coord, latitudeDelta: mapRegion.latitudeDelta, longitudeDelta: mapRegion.longitudeDelta }
    setMapRegion(region)
    const label = await reverseGeocode(coord.latitude, coord.longitude)
    setLocAddress(label)
    setLocSearch(label)
    setLocReversing(false)
  }, [mapRegion, reverseGeocode])

  // Search bar → Nominatim forward geocode → results dropdown
  const handleLocSearch = useCallback(async () => {
    const q = locSearch.trim()
    if (!q) return
    setLocSearching(true)
    setLocResults([])
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'TSCRMTechApp/1.0' } },
      )
      const data: GeoResult[] = await res.json()
      setLocResults(data)
    } catch {
      Alert.alert('Search Failed', 'Could not search location. Check your internet connection.')
    } finally {
      setLocSearching(false)
    }
  }, [locSearch])

  // Tap a search result
  const handleSelectLocResult = useCallback((result: GeoResult) => {
    const coord = { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }
    const label = result.display_name.split(',').slice(0, 3).join(',').trim()
    setLocPin(coord)
    setLocAddress(label)
    setLocSearch(label)
    setLocResults([])
    const region: Region = { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 }
    setMapRegion(region)
    mapRef.current?.animateToRegion(region, 500)
  }, [])

  // GPS button
  const handleUseCurrentGPS = useCallback(async () => {
    setLocFetchingGps(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      setLocPin(coord)
      const region: Region = { ...coord, latitudeDelta: 0.04, longitudeDelta: 0.04 }
      setMapRegion(region)
      mapRef.current?.animateToRegion(region, 500)
      const label = await reverseGeocode(coord.latitude, coord.longitude)
      setLocAddress(label)
      setLocSearch(label)
    } catch {
      Alert.alert('Error', 'Could not get current location.')
    } finally {
      setLocFetchingGps(false)
    }
  }, [reverseGeocode])

  const handleSaveLocation = async () => {
    if (!locPin) {
      Alert.alert('No Pin', 'Tap the map, search, or use GPS to drop a pin first.')
      return
    }
    if (!techProfile?.id) {
      Alert.alert('Error', 'Technician profile not found. Please try again later.')
      return
    }
    try {
      await updateBaseLocation.mutateAsync({
        technicianId: techProfile.id,
        latitude: locPin.latitude,
        longitude: locPin.longitude,
      })
      setViewAddress(locAddress || `${locPin.latitude.toFixed(5)}, ${locPin.longitude.toFixed(5)}`)
      setIsEditingLocation(false)
      Alert.alert('Saved', 'Base location updated successfully.')
    } catch {
      Alert.alert('Error', 'Failed to update base location. Please try again.')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout()
          router.replace('/login')
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name ?? 'Technician'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>

          {/* Rating + Stats */}
          {techProfile && (
            <View style={styles.statsRow}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>
                  {'⭐'.repeat(Math.round(techProfile.rating || 0))}
                </Text>
                <Text style={styles.profileStatLabel}>
                  {techProfile.rating?.toFixed(1) ?? '—'} ({techProfile.totalRatings} reviews)
                </Text>
              </View>
            </View>
          )}

          {/* Skills */}
          {techProfile?.skills && techProfile.skills.length > 0 && (
            <View style={styles.skillsRow}>
              {techProfile.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Personal Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editBtn}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
              />
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
              <ActionButton
                label="Save Changes"
                onPress={handleSaveProfile}
                loading={updateProfile.isPending}
                fullWidth
              />
            </View>
          ) : (
            <View style={styles.infoList}>
              <InfoRow label="Name" value={user?.name ?? '—'} />
              <InfoRow label="Email" value={user?.email ?? '—'} />
              <InfoRow label="Phone" value={formatPhone(user?.phone)} />
              <InfoRow label="Role" value="Technician" />
            </View>
          )}
        </View>

        {/* Base Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Base Location</Text>
            {!isEditingLocation && (
              <TouchableOpacity onPress={openLocationEdit}>
                <Text style={styles.editBtn}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditingLocation ? (
            <View style={[styles.editForm, { padding: 0, overflow: 'hidden' }]}>

              {/* ── Search bar ── */}
              <View style={styles.locSearchRow}>
                <TextInput
                  style={[styles.textInput, styles.locSearchInput]}
                  value={locSearch}
                  onChangeText={setLocSearch}
                  placeholder={locReversing ? 'Resolving address…' : 'Search suburb, city, address…'}
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="search"
                  onSubmitEditing={handleLocSearch}
                  editable={!locReversing}
                />
                <TouchableOpacity
                  style={[styles.locSearchBtn, (locSearching || locReversing) && styles.locSearchBtnDisabled]}
                  onPress={handleLocSearch}
                  disabled={locSearching || locReversing}
                >
                  {locSearching
                    ? <ActivityIndicator size="small" color={Colors.white} />
                    : <Text style={styles.locSearchBtnText}>🔍</Text>}
                </TouchableOpacity>
              </View>

              {/* ── Search results dropdown ── */}
              {locResults.length > 0 && (
                <FlatList
                  data={locResults}
                  keyExtractor={item => String(item.place_id)}
                  style={styles.locResultsList}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.locResultItem}
                      onPress={() => handleSelectLocResult(item)}
                    >
                      <Text style={styles.locResultIcon}>📍</Text>
                      <Text style={styles.locResultText} numberOfLines={2}>{item.display_name}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.locResultDivider} />}
                />
              )}

              {/* ── Map ── */}
              <MapView
                ref={mapRef}
                style={styles.locMap}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
              >
                {locPin && (
                  <Marker coordinate={locPin} pinColor={Colors.primary} title="Base location" />
                )}
              </MapView>

              {/* ── Pin info bar ── */}
              <View style={styles.locPinBar}>
                {locPin ? (
                  <>
                    <Text style={styles.locPinIcon}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locPinAddress} numberOfLines={1}>
                        {locReversing ? 'Resolving address…' : (locAddress || 'Location pinned')}
                      </Text>
                      <Text style={styles.locPinCoords}>
                        {locPin.latitude.toFixed(5)}, {locPin.longitude.toFixed(5)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => { setLocPin(null); setLocAddress(''); setLocSearch('') }}>
                      <Text style={styles.locClearBtn}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.locTapHint}>Tap anywhere on the map to drop your pin</Text>
                )}
              </View>

              {/* ── Bottom actions ── */}
              <View style={styles.locActions}>
                <TouchableOpacity
                  style={[styles.gpsBtn, locFetchingGps && { opacity: 0.6 }]}
                  onPress={handleUseCurrentGPS}
                  disabled={locFetchingGps}
                >
                  {locFetchingGps
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <Text style={styles.gpsBtnIcon}>◎</Text>}
                  <Text style={styles.gpsBtnText}>
                    {locFetchingGps ? 'Getting GPS…' : 'Use My Current Location'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.locationHint}>
                  Your base location helps the dispatch system assign nearby jobs to you.
                </Text>

                <View style={styles.pwdBtns}>
                  <ActionButton
                    label="Cancel"
                    variant="outline"
                    size="sm"
                    onPress={() => { setIsEditingLocation(false); setLocResults([]) }}
                  />
                  <ActionButton
                    label="Save Location"
                    size="sm"
                    onPress={handleSaveLocation}
                    loading={updateBaseLocation.isPending}
                  />
                </View>
              </View>

            </View>
          ) : (
            <View style={styles.infoList}>
              {techProfile?.currentLocation ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {viewAddress || `${techProfile.currentLocation.lat?.toFixed(5)}, ${techProfile.currentLocation.lng?.toFixed(5)}`}
                  </Text>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoValue, { color: Colors.textMuted, fontStyle: 'italic' }]}>
                    No base location set — tap Edit to set one.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Expenses Quick Access */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/expense/create')}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Expenses</Text>
            <Text style={styles.menuSubtitle}>
              {expensesData?.meta?.total ?? 0} total expenses
            </Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        {/* My Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Reviews</Text>
            {reviewStats && reviewStats.totalRatings > 0 && (
              <Text style={styles.reviewsAggregate}>
                ⭐ {reviewStats.avgRating.toFixed(1)} · {reviewStats.totalRatings}
              </Text>
            )}
          </View>

          {(!myReviews || myReviews.length === 0) ? (
            <View style={styles.reviewsEmpty}>
              <Text style={styles.reviewsEmptyIcon}>⭐</Text>
              <Text style={styles.reviewsEmptyTitle}>No reviews yet</Text>
              <Text style={styles.reviewsEmptySub}>
                Complete jobs to start receiving customer feedback.
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {myReviews.slice(0, 10).map((rv) => (
                <View key={rv.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardTop}>
                    <Text style={styles.reviewStars}>
                      {'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(rv.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {rv.customerName && (
                    <Text style={styles.reviewCustomer}>{rv.customerName}</Text>
                  )}
                  {rv.comment ? (
                    <Text style={styles.reviewComment}>"{rv.comment}"</Text>
                  ) : (
                    <Text style={styles.reviewCommentEmpty}>No comment</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          {showPasswordForm ? (
            <View style={styles.editForm}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                secureTextEntry
                placeholder="Enter current password"
              />
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry
                placeholder="Enter new password"
              />
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry
                placeholder="Confirm new password"
              />
              <View style={styles.pwdBtns}>
                <ActionButton
                  label="Cancel"
                  variant="outline"
                  size="sm"
                  onPress={() => setShowPasswordForm(false)}
                />
                <ActionButton
                  label="Change Password"
                  size="sm"
                  onPress={handleChangePassword}
                  loading={changePassword.isPending}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowPasswordForm(true)}
            >
              <Text style={styles.menuIcon}>🔒</Text>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Change Password</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarLargeText: {
    color: Colors.white,
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: FontSize.base,
  },
  profileStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  skillChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  skillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  editBtn: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  editForm: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
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
  infoList: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 22,
    color: Colors.textMuted,
  },
  pwdBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  logoutBtn: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
  },
  reviewsAggregate: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#D97706',
  },
  reviewsEmpty: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewsEmptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
    opacity: 0.4,
  },
  reviewsEmptyTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  reviewsEmptySub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  reviewsList: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewStars: {
    fontSize: FontSize.base,
    color: '#F59E0B',
    letterSpacing: 1,
  },
  reviewDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  reviewCustomer: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  reviewCommentEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  // ── Location map picker styles ──────────────────────────────────────────────
  locSearchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locSearchInput: {
    flex: 1,
    marginBottom: 0,
  },
  locSearchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  locSearchBtnDisabled: {
    opacity: 0.5,
  },
  locSearchBtnText: {
    fontSize: 16,
  },
  locResultsList: {
    maxHeight: 160,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  locResultIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  locResultText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  locResultDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.base,
  },
  locMap: {
    height: 220,
    width: '100%',
  },
  locPinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 52,
  },
  locPinIcon: {
    fontSize: 18,
  },
  locPinAddress: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  locPinCoords: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  locClearBtn: {
    fontSize: 16,
    color: Colors.textMuted,
    padding: Spacing.xs,
  },
  locTapHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },
  locActions: {
    padding: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  gpsBtnIcon: {
    fontSize: 16,
  },
  gpsBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  locationHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
})

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile, useTechnicianProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile'
import { useMyExpenses } from '@/hooks/useExpenses'
import { ActionButton } from '@/components/ActionButton'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { getInitials, formatPhone } from '@/utils/format'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { data: techProfile } = useTechnicianProfile()
  const { data: expensesData } = useMyExpenses({ limit: 5 })
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(user?.name ?? '')
  const [editPhone, setEditPhone] = useState(user?.phone ?? '')

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
})

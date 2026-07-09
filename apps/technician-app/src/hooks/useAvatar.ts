/**
 * useAvatar — technician profile photo (shown to customers in en-route emails).
 *
 * Picks from camera or gallery, resizes client-side to 512×512 JPEG (~50 KB)
 * so uploads are fast on field connections, and posts to /crm/users/me/avatar.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as SecureStore from 'expo-secure-store'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'

// Photo picked during signup, before the account can authenticate (pending
// approval). Uploaded automatically after the first successful login.
const PENDING_AVATAR_KEY = 'pending_avatar_uri'

export async function pickAvatarImage(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return null
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    })
    return res.canceled ? null : res.assets[0].uri
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return null
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  })
  return res.canceled ? null : res.assets[0].uri
}

/** Resize/compress to a square 512px JPEG suitable for an email avatar. */
export async function prepareAvatar(uri: string): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512, height: 512 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  )
  return out.uri
}

async function uploadAvatarUri(uri: string) {
  const prepared = await prepareAvatar(uri)
  const form = new FormData()
  // React Native FormData file part: {uri, name, type}
  form.append('file', { uri: prepared, name: 'avatar.jpg', type: 'image/jpeg' } as any)
  const res = await api.post('/crm/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30_000,
  })
  return res.data
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: uploadAvatarUri,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  })
}

export function useRemoveAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.delete('/crm/users/me/avatar')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  })
}

// ---- Signup-time photo (deferred upload) ----

export async function stashPendingAvatar(uri: string): Promise<void> {
  try { await SecureStore.setItemAsync(PENDING_AVATAR_KEY, uri) } catch { /* best-effort */ }
}

export async function popPendingAvatar(): Promise<string | null> {
  try {
    const uri = await SecureStore.getItemAsync(PENDING_AVATAR_KEY)
    if (uri) await SecureStore.deleteItemAsync(PENDING_AVATAR_KEY)
    return uri
  } catch {
    return null
  }
}

/** Upload a photo stashed at signup, if any. Called once after login. */
export async function uploadPendingAvatarIfAny(): Promise<boolean> {
  const uri = await popPendingAvatar()
  if (!uri) return false
  try {
    await uploadAvatarUri(uri)
    return true
  } catch {
    // Local file may be gone or network flaky — the reminder banner covers it.
    return false
  }
}

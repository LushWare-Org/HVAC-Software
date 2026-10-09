import React from 'react'
import { useSegments } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import KelvinOrb from './KelvinOrb'
import KelvinSheet from './KelvinSheet'
import { useKelvin } from './KelvinProvider'

/** Screens without Kelvin: before sign-in and while setting up the account. */
const WITHOUT = new Set(['login', 'signup', 'pending-approval', 'force-reset-password', 'setup-location', 'expense'])

/** Kelvin over the whole app, once signed in, for companies that have him. */
export default function KelvinLayer() {
  const { isAuthenticated } = useAuth()
  const k = useKelvin()
  const first = useSegments()[0] as string | undefined
  if (!isAuthenticated || !k?.enabled || !first || WITHOUT.has(first)) return null
  return (
    <>
      <KelvinOrb />
      <KelvinSheet />
    </>
  )
}

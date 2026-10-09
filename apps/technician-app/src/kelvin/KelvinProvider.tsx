import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useCompanyBranding } from '@/hooks/useCompanyBranding'
import type { ScreenJob } from './useKelvinChat'

/** Read replies aloud: remembered on this phone. MMKV can be missing on old builds; then it just isn't remembered. */
const prefs: { getBoolean(k: string): boolean | undefined; set(k: string, v: boolean): void } = (() => {
  try {
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv')
    return new MMKV({ id: 'kelvin' })
  } catch {
    const mem = new Map<string, boolean>()
    return { getBoolean: (k: string) => mem.get(k), set: (k: string, v: boolean) => { mem.set(k, v) } }
  }
})()

interface Kelvin {
  enabled: boolean
  isOpen: boolean
  /** Opens Kelvin, optionally asking him something, or listening straight away. */
  open: (o?: { ask?: string; listen?: boolean }) => void
  close: () => void
  /** What to do when the sheet opens; taken once. */
  takeRequest: () => { ask?: string; listen?: boolean } | null
  screenJob: ScreenJob | null
  setScreenJob: (job: ScreenJob | null) => void
  readAloud: boolean
  setReadAloud: (on: boolean) => void
}

const Ctx = createContext<Kelvin | null>(null)

export function KelvinProvider({ children }: { children: React.ReactNode }) {
  const { data: company } = useCompanyBranding()
  const [isOpen, setOpen] = useState(false)
  const [request, setRequest] = useState<{ ask?: string; listen?: boolean } | null>(null)
  const [screenJob, setScreenJob] = useState<ScreenJob | null>(null)
  const [readAloud, setReadAloudState] = useState(() => prefs.getBoolean('readAloud') ?? true)

  const open = useCallback((o?: { ask?: string; listen?: boolean }) => { setRequest(o ?? null); setOpen(true) }, [])
  const close = useCallback(() => setOpen(false), [])
  const takeRequest = useCallback(() => { const r = request; setRequest(null); return r }, [request])
  const setReadAloud = useCallback((on: boolean) => { setReadAloudState(on); prefs.set('readAloud', on) }, [])

  const value = useMemo(() => ({
    enabled: company?.kelvin === true, isOpen, open, close, takeRequest, screenJob, setScreenJob, readAloud, setReadAloud,
  }), [company?.kelvin, isOpen, open, close, takeRequest, screenJob, readAloud, setReadAloud])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useKelvin(): Kelvin | null {
  return useContext(Ctx)
}

/** A screen showing one job tells Kelvin, so "this job" means it. */
export function useKelvinScreenJob(job: ScreenJob | null) {
  const k = useContext(Ctx)
  const key = job?.id ?? ''
  React.useEffect(() => {
    if (!k || !job) return
    k.setScreenJob(job)
    return () => k.setScreenJob(null)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
}

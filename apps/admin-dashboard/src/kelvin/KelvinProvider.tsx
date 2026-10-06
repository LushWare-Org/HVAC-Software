import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useCompanySettings } from '../hooks/useCompanySettings'
import { useDispatchWebSocket } from '../hooks/useScheduling'
import { useSocket } from '../hooks/useSocket'
import { ASK_ASSISTANT_EVENT } from '../lib/assistant'
import { fetchFeed, postEvent, savePrefs } from './api'
import { SpokenStore } from './speech'
import { Placement, type Side } from './placement'
import type { Mood } from './KelvinFace'
import type { KelvinFeed, KelvinFix, KelvinItem, KelvinPrefs, PageContext } from './types'

export const isKelvinOn = (features: Record<string, unknown> | undefined | null) => features?.kelvin === true
const OFFICE = new Set(['super_admin', 'company_admin', 'office_manager', 'dispatcher'])
const LIVE = new Set(['JOB_CHANGED', 'AVAILABILITY_CHANGED', 'ASSIGNMENT_CREATED', 'ASSIGNMENT_STATUS_CHANGED'])

type Ctx = ReturnType<typeof useKelvinState>
const KelvinContext = createContext<Ctx | null>(null)
/** Read without throwing, for hooks that must work when Kelvin is off. */
export const KelvinContextForPages = KelvinContext

export function useKelvin(): Ctx {
  const v = useContext(KelvinContext)
  if (!v) throw new Error('useKelvin outside KelvinProvider')
  return v
}

function useKelvinState() {
  const { user } = useAuth()
  const { data: settings } = useCompanySettings()
  const enabled = isKelvinOn(settings?.features) && OFFICE.has(String(user?.role ?? '').toLowerCase())
  const qc = useQueryClient()

  const feedQ = useQuery<KelvinFeed>({
    queryKey: ['kelvin', 'feed'],
    queryFn: fetchFeed,
    enabled,
    refetchInterval: 60_000,
    staleTime: 10_000,
    retry: 1,
  })

  // useQuery returns a new object every render; its refetch is stable. Depending on
  // the object made every callback (and so every consumer) change on every render.
  const refetch = feedQ.refetch

  // Instant for important things: re-check on live signals, at most once per 1.5 s,
  // and only in a tab someone can see (hidden tabs catch up when shown).
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refresh = useCallback(() => {
    if (!enabled || timer.current || document.visibilityState === 'hidden') return
    timer.current = setTimeout(() => { timer.current = null; void refetch() }, 1500)
  }, [enabled, refetch])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  useEffect(() => {
    if (!enabled) return
    const onShow = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [enabled, refresh])
  // The live sockets are opened by <KelvinLiveSignals>, mounted only when Kelvin is on,
  // so companies without Kelvin never open extra connections.

  const [panelOpen, setPanelOpen] = useState(false)
  // The side Kelvin lives on; his panel opens there too.
  const [side, setSide] = useState<Side>(() => Placement.load(user?.id ?? '').side)
  const [pending, setPending] = useState<string | null>(null)
  const [page, setPage] = useState<PageContext | null>(null)
  const [moodFlash, setMoodFlash] = useState<Mood | null>(null)
  const [lookTarget, setLookTarget] = useState<{ x: number; y: number } | null>(null)

  const openPanel = useCallback((message?: string) => { if (message) setPending(message); setPanelOpen(true); void refetch() }, [refetch])
  const closePanel = useCallback(() => setPanelOpen(false), [])
  const takePending = useCallback(() => { const p = pending; setPending(null); return p }, [pending])

  useEffect(() => { document.body.classList.toggle('kelvin-on', enabled); return () => document.body.classList.remove('kelvin-on') }, [enabled])
  // The page narrows beside the panel (CSS on body.kelvin-open).
  useEffect(() => {
    document.body.classList.toggle('kelvin-open', panelOpen)
    document.body.classList.toggle('kelvin-left', side === 'left')
    return () => document.body.classList.remove('kelvin-open', 'kelvin-left')
  }, [panelOpen, side])

  // "Ask the assistant" buttons anywhere still work: they now open Kelvin.
  useEffect(() => {
    if (!enabled) return
    const onAsk = (e: Event) => { const m = (e as CustomEvent<{ message?: string }>).detail?.message; if (m) openPanel(m) }
    window.addEventListener(ASK_ASSISTANT_EVENT, onAsk)
    return () => window.removeEventListener(ASK_ASSISTANT_EVENT, onAsk)
  }, [enabled, openPanel])

  // ⌘K / Ctrl+K anywhere; Esc closes.
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPanelOpen(o => !o) }
      else if (e.key === 'Escape' && panelOpen) setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, panelOpen])

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashMood = useCallback((m: Mood, ms = 2500) => {
    setMoodFlash(m)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setMoodFlash(null), ms)
  }, [])

  const items = feedQ.data?.items ?? []
  const unseen = items.filter(i => !i.seen && i.urgency !== 'quiet')
  // Offline: the feed fails and what we hold is missing or more than 3 minutes old.
  const feedState: 'ready' | 'loading' | 'offline' =
    feedQ.isError && (!feedQ.data || Date.now() - feedQ.dataUpdatedAt > 180_000) ? 'offline'
      : feedQ.isPending ? 'loading' : 'ready'
  const mood: Mood = moodFlash
    ?? (feedState === 'offline' ? 'asleep'
      : feedQ.isFetching && panelOpen ? 'thinking'
      : unseen.some(i => i.urgency === 'urgent') ? 'urgent'
      : unseen.length ? 'news' : 'idle')

  const lookTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lookAtItem = useCallback((itemId: string | null) => {
    document.querySelectorAll('.kelvin-looked').forEach(el => el.classList.remove('kelvin-looked'))
    if (lookTimer.current) clearTimeout(lookTimer.current)
    if (!itemId) { setLookTarget(null); return }
    const el = document.querySelector<HTMLElement>(`[data-kelvin-item="${CSS.escape(itemId)}"]`)
    if (!el) { setLookTarget(null); return }
    const r = el.getBoundingClientRect()
    setLookTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    el.classList.add('kelvin-looked')
    lookTimer.current = setTimeout(() => { el.classList.remove('kelvin-looked'); setLookTarget(null) }, 2000)
  }, [])

  const patchItems = (fn: (i: KelvinItem) => KelvinItem | null) =>
    qc.setQueryData<KelvinFeed>(['kelvin', 'feed'], f => f ? { ...f, items: f.items.map(fn).filter(Boolean) as KelvinItem[] } : f)

  const markSpoken = useCallback((item: KelvinItem) => {
    if (user?.id) SpokenStore.add(user.id, item.id)
    postEvent({ type: 'SPOKE', itemId: item.id, summary: item.title })
    patchItems(i => (i.id === item.id ? { ...i, spoken: true } : i))
  }, [user?.id])
  const markSeen = useCallback((ids: string[]) => {
    const fresh = items.filter(i => ids.includes(i.id) && !i.seen)
    if (!fresh.length) return
    fresh.forEach(i => postEvent({ type: 'SHOWN', itemId: i.id, summary: i.title }))
    const set = new Set(fresh.map(i => i.id))
    patchItems(i => (set.has(i.id) ? { ...i, seen: true } : i))
  }, [items])
  const dismiss = useCallback((item: KelvinItem) => {
    postEvent({ type: 'DISMISSED', itemId: item.id, summary: item.title })
    patchItems(i => (i.id === item.id ? null : i))
  }, [])
  const applyFix = useCallback((item: KelvinItem, fix: KelvinFix) => {
    postEvent({ type: 'FIX_USED', itemId: item.id, summary: fix.label })
    openPanel(fix.request)
  }, [openPanel])
  const setPrefs = useCallback(async (p: Partial<KelvinPrefs>) => {
    const saved = await savePrefs(p)
    qc.setQueryData<KelvinFeed>(['kelvin', 'feed'], f => (f ? { ...f, prefs: saved } : f))
  }, [qc])

  const feed = feedQ.data
  const userId = user?.id ?? ''
  // Explicit dependencies: the value changes only when something a consumer reads changes.
  return useMemo(() => ({
    enabled, feed, feedState, unavailable: feed?.unavailable ?? [], userId,
    panelOpen, openPanel, closePanel, pending, takePending, side, setSide,
    page, setPage, mood, flashMood, lookTarget, lookAtItem,
    markSpoken, markSeen, dismiss, applyFix, setPrefs, refresh,
  }), [enabled, feed, feedState, userId, panelOpen, openPanel, closePanel, pending, takePending, side,
    page, mood, flashMood, lookTarget, lookAtItem, markSpoken, markSeen, dismiss, applyFix, setPrefs, refresh])
}

/** What pages need to say what is on screen. Stable, so declaring a page never re-renders it. */
export const KelvinPageContext = createContext<{ enabled: boolean; setPage: (p: PageContext | null) => void } | null>(null)

/** Opens the live channels and asks for a refresh on the important ones. Mounted only when Kelvin is on. */
function KelvinLiveSignals({ refresh }: { refresh: () => void }) {
  useDispatchWebSocket((e) => { if (LIVE.has(e.type)) refresh() })
  // The socket is created after mount, so subscribe again once it connects.
  const { onThreadsChanged, isConnected } = useSocket()
  useEffect(() => onThreadsChanged(() => refresh()), [onThreadsChanged, isConnected, refresh])
  return null
}

export function KelvinProvider({ children }: { children: ReactNode }) {
  const value = useKelvinState()
  const pageApi = useMemo(() => ({ enabled: value.enabled, setPage: value.setPage }), [value.enabled, value.setPage])
  return (
    <KelvinContext.Provider value={value}>
      <KelvinPageContext.Provider value={pageApi}>
        {value.enabled && <KelvinLiveSignals refresh={value.refresh} />}
        {children}
      </KelvinPageContext.Provider>
    </KelvinContext.Provider>
  )
}

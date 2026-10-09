import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { keys } from '../hooks/keys'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../contexts/CompanyContext'
import KelvinFace from './KelvinFace'
import { openKelvin } from './KelvinChat'

const dismissedCount = (userId?: string, ids: string[] = []) => {
  try {
    const gone: string[] = JSON.parse(localStorage.getItem(`kvp:dismissed:${userId ?? ''}`) ?? '[]')
    return ids.filter(id => !gone.includes(id)).length
  } catch { return ids.length }
}

/**
 * Kelvin in the top bar: his face (how many things he has for you, and where to see them) and
 * "Ask anything", which opens his panel. Ctrl or Cmd K opens it from anywhere.
 */
export default function KelvinPill() {
  const { user } = useAuth()
  const { settings } = useCompany()
  const navigate = useNavigate()
  const on = settings?.features?.kelvin === true
  const [, tick] = useState(0)
  const q = useQuery<{ notes: Array<{ id: string; urgency: string }> }>({
    queryKey: keys.kelvinNotes(),
    queryFn: async () => (await api.get('/chat/kelvin/portal')).data,
    enabled: on,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!on) return
    const refresh = () => tick(n => n + 1)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openKelvin() }
    }
    window.addEventListener('kvp:dismissed', refresh)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('kvp:dismissed', refresh); window.removeEventListener('keydown', onKey) }
  }, [on])

  if (!on) return null
  const notes = q.data?.notes ?? []
  const needs = dismissedCount(user?.id, notes.map(n => n.id))
  const urgent = notes.some(n => n.urgency === 'urgent')
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <div className="kvp-pill">
      <button type="button" className="kvp-pill-who" onClick={() => navigate('/')} aria-label={`Kelvin${needs ? `, ${needs} for you` : ''}`} title="See what Kelvin has for you">
        <KelvinFace size={32} mood={needs ? (urgent ? 'urgent' : 'news') : 'idle'} />
        <span className="kvp-pill-name">Kelvin</span>
        {needs > 0 && <span className="kvp-pill-count">{needs}</span>}
      </button>
      <button type="button" className="kvp-pill-ask" onClick={openKelvin}>
        Ask anything <kbd>{mac ? '\u2318K' : 'Ctrl K'}</kbd>
      </button>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useKelvin } from './KelvinProvider'
import KelvinFace from './KelvinFace'

/** Kelvin in the top bar on every page: his face opens his desk, "Ask anything" opens his panel. */
export default function KelvinPill() {
  const k = useKelvin()
  const navigate = useNavigate()
  if (!k.enabled) return null
  const needs = (k.feed?.items ?? []).filter(i => i.urgency !== 'quiet').length
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <div className="kv-pill">
      <button type="button" className="kv-pill-who" onClick={() => navigate('/kelvin')} aria-label={`Kelvin's desk${needs ? `, ${needs} need you` : ''}`}>
        <KelvinFace size={32} mood={k.mood} />
        <span className="kv-pill-name">Kelvin</span>
        {needs > 0 && <span className="kv-pill-count">{needs}</span>}
      </button>
      <button type="button" className="kv-pill-ask" onClick={() => k.openPanel()}>
        Ask anything <kbd>{mac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
    </div>
  )
}

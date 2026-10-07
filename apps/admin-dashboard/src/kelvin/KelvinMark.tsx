import { useContext, type ReactNode } from 'react'
import { KelvinContextForPages } from './KelvinProvider'
import KelvinFace from './KelvinFace'

/** True when the company has Kelvin, so the product's AI is shown as his. */
export function useKelvinOn(): boolean {
  return useContext(KelvinContextForPages)?.enabled === true
}

/**
 * Kelvin's mark on AI work: his face and a short label. Companies without
 * Kelvin see exactly what they saw before (fallback).
 */
export default function KelvinMark({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  if (!useKelvinOn()) return <>{fallback}</>
  return (
    <span className="kv-mark">
      <KelvinFace size={20} mood="idle" />
      <span className="kv-mark-label">{children}</span>
    </span>
  )
}

/** Hands an AI suggestion to Kelvin: he explains it and prepares the action on a card. Hidden without Kelvin. */
export function AskKelvin({ request, className = 'btn btn-secondary btn-sm' }: { request: string; className?: string }) {
  const k = useContext(KelvinContextForPages)
  if (!k?.enabled) return null
  return (
    <button type="button" className={`${className} kv-ask-btn`} onClick={e => { e.stopPropagation(); k.openPanel(request) }}>
      <KelvinFace size={20} mood="idle" />
      Ask Kelvin
    </button>
  )
}

/** Kelvin's face in place of a small AI icon, for companies with Kelvin. */
export function KelvinIcon({ fallback }: { fallback: ReactNode }) {
  return useKelvinOn() ? <KelvinFace size={20} mood="idle" /> : <>{fallback}</>
}

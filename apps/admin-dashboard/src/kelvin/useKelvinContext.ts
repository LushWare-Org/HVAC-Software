import { useContext, useEffect } from 'react'
import type { PageContext } from './types'
import { KelvinPageContext } from './KelvinProvider'

/** A page says what is on screen, so "this job" means something. No-op when Kelvin is off. */
export function useKelvinContext(p: PageContext | null) {
  const k = useContext(KelvinPageContext)
  const key = JSON.stringify(p)
  useEffect(() => {
    if (!k?.enabled) return
    k.setPage(p)
    return () => k.setPage(null)
  }, [key, k?.enabled])
}

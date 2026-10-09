import { useEffect, useState } from 'react'

/**
 * useState that survives leaving the page, switching tabs and opening a new
 * window: kept in localStorage under `tscrm.ui.<key>`. Storage that is blocked
 * or full just means it starts from the default, never an error.
 */
export function usePersistentState<T>(key: string, initial: T, isValid: (v: unknown) => v is T = (v): v is T => v !== undefined && v !== null) {
  const storageKey = `tscrm.ui.${key}`
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw !== null) {
        const parsed = JSON.parse(raw)
        if (isValid(parsed)) return parsed
      }
    } catch { /* default */ }
    return initial
  })
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(value)) } catch { /* not remembered */ }
  }, [storageKey, value])
  return [value, setValue] as const
}

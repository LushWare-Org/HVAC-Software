/**
 * The width the page actually has to work with: the main content column, not
 * the browser window. Opening Kelvin's panel (or collapsing the sidebar) changes
 * it while the window stays the same, so layouts that must stay on one row ask
 * this instead of using viewport media queries.
 */
import { useSyncExternalStore } from 'react'

let width = typeof window !== 'undefined' ? window.innerWidth : 1440
const listeners = new Set<() => void>()
let observer: ResizeObserver | null = null
let watched: Element | null = null

function watch() {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return
  const el = document.querySelector('.main-content')
  if (!el || el === watched) return
  observer?.disconnect()
  watched = el
  observer = new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width)
    if (w !== width) { width = w; listeners.forEach((l) => l()) }
  })
  observer.observe(el)
}

function subscribe(l: () => void) {
  listeners.add(l)
  watch()
  // The main column may mount after the first subscriber (e.g. the top bar).
  const retry = window.setTimeout(watch, 0)
  return () => { listeners.delete(l); window.clearTimeout(retry) }
}

export function useMainWidth(): number {
  return useSyncExternalStore(subscribe, () => width, () => 1440)
}

/** Below this the top bar and page headers switch to their compact forms. */
export const COMPACT_MAIN_WIDTH = 1240

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { APP_LINKS } from '../data/site'

/** "Log in" button in the top bar. Opens a small menu with the two apps. */
export default function LoginMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-md border px-4 py-2.5 font-display text-sm font-semibold tracking-tight transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2',
          open
            ? 'border-navy-950 bg-navy-50 text-ink'
            : 'border-navy-200 bg-white text-ink hover:border-navy-950 hover:bg-navy-50',
        )}
      >
        Log in
        <ChevronDown className={clsx('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <div
        role="menu"
        aria-label="Log in to HVACtor.ai"
        className={clsx(
          'absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-block transition duration-150',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        {APP_LINKS.map((app) => {
          const Icon = app.icon
          return (
            <a
              key={app.id}
              href={app.href}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-navy-50 focus:bg-navy-50 focus:outline-none"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-navy-900 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-ink">{app.name}</span>
                  <ArrowUpRight className="h-4 w-4 flex-none text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-navy-700" />
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{app.audience}</span>
                <span className="mt-1 block font-mono text-xs text-navy-600">{app.host}</span>
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Wind } from 'lucide-react'
import clsx from 'clsx'
import Button from './ui/Button'
import { NAV_LINKS } from '../data/site'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 h-16 border-b border-transparent bg-white/90 backdrop-blur transition-colors duration-300',
        scrolled && 'shadow-lg shadow-navy-900/5 border-b border-slate-200',
      )}
    >
      <nav className="mx-auto flex h-full max-w-content items-center justify-between px-6 lg:px-8" aria-label="Main navigation">
        <NavLink to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 shadow-md transition-shadow group-hover:shadow-lg group-hover:shadow-navy-800/30">
            <Wind className="h-5 w-5 text-white" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-navy-700 via-navy-600 to-navy-500 bg-clip-text text-transparent">
              HVAC
            </span>
            <span className="text-ink">tor</span>
          </span>
        </NavLink>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className="group relative rounded-lg px-3.5 py-2 text-sm font-medium select-none"
            >
              {({ isActive }) => (
                <>
                  <span className="flex flex-col overflow-hidden" style={{ height: '1.25em' }}>
                    <span
                      className={clsx(
                        'block translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full',
                        isActive ? 'font-semibold text-navy-900' : 'font-medium text-slate-600',
                      )}
                      style={{ lineHeight: '1.25em' }}
                    >
                      {link.label}
                    </span>
                    <span
                      className="block translate-y-0 font-semibold text-navy-900 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full"
                      style={{ lineHeight: '1.25em' }}
                      aria-hidden="true"
                    >
                      {link.label}
                    </span>
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-navy-700" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button to="/contact" variant="gradient" size="md">
            Request a demo
          </Button>
        </div>

        <button
          type="button"
          className="text-navy-900 transition-colors duration-300 md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile slide-in drawer */}
      <div
        className={clsx(
          'fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-6 py-5">
          <NavLink to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-navy-700 to-navy-900">
              <Wind className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-navy-700 via-navy-600 to-navy-500 bg-clip-text text-transparent">
                HVAC
              </span>
              <span className="text-ink">tor</span>
            </span>
          </NavLink>
          <button
            type="button"
            className="text-navy-900"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-6 py-3 text-base font-medium transition-colors',
                  isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-700 hover:bg-navy-50 hover:text-navy-800',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="space-y-3 border-t border-slate-100 p-4">
          <Button to="/contact" variant="gradient" size="lg" className="w-full">
            Request a demo
          </Button>
        </div>
      </aside>
    </header>
  )
}

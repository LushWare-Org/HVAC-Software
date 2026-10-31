import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import clsx from 'clsx'
import Button from './ui/Button'
import { NAV_LINKS, type NavItem } from '../data/site'
import { MODULE_CATEGORIES, modulePath, modulesInCategory } from '../data/modules'
import StatusBadge from './ui/StatusBadge'

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
    <>
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 h-16 border-b border-transparent bg-white/90 backdrop-blur transition-colors duration-300',
        scrolled && 'shadow-lg shadow-navy-900/5 border-b border-slate-200',
      )}
    >
      <nav className="mx-auto flex h-full max-w-content items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <NavLink to="/" className="group flex shrink-0 items-center gap-2 sm:gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full transition-shadow sm:h-9 sm:w-9">
            <img src="/platform/fav.png" alt="HVACtor logo" className="h-full w-full object-cover" />
          </span>
          <span className="whitespace-nowrap font-display text-base font-bold tracking-tight sm:text-lg">
            <span className="bg-gradient-to-r from-navy-900 via-navy-800 to-blue-500 bg-clip-text text-transparent">
              HVACtor.ai
            </span>
          </span>
        </NavLink>

        <div className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) =>
            link.modules ? <ModulesMenu key={link.to} link={link} /> : <DesktopNavLink key={link.to} link={link} />,
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button to="/contact" variant="gradient" size="md">
            Request a Demo
          </Button>
        </div>

        <button
          type="button"
          className="-mr-2 shrink-0 rounded-lg p-2 text-navy-900 transition-colors duration-200 active:bg-navy-50 lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>
    </header>

      {/* Mobile slide-in drawer */}
      <div
        className={clsx(
          'fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <img src="/platform/fav.png" alt="HVACtor logo" className="h-full w-full object-cover" />
            </span>
            <span className="whitespace-nowrap font-display text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-navy-700 via-navy-600 to-navy-500 bg-clip-text text-transparent">
                HVAC
              </span>
              <span className="text-ink">tor</span>
            </span>
          </NavLink>
          <button
            type="button"
            className="-mr-2 shrink-0 rounded-lg p-2 text-navy-900 transition-colors duration-200 active:bg-navy-50"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto py-4">
          {NAV_LINKS.map((link) => (
            <Fragment key={link.to}>
            <NavLink
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-6 py-3.5 text-base font-medium transition-colors',
                  isActive
                    ? 'bg-navy-50 text-navy-900'
                    : 'text-slate-700 hover:bg-navy-50 hover:text-navy-800 active:bg-navy-50',
                )
              }
            >
              {link.label}
            </NavLink>
            {link.modules && (
              <div className="pb-2">
                {MODULE_CATEGORIES.map((c) => (
                  <Fragment key={c.id}>
                    <div className="pb-1 pl-10 pr-6 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {c.name}
                    </div>
                    {modulesInCategory(c.id).map((m) => (
                      <NavLink
                        key={m.slug}
                        to={modulePath(m)}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center gap-2.5 py-2 pl-10 pr-6 text-sm transition-colors',
                            isActive ? 'font-semibold text-navy-900' : 'text-slate-600 hover:text-navy-800',
                          )
                        }
                      >
                        <m.icon className="h-4 w-4 flex-none text-navy-500" />
                        {m.navLabel}
                      </NavLink>
                    ))}
                  </Fragment>
                ))}
              </div>
            )}
            </Fragment>
          ))}
        </div>

        <div className="space-y-3 border-t border-slate-100 p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <Button to="/contact" variant="gradient" size="lg" className="w-full">
            Request a Demo
          </Button>
        </div>
      </aside>
    </>
  )
}

function AnimatedLabel({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <span className="flex flex-col overflow-hidden" style={{ height: '1.25em' }}>
      <span
        className={clsx(
          'block translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full',
          isActive ? 'font-semibold text-navy-900' : 'font-medium text-slate-600',
        )}
        style={{ lineHeight: '1.25em' }}
      >
        {label}
      </span>
      <span
        className="block translate-y-0 font-semibold text-navy-900 transition-transform duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full"
        style={{ lineHeight: '1.25em' }}
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  )
}

function DesktopNavLink({ link }: { link: NavItem }) {
  return (
    <NavLink to={link.to} end={link.to === '/'} className="group relative rounded-lg px-3 py-2 text-sm select-none">
      {({ isActive }) => (
        <>
          <AnimatedLabel label={link.label} isActive={isActive} />
          {isActive && (
            <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-navy-700" />
          )}
        </>
      )}
    </NavLink>
  )
}

function ModulesMenu({ link }: { link: NavItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const isActive = pathname.startsWith(link.to)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="group relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm select-none"
      >
        <AnimatedLabel label={link.label} isActive={isActive} />
        <ChevronDown className={clsx('h-3.5 w-3.5 text-slate-500 transition-transform', open && 'rotate-180')} />
        {isActive && (
          <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-navy-700" />
        )}
      </button>

      <div
        className={clsx(
          'absolute left-1/2 top-full w-[50rem] -translate-x-1/2 pt-3 transition-all duration-200',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-block">
          <div className="grid grid-cols-3 gap-2 p-3">
            {MODULE_CATEGORIES.map((c) => (
              <div key={c.id}>
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{c.name}</div>
                <ul>
                  {modulesInCategory(c.id).map((m) => (
                    <li key={m.slug}>
                      <Link
                        to={modulePath(m)}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-navy-50 focus:bg-navy-50 focus:outline-none"
                      >
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                          <m.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-snug text-ink">{m.navLabel}</span>
                          <StatusBadge status={m.availability} className="mt-1.5 !px-2 !py-0.5 !text-[10px]" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-6 py-3.5">
            <span className="text-xs text-slate-500">Use with HVACtor’s FSM or alongside your existing systems.</span>
            <Link to={link.to} onClick={() => setOpen(false)} className="whitespace-nowrap text-sm font-semibold text-navy-800 hover:underline">
              All modules &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

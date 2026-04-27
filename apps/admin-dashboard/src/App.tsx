import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './pages/Login'

// ── Code-split page routes ──────────────────────────────────────────────────
// Each page is loaded only when its route is first visited. This keeps the
// initial JS bundle tiny (just Dashboard + the shell), so time-to-interactive
// after login drops dramatically. Vite emits one chunk per lazy() import.
//
// Dashboard is NOT lazy-loaded — it's the post-login landing page and we want
// it ready before the login animation finishes.
import Dashboard from './pages/Dashboard'

const Customers       = lazy(() => import('./pages/customers/Customers'))
const Jobs            = lazy(() => import('./pages/jobs/Jobs'))
const DispatchBoard   = lazy(() => import('./pages/dispatch/DispatchBoard'))
const Finance         = lazy(() => import('./pages/finance/Finance'))
const Communications  = lazy(() => import('./pages/Communications'))
const Analytics       = lazy(() => import('./pages/Analytics'))
const Inventory       = lazy(() => import('./pages/inventory/Inventory'))
const Settings        = lazy(() => import('./pages/Settings'))
const Team            = lazy(() => import('./pages/Team'))
const Profile         = lazy(() => import('./pages/Profile'))

// Map each path to its dynamic importer so we can warm up chunks on hover
// (see Sidebar). Keys match react-router paths.
export const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  '/customers':      () => import('./pages/customers/Customers'),
  '/jobs':           () => import('./pages/jobs/Jobs'),
  '/dispatch':       () => import('./pages/dispatch/DispatchBoard'),
  '/finance':        () => import('./pages/finance/Finance'),
  '/communications': () => import('./pages/Communications'),
  '/analytics':      () => import('./pages/Analytics'),
  '/inventory':      () => import('./pages/inventory/Inventory'),
  '/settings':       () => import('./pages/Settings'),
  '/team':           () => import('./pages/Team'),
  '/profile':        () => import('./pages/Profile'),
}

/**
 * After the app goes idle, quietly warm the chunks a user is most likely to
 * visit next (Customers, Jobs, Dispatch). Uses requestIdleCallback so we
 * never contend with the initial render or any user interaction. Falls back
 * to a modest setTimeout on Safari, which doesn't ship requestIdleCallback.
 */
function warmLikelyRoutes() {
  const warm = () => {
    ROUTE_LOADERS['/customers']?.().catch(() => {})
    ROUTE_LOADERS['/jobs']?.().catch(() => {})
    ROUTE_LOADERS['/dispatch']?.().catch(() => {})
  }
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined
  if (ric) {
    ric(warm, { timeout: 4000 })
  } else {
    setTimeout(warm, 2500)
  }
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

/**
 * Lightweight route-level fallback. Deliberately NOT a full-page spinner —
 * a thin top progress bar keeps the shell present and feels faster than a
 * blank "Loading" screen. The chunk normally lands in <300 ms.
 */
function RouteFallback() {
  return (
    <div
      aria-busy="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background:
          'linear-gradient(90deg, transparent 0%, var(--blue, #2563EB) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'routeLoadShimmer 1.1s ease-in-out infinite',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  )
}

function AuthenticatedApp() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Warm the most-used route chunks once, when the browser is idle.
  useEffect(() => {
    warmLikelyRoutes()
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile) setMobileOpen(false)
  }, [location.pathname, isMobile])

  const handleToggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen(prev => !prev)
    } else {
      setCollapsed(c => !c)
    }
  }, [isMobile])

  return (
    <div className="app-shell">
      {isMobile && (
        <div
          className={`sidebar-backdrop${mobileOpen ? ' visible' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={handleToggle}
        mobileOpen={isMobile ? mobileOpen : undefined}
      />
      <div className={`main-content${!isMobile && collapsed ? ' sidebar-collapsed' : ''}`}>
        <Topbar onMenuClick={handleToggle} showMenu={isMobile} />
        <div className="page">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/dispatch" element={<DispatchBoard />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/team" element={<Team />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Suspense>
        </div>
      </div>
      {/* Keyframes for the top-of-page route loader */}
      <style>{`
        @keyframes routeLoadShimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Login />

  return <AuthenticatedApp />
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

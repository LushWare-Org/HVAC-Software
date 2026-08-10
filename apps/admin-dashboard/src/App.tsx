import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { useTechDirectory } from './components/TechAvatar'
import Login from './pages/Login'
import ChatWidget from './components/ChatWidget'

// ── Code-split page routes ──────────────────────────────────────────────────
// Each page is loaded only when its route is first visited. This keeps the
// initial JS bundle tiny (just Dashboard + the shell), so time-to-interactive
// after login drops dramatically. Vite emits one chunk per lazy() import.
//
// Dashboard is NOT lazy-loaded — it's the post-login landing page and we want
// it ready before the login animation finishes.
import Dashboard from './pages/Dashboard'
import { useCompanySettings } from './hooks/useCompanySettings'

const BanditDashboard = lazy(() => import('./pages/BanditDashboard'))
const Customers       = lazy(() => import('./pages/customers/Customers'))
const Jobs            = lazy(() => import('./pages/jobs/Jobs'))
const Finance         = lazy(() => import('./pages/finance/Finance'))
const Agreements      = lazy(() => import('./pages/agreements/Agreements'))
const Scheduling      = lazy(() => import('./pages/scheduling/Scheduling'))
const Projects        = lazy(() => import('./pages/projects/ProjectsLayoutGate').then(m => ({ default: m.ProjectsPage })))
const ProjectDetail   = lazy(() => import('./pages/projects/ProjectsLayoutGate').then(m => ({ default: m.ProjectDetailPage })))
const Communications  = lazy(() => import('./pages/Communications'))
const Marketing       = lazy(() => import('./pages/marketing/Marketing'))
const Analytics       = lazy(() => import('./pages/Analytics'))
const Inventory       = lazy(() => import('./pages/inventory/Inventory'))
const Settings        = lazy(() => import('./pages/Settings'))
const Team            = lazy(() => import('./pages/Team'))
const Profile         = lazy(() => import('./pages/Profile'))
const ImportWizard    = lazy(() => import('./pages/import/Import'))
const AdminImports    = lazy(() => import('./pages/import/AdminImports'))

// Map each path to its dynamic importer so we can warm up chunks on hover
// (see Sidebar). Keys match react-router paths.
export const ROUTE_LOADERS: Record<string, () => Promise<unknown>> = {
  '/customers':      () => import('./pages/customers/Customers'),
  '/jobs':           () => import('./pages/jobs/Jobs'),
  '/finance':        () => import('./pages/finance/Finance'),
  '/agreements':     () => import('./pages/agreements/Agreements'),
  '/scheduling':     () => import('./pages/scheduling/Scheduling'),
  '/projects':       () => import('./pages/projects/Projects'),
  '/communications': () => import('./pages/Communications'),
  '/marketing':      () => import('./pages/marketing/Marketing'),
  '/analytics':      () => import('./pages/Analytics'),
  '/inventory':      () => import('./pages/inventory/Inventory'),
  '/settings':       () => import('./pages/Settings'),
  '/import':         () => import('./pages/import/Import'),
  '/team':           () => import('./pages/Team'),
  '/profile':        () => import('./pages/Profile'),
}

/**
 * After the app goes idle, quietly warm EVERY page: first all route chunks
 * (parallel — they're static assets), then each page's data via the
 * prefetch registry (sequential — real backend queries, warmed one route
 * at a time so we never stampede the services). Uses requestIdleCallback
 * so we never contend with the initial render or any user interaction;
 * falls back to a modest setTimeout on Safari.
 *
 * The result: clicking any sidebar item renders instantly — code AND data
 * are already in cache before the first visit.
 */
function warmLikelyRoutes() {
  const warm = () => {
    for (const load of Object.values(ROUTE_LOADERS)) load().catch(() => {})
    import('./lib/prefetchRoutes').then(m => m.warmAllRouteData()).catch(() => {})
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
function RouteLoading() {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999,
        background: 'linear-gradient(90deg, transparent 0%, var(--blue, #3b82f6) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'routeLoadShimmer 1.1s linear infinite',
      }}
      aria-hidden
    />
  )
}


function AuthenticatedApp() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Prime tenant currency/timezone for the format helpers (once per session).
  useCompanySettings()

  // Prime the technician directory so TechAvatar can resolve a photo anywhere,
  // including the many surfaces that only hold a job's `assignedToId`/name.
  useTechDirectory()

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
          {/* Route-level Suspense: the shell + topbar stay rendered while the
              next page's chunk loads. The fallback is a 3px shimmer at the
              very top, NOT a full-page spinner — perceived speed wins. */}
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/scheduling" element={<Scheduling />} />
              <Route path="/agreements" element={<Agreements />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/bandit-dashboard" element={<BanditDashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/import" element={<ImportWizard />} />
              <Route path="/import/admin" element={<AdminImports />} />
              <Route path="/team" element={<Team />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
      <ChatWidget />
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
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-app)',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--bd)', borderTopColor: 'var(--blue)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

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

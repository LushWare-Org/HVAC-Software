import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ChatWidget from './components/ChatWidget'
// Dashboard + Login stay eager: they're the post-login landing and the
// pre-login screen, both shown immediately. Everything else is lazy-loaded
// so the initial JS bundle stays tight.
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

const Jobs                = lazy(() => import('./pages/jobs/Jobs'))
const Invoices            = lazy(() => import('./pages/invoices/Invoices'))
const Quotes              = lazy(() => import('./pages/quotes/Quotes'))
const Messages            = lazy(() => import('./pages/messages/Messages'))
const Profile             = lazy(() => import('./pages/Profile'))
const ForceResetPassword  = lazy(() => import('./pages/ForceResetPassword'))

const MOBILE_BP = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BP)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= MOBILE_BP)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// ─── Auth Guard — also blocks navigation when password reset is required ──────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, mustResetPassword } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  // Authenticated but first-login temp password — must reset before anything else
  if (mustResetPassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />
  }
  return <>{children}</>
}

// ─── App Shell (authenticated layout) ────────────────────────────────────────
function AppShell() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  useEffect(() => {
    if (isMobile) setMobileOpen(false)
  }, [location.pathname, isMobile])

  useEffect(() => {
    if (!isMobile) setMobileOpen(false)
  }, [isMobile])

  const handleToggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen(o => !o)
    } else {
      setCollapsed(c => !c)
    }
  }, [isMobile])

  if (isLogin) return <Login />

  return (
    <RequireAuth>
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
            {/* Route-level Suspense — the shell stays rendered while the next
                page's chunk loads. Fallback is a thin top shimmer; perceived
                speed wins over a full-page spinner. */}
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/quotes" element={<Quotes />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
        <ChatWidget />
      </div>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Force-reset gate — shown when admin provisioned the account */}
            <Route path="/reset-password" element={<ForceResetPasswordGuard />} />
            <Route path="/*" element={<AppShell />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}

/** Wrapper: only render ForceResetPassword if user is authenticated AND mustReset. */
function ForceResetPasswordGuard() {
  const { isAuthenticated, mustResetPassword } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!mustResetPassword) return <Navigate to="/" replace />
  return (
    <Suspense fallback={<RouteLoading />}>
      <ForceResetPassword />
    </Suspense>
  )
}

/** Thin top progress shimmer — keeps the shell present while a chunk loads. */
function RouteLoading() {
  return (
    <>
      <style>{`@keyframes cpRouteLoadShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999,
          background: 'linear-gradient(90deg, transparent 0%, var(--blue, #3b82f6) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'cpRouteLoadShimmer 1.1s linear infinite',
        }}
        aria-hidden
      />
    </>
  )
}

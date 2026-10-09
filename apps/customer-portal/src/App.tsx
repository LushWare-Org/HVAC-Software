import { useChatRealtime } from './hooks/useChat'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { lazyPage } from './lib/lazyPage'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ChatWidget from './components/ChatWidget'
import KelvinChat from './kelvin/KelvinChat'
import { useCompany } from './contexts/CompanyContext'
import ModalCloseGuard from './components/ModalCloseGuard'
// Dashboard + Login stay eager: they're the post-login landing and the
// pre-login screen, both shown immediately. Everything else is lazy-loaded
// so the initial JS bundle stays tight.
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { SignInTransition } from './components/airflow/CustomerAuth'

const Jobs                = lazyPage(() => import('./pages/jobs/Jobs'))
const Invoices            = lazyPage(() => import('./pages/invoices/Invoices'))
const Quotes              = lazyPage(() => import('./pages/quotes/Quotes'))
const Messages            = lazyPage(() => import('./pages/messages/Messages'))
const Profile             = lazyPage(() => import('./pages/Profile'))
const Devices             = lazyPage(() => import('./pages/Devices'))
const MyProjects          = lazyPage(() => import('./pages/MyProjects'))
const MyProperty          = lazyPage(() => import('./pages/MyProperty'))
const Equipment           = lazyPage(() => import('./pages/Equipment'))
const ForceResetPassword  = lazyPage(() => import('./pages/ForceResetPassword'))
const ForgotPassword      = lazyPage(() => import('./pages/ForgotPassword'))
const ResetPassword       = lazyPage(() => import('./pages/ResetPassword'))
const Tips                = lazyPage(() => import('./pages/Tips'))
const Offers              = lazyPage(() => import('./pages/Offers'))
const Agreements          = lazyPage(() => import('./pages/Agreements'))
const AgreementConfirm    = lazyPage(() => import('./pages/AgreementConfirm'))
const ShareLocation       = lazyPage(() => import('./pages/ShareLocation'))

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
  // One live chat connection while signed in: new messages, read receipts and the badge, on every page.
  useChatRealtime()

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
                <Route path="/devices" element={<Devices />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/agreements" element={<Agreements />} />
                <Route path="/projects" element={<MyProjects />} />
                <Route path="/my-property" element={<MyProperty />} />
                <Route path="/tips" element={<Tips />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
        <Assistant />
      </div>
    </RequireAuth>
  )
}

/** Kelvin for companies that have him; the plain assistant otherwise. */
function Assistant() {
  const { settings } = useCompany()
  return settings?.features?.kelvin === true ? <KelvinChat /> : <ChatWidget />
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<Suspense fallback={null}><ForgotPassword /></Suspense>} />
            {/* With ?token= it's an emailed reset link; without, the forced
                first-sign-in reset for admin-provisioned accounts. */}
            <Route path="/reset-password" element={<ResetPasswordRoute />} />
            {/* Public: email confirm link — token-gated, no login required */}
            <Route
              path="/agreements/confirm/:token"
              element={
                <Suspense fallback={null}>
                  <AgreementConfirm />
                </Suspense>
              }
            />
            {/* Public: "where should we come?" link — signed token, no login required */}
            <Route path="/share-location/:token" element={<Suspense fallback={null}><ShareLocation /></Suspense>} />
            <Route path="/*" element={<AppShell />} />
          </Routes>
          <SignInGate />
        </BrowserRouter>
        {/* Confirms accidental backdrop clicks for every modal in the app. */}
        <ModalCloseGuard />
      </ToastProvider>
    </ThemeProvider>
  )
}

function ResetPasswordRoute() {
  const { search } = useLocation()
  if (new URLSearchParams(search).get('token')) {
    return <Suspense fallback={null}><ResetPassword /></Suspense>
  }
  return <ForceResetPasswordGuard />
}

/** Covers the portal with the loading screen from sign-in until its first data arrives. */
function SignInGate() {
  const { justSignedIn, finishSignIn } = useAuth()
  return justSignedIn ? <SignInTransition onDone={finishSignIn} /> : null
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

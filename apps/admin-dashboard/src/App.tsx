import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/customers/Customers'
import Jobs from './pages/jobs/Jobs'
import Scheduling from './pages/scheduling/Scheduling'
import DispatchBoard from './pages/dispatch/DispatchBoard'
import Finance from './pages/finance/Finance'
import Communications from './pages/Communications'
import Analytics from './pages/Analytics'
import Inventory from './pages/inventory/Inventory'
import Settings from './pages/Settings'
import Team from './pages/Team'
import Profile from './pages/Profile'
import Alerts from './pages/alerts/alerts'

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

function AuthenticatedApp() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/dispatch" element={<DispatchBoard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/communications" element={<Communications />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/team" element={<Team />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
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

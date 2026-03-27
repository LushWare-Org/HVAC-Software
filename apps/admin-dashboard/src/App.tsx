import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function AuthenticatedApp() {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Topbar />
        <div className="page">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/scheduling" element={<Scheduling />} />
            <Route path="/dispatch" element={<DispatchBoard />} />
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

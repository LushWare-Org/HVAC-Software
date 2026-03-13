import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/jobs/Jobs'
import Invoices from './pages/invoices/Invoices'
import Profile from './pages/Profile'
import Login from './pages/Login'

export default function App() {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
          <div className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
            <Topbar />
            <div className="page">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

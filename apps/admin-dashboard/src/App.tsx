import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/customers/Customers'
import Jobs from './pages/jobs/Jobs'
import Scheduling from './pages/scheduling/Scheduling'
import Finance from './pages/finance/Finance'
import Communications from './pages/Communications'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Team from './pages/Team'

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
                <Route path="/customers" element={<Customers />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/scheduling" element={<Scheduling />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/communications" element={<Communications />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/team" element={<Team />} />
              </Routes>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

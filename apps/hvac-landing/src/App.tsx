import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import Footer from './components/Footer.tsx'
import ScrollToTop from './components/ScrollToTop.tsx'
import FloatingActions from './components/FloatingActions.tsx'
import Home from './pages/Home.tsx'
const Fsm = lazy(() => import('./pages/Fsm.tsx'))
const Intelligence = lazy(() => import('./pages/Intelligence.tsx'))
const ModuleDetail = lazy(() => import('./pages/ModuleDetail.tsx'))
const Integrations = lazy(() => import('./pages/Integrations.tsx'))
const Industries = lazy(() => import('./pages/Industries.tsx'))
const Contact = lazy(() => import('./pages/Contact.tsx'))
const NotFound = lazy(() => import('./pages/NotFound.tsx'))

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Home ships in the main bundle; other pages load on navigation. */}
        <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fsm" element={<Fsm />} />
          <Route path="/features" element={<Navigate to="/fsm" replace />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/intelligence/:slug" element={<ModuleDetail />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/industries" element={<Industries />} />
          {/* Platform, Pricing and About are hidden for now; their pages stay in src/pages.
              To restore: re-add the lazy imports and routes, and the NAV_LINKS / footer entries. */}
          <Route path="/platform" element={<Navigate to="/" replace />} />
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<Navigate to="/" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <FloatingActions />
    </div>
  )
}

export default App

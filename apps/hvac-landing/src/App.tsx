import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import Footer from './components/Footer.tsx'
import ScrollToTop from './components/ScrollToTop.tsx'
import FloatingActions from './components/FloatingActions.tsx'
import Home from './pages/Home.tsx'
import Features from './pages/Features.tsx'
// Pricing page hidden for now (shared with a prospective company). Restore this import and the route below to bring it back.
// import Pricing from './pages/Pricing.tsx'
import About from './pages/About.tsx'
import Contact from './pages/Contact.tsx'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          {/* <Route path="/pricing" element={<Pricing />} /> */}
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      <FloatingActions />
    </div>
  )
}

export default App

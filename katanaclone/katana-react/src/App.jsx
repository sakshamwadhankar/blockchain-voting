import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Loader from './components/Loader'
import Hero from './components/Hero'
import Liquidity from './components/Liquidity'
import Flywheel from './components/Flywheel'
import Quotes from './components/Quotes'
import Features from './components/Features'
import Roadmap from './components/Roadmap'
import Newsletter from './components/Newsletter'
import FooterCTA from './components/FooterCTA'
import Footer from './components/Footer'
import Scene3D from './components/Scene3D'
import StarField from './components/StarField'
import CustomCursor from './components/CustomCursor'
import Scrollbar from './components/Scrollbar'

import VerifyPage from './pages/VerifyPage'
import VotePage from './pages/VotePage'
import ResultsPage from './pages/ResultsPage'
import AdminPage from './pages/AdminPage'

function HomePage() {
  return (
    <>
      <Scene3D />
      <main>
        <Hero />
        <Liquidity />
        <Flywheel />
        <Quotes />
        <Features />
        <Roadmap />
        <Newsletter />
        <FooterCTA />
      </main>
      <Footer />
    </>
  )
}

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Loader visible={loading} />
      <StarField />
      <CustomCursor />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/vote" element={<VotePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Scrollbar />
    </>
  )
}

export default App

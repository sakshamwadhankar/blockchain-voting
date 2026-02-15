import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
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
import SectionTransition from './components/SectionTransition'

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
        <SectionTransition className="section visible">
          <Liquidity />
        </SectionTransition>
        <SectionTransition className="section">
          <Flywheel />
        </SectionTransition>
        <SectionTransition className="section">
          <Quotes />
        </SectionTransition>
        <SectionTransition className="section">
          <Features />
        </SectionTransition>
        <SectionTransition className="section">
          <Roadmap />
        </SectionTransition>
        <SectionTransition className="section">
          <Newsletter />
        </SectionTransition>
        <SectionTransition className="section">
          <FooterCTA />
        </SectionTransition>
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <>
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

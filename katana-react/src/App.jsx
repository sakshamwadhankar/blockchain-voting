import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from "./context/WalletContext";
import { AuthProvider } from "./context/AuthContext";
// Header removed as per requirement
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

// Voting Pages
import VotingLayout from "./components/VotingLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import VerifyIdentity from "./pages/VerifyIdentity";
import VotingBooth from "./pages/VotingBooth";
import LiveResults from "./pages/LiveResults";
import ElectionDashboard from "./pages/ElectionDashboard";
import UnifiedAdminPanel from "./pages/UnifiedAdminPanel";

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
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/" element={
              <>
                <StarField />
                <CustomCursor />
                <HomePage />
                <Scrollbar />
              </>
            } />
            <Route path="/login" element={
              <VotingLayout>
                <Login />
              </VotingLayout>
            } />
            <Route
              path="/verify"
              element={
                <VotingLayout>
                  <ProtectedRoute allowGuest={true}>
                    <VerifyIdentity />
                  </ProtectedRoute>
                </VotingLayout>
              }
            />
            <Route
              path="/vote"
              element={
                <VotingLayout>
                  <ProtectedRoute requireVerification={true}>
                    <VotingBooth />
                  </ProtectedRoute>
                </VotingLayout>
              }
            />
            <Route
              path="/results/:id"
              element={
                <VotingLayout>
                  <ProtectedRoute>
                    <LiveResults />
                  </ProtectedRoute>
                </VotingLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <VotingLayout>
                  <ProtectedRoute adminOnly={true}>
                    <UnifiedAdminPanel />
                  </ProtectedRoute>
                </VotingLayout>
              }
            />
            <Route
              path="/elections"
              element={
                <VotingLayout>
                  <ProtectedRoute>
                    <ElectionDashboard />
                  </ProtectedRoute>
                </VotingLayout>
              }
            />
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

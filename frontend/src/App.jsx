import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import WalletConnect from "./components/WalletConnect";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import VerifyIdentity from "./pages/VerifyIdentity";
import VotingBooth from "./pages/VotingBooth";
import LiveResults from "./pages/LiveResults";
import ElectionDashboard from "./pages/ElectionDashboard";
import UnifiedAdminPanel from "./pages/UnifiedAdminPanel";
import "./index.css";

const navItems = [
  { path: "/", label: "Verify ID", icon: "🪪", adminOnly: false },
  { path: "/vote", label: "Vote", icon: "🗳️", adminOnly: false },
  { path: "/results", label: "Results", icon: "📊", adminOnly: false },
  { path: "/elections", label: "Elections", icon: "🏛️", adminOnly: false },
  { path: "/admin", label: "Admin Dashboard", icon: "⚙️", adminOnly: true },
];

function Layout() {
  const { account } = useWallet();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Nav ──────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-[#EEFF00]/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EEFF00]
                            flex items-center justify-center text-[#0f1419] font-bold text-lg shadow-lg">
              G
            </div>
            <span className="text-lg font-bold text-[#EEFF00] hidden sm:inline">
              Governance
            </span>
            {user && (
              <span className="text-xs text-gray-400 hidden md:inline">
                · {user.type === "admin" ? "Admin" : user.name}
              </span>
            )}
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon, adminOnly }) => {
              // Hide admin link for non-admin users
              if (adminOnly && !isAdmin()) return null;

              return (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                     transition-all duration-200
                     ${isActive
                      ? "bg-[#EEFF00]/20 text-[#EEFF00] shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-[#1a1f2e]"}`
                  }
                >
                  <span className="hidden md:inline">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <WalletConnect />
            {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 
                         hover:text-white hover:bg-[#1a1f2e] transition-all cursor-pointer"
                title="Logout"
              >
                🚪
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────── */}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute allowGuest={true}>
                <VerifyIdentity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vote"
            element={
              <ProtectedRoute requireVerification={true}>
                <VotingBooth />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute>
                <LiveResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <UnifiedAdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elections"
            element={
              <ProtectedRoute>
                <ElectionDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="py-6 text-center text-xs text-gray-600 border-t border-[#EEFF00]/10">
        <p>Blockchain Governance Dashboard · Built with React + Ethers.js + Socket.io</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  );
}

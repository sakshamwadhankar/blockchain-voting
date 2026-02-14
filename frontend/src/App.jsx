import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import WalletConnect from "./components/WalletConnect";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import VerifyIdentity from "./pages/VerifyIdentity";
import VotingBooth from "./pages/VotingBooth";
import LiveResults from "./pages/LiveResults";
import AdminPanel from "./pages/AdminPanel";
import RegisterEmployee from "./pages/RegisterEmployee";
import "./index.css";

const navItems = [
  { path: "/", label: "Verify ID", icon: "🪪", adminOnly: false },
  { path: "/vote", label: "Vote", icon: "🗳️", adminOnly: false },
  { path: "/results", label: "Results", icon: "📊", adminOnly: false },
  { path: "/admin", label: "Admin", icon: "⚙️", adminOnly: true },
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
      <header className="sticky top-0 z-50 glass border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500
                            flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
              G
            </div>
            <span className="text-lg font-bold text-white hidden sm:inline">
              Governance
            </span>
            {user && (
              <span className="text-xs text-slate-400 hidden md:inline">
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
                      ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"}`
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
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 
                         hover:text-slate-200 hover:bg-slate-700/40 transition-all cursor-pointer"
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
            path="/results"
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
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-employee"
            element={
              <ProtectedRoute adminOnly={true}>
                <RegisterEmployee />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="py-6 text-center text-xs text-slate-600 border-t border-slate-800/50">
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

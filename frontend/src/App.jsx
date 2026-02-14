import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { WalletProvider, useWallet } from "./context/WalletContext";
import WalletConnect from "./components/WalletConnect";
import VerifyIdentity from "./pages/VerifyIdentity";
import VotingBooth from "./pages/VotingBooth";
import LiveResults from "./pages/LiveResults";
import AdminPanel from "./pages/AdminPanel";
import "./index.css";

const navItems = [
  { path: "/", label: "Verify ID", icon: "🪪" },
  { path: "/vote", label: "Vote", icon: "🗳️" },
  { path: "/results", label: "Results", icon: "📊" },
  { path: "/admin", label: "Admin", icon: "⚙️" },
];

function Layout() {
  const { account } = useWallet();

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
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon }) => (
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
            ))}
          </nav>

          <WalletConnect />
        </div>
      </header>

      {/* ── Main Content ─────────────────────────── */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<VerifyIdentity />} />
          <Route path="/vote" element={<VotingBooth />} />
          <Route path="/results" element={<LiveResults />} />
          <Route path="/admin" element={<AdminPanel />} />
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
    <WalletProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </WalletProvider>
  );
}

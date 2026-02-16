import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import WalletConnect from './WalletConnect';
import '../voting.css';

const navItems = [
  { path: "/", label: "Home", icon: "🏠", adminOnly: false },
  { path: "/verify", label: "Verify ID", icon: "🪪", adminOnly: false },
  { path: "/vote", label: "Vote", icon: "🗳️", adminOnly: false },
  { path: "/elections", label: "Elections", icon: "🏛️", adminOnly: false },
  { path: "/admin", label: "Admin Dashboard", icon: "⚙️", adminOnly: true },
];

export default function VotingLayout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { account } = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#0f1419',
      zIndex: 9999,
      overflow: 'auto'
    }}>
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 glass border-b border-[#EEFF00]/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EEFF00]
                            flex items-center justify-center text-[#0f1419] font-bold text-lg shadow-lg">
              K
            </div>
            <span className="text-lg font-bold text-[#EEFF00] hidden sm:inline">
              KWOTE
            </span>
            {user && (
              <span className="text-xs text-gray-400 hidden md:inline">
                · {user.type === "admin" ? "Admin" : user.name}
              </span>
            )}
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon, adminOnly }) => {
              if (adminOnly && !isAdmin()) return null;

              return (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                           transition-all duration-200 text-gray-400 hover:text-white hover:bg-[#1a1f2e]"
                >
                  <span className="hidden md:inline">{icon}</span>
                  <span>{label}</span>
                </Link>
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

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-600 border-t border-[#EEFF00]/10">
        <p>Blockchain KWOTE Dashboard · Built with React + Ethers.js + Socket.io</p>
      </footer>
    </div>
  );
}

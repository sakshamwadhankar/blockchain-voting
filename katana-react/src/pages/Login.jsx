import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { loginAsAdmin } = useAuth();
    const [adminPassword, setAdminPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (adminPassword === "admin123") {
            loginAsAdmin({
                name: "Administrator"
            });
            navigate("/admin");
        } else {
            setError("Invalid admin password");
        }
        setLoading(false);
    };

    const handleEmployeeClick = () => {
        navigate("/verify");
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f1419',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative',
            zIndex: 100
        }}>
            <div className="glass p-8 max-w-md w-full animate-fade-up" style={{
                background: 'rgba(26, 31, 46, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(238, 255, 0, 0.15)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EEFF00]
                                  flex items-center justify-center text-[#0f1419] font-bold text-2xl shadow-lg mb-4">
                        K
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">KWOTE Login</h1>
                    <p className="text-gray-400 text-sm">Secure blockchain voting system</p>
                </div>

                <div className="space-y-4">
                    {/* Employee Login Button */}
                    <div className="bg-[#1a1f2e] p-6 rounded-xl border border-[#EEFF00]/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#EEFF00]/20 flex items-center justify-center text-2xl">
                                👤
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">Employee Login</h3>
                                <p className="text-sm text-gray-400">Verify your identity to vote</p>
                            </div>
                        </div>
                        <button
                            onClick={handleEmployeeClick}
                            className="w-full py-3 rounded-xl font-semibold cursor-pointer btn-yellow transition-all duration-300"
                        >
                            Continue as Employee →
                        </button>
                    </div>

                    {/* Admin Login */}
                    <div className="bg-[#1a1f2e] p-6 rounded-xl border border-[#EEFF00]/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#EEFF00]/20 flex items-center justify-center text-2xl">
                                ⚙️
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">Admin Login</h3>
                                <p className="text-sm text-gray-400">Manage KWOTE system</p>
                            </div>
                        </div>

                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="Enter admin password"
                                className="w-full bg-[#0f1419] border border-[#EEFF00]/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#EEFF00] transition-all"
                            />
                            {error && (
                                <p className="text-red-400 text-sm">{error}</p>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-semibold cursor-pointer bg-[#EEFF00]/20 text-[#EEFF00] border border-[#EEFF00]/30 hover:bg-[#EEFF00]/30 disabled:opacity-50 transition-all duration-300"
                            >
                                {loading ? "Logging in..." : "Login as Admin"}
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                                Default password: admin123
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

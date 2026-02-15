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

        // Simple admin password check
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
        // Directly navigate to verification page
        navigate("/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass p-8 max-w-md w-full animate-fade-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500
                                  flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/25 mb-4">
                        G
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Governance Login</h1>
                    <p className="text-slate-400 text-sm">Secure blockchain voting system</p>
                </div>

                <div className="space-y-4">
                    {/* Employee Login Button */}
                    <div className="glass-light p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl">
                                👤
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">Employee Login</h3>
                                <p className="text-sm text-slate-400">Verify your identity to vote</p>
                            </div>
                        </div>
                        <button
                            onClick={handleEmployeeClick}
                            className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                                     bg-gradient-to-r from-indigo-500 to-purple-500
                                     hover:from-indigo-400 hover:to-purple-400
                                     transition-all duration-300 shadow-lg shadow-indigo-500/20"
                        >
                            Continue as Employee →
                        </button>
                    </div>

                    {/* Admin Login */}
                    <div className="glass-light p-6 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                                ⚙️
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">Admin Login</h3>
                                <p className="text-sm text-slate-400">Manage governance system</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAdminLogin} className="space-y-3">
                            <input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="Enter admin password"
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                                         text-white placeholder-slate-500
                                         focus:outline-none focus:border-amber-500/60 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={loading || !adminPassword.trim()}
                                className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                                         bg-gradient-to-r from-amber-500 to-orange-500
                                         hover:from-amber-400 hover:to-orange-400
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         transition-all duration-300 shadow-lg shadow-amber-500/20"
                            >
                                {loading ? "Verifying..." : "Login as Admin"}
                            </button>
                            <p className="text-xs text-slate-500 text-center">
                                Default password: admin123
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

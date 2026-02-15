import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false, requireVerification = false, allowGuest = false }) {
    const { user, loading, isAdmin, isVerified } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Allow guest access for certain pages (like initial verification)
    if (!user && !allowGuest) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin()) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="glass p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">🚫</div>
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-slate-400 mb-6">
                        This page is only accessible to administrators.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 
                                 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Check if verification is required (for voting booth)
    if (requireVerification && !isVerified && !isAdmin()) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="glass p-8 text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-2">Verification Required</h2>
                    <p className="text-slate-400 mb-6">
                        You must complete identity verification (ID scan, face scan, and OTP) before accessing the voting booth.
                    </p>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 
                                 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                        Complete Verification
                    </button>
                </div>
            </div>
        );
    }

    return children;
}

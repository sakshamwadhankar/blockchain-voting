import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { BACKEND_URL } from "../config/contracts";

export default function VerifyIdentity() {
    const { account } = useWallet();
    const [step, setStep] = useState(1); // 1=form, 2=otp, 3=done
    const [aadhaar, setAadhaar] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [txHash, setTxHash] = useState("");

    const sendOTP = async () => {
        if (!phone || !aadhaar) return setStatus({ type: "error", message: "Fill all fields" });
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch(`${BACKEND_URL}/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: phone }),
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
                setStatus({ type: "success", message: "OTP sent! Check your phone." });
            } else {
                setStatus({ type: "error", message: data.message });
            }
        } catch {
            setStatus({ type: "error", message: "Server unreachable. Make sure the backend is running." });
        }
        setLoading(false);
    };

    const verifyOTP = async () => {
        if (!otp) return setStatus({ type: "error", message: "Enter OTP" });
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch(`${BACKEND_URL}/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: phone,
                    code: otp,
                    aadhaarId: aadhaar,
                    walletAddress: account,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setStep(3);
                setTxHash(data.transactionHash);
                setStatus({ type: "success", message: "Identity verified! You can now vote." });
            } else {
                setStatus({ type: "error", message: data.message });
            }
        } catch {
            setStatus({ type: "error", message: "Verification failed. Try again." });
        }
        setLoading(false);
    };

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 animate-fade-up">
                <div className="glass p-10 text-center max-w-md">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
                    <p className="text-slate-400">
                        Please connect your MetaMask wallet to verify your identity.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto py-8 px-4 animate-fade-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Identity Verification
                </h1>
                <p className="text-slate-400 mt-2">
                    Verify your identity to participate in governance voting.
                </p>
            </div>

            {/* ── Progress Steps ─────────────────────────── */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center
                          text-sm font-bold transition-colors duration-300
                          ${step >= s
                                    ? "bg-indigo-500 text-white"
                                    : "bg-slate-700 text-slate-500"}`}
                        >
                            {step > s ? "✓" : s}
                        </div>
                        {s < 3 && (
                            <div className={`w-12 h-0.5 ${step > s ? "bg-indigo-500" : "bg-slate-700"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Status Bar ────────────────────────────── */}
            {status.message && (
                <div
                    className={`mb-6 p-4 rounded-xl text-sm ${status.type === "error"
                            ? "bg-red-500/10 border border-red-500/30 text-red-300"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                        }`}
                >
                    {status.message}
                </div>
            )}

            {/* ── Step 1: Aadhaar + Phone ───────────────── */}
            {step === 1 && (
                <div className="glass p-6 space-y-5">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Aadhaar Number</label>
                        <input
                            type="text"
                            value={aadhaar}
                            onChange={(e) => setAadhaar(e.target.value)}
                            placeholder="1234 5678 9012"
                            maxLength={14}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                         text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60
                         transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 9876543210"
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                         text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60
                         transition-colors"
                        />
                    </div>
                    <button
                        onClick={sendOTP}
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                       bg-gradient-to-r from-indigo-500 to-cyan-500
                       hover:from-indigo-400 hover:to-cyan-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300 shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? "Sending..." : "Send OTP →"}
                    </button>
                </div>
            )}

            {/* ── Step 2: OTP Verification ──────────────── */}
            {step === 2 && (
                <div className="glass p-6 space-y-5">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Enter OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="6-digit code"
                            maxLength={6}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                         text-white placeholder-slate-500 text-center text-2xl tracking-[0.5em]
                         focus:outline-none focus:border-indigo-500/60 transition-colors"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setStep(1); setOtp(""); setStatus({ type: "", message: "" }); }}
                            className="flex-1 py-3 rounded-xl font-semibold border border-slate-600
                         text-slate-300 hover:bg-slate-700/50 transition-colors cursor-pointer"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={verifyOTP}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl font-semibold text-white cursor-pointer
                         bg-gradient-to-r from-emerald-500 to-cyan-500
                         hover:from-emerald-400 hover:to-cyan-400
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300"
                        >
                            {loading ? "Verifying..." : "Verify ✓"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 3: Success ───────────────────────── */}
            {step === 3 && (
                <div className="glass p-8 text-center space-y-4">
                    <div className="text-6xl mb-2">✅</div>
                    <h2 className="text-2xl font-bold text-emerald-400">Verified!</h2>
                    <p className="text-slate-400">
                        Your wallet is now authorized to vote on governance proposals.
                    </p>
                    {txHash && (
                        <p className="text-xs text-slate-500 break-all mt-4">
                            TX: <span className="text-indigo-400 font-mono">{txHash}</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

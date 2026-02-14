import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { useWallet } from "../context/WalletContext";
import { BACKEND_URL } from "../config/contracts";

const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: "user",
};

export default function VerifyIdentity() {
    const { account } = useWallet();
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    // Step machine: 1 = ID Scan, 2 = Face Scan, 3 = OTP
    const [step, setStep] = useState(1);

    // Step 1 state
    const [idImage, setIdImage] = useState(null);
    const [employeeId, setEmployeeId] = useState("");
    const [employeeName, setEmployeeName] = useState("");

    // Step 2 state
    const [faceImage, setFaceImage] = useState(null);

    // Step 3 state
    const [otp, setOtp] = useState("");
    const [maskedPhone, setMaskedPhone] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    // Shared state
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [txHash, setTxHash] = useState("");

    // ── Capture helpers ────────────────────────────
    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            return webcamRef.current.getScreenshot();
        }
        return null;
    }, []);

    // ── Step 1: Capture ID ─────────────────────────
    const handleCaptureId = () => {
        const img = capturePhoto();
        if (img) {
            setIdImage(img);
            setStatus({ type: "success", message: "ID captured! Enter your Employee ID below." });
        }
    };

    const handleIdSubmit = async () => {
        if (!employeeId.trim()) {
            return setStatus({ type: "error", message: "Please enter your Employee ID" });
        }
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch(`${BACKEND_URL}/employee/${employeeId.trim()}`);
            const data = await res.json();
            if (data.success) {
                setEmployeeName(data.data.name);
                setStatus({ type: "success", message: `Welcome, ${data.data.name}! Proceed to face scan.` });
                setStep(2);
            } else {
                setStatus({ type: "error", message: data.message });
            }
        } catch {
            setStatus({ type: "error", message: "Cannot reach server. Is the backend running?" });
        }
        setLoading(false);
    };

    // ── Step 2: Capture Face ───────────────────────
    const handleCaptureFace = () => {
        const img = capturePhoto();
        if (img) {
            setFaceImage(img);
            setStatus({ type: "success", message: "Face captured! Proceeding to OTP verification..." });
            // Auto-advance to step 3 and send OTP
            setTimeout(() => {
                setStep(3);
                sendOTP();
            }, 800);
        }
    };

    // ── Step 3: Send OTP ───────────────────────────
    const sendOTP = async () => {
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch(`${BACKEND_URL}/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeId: employeeId.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setMaskedPhone(data.maskedPhone || "your phone");
                setOtpSent(true);
                setStatus({ type: "success", message: `OTP sent to ${data.maskedPhone || "your phone"}` });
            } else {
                setStatus({ type: "error", message: data.message });
            }
        } catch {
            setStatus({ type: "error", message: "Failed to send OTP. Check backend." });
        }
        setLoading(false);
    };

    // ── Step 3: Verify OTP ─────────────────────────
    const verifyOTP = async () => {
        if (!otp.trim()) return setStatus({ type: "error", message: "Enter the OTP" });
        setLoading(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch(`${BACKEND_URL}/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: employeeId.trim(),
                    code: otp.trim(),
                    walletAddress: account,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setTxHash(data.transactionHash);
                setStatus({ type: "success", message: "✅ Verification complete! Redirecting to vote..." });
                setTimeout(() => navigate("/vote"), 2000);
            } else {
                setStatus({ type: "error", message: data.message });
            }
        } catch {
            setStatus({ type: "error", message: "Verification failed. Try again." });
        }
        setLoading(false);
    };

    // ── No wallet connected ────────────────────────
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
        <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-up">
            {/* ── Header ────────────────────────────────── */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Identity Verification
                </h1>
                <p className="text-slate-400 mt-1">
                    Scan your ID, verify your face, and confirm with OTP
                </p>
            </div>

            {/* ── Progress Steps ────────────────────────── */}
            <div className="flex items-center gap-2 mb-8">
                {[
                    { n: 1, label: "Scan ID" },
                    { n: 2, label: "Face Scan" },
                    { n: 3, label: "OTP" },
                ].map(({ n, label }) => (
                    <div key={n} className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step > n
                                        ? "bg-emerald-500 text-white"
                                        : step === n
                                            ? "bg-indigo-500 text-white pulse-glow"
                                            : "bg-slate-700 text-slate-500"
                                    }`}
                            >
                                {step > n ? "✓" : n}
                            </div>
                            <span className={`text-xs mt-1 ${step >= n ? "text-slate-300" : "text-slate-600"}`}>
                                {label}
                            </span>
                        </div>
                        {n < 3 && (
                            <div className={`w-16 h-0.5 mb-5 ${step > n ? "bg-emerald-500" : "bg-slate-700"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ── Status Bar ────────────────────────────── */}
            {status.message && (
                <div
                    className={`mb-6 p-4 rounded-xl text-sm transition-all ${status.type === "error"
                            ? "bg-red-500/10 border border-red-500/30 text-red-300"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                        }`}
                >
                    {status.message}
                </div>
            )}

            {/* ══════════════════════════════════════════════
          STEP 1: Scan ID
         ══════════════════════════════════════════════ */}
            {step === 1 && (
                <div className="glass p-6 space-y-5 animate-fade-up">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-2xl">🪪</span> Scan Your Employee ID
                    </h2>

                    {/* Camera */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50">
                        {!idImage ? (
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="w-full"
                            />
                        ) : (
                            <img src={idImage} alt="Captured ID" className="w-full" />
                        )}
                        {/* Scanner overlay */}
                        {!idImage && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-4 border-2 border-dashed border-cyan-400/40 rounded-xl" />
                                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
                            </div>
                        )}
                    </div>

                    {/* Capture / Retake */}
                    {!idImage ? (
                        <button
                            onClick={handleCaptureId}
                            className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                         bg-gradient-to-r from-cyan-500 to-blue-500
                         hover:from-cyan-400 hover:to-blue-400
                         transition-all duration-300 shadow-lg shadow-cyan-500/20"
                        >
                            📸 Capture ID
                        </button>
                    ) : (
                        <button
                            onClick={() => { setIdImage(null); setStatus({ type: "", message: "" }); }}
                            className="w-full py-2.5 rounded-xl font-semibold text-slate-300 cursor-pointer
                         border border-slate-600 hover:bg-slate-700/50 transition-colors"
                        >
                            🔄 Retake Photo
                        </button>
                    )}

                    {/* Employee ID input (temporary until OCR) */}
                    {idImage && (
                        <div className="space-y-3 pt-2 border-t border-slate-700/50">
                            <label className="block text-sm text-slate-400">
                                Enter Employee ID from your card
                            </label>
                            <input
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                placeholder="e.g. MNC-001"
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                           text-white placeholder-slate-500 font-mono text-lg text-center tracking-wider
                           focus:outline-none focus:border-indigo-500/60 transition-colors"
                            />
                            <button
                                onClick={handleIdSubmit}
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                           bg-gradient-to-r from-indigo-500 to-purple-500
                           hover:from-indigo-400 hover:to-purple-400
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300 shadow-lg shadow-indigo-500/20"
                            >
                                {loading ? "Checking..." : "Verify ID →"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════
          STEP 2: Face Scan
         ══════════════════════════════════════════════ */}
            {step === 2 && (
                <div className="glass p-6 space-y-5 animate-fade-up">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-2xl">🧑</span> Face Verification
                        <span className="text-sm font-normal text-slate-400 ml-auto">
                            Welcome, {employeeName}
                        </span>
                    </h2>

                    {/* Camera with face oval overlay */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50">
                        {!faceImage ? (
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="w-full"
                                mirrored
                            />
                        ) : (
                            <img src={faceImage} alt="Captured face" className="w-full" />
                        )}
                        {/* Oval face guide */}
                        {!faceImage && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div
                                    className="w-48 h-64 rounded-[50%] border-2 border-emerald-400/50"
                                    style={{
                                        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.6)",
                                    }}
                                />
                                <p className="absolute bottom-6 text-sm text-emerald-300/70 font-medium">
                                    Align your face inside the oval
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Capture / Retake */}
                    {!faceImage ? (
                        <button
                            onClick={handleCaptureFace}
                            className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                         bg-gradient-to-r from-emerald-500 to-cyan-500
                         hover:from-emerald-400 hover:to-cyan-400
                         transition-all duration-300 shadow-lg shadow-emerald-500/20"
                        >
                            📸 Capture Face
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setFaceImage(null); setStatus({ type: "", message: "" }); }}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-300 cursor-pointer
                           border border-slate-600 hover:bg-slate-700/50 transition-colors"
                            >
                                🔄 Retake
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setStep(1)}
                        className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                        ← Back to ID Scan
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════════
          STEP 3: OTP Verification
         ══════════════════════════════════════════════ */}
            {step === 3 && !txHash && (
                <div className="glass p-6 space-y-5 animate-fade-up">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-2xl">📱</span> OTP Verification
                    </h2>

                    {/* Preview thumbnails */}
                    <div className="flex gap-3">
                        {idImage && (
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1">ID Card</p>
                                <img src={idImage} alt="ID" className="w-full rounded-lg border border-slate-700/50 opacity-70" />
                            </div>
                        )}
                        {faceImage && (
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1">Face</p>
                                <img src={faceImage} alt="Face" className="w-full rounded-lg border border-slate-700/50 opacity-70" />
                            </div>
                        )}
                    </div>

                    <div className="text-center py-2">
                        <p className="text-slate-400 text-sm">
                            {otpSent
                                ? `OTP sent to ${maskedPhone}`
                                : "Sending OTP..."}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Enter 6-digit OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            placeholder="• • • • • •"
                            className="w-full px-4 py-4 rounded-xl bg-slate-800/60 border border-slate-600/50
                         text-white placeholder-slate-600 text-center text-3xl tracking-[0.5em] font-mono
                         focus:outline-none focus:border-indigo-500/60 transition-colors"
                        />
                    </div>

                    <button
                        onClick={verifyOTP}
                        disabled={loading || !otpSent}
                        className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                       bg-gradient-to-r from-indigo-500 to-emerald-500
                       hover:from-indigo-400 hover:to-emerald-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300 shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? "Verifying..." : "Verify & Authorize ✓"}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setStep(2); setFaceImage(null); setOtpSent(false); setStatus({ type: "", message: "" }); }}
                            className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                            ← Back to Face Scan
                        </button>
                        <button
                            onClick={sendOTP}
                            disabled={loading}
                            className="flex-1 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Resend OTP
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
          SUCCESS
         ══════════════════════════════════════════════ */}
            {txHash && (
                <div className="glass p-8 text-center space-y-4 animate-fade-up">
                    <div className="text-7xl mb-2">✅</div>
                    <h2 className="text-2xl font-bold text-emerald-400">Verification Complete!</h2>
                    <p className="text-slate-400">
                        Welcome, <strong className="text-white">{employeeName}</strong>. Your wallet is now authorized to vote.
                    </p>
                    <p className="text-xs text-slate-500 break-all">
                        TX: <span className="text-indigo-400 font-mono">{txHash}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-4">Redirecting to voting booth...</p>
                </div>
            )}
        </div>
    );
}

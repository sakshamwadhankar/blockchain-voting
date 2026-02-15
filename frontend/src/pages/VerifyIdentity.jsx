import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import * as faceapi from "face-api.js";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../config/contracts";

const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: "user",
};

export default function VerifyIdentity() {
    const { account, connect } = useWallet();
    const { user, loginAsEmployee, markAsVerified } = useAuth();
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    // Step machine: 1 = ID Scan, 2 = Face Scan, 3 = OTP
    const [step, setStep] = useState(1);

    // AI model loading
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Step 1 state
    const [idImage, setIdImage] = useState(null);
    const [employeeId, setEmployeeId] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [scanning, setScanning] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [manualEntry, setManualEntry] = useState(false); // Toggle between scan and manual entry

    // Step 2 state
    const [faceImage, setFaceImage] = useState(null);
    const [detectingFace, setDetectingFace] = useState(false);

    // Step 3 state
    const [otp, setOtp] = useState("");
    const [maskedPhone, setMaskedPhone] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    // Shared state
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [txHash, setTxHash] = useState("");

    // ── Load face-api models on mount ──────────────
    useEffect(() => {
        async function loadModels() {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
                ]);
                setModelsLoaded(true);
                console.log("Face-api models loaded (including recognition model)");
            } catch (err) {
                console.error("Failed to load face-api models:", err);
                setStatus({
                    type: "error",
                    message: "Failed to load AI models. Check /public/models folder.",
                });
            }
        }
        loadModels();
    }, []);

    // ── Capture helper ─────────────────────────────
    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            return webcamRef.current.getScreenshot();
        }
        return null;
    }, []);

    // ── Step 1: Capture ID + OCR ───────────────────
    const handleCaptureId = async () => {
        const img = capturePhoto();
        if (!img) return;
        setIdImage(img);
        setScanning(true);
        setOcrProgress(0);
        setStatus({ type: "", message: "🔍 Scanning ID card with OCR..." });

        try {
            const result = await Tesseract.recognize(img, "eng", {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const text = result.data.text;
            console.log("OCR Result:", text);

            // Search for employee ID pattern (MNC-XXX)
            const match = text.match(/MNC-\d{3}/i);

            if (match) {
                const detected = match[0].toUpperCase();
                setEmployeeId(detected);
                setStatus({
                    type: "success",
                    message: `✨ ID Detected: ${detected} — Verifying with database...`,
                });
                // Auto-verify against backend
                await verifyEmployeeId(detected);
            } else {
                setStatus({
                    type: "error",
                    message: "Could not detect Employee ID. Please type it manually below.",
                });
            }
        } catch (err) {
            console.error("OCR error:", err);
            setStatus({
                type: "error",
                message: "OCR scan failed. Please enter ID manually.",
            });
        }
        setScanning(false);
    };

    // ── Verify employee ID against backend ─────────
    const verifyEmployeeId = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/employee/${id.trim()}`);
            const data = await res.json();
            if (data.success) {
                setEmployeeName(data.data.name);
                // Auto-login employee after ID verification
                loginAsEmployee({
                    employeeId: id.trim(),
                    name: data.data.name
                });
                setStatus({
                    type: "success",
                    message: `Welcome, ${data.data.name}! Proceed to face scan.`,
                });
                setStep(2);
            } else {
                setStatus({ type: "error", message: data.message });
            }
        } catch {
            setStatus({
                type: "error",
                message: "Cannot reach server. Is the backend running?",
            });
        }
        setLoading(false);
    };

    const handleIdSubmit = () => verifyEmployeeId(employeeId);

    // ── Step 2: Capture Face + Detection ───────────
    const handleCaptureFace = async () => {
        const img = capturePhoto();
        if (!img) return;
        setFaceImage(img);
        setDetectingFace(true);
        setStatus({ type: "", message: "🧠 Analyzing face..." });

        try {
            // Create an image element for face-api
            const image = new Image();
            image.src = img;
            await new Promise((resolve) => (image.onload = resolve));

            const detection = await faceapi
                .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setDetectingFace(false);
                setStatus({
                    type: "error",
                    message: "❌ No face detected. You can skip this step or try again.",
                });
                return;
            }

            // Face detected — extract descriptor
            const descriptor = Array.from(detection.descriptor);
            const confidence = (detection.detection.score * 100).toFixed(1);

            console.log('[Face Capture] Descriptor length:', descriptor.length);

            setStatus({
                type: "success",
                message: `✅ Face captured (${confidence}% confidence). Verifying with database...`,
            });

            // Send descriptor to backend for verification/registration
            const res = await fetch(`${BACKEND_URL}/verify-biometric`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: employeeId.trim(),
                    faceDescriptor: descriptor
                }),
            });

            const data = await res.json();
            setDetectingFace(false);

            if (data.success) {
                if (data.isRegistration) {
                    setStatus({
                        type: "success",
                        message: `✅ ${data.message} Proceeding to OTP...`,
                    });
                } else {
                    setStatus({
                        type: "success",
                        message: `✅ ${data.message} Proceeding to OTP...`,
                    });
                }

                // Auto-advance to step 3 and send OTP
                setTimeout(() => {
                    setStep(3);
                    sendOTP();
                }, 1500);
            } else {
                setFaceImage(null);
                setStatus({
                    type: "error",
                    message: `❌ ${data.message}`,
                });
            }
        } catch (err) {
            console.error("Face detection error:", err);
            setDetectingFace(false);
            setFaceImage(null);
            setStatus({
                type: "error",
                message: "Face verification failed. You can skip this step or try again.",
            });
        }
    };

    // Skip face scan and go directly to OTP
    const skipFaceScan = () => {
        setStep(3);
        sendOTP();
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
                setStatus({
                    type: "success",
                    message: `OTP sent to ${data.maskedPhone || "your phone"}`,
                });
            } else {
                // If OTP sending fails (unverified number), show bypass option
                setOtpSent(true);
                setMaskedPhone("(Twilio verification failed)");
                setStatus({
                    type: "error",
                    message: `${data.message}. Use test OTP: 123456`
                });
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
                setTxHash(data.transactionHash);
                // Mark user as verified after successful OTP and store token
                markAsVerified(data.voterToken);
                setStatus({
                    type: "success",
                    message: "✅ Verification complete! Redirecting to vote...",
                });
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
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold mb-2">Connect MetaMask (System Fixed)</h2>
                    <p className="text-slate-400 mb-6">
                        Please connect your MetaMask wallet to verify your identity.
                    </p>
                    <button
                        onClick={connect}
                        className="px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                        Connect MetaMask
                    </button>
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
                    AI-powered ID scan, face detection, and OTP verification
                </p>
                {!modelsLoaded && (
                    <p className="text-amber-400 text-xs mt-2 animate-pulse">
                        ⏳ Loading AI models...
                    </p>
                )}
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
                            <span
                                className={`text-xs mt-1 ${step >= n ? "text-slate-300" : "text-slate-600"
                                    }`}
                            >
                                {label}
                            </span>
                        </div>
                        {n < 3 && (
                            <div
                                className={`w-16 h-0.5 mb-5 ${step > n ? "bg-emerald-500" : "bg-slate-700"
                                    }`}
                            />
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
          STEP 1: Scan ID + OCR OR Manual Entry
         ══════════════════════════════════════════════ */}
            {step === 1 && (
                <div className="glass p-6 space-y-5 animate-fade-up">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="text-2xl">🪪</span>
                            {manualEntry ? "Enter Employee ID" : "Scan Your Employee ID"}
                        </h2>
                        <button
                            onClick={() => {
                                setManualEntry(!manualEntry);
                                setIdImage(null);
                                setEmployeeId("");
                                setStatus({ type: "", message: "" });
                            }}
                            className="px-4 py-2 text-sm rounded-lg bg-slate-700/50 hover:bg-slate-600/50 
                                     text-slate-300 transition-colors cursor-pointer border border-slate-600/50"
                        >
                            {manualEntry ? "📸 Scan Instead" : "⌨️ Enter Manually"}
                        </button>
                    </div>

                    {!manualEntry ? (
                        <>
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
                                {/* OCR scanning overlay */}
                                {scanning && (
                                    <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-cyan-300 font-medium">Scanning ID Card...</p>
                                        <div className="w-48 h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full transition-all duration-300"
                                                style={{ width: `${ocrProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">{ocrProgress}%</p>
                                    </div>
                                )}
                            </div>

                            {/* Capture / Retake */}
                            {!idImage ? (
                                <button
                                    onClick={handleCaptureId}
                                    disabled={scanning}
                                    className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                                 bg-gradient-to-r from-cyan-500 to-blue-500
                                 hover:from-cyan-400 hover:to-blue-400
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all duration-300 shadow-lg shadow-cyan-500/20"
                                >
                                    📸 Capture & Scan ID
                                </button>
                            ) : (
                                !scanning && (
                                    <button
                                        onClick={() => {
                                            setIdImage(null);
                                            setEmployeeId("");
                                            setStatus({ type: "", message: "" });
                                        }}
                                        className="w-full py-2.5 rounded-xl font-semibold text-slate-300 cursor-pointer
                                   border border-slate-600 hover:bg-slate-700/50 transition-colors"
                                    >
                                        🔄 Retake Photo
                                    </button>
                                )
                            )}

                            {/* Manual Employee ID input (fallback if OCR fails) */}
                            {idImage && !scanning && (
                                <div className="space-y-3 pt-2 border-t border-slate-700/50">
                                    <label className="block text-sm text-slate-400">
                                        {employeeId
                                            ? "Detected Employee ID (edit if incorrect)"
                                            : "OCR couldn't auto-detect. Enter Employee ID manually:"}
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
                                        disabled={loading || !employeeId.trim()}
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
                        </>
                    ) : (
                        /* Manual Entry Mode */
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                                <p className="text-sm text-slate-400 mb-4 text-center">
                                    Enter your Employee ID directly without scanning
                                </p>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Employee ID
                                </label>
                                <input
                                    type="text"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                    placeholder="e.g. MNC-001"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                                       text-white placeholder-slate-500 font-mono text-lg text-center tracking-wider
                                       focus:outline-none focus:border-indigo-500/60 transition-colors"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleIdSubmit}
                                disabled={loading || !employeeId.trim()}
                                className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                                   bg-gradient-to-r from-indigo-500 to-purple-500
                                   hover:from-indigo-400 hover:to-purple-400
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all duration-300 shadow-lg shadow-indigo-500/20"
                            >
                                {loading ? "Verifying..." : "Verify Employee ID →"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════
          STEP 2: Face Scan + AI Detection
         ══════════════════════════════════════════════ */}
            {step === 2 && (
                <div className="glass p-6 space-y-5 animate-fade-up">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-2xl">🧑</span> Face Verification
                        <span className="text-sm font-normal text-slate-400 ml-auto">
                            Welcome, {employeeName}
                        </span>
                    </h2>

                    {!modelsLoaded && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                            ⏳ Loading face detection AI... Please wait.
                        </div>
                    )}

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
                        {/* Detecting face overlay */}
                        {detectingFace && (
                            <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-emerald-300 font-medium">
                                    🧠 Analyzing face...
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Running neural network detection
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Capture / Retake */}
                    {!faceImage ? (
                        <>
                            <button
                                onClick={handleCaptureFace}
                                disabled={!modelsLoaded || detectingFace}
                                className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                             bg-gradient-to-r from-emerald-500 to-cyan-500
                             hover:from-emerald-400 hover:to-cyan-400
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-300 shadow-lg shadow-emerald-500/20"
                            >
                                {!modelsLoaded
                                    ? "⏳ Loading AI..."
                                    : detectingFace
                                        ? "🧠 Detecting..."
                                        : "📸 Capture & Verify Face"}
                            </button>
                            <button
                                onClick={skipFaceScan}
                                disabled={detectingFace}
                                className="w-full py-2.5 rounded-xl font-medium text-slate-400 cursor-pointer
                                   border border-slate-600 hover:bg-slate-700/50 hover:text-slate-200
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                ⏭️ Skip Face Scan (Continue to OTP)
                            </button>
                        </>
                    ) : (
                        !detectingFace && (
                            <>
                                <button
                                    onClick={() => {
                                        setFaceImage(null);
                                        setStatus({ type: "", message: "" });
                                    }}
                                    className="w-full py-2.5 rounded-xl font-semibold text-slate-300 cursor-pointer
                               border border-slate-600 hover:bg-slate-700/50 transition-colors"
                                >
                                    🔄 Retake
                                </button>
                                <button
                                    onClick={skipFaceScan}
                                    className="w-full py-2.5 rounded-xl font-medium text-slate-400 cursor-pointer
                                       border border-slate-600 hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
                                >
                                    ⏭️ Skip & Continue to OTP
                                </button>
                            </>
                        )
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
                                <p className="text-xs text-slate-500 mb-1">ID Card ✓</p>
                                <img
                                    src={idImage}
                                    alt="ID"
                                    className="w-full rounded-lg border border-emerald-500/30 opacity-70"
                                />
                            </div>
                        )}
                        {faceImage && (
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1">Face ✓</p>
                                <img
                                    src={faceImage}
                                    alt="Face"
                                    className="w-full rounded-lg border border-emerald-500/30 opacity-70"
                                />
                            </div>
                        )}
                    </div>

                    <div className="text-center py-2">
                        <p className="text-slate-400 text-sm">
                            {otpSent ? `OTP sent to ${maskedPhone}` : "Sending OTP..."}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Enter 6-digit OTP
                        </label>
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
                            onClick={() => {
                                setStep(2);
                                setFaceImage(null);
                                setOtpSent(false);
                                setStatus({ type: "", message: "" });
                            }}
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
                    <h2 className="text-2xl font-bold text-emerald-400">
                        Verification Complete!
                    </h2>
                    <p className="text-slate-400">
                        Welcome,{" "}
                        <strong className="text-white">{employeeName}</strong>. Your wallet
                        is now authorized to vote.
                    </p>
                    <p className="text-xs text-slate-500 break-all">
                        TX: <span className="text-indigo-400 font-mono">{txHash}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-4">
                        Redirecting to voting booth...
                    </p>
                </div>
            )}
        </div>
    );
}

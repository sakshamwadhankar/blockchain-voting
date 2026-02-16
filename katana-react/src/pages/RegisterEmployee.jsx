import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { BACKEND_URL } from "../config/contracts";

const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: "user",
};

export default function RegisterEmployee() {
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: "",
        name: "",
        phone: ""
    });
    const [faceImage, setFaceImage] = useState(null);
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [detectingFace, setDetectingFace] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    // Load face-api models
    useEffect(() => {
        async function loadModels() {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
                ]);
                setModelsLoaded(true);
                console.log("Face-api models loaded");
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

    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            return webcamRef.current.getScreenshot();
        }
        return null;
    }, []);

    const handleCaptureFace = async () => {
        const img = capturePhoto();
        if (!img) return;
        setFaceImage(img);
        setDetectingFace(true);
        setStatus({ type: "", message: "🧠 Analyzing face..." });

        try {
            const image = new Image();
            image.src = img;
            await new Promise((resolve) => (image.onload = resolve));

            const detection = await faceapi
                .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setDetectingFace(false);
                setFaceImage(null);
                setStatus({
                    type: "error",
                    message: "❌ No face detected. Please try again.",
                });
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            const confidence = (detection.detection.score * 100).toFixed(1);
            
            setFaceDescriptor(descriptor);
            setDetectingFace(false);
            setStatus({
                type: "success",
                message: `✅ Face captured successfully (${confidence}% confidence)`,
            });
        } catch (err) {
            console.error("Face detection error:", err);
            setDetectingFace(false);
            setFaceImage(null);
            setStatus({
                type: "error",
                message: "Face detection failed. Please try again.",
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!faceDescriptor) {
            setStatus({ type: "error", message: "Please capture face first" });
            return;
        }

        setLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const res = await fetch(`${BACKEND_URL}/register-employee`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    faceDescriptor
                }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus({
                    type: "success",
                    message: `✅ Employee registered successfully! ID: ${data.employeeId}`,
                });
                
                // Reset form after 2 seconds
                setTimeout(() => {
                    setFormData({ employeeId: "", name: "", phone: "" });
                    setFaceImage(null);
                    setFaceDescriptor(null);
                    setStatus({ type: "", message: "" });
                }, 2000);
            } else {
                setStatus({ type: "error", message: data.message });
            }
        } catch (err) {
            setStatus({ type: "error", message: "Registration failed. Check backend." });
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-up">
            <div className="mb-6">
                <button
                    onClick={() => navigate("/admin")}
                    className="text-slate-400 hover:text-slate-200 transition-colors mb-4 cursor-pointer"
                >
                    ← Back to Admin Panel
                </button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Register New Employee
                </h1>
                <p className="text-slate-400 mt-1">
                    Add employee details and capture face for biometric registration
                </p>
            </div>

            {/* Status Message */}
            {status.message && (
                <div
                    className={`mb-6 p-4 rounded-xl text-sm transition-all ${
                        status.type === "error"
                            ? "bg-red-500/10 border border-red-500/30 text-red-300"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    }`}
                >
                    {status.message}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="glass p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Employee Details</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Employee ID
                            </label>
                            <input
                                type="text"
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                                placeholder="e.g. MNC-004"
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                                         text-white placeholder-slate-500 font-mono
                                         focus:outline-none focus:border-indigo-500/60 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. John Doe"
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                                         text-white placeholder-slate-500
                                         focus:outline-none focus:border-indigo-500/60 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="e.g. +919876543210"
                                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-600/50
                                         text-white placeholder-slate-500
                                         focus:outline-none focus:border-indigo-500/60 transition-colors"
                                required
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Include country code (e.g., +91 for India)
                            </p>
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-slate-400">Face Biometric</span>
                                {faceDescriptor && (
                                    <span className="text-xs text-emerald-400">✓ Captured</span>
                                )}
                            </div>
                            {!faceDescriptor && (
                                <p className="text-xs text-amber-400">
                                    ⚠️ Face capture required before registration
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !faceDescriptor}
                            className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer
                                     bg-gradient-to-r from-indigo-500 to-purple-500
                                     hover:from-indigo-400 hover:to-purple-400
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-all duration-300 shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? "Registering..." : "Register Employee"}
                        </button>
                    </form>
                </div>

                {/* Face Capture Section */}
                <div className="glass p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Face Capture</h2>

                    {!modelsLoaded && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                            ⏳ Loading AI models... Please wait.
                        </div>
                    )}

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
                                    Align face inside the oval
                                </p>
                            </div>
                        )}

                        {/* Detecting overlay */}
                        {detectingFace && (
                            <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-emerald-300 font-medium">
                                    🧠 Analyzing face...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Capture / Retake Buttons */}
                    {!faceImage ? (
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
                                : "📸 Capture Face"}
                        </button>
                    ) : (
                        !detectingFace && (
                            <button
                                onClick={() => {
                                    setFaceImage(null);
                                    setFaceDescriptor(null);
                                    setStatus({ type: "", message: "" });
                                }}
                                className="w-full py-2.5 rounded-xl font-semibold text-slate-300 cursor-pointer
                                       border border-slate-600 hover:bg-slate-700/50 transition-colors"
                            >
                                🔄 Retake Photo
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

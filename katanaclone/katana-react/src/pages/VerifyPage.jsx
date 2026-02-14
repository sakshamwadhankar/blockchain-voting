import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Webcam from 'react-webcam'
import Tesseract from 'tesseract.js'
import * as faceapi from 'face-api.js'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'
import { BACKEND_URL } from '../config/contracts'
import SectionParticles from '../components/SectionParticles'
import StarField from '../components/StarField'

const videoConstraints = { width: 480, height: 360, facingMode: 'user' }

export default function VerifyPage() {
    const { account, connect } = useWallet()
    const { loginAsEmployee, markAsVerified } = useAuth()
    const navigate = useNavigate()
    const webcamRef = useRef(null)

    // Step machine: 1 = ID Entry, 2 = Face Scan, 3 = OTP
    const [step, setStep] = useState(1)
    const [modelsLoaded, setModelsLoaded] = useState(false)

    // Step 1 state
    const [idImage, setIdImage] = useState(null)
    const [employeeId, setEmployeeId] = useState('')
    const [employeeName, setEmployeeName] = useState('')
    const [scanning, setScanning] = useState(false)
    const [ocrProgress, setOcrProgress] = useState(0)
    const [manualEntry, setManualEntry] = useState(false)

    // Step 2 state
    const [faceImage, setFaceImage] = useState(null)
    const [detectingFace, setDetectingFace] = useState(false)

    // Step 3 state
    const [otp, setOtp] = useState('')
    const [maskedPhone, setMaskedPhone] = useState('')
    const [otpSent, setOtpSent] = useState(false)

    // Shared state
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState({ type: '', message: '' })
    const [txHash, setTxHash] = useState('')

    // Load face-api models on mount
    useEffect(() => {
        async function loadModels() {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ])
                setModelsLoaded(true)
            } catch (err) {
                console.error('Failed to load face-api models:', err)
                setStatus({ type: 'error', message: 'Failed to load AI models. Check /public/models folder.' })
            }
        }
        loadModels()
    }, [])

    const capturePhoto = useCallback(() => {
        if (webcamRef.current) return webcamRef.current.getScreenshot()
        return null
    }, [])

    // Step 1: Capture ID + OCR
    const handleCaptureId = async () => {
        const img = capturePhoto()
        if (!img) return
        setIdImage(img)
        setScanning(true)
        setOcrProgress(0)
        setStatus({ type: '', message: '🔍 scanning ID card with OCR...' })
        try {
            const result = await Tesseract.recognize(img, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100))
                },
            })
            const text = result.data.text
            const match = text.match(/MNC-\d{3}/i)
            if (match) {
                const detected = match[0].toUpperCase()
                setEmployeeId(detected)
                setStatus({ type: 'success', message: `✨ ID detected: ${detected} — verifying with database...` })
                await verifyEmployeeId(detected)
            } else {
                setStatus({ type: 'error', message: 'could not detect Employee ID. please type it manually below.' })
            }
        } catch (err) {
            console.error('OCR error:', err)
            setStatus({ type: 'error', message: 'OCR scan failed. please enter ID manually.' })
        }
        setScanning(false)
    }

    // Verify employee ID against backend
    const verifyEmployeeId = async (id) => {
        setLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/employee/${id.trim()}`)
            const data = await res.json()
            if (data.success) {
                setEmployeeName(data.data.name)
                loginAsEmployee({ employeeId: id.trim(), name: data.data.name })
                setStatus({ type: 'success', message: `welcome, ${data.data.name}! proceed to face scan.` })
                setStep(2)
            } else {
                setStatus({ type: 'error', message: data.message })
            }
        } catch {
            setStatus({ type: 'error', message: 'cannot reach server. is the backend running?' })
        }
        setLoading(false)
    }

    const handleIdSubmit = () => verifyEmployeeId(employeeId)

    // Step 2: Capture Face + Detection
    const handleCaptureFace = async () => {
        const img = capturePhoto()
        if (!img) return
        setFaceImage(img)
        setDetectingFace(true)
        setStatus({ type: '', message: '🧠 analyzing face...' })
        try {
            const image = new Image()
            image.src = img
            await new Promise((resolve) => (image.onload = resolve))
            const detection = await faceapi
                .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
                .withFaceLandmarks()
                .withFaceDescriptor()
            if (!detection) {
                setDetectingFace(false)
                setStatus({ type: 'error', message: '❌ no face detected. you can skip this step or try again.' })
                return
            }
            const descriptor = Array.from(detection.descriptor)
            const confidence = (detection.detection.score * 100).toFixed(1)
            setStatus({ type: 'success', message: `✅ face captured (${confidence}% confidence). verifying with database...` })
            const res = await fetch(`${BACKEND_URL}/verify-biometric`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeId.trim(), faceDescriptor: descriptor }),
            })
            const data = await res.json()
            setDetectingFace(false)
            if (data.success) {
                setStatus({ type: 'success', message: `✅ ${data.message} proceeding to OTP...` })
                setTimeout(() => { setStep(3); sendOTP() }, 1500)
            } else {
                setFaceImage(null)
                setStatus({ type: 'error', message: `❌ ${data.message}` })
            }
        } catch (err) {
            console.error('Face detection error:', err)
            setDetectingFace(false)
            setFaceImage(null)
            setStatus({ type: 'error', message: 'face verification failed. you can skip this step or try again.' })
        }
    }

    const skipFaceScan = () => { setStep(3); sendOTP() }

    // Step 3: Send OTP
    const sendOTP = async () => {
        setLoading(true)
        setStatus({ type: '', message: '' })
        try {
            const res = await fetch(`${BACKEND_URL}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeId.trim() }),
            })
            const data = await res.json()
            if (data.success) {
                setMaskedPhone(data.maskedPhone || 'your phone')
                setOtpSent(true)
                setStatus({ type: 'success', message: `OTP sent to ${data.maskedPhone || 'your phone'}` })
            } else {
                setStatus({ type: 'error', message: data.message })
            }
        } catch {
            setStatus({ type: 'error', message: 'failed to send OTP. check backend.' })
        }
        setLoading(false)
    }

    // Step 3: Verify OTP
    const verifyOTP = async () => {
        if (!otp.trim()) return setStatus({ type: 'error', message: 'enter the OTP' })
        setLoading(true)
        setStatus({ type: '', message: '' })
        try {
            const res = await fetch(`${BACKEND_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeId.trim(), code: otp.trim(), walletAddress: account }),
            })
            const data = await res.json()
            if (data.success) {
                setTxHash(data.transactionHash)
                markAsVerified()
                setStatus({ type: 'success', message: '✅ verification complete! redirecting to vote...' })
                setTimeout(() => navigate('/vote'), 2000)
            } else {
                setStatus({ type: 'error', message: data.message })
            }
        } catch {
            setStatus({ type: 'error', message: 'verification failed. try again.' })
        }
        setLoading(false)
    }

    // No wallet connected
    if (!account) {
        return (
            <div className="page-wrapper">
                <StarField />
                <div className="page-content">
                    <SectionParticles variant="blue" density={50} />
                    <div className="page-header">
                        <Link to="/" className="page-back">← back to home</Link>
                        <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>connect wallet</h1>
                        <p className="page-subtitle">connect your MetaMask wallet to verify your identity</p>
                    </div>
                    <div className="page-grid" style={{ justifyContent: 'center' }}>
                        <div className="page-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
                            <div className="page-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#F6FF0D" strokeWidth="1.5">
                                    <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                                    <path d="M3 5v14a2 2 0 002 2h16v-5" />
                                    <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                            </div>
                            <h3 className="typo-h4">MetaMask required</h3>
                            <p>please connect your MetaMask wallet to proceed with identity verification and on-chain authorization.</p>
                            <button className="btn btn--important" style={{ marginTop: '20px' }} onClick={connect}>
                                <span className="btn-inner"><span>connect MetaMask</span></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-wrapper">
            <StarField />
            <div className="page-content">
                <SectionParticles variant="blue" density={50} />
                <div className="page-header">
                    <Link to="/" className="page-back">← back to home</Link>
                    <h1 className="typo-h1" style={{ color: '#F6FF0D' }}>verify identity</h1>
                    <p className="page-subtitle">three-layer biometric authentication for election integrity</p>
                    {!modelsLoaded && <p style={{ color: '#F6FF0D', fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>⏳ loading AI models...</p>}
                </div>

                {/* Progress Steps */}
                <div className="page-status-bar">
                    <div className={`page-status-step ${step > 1 ? 'completed' : step === 1 ? 'active' : ''}`}>
                        {step > 1 ? '✓' : '1'} ID scan
                    </div>
                    <div className="page-status-line"></div>
                    <div className={`page-status-step ${step > 2 ? 'completed' : step === 2 ? 'active' : ''}`}>
                        {step > 2 ? '✓' : '2'} face scan
                    </div>
                    <div className="page-status-line"></div>
                    <div className={`page-status-step ${step > 3 || txHash ? 'completed' : step === 3 ? 'active' : ''}`}>
                        {txHash ? '✓' : '3'} OTP
                    </div>
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`page-status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}

                {/* ═══ STEP 1: ID Entry/Scan ═══ */}
                {step === 1 && (
                    <div className="page-grid">
                        <div className="page-card" style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 className="typo-h4">
                                    {manualEntry ? 'enter employee ID' : 'scan your employee ID'}
                                </h3>
                                <button
                                    className="btn btn--smaller"
                                    onClick={() => { setManualEntry(!manualEntry); setIdImage(null); setEmployeeId(''); setStatus({ type: '', message: '' }) }}
                                >
                                    <span className="btn-inner"><span>{manualEntry ? '📸 scan instead' : '⌨️ enter manually'}</span></span>
                                </button>
                            </div>

                            {!manualEntry ? (
                                <>
                                    <div className="page-camera-box">
                                        {!idImage ? (
                                            <Webcam
                                                ref={webcamRef}
                                                audio={false}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={videoConstraints}
                                                style={{ width: '100%', borderRadius: '8px' }}
                                            />
                                        ) : (
                                            <img src={idImage} alt="Captured ID" style={{ width: '100%', borderRadius: '8px' }} />
                                        )}
                                        {scanning && (
                                            <div className="page-camera-overlay">
                                                <div className="page-spinner"></div>
                                                <p>scanning ID card... {ocrProgress}%</p>
                                                <div className="page-progress-bar">
                                                    <div className="page-progress-fill" style={{ width: `${ocrProgress}%` }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!idImage ? (
                                        <button className="btn btn--important" onClick={handleCaptureId} disabled={scanning} style={{ marginTop: '16px', width: '100%' }}>
                                            <span className="btn-inner"><span>📸 capture & scan ID</span></span>
                                        </button>
                                    ) : !scanning && (
                                        <button className="btn" onClick={() => { setIdImage(null); setEmployeeId(''); setStatus({ type: '', message: '' }) }} style={{ marginTop: '12px', width: '100%' }}>
                                            <span className="btn-inner"><span>🔄 retake photo</span></span>
                                        </button>
                                    )}
                                    {idImage && !scanning && (
                                        <div style={{ marginTop: '16px' }}>
                                            <label style={{ fontSize: '13px', opacity: 0.6, display: 'block', marginBottom: '8px' }}>
                                                {employeeId ? 'detected Employee ID (edit if incorrect)' : 'OCR couldn\'t auto-detect. enter ID manually:'}
                                            </label>
                                            <input
                                                type="text" value={employeeId}
                                                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                                placeholder="e.g. MNC-001" className="page-input"
                                                style={{ textAlign: 'center', letterSpacing: '0.1em', fontFamily: 'monospace' }}
                                            />
                                            <button className="btn btn--important" onClick={handleIdSubmit} disabled={loading || !employeeId.trim()} style={{ marginTop: '12px', width: '100%' }}>
                                                <span className="btn-inner"><span>{loading ? 'checking...' : 'verify ID →'}</span></span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '14px', opacity: 0.6, marginBottom: '16px', textAlign: 'center' }}>
                                        enter your Employee ID directly without scanning
                                    </p>
                                    <input
                                        type="text" value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                        placeholder="e.g. MNC-001" className="page-input"
                                        style={{ textAlign: 'center', letterSpacing: '0.1em', fontFamily: 'monospace' }}
                                        autoFocus
                                    />
                                    <button className="btn btn--important" onClick={handleIdSubmit} disabled={loading || !employeeId.trim()} style={{ marginTop: '16px', width: '100%' }}>
                                        <span className="btn-inner"><span>{loading ? 'verifying...' : 'verify employee ID →'}</span></span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ STEP 2: Face Scan ═══ */}
                {step === 2 && (
                    <div className="page-grid">
                        <div className="page-card" style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 className="typo-h4">face verification</h3>
                                <span style={{ fontSize: '13px', opacity: 0.6 }}>welcome, {employeeName}</span>
                            </div>

                            {!modelsLoaded && (
                                <div className="page-status-message" style={{ marginBottom: '16px' }}>⏳ loading face detection AI... please wait.</div>
                            )}

                            <div className="page-camera-box">
                                {!faceImage ? (
                                    <Webcam
                                        ref={webcamRef} audio={false} screenshotFormat="image/jpeg"
                                        videoConstraints={videoConstraints} mirrored
                                        style={{ width: '100%', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <img src={faceImage} alt="Captured face" style={{ width: '100%', borderRadius: '8px' }} />
                                )}
                                {detectingFace && (
                                    <div className="page-camera-overlay">
                                        <div className="page-spinner"></div>
                                        <p>🧠 analyzing face...</p>
                                    </div>
                                )}
                            </div>

                            {!faceImage ? (
                                <>
                                    <button className="btn btn--important" onClick={handleCaptureFace} disabled={!modelsLoaded || detectingFace} style={{ marginTop: '16px', width: '100%' }}>
                                        <span className="btn-inner"><span>
                                            {!modelsLoaded ? '⏳ loading AI...' : detectingFace ? '🧠 detecting...' : '📸 capture & verify face'}
                                        </span></span>
                                    </button>
                                    <button className="btn" onClick={skipFaceScan} disabled={detectingFace} style={{ marginTop: '8px', width: '100%' }}>
                                        <span className="btn-inner"><span>⏭️ skip face scan (continue to OTP)</span></span>
                                    </button>
                                </>
                            ) : !detectingFace && (
                                <>
                                    <button className="btn" onClick={() => { setFaceImage(null); setStatus({ type: '', message: '' }) }} style={{ marginTop: '12px', width: '100%' }}>
                                        <span className="btn-inner"><span>🔄 retake</span></span>
                                    </button>
                                    <button className="btn" onClick={skipFaceScan} style={{ marginTop: '8px', width: '100%' }}>
                                        <span className="btn-inner"><span>⏭️ skip & continue to OTP</span></span>
                                    </button>
                                </>
                            )}

                            <button onClick={() => setStep(1)} className="btn btn--smaller" style={{ marginTop: '16px', width: '100%', opacity: 0.5 }}>
                                <span className="btn-inner"><span>← back to ID scan</span></span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ STEP 3: OTP Verification ═══ */}
                {step === 3 && !txHash && (
                    <div className="page-grid">
                        <div className="page-card" style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto' }}>
                            <h3 className="typo-h4" style={{ marginBottom: '16px' }}>📱 OTP verification</h3>

                            <p style={{ textAlign: 'center', opacity: 0.6, fontSize: '14px', marginBottom: '24px' }}>
                                {otpSent ? `OTP sent to ${maskedPhone}` : 'sending OTP...'}
                            </p>

                            <label style={{ fontSize: '13px', opacity: 0.5, display: 'block', marginBottom: '8px' }}>enter 6-digit OTP</label>
                            <input
                                type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                                maxLength={6} placeholder="• • • • • •" className="page-input"
                                style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '0.5em', fontFamily: 'monospace' }}
                            />

                            <button className="btn btn--important" onClick={verifyOTP} disabled={loading || !otpSent} style={{ marginTop: '20px', width: '100%' }}>
                                <span className="btn-inner"><span>{loading ? 'verifying...' : 'verify & authorize ✓'}</span></span>
                            </button>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button className="btn btn--smaller" onClick={() => { setStep(2); setFaceImage(null); setOtpSent(false); setStatus({ type: '', message: '' }) }} style={{ flex: 1 }}>
                                    <span className="btn-inner"><span>← back</span></span>
                                </button>
                                <button className="btn btn--smaller btn--important" onClick={sendOTP} disabled={loading} style={{ flex: 1 }}>
                                    <span className="btn-inner"><span>resend OTP</span></span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ SUCCESS ═══ */}
                {txHash && (
                    <div className="page-grid">
                        <div className="page-card" style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                            <h3 className="typo-h3" style={{ color: '#4ade80', marginBottom: '12px' }}>verification complete!</h3>
                            <p style={{ opacity: 0.7, marginBottom: '12px' }}>
                                welcome, <strong style={{ color: '#fff' }}>{employeeName}</strong>. your wallet is now authorized to vote.
                            </p>
                            <p style={{ fontSize: '12px', opacity: 0.4, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                TX: <span style={{ color: '#F6FF0D' }}>{txHash}</span>
                            </p>
                            <p style={{ fontSize: '13px', opacity: 0.5, marginTop: '16px' }}>redirecting to voting booth...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

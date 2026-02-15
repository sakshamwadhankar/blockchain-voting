import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import firebaseService from '../services/firebaseService';

export default function BiometricVerification({ employeeId, onVerified, onError }) {
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      startCamera();
    }
  }, [modelsLoaded]);

  const loadModels = async () => {
    try {
      setMessage('Loading AI models...');
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      setModelsLoaded(true);
      setMessage('AI models loaded. Starting camera...');
    } catch (error) {
      console.error('Error loading models:', error);
      setMessage('Failed to load AI models');
      onError?.('Failed to load face recognition models');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setLoading(false);
        setMessage('Position your face in the frame');
        startFaceDetection();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setMessage('Camera access denied');
      onError?.('Camera access required for biometric verification');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startFaceDetection = () => {
    const detectFace = async () => {
      if (!videoRef.current || verifying) return;

      const detections = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        setFaceDetected(true);
        
        // Draw detection on canvas
        if (canvasRef.current) {
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        }
      } else {
        setFaceDetected(false);
      }

      requestAnimationFrame(detectFace);
    };

    detectFace();
  };

  const handleVerify = async () => {
    if (!faceDetected || verifying) return;

    setVerifying(true);
    setMessage('Verifying your identity...');

    try {
      // Capture face descriptor
      const detections = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setMessage('No face detected. Please try again.');
        setVerifying(false);
        return;
      }

      const capturedDescriptor = Array.from(detections.descriptor);

      // Verify against Firebase
      const result = await firebaseService.verifyEmployeeFace(
        employeeId,
        capturedDescriptor
      );

      if (result.success) {
        setMessage('✅ Identity verified successfully!');
        stopCamera();
        onVerified?.(result);
      } else {
        setMessage(`❌ Verification failed. Distance: ${result.distance.toFixed(3)}`);
        onError?.('Face verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setMessage('Verification error. Please try again.');
      onError?.(error.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4">🔐 Biometric Verification</h2>
      
      {/* Video Feed */}
      <div className="relative mb-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full rounded-lg"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* Face Detection Indicator */}
        {!loading && (
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${
            faceDetected 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {faceDetected ? '✓ Face Detected' : '✗ No Face'}
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className="mb-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
        <p className="text-blue-200 text-center">{message}</p>
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={!faceDetected || verifying || loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-colors"
      >
        {verifying ? 'Verifying...' : 'Verify Identity'}
      </button>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-white/5 rounded-lg">
        <p className="text-white text-sm font-semibold mb-2">Instructions:</p>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Position your face in the center of the frame</li>
          <li>• Ensure good lighting</li>
          <li>• Remove glasses if possible</li>
          <li>• Look directly at the camera</li>
          <li>• Click "Verify Identity" when face is detected</li>
        </ul>
      </div>
    </div>
  );
}

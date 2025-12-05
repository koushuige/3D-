import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureState, HandData } from '../types';
import { detectGesture, calculateExpansion, calculateRotationZ } from '../services/gestureUtils';

interface HandManagerProps {
  onHandUpdate: (data: HandData | null) => void;
}

const HandManager: React.FC<HandManagerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastVideoTime = useRef(-1);
  const requestRef = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  // Initialize MediaPipe
  useEffect(() => {
    const initHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading hand landmarker:", error);
      }
    };

    initHandLandmarker();

    return () => {
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  // Setup Camera
  useEffect(() => {
    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    if (isLoaded) {
      startCamera();
    }

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    const nowInMs = Date.now();
    if (videoRef.current.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = videoRef.current.currentTime;
      
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, nowInMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const gesture = detectGesture(landmarks);
        
        // Calculate interaction values
        const expansion = calculateExpansion(landmarks);
        const zAngle = calculateRotationZ(landmarks);
        
        // Use Index finger tip for XY control (normalized 0-1 based on video dimensions)
        // MediaPipe coords are already normalized 0-1
        const xPos = landmarks[8].x;
        const yPos = landmarks[8].y;

        onHandUpdate({
          landmarks,
          gesture,
          values: {
            expansion,
            rotationX: (yPos - 0.5) * 2, // Map 0..1 to -1..1
            rotationY: (xPos - 0.5) * 2, // Map 0..1 to -1..1
            rotationZ: zAngle,
          }
        });
      } else {
        onHandUpdate(null);
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl overflow-hidden border-2 border-cyan-500/30 bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.3)]">
       {/* Helper visualization could go here, but raw video is fine for checking tracking */}
       <video 
         ref={videoRef} 
         autoPlay 
         playsInline 
         className="w-48 h-36 object-cover opacity-80 scale-x-[-1]" // Mirror effect
         muted
       />
       <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-xs text-cyan-400 font-mono rounded">
         {isLoaded ? 'SYSTEM ONLINE' : 'INITIALIZING...'}
       </div>
    </div>
  );
};

export default HandManager;
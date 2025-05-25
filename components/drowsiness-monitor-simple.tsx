"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, AlertTriangle, Loader2, Server, Smartphone } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import * as faceapi from 'face-api.js'

// For face-api.js environment
if (typeof window !== 'undefined') {
  faceapi.env.monkeyPatch({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
  });
}

// Constants
const EAR_THRESHOLD = 0.2;  // Eye Aspect Ratio threshold for drowsiness
const BLINK_THRESHOLD = 0.21;  // Threshold for detecting blinks

export function DrowsinessMonitorSimple() {
  // State
  const [isActive, setIsActive] = useState(false)
  const [drowsinessLevel, setDrowsinessLevel] = useState(10)
  const [earValue, setEarValue] = useState(0.32)
  const [blinkCount, setBlinkCount] = useState(0)
  const [alertStatus, setAlertStatus] = useState("normal")
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  
  // Detection variables
  const earBufferRef = useRef<number[]>([]);
  const closedEyeFramesRef = useRef<number>(0);
  const previousEyeStateRef = useRef<string>('open');
  const lastBlinkTimestampRef = useRef<number>(0);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        
        // Load required models
        await faceapi.loadTinyFaceDetectorModel('/models/face-api');
        await faceapi.loadFaceLandmarkModel('/models/face-api');
        
        console.log("Face-API models loaded successfully");
        setModelsLoaded(true);
        setError(null);
      } catch (error) {
        console.error("Error loading face-api.js models:", error);
        setError("Failed to load facial detection models. Please refresh the page and try again.");
      } finally {
        setIsModelLoading(false);
      }
    };

    // Only load models in browser environment
    if (typeof window !== 'undefined') {
      loadModels();
    }
    
    return () => {
      // Cleanup if component unmounts
      stopDetection();
    };
  }, []);

  // Calculate Eye Aspect Ratio from landmarks
  const calculateEAR = (landmarks: any) => {
    try {
      // Get eye landmarks
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      // Calculate EAR for left eye
      const leftEAR = calculateEyeAspectRatio(leftEye);
      
      // Calculate EAR for right eye
      const rightEAR = calculateEyeAspectRatio(rightEye);
      
      // Return average EAR
      return (leftEAR + rightEAR) / 2.0;
    } catch (error) {
      console.error("Error calculating EAR:", error);
      return 0.3; // Default value for open eyes
    }
  };

  // Calculate EAR for a single eye
  const calculateEyeAspectRatio = (eye: any[]) => {
    try {
      // Calculate euclidean distance between points
      const v1 = distance(eye[1], eye[5]); // top to bottom at left side
      const v2 = distance(eye[2], eye[4]); // top to bottom at right side
      const h = distance(eye[0], eye[3]); // left to right corners
      
      // Return EAR
      if (h === 0) return 0.3; // Avoid division by zero
      return (v1 + v2) / (2.0 * h);
    } catch (error) {
      console.error("Error calculating single eye EAR:", error);
      return 0.3;
    }
  };

  // Calculate distance between two points
  const distance = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Setup webcam
  const setupWebcam = async () => {
    if (!videoRef.current) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      videoRef.current.srcObject = stream;

      return new Promise<boolean>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            resolve(true);
          };
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setError("Could not access webcam. Please check permissions.");
      return false;
    }
  };

  // Start detection
  const startDetection = async () => {
    if (!modelsLoaded) {
      setError("Face detection models not loaded yet. Please wait.");
      return;
    }

    try {
      setError(null);
      
      // Setup webcam
      const webcamReady = await setupWebcam();
      if (!webcamReady) {
        throw new Error("Failed to initialize webcam");
      }

      // Start video playback
      if (videoRef.current) {
        await videoRef.current.play();
      }

      // Reset detection state
      resetDetectionState();
      
      // Start detection loop
      detectDrowsiness();
      
      setIsActive(true);
    } catch (error) {
      console.error("Error starting detection:", error);
      setError(`Failed to start detection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reset detection state
  const resetDetectionState = () => {
    earBufferRef.current = [];
    closedEyeFramesRef.current = 0;
    previousEyeStateRef.current = 'open';
    lastBlinkTimestampRef.current = 0;
    setBlinkCount(0);
    setDrowsinessLevel(10);
    setAlertStatus("normal");
  };

  // Detect drowsiness
  const detectDrowsiness = async () => {
    if (!isActive || !videoRef.current || !canvasRef.current || !videoRef.current.readyState) {
      // Schedule next frame if active but video not ready
      if (isActive) {
        animationRef.current = requestAnimationFrame(detectDrowsiness);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    // Match canvas size to video
    if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
      faceapi.matchDimensions(canvas, displaySize);
    }

    try {
      // Detect faces with landmarks
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      // Draw results on canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // First draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (detections) {
          // Face detected
          setFaceDetected(true);
          
          // Draw face landmarks
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          // Calculate EAR
          const ear = calculateEAR(resizedDetections.landmarks);
          setEarValue(Number(ear.toFixed(2)));
          
          // Add to buffer for smoother detection
          earBufferRef.current.push(ear);
          if (earBufferRef.current.length > 10) { // Keep last 10 frames
            earBufferRef.current.shift();
          }
          
          // Calculate moving average
          const avgEAR = earBufferRef.current.reduce((a, b) => a + b, 0) / earBufferRef.current.length;
          
          // Update eye state (open/closed)
          const currentEyeState = avgEAR < BLINK_THRESHOLD ? 'closed' : 'open';
          
          // Blink detection
          if (previousEyeStateRef.current === 'open' && currentEyeState === 'closed') {
            // Start of eye closure, reset frame counter
            closedEyeFramesRef.current = 1;
          } else if (currentEyeState === 'closed') {
            // Continuing eye closure
            closedEyeFramesRef.current++;
          } else if (previousEyeStateRef.current === 'closed' && currentEyeState === 'open') {
            // End of eye closure - check if it was a blink
            const now = Date.now();
            if (closedEyeFramesRef.current >= 2 && 
                closedEyeFramesRef.current <= 7 && // Not too long for a blink
                now - lastBlinkTimestampRef.current > 500) { // Not too frequent
              setBlinkCount(prev => prev + 1);
              lastBlinkTimestampRef.current = now;
            }
            closedEyeFramesRef.current = 0;
          }
          
          previousEyeStateRef.current = currentEyeState;
          
          // Determine drowsiness
          const isDrowsy = avgEAR < EAR_THRESHOLD;
          
          // Update drowsiness level
          if (isDrowsy) {
            setDrowsinessLevel(prev => Math.min(100, prev + 5));
          } else {
            setDrowsinessLevel(prev => Math.max(0, prev - 1));
          }
          
          // Update alert status
          if (drowsinessLevel > 70) {
            setAlertStatus("high");
          } else if (drowsinessLevel > 40) {
            setAlertStatus("medium");
          } else {
            setAlertStatus("normal");
          }
          
          // Draw EAR value and blink count
          ctx.fillStyle = "#4ADE80";
          ctx.font = "16px Arial";
          ctx.fillText(`EAR: ${avgEAR.toFixed(2)}`, 10, 30);
          ctx.fillText(`Blinks: ${blinkCount}`, 10, 60);
          
          // Draw drowsiness indicators
          if (isDrowsy) {
            ctx.fillStyle = "#EF4444";
            ctx.font = "20px Arial Bold";
            ctx.fillText("DROWSINESS DETECTED!", canvas.width / 2 - 120, 30);
          }
        } else {
          // No face detected
          setFaceDetected(false);
        }
      }
    } catch (error) {
      console.error("Error in detection:", error);
    }

    // Continue detection loop
    if (isActive) {
      animationRef.current = requestAnimationFrame(detectDrowsiness);
    }
  };

  // Stop detection
  const stopDetection = () => {
    setIsActive(false);
    
    // Stop animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Stop webcam
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          className={`px-4 py-2 rounded-md ${
            isActive
              ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
              : "bg-gradient-to-r from-green-500 to-green-600 text-white"
          } shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={isActive ? stopDetection : startDetection}
          disabled={isModelLoading}
        >
          {isModelLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
              Loading models...
            </>
          ) : isActive ? (
            "Stop Monitoring"
          ) : (
            "Start Monitoring"
          )}
        </button>

        <Badge
          variant="outline"
          className={`
            ${alertStatus === "normal" ? "border-green-500 text-green-500" : ""}
            ${alertStatus === "medium" ? "border-yellow-500 text-yellow-500" : ""}
            ${alertStatus === "high" ? "border-red-500 text-red-500" : ""}
          `}
        >
          {alertStatus === "high" && <AlertTriangle className="mr-1 h-3 w-3" />}
          {alertStatus === "normal" ? "Normal" : alertStatus === "medium" ? "Warning" : "Alert"}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="aspect-video bg-gradient-to-br from-gray-900 to-blue-900 rounded-md flex items-center justify-center relative shadow-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: "scaleX(-1)" }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {!faceDetected && isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center p-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>No face detected</p>
              <p className="text-xs mt-1">Please position your face in the camera view</p>
            </div>
          </div>
        )}

        {!isActive && !isModelLoading && (
          <div className="text-white text-center p-4">
            <Eye className="h-8 w-8 mx-auto mb-2" />
            <p>Camera is off</p>
            <p className="text-xs mt-1">Click "Start Monitoring" to begin</p>
          </div>
        )}

        {isModelLoading && (
          <div className="text-white text-center p-4">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Loading detection models...</p>
            <p className="text-xs mt-1">This may take a few seconds</p>
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white p-3 rounded-md text-xs">
          <div className="flex justify-between mb-1">
            <span>Drowsiness Level:</span>
            <span>{drowsinessLevel}%</span>
          </div>
          <Progress value={drowsinessLevel} className="h-1.5 mb-2">
            <div
              className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
              style={{ width: `${drowsinessLevel}%` }}
            />
          </Progress>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between">
              <span>EAR Value:</span>
              <span className="font-medium">{earValue}</span>
            </div>
            <div className="flex justify-between">
              <span>Blinks:</span>
              <span className="font-medium">{blinkCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`font-medium ${
                alertStatus === "normal" ? "text-green-400" : 
                alertStatus === "medium" ? "text-yellow-400" : "text-red-400"
              }`}>
                {alertStatus === "normal" ? "Alert" : 
                 alertStatus === "medium" ? "Drowsy" : "Very Drowsy"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="truncate font-medium">
                Browser
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="border-none shadow-md bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Blink Rate</span>
              </div>
              <span className="text-sm bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full text-blue-700 dark:text-blue-300">
                {isActive ? `${blinkCount} blinks` : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Alertness</span>
              </div>
              <span className={`text-sm px-2 py-0.5 rounded-full ${
                alertStatus === "normal" 
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                  : alertStatus === "medium"
                  ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                  : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              }`}>
                {isActive ? (
                  alertStatus === "normal" ? "Good" : alertStatus === "medium" ? "Moderate" : "Low"
                ) : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
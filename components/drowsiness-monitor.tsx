"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react"
import * as faceapi from 'face-api.js'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useDrowsiness } from "@/app/contexts/DrowsinessContext"

// Initialize face-api.js environment
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
const EAR_THRESHOLD = 0.22;  // Eye Aspect Ratio threshold for drowsiness
const BLINK_THRESHOLD = 0.27;  // Threshold for detecting blinks based on observed values
const DROWSY_TIME_THRESHOLD = 3000;  // Time in ms for eyes to be closed to trigger drowsiness alert (3 seconds)
const HEAD_NOD_THRESHOLD = 0.15;  // Threshold for detecting head nodding (vertical movement)
const HEAD_SAMPLES = 20;  // Number of samples to track head position
const SOS_TRIGGER_THRESHOLD = 5;  // Number of drowsiness events to trigger SOS

export function DrowsinessMonitor() {
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
  const [sosAlertActive, setSosAlertActive] = useState(false)
  const [nodCount, setNodCount] = useState(0)
  const [isAlertActive, setIsAlertActive] = useState(false)
  const { drowsinessCount, triggerDrowsinessAlert, acknowledgeAlert } = useDrowsiness()

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  
  // Detection variables
  const earBufferRef = useRef<number[]>([]);
  const closedEyeFramesRef = useRef<number>(0);
  const previousEyeStateRef = useRef<string>('open');
  const lastBlinkTimestampRef = useRef<number>(0);
  const eyeClosureStartTimeRef = useRef<number>(0);
  const headPositionBufferRef = useRef<{y: number, roll: number}[]>([]);
  const drowsinessEventsRef = useRef<number>(0);
  const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNodDetectedRef = useRef<boolean>(false);
  const lastNodTimestampRef = useRef<number>(0);

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
      if (isActive) {
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
        
        setIsActive(false);
      }
    };
  }, [isActive]);

  // Added useEffect to handle video initialization similar to emotion-display
  useEffect(() => {
    if (isActive) {
      const startDetectionLoop = async () => {
        // Check if models are loaded
        if (!modelsLoaded) {
          // Models will be loaded in the first useEffect - just wait
          return;
        }
        
        // Setup webcam
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
              }
            });

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }

            // Reset detection state
            resetDetectionState();
            
            // Start detection loop
            detectDrowsiness();
          } catch (error) {
            console.error("Error accessing webcam:", error);
            setError("Failed to access webcam. Please check permissions and try again.");
          }
        } else {
          setError("Your browser doesn't support webcam access. Please try a different browser.");
        }
      };

      startDetectionLoop();

      return () => {
        // Cleanup
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Stop webcam
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isActive, modelsLoaded]);

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

  // Reset detection state
  const resetDetectionState = () => {
    earBufferRef.current = [];
    closedEyeFramesRef.current = 0;
    previousEyeStateRef.current = 'open';
    lastBlinkTimestampRef.current = 0;
    eyeClosureStartTimeRef.current = 0;
    headPositionBufferRef.current = [];
    drowsinessEventsRef.current = 0;
    isNodDetectedRef.current = false;
    lastNodTimestampRef.current = 0;
    setBlinkCount(0);
    setDrowsinessLevel(10);
    setAlertStatus("normal");
    setSosAlertActive(false);
    setNodCount(0);
    
    // Clear any existing SOS timeout
    if (sosTimeoutRef.current) {
      clearTimeout(sosTimeoutRef.current);
      sosTimeoutRef.current = null;
    }
  };

  // Detect drowsiness
  const detectDrowsiness = async () => {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.readyState) {
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
      // Detect faces with landmarks using detectAllFaces instead of detectSingleFace
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      // Draw results on canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // First draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (detections && detections.length > 0) {
          // Face detected - we take the first face detected
          const detection = detections[0];
          setFaceDetected(true);
          
          // Draw face landmarks
          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          
          // Draw just the face mesh
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
          
          // Get landmarks data for eye visualization
          const landmarks = resizedDetection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          
          // Highlight the eyes with custom drawing
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#00FFFF'; // Cyan color for eye outlines
          
          // Draw left eye
          ctx.beginPath();
          ctx.moveTo(leftEye[0].x, leftEye[0].y);
          for (let i = 1; i < leftEye.length; i++) {
            ctx.lineTo(leftEye[i].x, leftEye[i].y);
          }
          ctx.closePath();
          ctx.stroke();
          
          // Draw right eye
          ctx.beginPath();
          ctx.moveTo(rightEye[0].x, rightEye[0].y);
          for (let i = 1; i < rightEye.length; i++) {
            ctx.lineTo(rightEye[i].x, rightEye[i].y);
          }
          ctx.closePath();
          ctx.stroke();

          // Calculate EAR
          const ear = calculateEAR(resizedDetection.landmarks);
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
          
          // Create a dynamic threshold based on eye baseline
          // This helps adjust to different users with different eye openness
          if (earBufferRef.current.length === 10 && avgEAR > BLINK_THRESHOLD) {
            // If eyes have been consistently open for 10 frames, establish a new baseline
            const baselineEAR = avgEAR * 0.9; // 90% of open eyes value as threshold
            console.log("Setting dynamic blink threshold:", baselineEAR);
          }
          
          // Blink detection - improved logic
          if (previousEyeStateRef.current === 'open' && currentEyeState === 'closed') {
            // Eye just closed - potential start of a blink
            closedEyeFramesRef.current = 1;
            // Record the time when eyes first closed (for drowsiness detection)
            eyeClosureStartTimeRef.current = Date.now();
            console.log("Eye closed detected, EAR:", avgEAR);
            
            // Visual cue for eye closure
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillText("EYES CLOSING", 10, 120);
          } else if (currentEyeState === 'closed') {
            // Continuing eye closure
            closedEyeFramesRef.current++;
            
            // Check for prolonged eye closure (drowsiness)
            const closureDuration = Date.now() - eyeClosureStartTimeRef.current;
            
            console.log("Eyes still closed, duration:", closureDuration + "ms");
            
            // Visual feedback for closed eyes
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillText("EYES CLOSED: " + closedEyeFramesRef.current + " (" + Math.round(closureDuration/1000) + "s)", 10, 120);
            
            // Check if eye closure exceeds drowsiness threshold
            if (closureDuration > DROWSY_TIME_THRESHOLD) {
              // Prolonged eye closure detected - this is drowsiness
              drowsinessEventsRef.current++;
              console.log(`Drowsiness event detected! Count: ${drowsinessEventsRef.current}`);
              
              // Visual alert for drowsiness
              ctx.fillStyle = "#FF0000";
              ctx.font = "24px Arial Bold";
              ctx.fillText("DROWSINESS DETECTED!", canvas.width / 2 - 150, 30);
              ctx.fillText(`Eyes closed for ${Math.round(closureDuration/1000)}s`, canvas.width / 2 - 120, 60);
              
              // Reset the start time to avoid triggering multiple times for the same closure
              eyeClosureStartTimeRef.current = Date.now();
              
              // Update drowsiness level more aggressively
              setDrowsinessLevel(prev => Math.min(100, prev + 20));
              
              if (drowsinessEventsRef.current >= SOS_TRIGGER_THRESHOLD) {
                triggerSOSAlert();
              }
            }
          } else if (previousEyeStateRef.current === 'closed' && currentEyeState === 'open') {
            // End of eye closure - check if it was a blink
            const now = Date.now();
            // More lenient blink detection (1-10 frames)
            if (closedEyeFramesRef.current >= 1 && 
                closedEyeFramesRef.current <= 10 && // Allow for slightly longer blinks
                now - lastBlinkTimestampRef.current > 300) { // Allow more frequent blinks
              setBlinkCount(prev => prev + 1);
              lastBlinkTimestampRef.current = now;
              console.log("Blink detected! Total:", blinkCount + 1);
              
              // Visual feedback for blink
              ctx.fillStyle = "#00FF00";
              ctx.font = "20px Arial Bold";
              ctx.fillText("BLINK DETECTED!", canvas.width / 2 - 100, 60);
            }
            closedEyeFramesRef.current = 0;
            eyeClosureStartTimeRef.current = 0;
          }
          
          previousEyeStateRef.current = currentEyeState;
          
          // Detect head nodding
          const isNodding = detectHeadNodding(resizedDetection.landmarks);
          
          if (isNodding) {
            console.log("Head nodding detected!");
            
            // Visual feedback for head nodding
            ctx.fillStyle = "#FF9900";
            ctx.font = "20px Arial Bold";
            ctx.fillText("HEAD NODDING DETECTED!", canvas.width / 2 - 150, 90);
            
            // Increase drowsiness level when nodding is detected
            setDrowsinessLevel(prev => Math.min(100, prev + 15));
            
            // Increment drowsiness events for severe nodding
            drowsinessEventsRef.current++;
            
            if (drowsinessEventsRef.current >= SOS_TRIGGER_THRESHOLD) {
              triggerSOSAlert();
            }
          }
          
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
          ctx.fillText(`Threshold: ${BLINK_THRESHOLD}`, 10, 90);
          
          // Draw drowsiness indicators
          if (isDrowsy) {
            ctx.fillStyle = "#EF4444";
            ctx.font = "20px Arial Bold";
            ctx.fillText("LOW EAR VALUE!", canvas.width / 2 - 120, 30);
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

  // Detect head nodding by analyzing vertical movement
  const detectHeadNodding = (landmarks: any) => {
    try {
      const nose = landmarks.getNose()[0]; // Get nose tip position
      const jawline = landmarks.getJawOutline();
      const topOfHead = jawline[16]; // Top point of jawline outline
      
      // Calculate face angle/roll from the line connecting nose and top of head
      const dx = topOfHead.x - nose.x;
      const dy = topOfHead.y - nose.y;
      const roll = Math.atan2(dx, dy) * (180 / Math.PI);
      
      // Add current head position to buffer
      headPositionBufferRef.current.push({
        y: nose.y,
        roll: roll
      });
      
      // Keep buffer size limited
      if (headPositionBufferRef.current.length > HEAD_SAMPLES) {
        headPositionBufferRef.current.shift();
      }
      
      // Need enough samples to analyze
      if (headPositionBufferRef.current.length < 10) {
        return false;
      }
      
      // Detect significant vertical movement (nodding)
      const positions = headPositionBufferRef.current;
      let isNodding = false;
      
      // Check for head drooping (forward nodding)
      // This happens when the head position changes significantly downward
      // and then returns back up - typical of drowsy head nodding
      
      if (positions.length >= 10) {
        // Calculate the average position
        const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
        
        // Get the max vertical movement in recent frames
        let maxDownwardMovement = 0;
        for (let i = 1; i < positions.length; i++) {
          const movement = positions[i].y - positions[i-1].y;
          if (movement > maxDownwardMovement) {
            maxDownwardMovement = movement;
          }
        }
        
        // Detect sudden downward movement followed by a return
        const recentPositions = positions.slice(-5);
        const recentAvgY = recentPositions.reduce((sum, pos) => sum + pos.y, 0) / recentPositions.length;
        const verticalDeviation = Math.abs(recentAvgY - avgY);
        
        // Check if there's enough vertical movement to be considered a nod
        if (maxDownwardMovement > HEAD_NOD_THRESHOLD && verticalDeviation > HEAD_NOD_THRESHOLD) {
          const now = Date.now();
          // Ensure we don't count the same nod multiple times
          if (now - lastNodTimestampRef.current > 1000 && !isNodDetectedRef.current) {
            isNodding = true;
            isNodDetectedRef.current = true;
            lastNodTimestampRef.current = now;
            setNodCount(prev => prev + 1);
            setTimeout(() => {
              isNodDetectedRef.current = false;
            }, 1000);
          }
        }
      }
      
      return isNodding;
    } catch (error) {
      console.error("Error detecting head nodding:", error);
      return false;
    }
  };

  // Trigger SOS alert
  const triggerSOSAlert = () => {
    if (sosAlertActive) return; // Already triggered
    
    setSosAlertActive(true);
    console.log("🚨 SOS ALERT TRIGGERED! Driver is drowsy and unsafe!");
    
    // Play alert sound
    const audio = new Audio('/alert.mp3');
    audio.volume = 0.8;
    try {
      audio.play().catch(e => console.error("Error playing alert sound:", e));
    } catch (error) {
      console.error("Error playing alert sound:", error);
    }
    
    // Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }
    
    // Set timeout to reset the SOS alert after 10 seconds
    sosTimeoutRef.current = setTimeout(() => {
      setSosAlertActive(false);
      drowsinessEventsRef.current = Math.max(0, drowsinessEventsRef.current - 2);
    }, 10000);
  };

  // Stop SOS alert
  const stopSOSAlert = () => {
    setSosAlertActive(false);
    if (sosTimeoutRef.current) {
      clearTimeout(sosTimeoutRef.current);
      sosTimeoutRef.current = null;
    }
    drowsinessEventsRef.current = 0;
  };

  // Simulate drowsiness detection
  useEffect(() => {
    const interval = setInterval(() => {
      // Random drowsiness detection simulation (20% chance)
      if (Math.random() < 0.2) {
        setIsAlertActive(true)
        triggerDrowsinessAlert()
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [triggerDrowsinessAlert])

  const handleAcknowledge = () => {
    setIsAlertActive(false)
    acknowledgeAlert()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          className={`px-4 py-2 rounded-md ${
            isActive
              ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
              : "bg-gradient-to-r from-green-500 to-green-600 text-white"
          } shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={() => setIsActive(!isActive)}
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
              <span className="truncate font-medium">Browser</span>
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

      {/* SOS Alert Overlay */}
      {sosAlertActive && (
        <div className="fixed inset-0 bg-red-600/80 flex items-center justify-center z-50 animate-pulse">
          <div className="bg-white p-8 rounded-lg max-w-md text-center">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">EMERGENCY ALERT</h2>
            <p className="text-lg mb-4">Driver appears to be drowsy!</p>
            <p className="text-sm mb-6">Please pull over safely or take a break.</p>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              onClick={stopSOSAlert}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Current Status</h3>
          <p className="text-sm text-gray-500">
            Drowsiness Alerts Today: {drowsinessCount}
          </p>
        </div>
        {isAlertActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAcknowledge}
            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          >
            Acknowledge Alert
          </Button>
        )}
      </div>

      {isAlertActive && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Drowsiness Detected!</AlertTitle>
          <AlertDescription>
            Please take a break or pull over safely.
            {drowsinessCount >= 2 && (
              <div className="mt-2 text-sm font-medium">
                ⚠️ Warning: This is your {drowsinessCount}rd detection. SOS will be triggered after 3 detections.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isAlertActive ? "⚠️ Driver showing signs of drowsiness" : "👀 Monitoring driver state..."}
        </p>
      </div>
    </div>
  );
}

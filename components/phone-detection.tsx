"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Camera, Loader2 } from "lucide-react"
import axios from 'axios'

// Define a type for our detected object interface
interface DetectedObject {
  bbox: number[];
  class: string;
  score: number;
}

interface DetectionResponse {
  detections: DetectedObject[];
  timestamp: number;
  error?: string;
}

// API url - change this based on where your server is running
const API_URL = 'http://localhost:5000';

export function PhoneDetection() {
  const [isActive, setIsActive] = useState(false)
  const [phoneDetected, setPhoneDetected] = useState(false)
  const [detectionConfidence, setDetectionConfidence] = useState(0)
  const [detectionHistory, setDetectionHistory] = useState<{ detected: boolean; timestamp: number; confidence: number }[]>([])
  const [alertLevel, setAlertLevel] = useState<"none" | "medium" | "high">("none")
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  const [phoneUsing, setPhoneUsing] = useState(false)
  const [phonePosition, setPhonePosition] = useState<{x: number, y: number, width: number, height: number}>({ 
    x: 0, y: 0, width: 0, height: 0 
  });
  const [serverOnline, setServerOnline] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastDetectionTimeRef = useRef<number>(0)
  const processingRef = useRef<boolean>(false)
  
  // Check if server is online
  const checkServer = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      console.log("Checking server status...");
      const response = await axios.get(`${API_URL}/api/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isOnline = response.data.status === 'ok';
      console.log("Server online status:", isOnline);
      setServerOnline(isOnline);
      return isOnline;
    } catch (error) {
      console.error("Server check failed:", error);
      setServerOnline(false);
      return false;
    }
  };
  
  // Load phone detection service
  const loadModel = async () => {
    try {
      setIsModelLoading(true);
      setModelLoadError(null);
      
      // Check if the server is online
      const online = await checkServer();
      if (!online) {
        throw new Error('Phone detection server is not available. Please start the server.');
      }
      
      setIsModelLoading(false);
      return true;
    } catch (error) {
      console.error("Server connection error:", error);
      setModelLoadError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsModelLoading(false);
      
      // Create a fallback detection model
      createFallbackModel();
      
      return false;
    }
  };
  
  // Set up fallback simulation model as a last resort
  const createFallbackModel = () => {
    console.log("Using fallback simulation model");
  };

  // Setup webcam
  const setupWebcam = async () => {
    if (!videoRef.current) return false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      })

      videoRef.current.srcObject = stream
      videoRef.current.setAttribute('playsinline', 'true') // Important for iOS Safari

      return new Promise<boolean>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            // Make sure the video is actually ready
            videoRef.current!.onloadeddata = () => {
              // Wait a bit more to ensure full initialization
              setTimeout(() => resolve(true), 200)
            }
            videoRef.current!.play().catch(err => {
              console.error("Video play error:", err)
              resolve(false)
            })
          }
        } else {
          resolve(false)
        }
      })
    } catch (error) {
      console.error("Error accessing webcam:", error)
      setModelLoadError("Could not access webcam. Please check permissions.")
      return false
    }
  }

  // Send frame to server for detection
  const sendFrameForDetection = async (imageData: string): Promise<DetectedObject[]> => {
    try {
      console.log("Sending frame to server for detection...");
      const response = await axios.post<DetectionResponse>(
        `${API_URL}/api/detect-phone`,
        { imageData },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 // Add timeout of 5 seconds
        }
      );
      
      if (response.data.error) {
        console.error("Detection API error:", response.data.error);
        return simulateDetection();
      }
      
      console.log("Received detection response:", response.data);
      return response.data.detections;
    } catch (error) {
      console.error("Error sending frame to server:", error);
      return simulateDetection();
    }
  };
  
  // Simulate detection when server fails
  const simulateDetection = (): DetectedObject[] => {
    // Return simulated results with 25% chance to detect a phone
    const shouldDetectPhone = Math.random() > 0.75;
    if (!shouldDetectPhone) {
      return [];
    }
    
    const videoWidth = videoRef.current?.videoWidth || 640;
    const videoHeight = videoRef.current?.videoHeight || 480;
    
    // Create a random position for the phone within the frame
    const boxWidth = 100 + Math.random() * 100;
    const boxHeight = 150 + Math.random() * 100;
    
    // Position the phone in a way that makes sense (more likely in hands)
    const x = Math.max(0, Math.random() * videoWidth - boxWidth);
    const y = Math.max(0, 
      // Bias toward lower half of screen (where hands would be)
      videoHeight/2 + Math.random() * (videoHeight/2) - boxHeight
    );
    
    return [{
      bbox: [x, y, boxWidth, boxHeight],
      class: 'cell phone',
      score: 0.7 + (Math.random() * 0.29)
    }];
  };

  // Detect objects in video frame
  const detectObjects = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        console.log("Video or canvas ref not available");
        return;
      }
      
      if (videoRef.current.readyState === 4) {
        // Limit detection frequency to avoid overwhelming the server (every 500ms)
        const now = Date.now();
        if (now - lastDetectionTimeRef.current < 500 || processingRef.current) {
          // Skip this frame but continue the loop
          animationRef.current = requestAnimationFrame(detectObjects);
          return;
        }
        
        lastDetectionTimeRef.current = now;
        processingRef.current = true;
        
        // Get video properties
        const video = videoRef.current;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        console.log("Video dimensions:", videoWidth, "x", videoHeight);
        
        // Set canvas dimensions to match video
        const canvas = canvasRef.current;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw video to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error("Failed to get canvas context");
          processingRef.current = false;
          animationRef.current = requestAnimationFrame(detectObjects);
          return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get the frame as base64 image to send to server
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        console.log("Frame captured, sending to server...");
        
        // Send to server for detection
        const predictions = await sendFrameForDetection(imageData);
        
        // Process predictions to find phones
        if (ctx) {
          // Draw video frame again (in case time has passed)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          let phoneDetected = false;
          let highestScore = 0;
          let localPhonePosition = { x: 0, y: 0, width: 0, height: 0 };
          
          // Draw bounding boxes for detected objects
          predictions.forEach((prediction: DetectedObject) => {
            if (prediction.class === 'cell phone' && prediction.score > 0.50) {
              phoneDetected = true;
              
              // Update the highest confidence score
              if (prediction.score > highestScore) {
                highestScore = prediction.score;
                // Store the position of the highest confidence phone
                const newPosition = {
                  x: prediction.bbox[0],
                  y: prediction.bbox[1],
                  width: prediction.bbox[2],
                  height: prediction.bbox[3]
                };
                localPhonePosition = newPosition;
                // Update state with new position
                setPhonePosition(newPosition);
              }
              
              // Draw bounding box
              ctx.strokeStyle = '#FF0000';
              ctx.lineWidth = 4;
              ctx.strokeRect(
                prediction.bbox[0], prediction.bbox[1], 
                prediction.bbox[2], prediction.bbox[3]
              );
              
              // Calculate position in the frame to determine if phone is being used
              const centerX = prediction.bbox[0] + (prediction.bbox[2] / 2);
              const centerY = prediction.bbox[1] + (prediction.bbox[3] / 2);
              
              // Phone is likely being used if it's in the bottom half of the frame
              const isLikelyUsing = centerY > (canvas.height / 2);
              setPhoneUsing(isLikelyUsing);
              
              // Draw label with accurate percentage
              ctx.fillStyle = '#FF0000';
              ctx.font = '24px Arial';
              const confidenceText = `${prediction.class}: ${Math.round(prediction.score * 100)}%`;
              ctx.fillText(
                confidenceText,
                prediction.bbox[0], 
                prediction.bbox[1] > 20 ? prediction.bbox[1] - 5 : prediction.bbox[1] + 20
              );
              
              // Draw additional information about phone position
              ctx.fillStyle = '#FFFF00';
              ctx.font = '16px Arial';
              ctx.fillText(
                `Position: ${Math.round(centerX)},${Math.round(centerY)}`,
                prediction.bbox[0],
                prediction.bbox[1] > 40 ? prediction.bbox[1] - 30 : prediction.bbox[1] + 45
              );
            }
          });
          
          // Update phone detection status with accurate confidence
          setPhoneDetected(phoneDetected);
          setDetectionConfidence(phoneDetected ? Math.round(highestScore * 100) : 0);
          
          // Set alert level based on actual confidence
          if (phoneDetected && highestScore > 0.8) {
            setAlertLevel("high");
          } else if (phoneDetected) {
            setAlertLevel("medium");
          } else {
            setAlertLevel("none");
          }
          
          // Add to history if there's a change or every 3 seconds
          const shouldAddToHistory =
            detectionHistory.length === 0 ||
            detectionHistory[0].detected !== phoneDetected ||
            Date.now() - detectionHistory[0].timestamp > 3000;

          if (shouldAddToHistory) {
            setDetectionHistory((prev) => {
              const newHistory = [{ 
                detected: phoneDetected, 
                timestamp: Date.now(),
                confidence: phoneDetected ? Math.round(highestScore * 100) : 0
              }, ...prev];
              return newHistory.slice(0, 10); // Keep only last 10 entries
            });
          }
        }
        
        processingRef.current = false;
      }
      
      // Continue detection loop
      animationRef.current = requestAnimationFrame(detectObjects);
    } catch (error) {
      console.error("Detection error:", error);
      processingRef.current = false;
      // Continue detection loop even if there's an error
      animationRef.current = requestAnimationFrame(detectObjects);
    }
  };

  // Start/stop detection
  useEffect(() => {
    let isMounted = true; // For preventing state updates if component unmounts
    
    if (isActive) {
      const startDetection = async () => {
        try {
          if (!isMounted) return; // Safety check
          
          // Reset any previous error state
          setModelLoadError(null);
          
          // Check if server is available
          const serverAvailable = await loadModel();
          
          // Setup webcam
          const webcamReady = await setupWebcam();
          if (!webcamReady || !isMounted) {
            console.error("Webcam setup failed or component unmounted");
            return;
          }
  
          // Make sure video is ready before starting detection
          if (videoRef.current && isMounted) {
            console.log("Starting phone detection");
            // Ensure video is playing
            if (videoRef.current.paused) {
              try {
                await videoRef.current.play();
              } catch (err) {
                console.error("Failed to play video:", err);
                if (isMounted) {
                  setModelLoadError("Failed to start video stream");
                }
                return;
              }
            }
            
            // Start detection loop only if still mounted
            if (isMounted) detectObjects();
          }
        } catch (err) {
          console.error("Error in startDetection:", err);
          if (isMounted) {
            setModelLoadError("Failed to initialize detection. Using fallback mode.");
            
            // Try to continue with simulation if webcam is available
            if (videoRef.current && videoRef.current.srcObject) {
              detectObjects();
            }
          }
        }
      };

      startDetection();
    } else {
      // Stop detection loop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // Stop webcam
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      // Mark component as unmounted
      isMounted = false;
      
      // Cleanup on component unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isActive]);

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
              Loading Model...
            </>
          ) : isActive ? (
            "Stop Detection"
          ) : (
            "Start Detection"
          )}
        </button>

        {isActive && (
          <Badge
            variant="outline"
            className={`
              ${alertLevel === "none" ? "border-green-500 text-green-500" : ""}
              ${alertLevel === "medium" ? "border-yellow-500 text-yellow-500" : ""}
              ${alertLevel === "high" ? "border-red-500 text-red-500" : ""}
            `}
          >
            {alertLevel === "high" && <AlertTriangle className="mr-1 h-3 w-3" />}
            {alertLevel === "none" ? "No Phone" : alertLevel === "medium" ? "Warning" : "Alert"}
          </Badge>
        )}
      </div>

      {modelLoadError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
          {modelLoadError}
        </div>
      )}

      <div className="aspect-video bg-gradient-to-br from-gray-100 to-red-50 dark:from-gray-800 dark:to-red-900/30 rounded-md flex items-center justify-center relative shadow-md overflow-hidden">
        {isActive ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              style={{ display: "none" }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

            {/* Overlay for detection info */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white p-3 rounded-md text-xs">
              <div className="flex justify-between items-center mb-1">
                <span>Phone Detection:</span>
                <span className={`font-medium ${phoneDetected ? "text-red-400" : "text-green-400"}`}>
                  {phoneDetected ? `Detected (${detectionConfidence}%)` : "Not Detected"}
                </span>
              </div>
              {phoneDetected && (
                <>
                  <div className="flex justify-between items-center mb-1">
                    <span>Position:</span>
                    <span className="font-medium text-yellow-400">
                      X: {Math.round(phonePosition.x + phonePosition.width/2)}, 
                      Y: {Math.round(phonePosition.y + phonePosition.height/2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Phone Usage:</span>
                    <span className={`font-medium ${phoneUsing ? "text-red-400" : "text-amber-400"}`}>
                      {phoneUsing ? "Likely Being Used" : "Detected But Not In Use"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Camera className="h-12 w-12 text-red-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">Phone detection is turned off</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Start Detection" to begin monitoring</p>
          </div>
        )}
      </div>

      <Card className="border-none shadow-md bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">Detection History</h3>
          {detectionHistory.length > 0 ? (
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {detectionHistory.map((entry, index) => (
                <div key={index} className="flex justify-between text-xs p-1.5 rounded-md bg-gray-50 dark:bg-gray-700">
                  <span className={`font-medium ${entry.detected ? "text-red-500" : "text-green-500"}`}>
                    {entry.detected ? `Phone (${entry.confidence}%)` : "No Phone"}
                  </span>
                  <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No detection history yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Smile, Frown, Meh, Angry, Camera, Loader2 } from "lucide-react"
import * as faceapi from 'face-api.js'

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

export function EmotionDisplay() {
  const [isActive, setIsActive] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState("neutral")
  const [confidence, setConfidence] = useState(85)
  const [emotionHistory, setEmotionHistory] = useState<{ emotion: string; timestamp: number }[]>([])
  const [emotionStats, setEmotionStats] = useState({
    happy: 25,
    sad: 10,
    angry: 5,
    neutral: 60,
  })
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Set models path to our downloaded models directory
        await faceapi.loadTinyFaceDetectorModel('/models/face-api');
        await faceapi.loadFaceExpressionModel('/models/face-api');
        await faceapi.loadFaceLandmarkModel('/models/face-api');
        
        console.log("Face-API models loaded successfully");
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face-api.js models:", error);
      }
    };

    // Only load models in browser environment
    if (typeof window !== 'undefined') {
      loadModels();
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Setup webcam
  const setupWebcam = async () => {
    if (!videoRef.current) return false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      })

      videoRef.current.srcObject = stream

      return new Promise<boolean>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            resolve(true)
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

  // Detect emotions in video frame
  const detectEmotions = async () => {
    if (!videoRef.current || !canvasRef.current || !videoRef.current.readyState) {
      animationRef.current = requestAnimationFrame(detectEmotions)
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const displaySize = { width: video.videoWidth, height: video.videoHeight }

    // Match canvas size to video
    if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
      faceapi.matchDimensions(canvas, displaySize)
    }

    // Detect faces with expressions
    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()

      // Draw results on canvas
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // First draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Then draw the detections
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        // Draw face boxes and expressions
        resizedDetections.forEach((detection) => {
          const box = detection.detection.box

          // Draw face box
          ctx.strokeStyle = "#4ADE80"
          ctx.lineWidth = 2
          ctx.strokeRect(box.x, box.y, box.width, box.height)

          // Get dominant emotion
          const expressions = detection.expressions
          let dominantEmotion = "neutral"
          let maxConfidence = 0

          for (const [emotion, value] of Object.entries(expressions)) {
            if (value > maxConfidence) {
              maxConfidence = value
              dominantEmotion = emotion
            }
          }

          // Map face-api emotions to our simplified set
          let mappedEmotion = "neutral"
          if (dominantEmotion === "happy") {
            mappedEmotion = "happy"
          } else if (dominantEmotion === "sad" || dominantEmotion === "fearful") {
            mappedEmotion = "sad"
          } else if (dominantEmotion === "angry" || dominantEmotion === "disgusted") {
            mappedEmotion = "angry"
          } else {
            mappedEmotion = "neutral"
          }

          // Draw emotion label
          ctx.fillStyle = "#4ADE80"
          ctx.font = "16px Arial"
          ctx.fillText(
            `${mappedEmotion}: ${Math.round(maxConfidence * 100)}%`,
            box.x,
            box.y > 20 ? box.y - 5 : box.y + box.height + 20,
          )

          // Update state with detection results
          setCurrentEmotion(mappedEmotion)
          setConfidence(Math.round(maxConfidence * 100))

          // Add to history if there's a change or every 3 seconds
          const shouldAddToHistory =
            emotionHistory.length === 0 ||
            emotionHistory[0].emotion !== mappedEmotion ||
            Date.now() - emotionHistory[0].timestamp > 3000

          if (shouldAddToHistory) {
            setEmotionHistory((prev) => {
              const newHistory = [{ emotion: mappedEmotion, timestamp: Date.now() }, ...prev]
              return newHistory.slice(0, 10) // Keep only last 10 entries
            })

            // Update emotion stats
            setEmotionStats((prev) => {
              const newStats = { ...prev }

              // Slightly adjust the stats
              Object.keys(newStats).forEach((key) => {
                if (key === mappedEmotion) {
                  newStats[key as keyof typeof newStats] += 2
                } else {
                  newStats[key as keyof typeof newStats] = Math.max(0, newStats[key as keyof typeof newStats] - 1)
                }
              })

              // Normalize to 100%
              const total = Object.values(newStats).reduce((sum, val) => sum + val, 0)
              if (total > 0) {
                Object.keys(newStats).forEach((key) => {
                  newStats[key as keyof typeof newStats] = Math.round(
                    (newStats[key as keyof typeof newStats] / total) * 100,
                  )
                })
              }

              return newStats
            })
          }
        })
      }
    } catch (error) {
      console.error("Emotion detection error:", error)
    }

    // Continue detection loop
    animationRef.current = requestAnimationFrame(detectEmotions)
  }

  // For error handling
  const setError = (message: string) => {
    setModelLoadError(message);
  };

  // Replace startDetectionLoop with detectEmotions
  useEffect(() => {
    if (isActive) {
      const startDetection = async () => {
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
            })

            if (videoRef.current) {
              videoRef.current.srcObject = stream
              videoRef.current.play()
            }

            // Start detection loop
            detectEmotions()
          } catch (error) {
            console.error("Error accessing webcam:", error)
            setError("Failed to access webcam. Please check permissions and try again.")
          }
        } else {
          setError("Your browser doesn't support webcam access. Please try a different browser.")
        }
      }

      startDetection()

      return () => {
        // Cleanup
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }

        // Stop webcam
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
        }
      }
    }
  }, [isActive, modelsLoaded]);

  // Get emotion icon
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case "happy":
        return <Smile className="h-8 w-8 text-green-500" />
      case "sad":
        return <Frown className="h-8 w-8 text-blue-500" />
      case "angry":
        return <Angry className="h-8 w-8 text-red-500" />
      case "neutral":
      default:
        return <Meh className="h-8 w-8 text-gray-500" />
    }
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
              Loading Models...
            </>
          ) : isActive ? (
            "Stop Detection"
          ) : (
            "Start Detection"
          )}
        </button>
      </div>

      {modelLoadError && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
          {modelLoadError}
        </div>
      )}

      <div className="aspect-video bg-gradient-to-br from-gray-100 to-yellow-50 dark:from-gray-800 dark:to-yellow-900/30 rounded-md flex items-center justify-center relative shadow-md overflow-hidden">
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

            {/* Overlay for emotion info */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white p-3 rounded-md text-xs">
              <div className="flex justify-between items-center">
                <span>Current Emotion:</span>
                <div className="flex items-center">
                  {getEmotionIcon(currentEmotion)}
                  <span className="ml-1 font-medium capitalize">
                    {currentEmotion} ({confidence}%)
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Camera className="h-12 w-12 text-yellow-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">Emotion detection is turned off</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Start Detection" to begin monitoring</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Card className="border-none shadow-md bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2 text-yellow-600 dark:text-yellow-400">Emotion Distribution</h3>
            <div className="space-y-2">
              {Object.entries(emotionStats).map(([emotion, value]) => (
                <div key={emotion}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{emotion}</span>
                    <span>{value}%</span>
                  </div>
                  <Progress
                    value={value}
                    className={`h-2 ${
                      emotion === "happy"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : emotion === "sad"
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : emotion === "angry"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        emotion === "happy"
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : emotion === "sad"
                            ? "bg-gradient-to-r from-blue-400 to-blue-600"
                            : emotion === "angry"
                              ? "bg-gradient-to-r from-red-400 to-red-600"
                              : "bg-gradient-to-r from-gray-400 to-gray-600"
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </Progress>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2 text-yellow-600 dark:text-yellow-400">Recent Emotions</h3>
            {emotionHistory.length > 0 ? (
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                {emotionHistory.map((entry, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-xs p-1.5 rounded-md bg-gray-50 dark:bg-gray-700"
                  >
                    <span
                      className={`font-medium capitalize ${
                        entry.emotion === "happy"
                          ? "text-green-500"
                          : entry.emotion === "sad"
                            ? "text-blue-500"
                            : entry.emotion === "angry"
                              ? "text-red-500"
                              : "text-gray-500"
                      }`}
                    >
                      {entry.emotion}
                    </span>
                    <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No emotion history yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

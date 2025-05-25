"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"

export function HeartRateMonitor() {
  const [isActive, setIsActive] = useState(false)
  const [heartRate, setHeartRate] = useState(72)
  const [heartRateStatus, setHeartRateStatus] = useState("normal")
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([])
  const [stressLevel, setStressLevel] = useState(20)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const pointsRef = useRef<number[]>([])

  // Initialize ECG wave data
  useEffect(() => {
    // Create initial flat line
    pointsRef.current = Array(200).fill(50)
  }, [])

  // Draw ECG wave function
  const drawECGWave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set line style
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Create gradient for the line
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, "#ec4899")
    gradient.addColorStop(1, "#db2777")
    ctx.strokeStyle = gradient

    // Draw the ECG line
    ctx.beginPath()
    const points = pointsRef.current

    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(i * (canvas.width / points.length), points[i])
    }

    ctx.stroke()

    // Add grid lines
    ctx.lineWidth = 0.5
    ctx.strokeStyle = "rgba(236, 72, 153, 0.1)"

    // Horizontal grid lines
    for (let i = 0; i < canvas.height; i += 10) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let i = 0; i < canvas.width; i += 10) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
  }

  // Simulate real-time heart rate monitoring with ECG wave
  useEffect(() => {
    if (!isActive) return

    // Function to generate next ECG point
    const generateECGPoint = () => {
      const points = [...pointsRef.current]

      // Shift all points to the left
      points.shift()

      // Generate next point based on heart rate
      // Higher heart rate = more frequent peaks
      const baseValue = 50 // baseline

      // Determine if we should generate a peak based on heart rate
      // The higher the heart rate, the more frequent the peaks
      const shouldGeneratePeak = Math.random() < heartRate / 1000

      if (shouldGeneratePeak) {
        // Generate P wave (small bump)
        points.push(baseValue - 5)
        points.shift()

        // Generate QRS complex (big spike)
        points.push(baseValue - 30) // Q wave (small dip)
        points.shift()
        points.push(baseValue + 40) // R wave (big spike)
        points.shift()
        points.push(baseValue - 15) // S wave (medium dip)
        points.shift()

        // Generate T wave (medium bump)
        points.push(baseValue + 10)
        points.shift()

        // Return to baseline
        points.push(baseValue)
      } else {
        // Just add a point at baseline with small noise
        points.push(baseValue + (Math.random() * 2 - 1))
      }

      pointsRef.current = points

      // Draw the updated ECG
      drawECGWave()
    }

    // Update heart rate and ECG data
    const interval = setInterval(() => {
      // Generate a realistic heart rate that changes gradually
      const change = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
      const newHeartRate = Math.max(60, Math.min(100, heartRate + change))
      setHeartRate(newHeartRate)

      // Update heart rate status
      if (newHeartRate > 90) {
        setHeartRateStatus("high")
      } else if (newHeartRate < 65) {
        setHeartRateStatus("low")
      } else {
        setHeartRateStatus("normal")
      }

      // Update heart rate history
      setHeartRateHistory((prev) => {
        const newHistory = [...prev, newHeartRate]
        // Keep only last 20 entries
        return newHistory.slice(-20)
      })

      // Update stress level based on heart rate
      const newStressLevel = Math.floor((newHeartRate - 60) * 2.5)
      setStressLevel(Math.max(0, Math.min(100, newStressLevel)))

      // Generate ECG point
      generateECGPoint()
    }, 100)

    // Set up animation loop for smooth ECG rendering
    const animate = () => {
      generateECGPoint()
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      clearInterval(interval)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, heartRate])

  // Draw initial ECG wave
  useEffect(() => {
    if (canvasRef.current) {
      drawECGWave()
    }
  }, [canvasRef])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          className={`px-4 py-2 rounded-md ${
            isActive
              ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
          } shadow-md transition-all duration-300`}
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? "Stop Monitoring" : "Start Monitoring"}
        </button>

        {isActive && (
          <Badge
            variant="outline"
            className={`
              ${heartRateStatus === "normal" ? "border-green-500 text-green-500 bg-green-50 dark:bg-green-900/20" : ""}
              ${heartRateStatus === "low" ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}
              ${heartRateStatus === "high" ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20" : ""}
              shadow-sm
            `}
          >
            {heartRateStatus === "normal" ? "Normal" : heartRateStatus === "low" ? "Low" : "High"}
          </Badge>
        )}
      </div>

      {isActive ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 rounded-md p-6 flex flex-col items-center justify-center shadow-md">
            <div className="relative mb-4">
              <Heart
                className={`h-16 w-16 ${
                  heartRateStatus === "normal"
                    ? "text-green-500"
                    : heartRateStatus === "low"
                      ? "text-blue-500"
                      : "text-red-500"
                } animate-pulse`}
                style={{ animationDuration: `${60000 / heartRate}ms` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white bg-pink-500 rounded-full h-8 w-8 flex items-center justify-center">
                  {heartRate}
                </span>
              </div>
            </div>
            <p className="mt-2 text-lg font-medium text-pink-700 dark:text-pink-300">{heartRate} BPM</p>
            <p className="text-xs text-pink-600/70 dark:text-pink-400/70">
              {heartRateStatus === "normal"
                ? "Normal heart rate"
                : heartRateStatus === "low"
                  ? "Heart rate below normal"
                  : "Heart rate above normal"}
            </p>

            {/* ECG Wave Canvas */}
            <div className="w-full mt-4 bg-white dark:bg-gray-800 rounded-md p-2 shadow-inner">
              <canvas ref={canvasRef} width={500} height={100} className="w-full h-[100px]" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Card className="border-none shadow-md bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2 text-pink-600 dark:text-pink-400">Heart Rate History</h3>
                {heartRateHistory.length > 0 ? (
                  <div className="h-[80px] flex items-end space-x-1">
                    {heartRateHistory.map((rate, index) => (
                      <div
                        key={index}
                        className={`w-2 rounded-t ${
                          rate > 90 ? "bg-red-500" : rate < 65 ? "bg-blue-500" : "bg-green-500"
                        }`}
                        style={{ height: `${Math.max(10, (rate - 50) * 2)}%` }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No heart rate history yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-pink-600 dark:text-pink-400">Stress Level:</span>
                  <span className="font-medium">{stressLevel}%</span>
                </div>
                <Progress value={stressLevel} className="h-2 bg-pink-100 dark:bg-pink-900">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                    style={{ width: `${stressLevel}%` }}
                  />
                </Progress>
                <p className="text-xs text-gray-500 mt-2">
                  {stressLevel < 30
                    ? "Low stress level"
                    : stressLevel < 70
                      ? "Moderate stress level"
                      : "High stress level - consider taking a break"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-md flex flex-col items-center justify-center shadow-md">
          <Heart className="h-12 w-12 text-pink-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-300">Heart rate monitoring is turned off</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click "Start Monitoring" to begin</p>
        </div>
      )}
    </div>
  )
}

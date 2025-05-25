"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, Heart, SirenIcon as SosIcon, Clock, Eye, Smile } from "lucide-react"

type Alert = {
  id: number
  type: "drowsiness" | "emotion" | "phone" | "heart" | "sos"
  severity: "low" | "medium" | "high"
  message: string
  timestamp: number
  acknowledged: boolean
}

export function AlertHistory() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<string>("all")

  // Generate sample alerts
  useEffect(() => {
    const sampleAlerts: Alert[] = [
      {
        id: 1,
        type: "drowsiness",
        severity: "high",
        message: "Driver drowsiness detected - EAR below threshold for 30 seconds",
        timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
        acknowledged: true,
      },
      {
        id: 2,
        type: "phone",
        severity: "medium",
        message: "Phone usage detected while driving",
        timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
        acknowledged: true,
      },
      {
        id: 3,
        type: "heart",
        severity: "low",
        message: "Elevated heart rate detected - 95 BPM",
        timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
        acknowledged: true,
      },
      {
        id: 4,
        type: "emotion",
        severity: "medium",
        message: "Angry emotion detected - consider taking a break",
        timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
        acknowledged: false,
      },
      {
        id: 5,
        type: "sos",
        severity: "high",
        message: "SOS alert triggered - emergency contacts notified",
        timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
        acknowledged: true,
      },
    ]

    setAlerts(sampleAlerts)

    // Simulate new alerts coming in
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const alertTypes = ["drowsiness", "emotion", "phone", "heart", "sos"]
        const severities = ["low", "medium", "high"]
        const messages = [
          "Driver drowsiness detected - take a break",
          "Phone usage detected while driving",
          "Elevated heart rate detected",
          "Distracted driving detected",
          "Yawning detected - fatigue warning",
        ]

        const newAlert: Alert = {
          id: Date.now(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)] as any,
          severity: severities[Math.floor(Math.random() * severities.length)] as any,
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: Date.now(),
          acknowledged: false,
        }

        setAlerts((prev) => [newAlert, ...prev].slice(0, 20)) // Keep only 20 most recent alerts
      }
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "drowsiness":
        return <Eye className="h-4 w-4 text-blue-500" />
      case "emotion":
        return <Smile className="h-4 w-4 text-yellow-500" />
      case "phone":
        return <Phone className="h-4 w-4 text-red-500" />
      case "heart":
        return <Heart className="h-4 w-4 text-red-500" />
      case "sos":
        return <SosIcon className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const filteredAlerts = filter === "all" ? alerts : alerts.filter((alert) => alert.type === filter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${filter === "all" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          onClick={() => setFilter("all")}
        >
          All
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${filter === "drowsiness" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          onClick={() => setFilter("drowsiness")}
        >
          <Eye className="h-3 w-3 mr-1" />
          Drowsiness
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${filter === "emotion" ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-transparent" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          onClick={() => setFilter("emotion")}
        >
          <Smile className="h-3 w-3 mr-1" />
          Emotion
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${filter === "phone" ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-transparent" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          onClick={() => setFilter("phone")}
        >
          <Phone className="h-3 w-3 mr-1" />
          Phone
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${filter === "heart" ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white border-transparent" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          onClick={() => setFilter("heart")}
        >
          <Heart className="h-3 w-3 mr-1" />
          Heart Rate
        </Badge>
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${filter === "sos" ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-transparent" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          onClick={() => setFilter("sos")}
        >
          <SosIcon className="h-3 w-3 mr-1" />
          SOS
        </Badge>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-md border shadow-sm transition-all ${
                alert.severity === "high"
                  ? "border-red-200 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 dark:border-red-800"
                  : alert.severity === "medium"
                    ? "border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 dark:border-yellow-800"
                    : "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 dark:border-blue-800"
              } ${!alert.acknowledged ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div
                    className={`mr-3 mt-0.5 p-1.5 rounded-full ${
                      alert.type === "drowsiness"
                        ? "bg-blue-100 dark:bg-blue-900/50"
                        : alert.type === "emotion"
                          ? "bg-yellow-100 dark:bg-yellow-900/50"
                          : alert.type === "phone"
                            ? "bg-red-100 dark:bg-red-900/50"
                            : alert.type === "heart"
                              ? "bg-pink-100 dark:bg-pink-900/50"
                              : "bg-orange-100 dark:bg-orange-900/50"
                    }`}
                  >
                    {getAlertIcon(alert.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-3 w-3 text-gray-500 mr-1" />
                      <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`
                    ${alert.severity === "high" ? "border-red-500 text-white bg-gradient-to-r from-red-500 to-red-600" : ""}
                    ${alert.severity === "medium" ? "border-yellow-500 text-white bg-gradient-to-r from-yellow-500 to-yellow-600" : ""}
                    ${alert.severity === "low" ? "border-blue-500 text-white bg-gradient-to-r from-blue-500 to-blue-600" : ""}
                  `}
                >
                  {alert.severity === "high" ? "High" : alert.severity === "medium" ? "Medium" : "Low"}
                </Badge>
              </div>

              {!alert.acknowledged && (
                <div className="mt-2 flex justify-end">
                  <button
                    className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md transition-colors"
                    onClick={() => {
                      setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a)))
                    }}
                  >
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-md">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">No alerts found</p>
            <p className="text-sm mt-1">All systems are operating normally</p>
          </div>
        )}
      </div>
    </div>
  )
}

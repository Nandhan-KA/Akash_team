"use client"

import { createContext, useContext, useState, useRef } from "react"

interface DrowsinessContextType {
  drowsinessCount: number
  lastDetectionTime: Date | null
  acknowledgeAlert: () => void
  resetCount: () => void
  triggerDrowsinessAlert: () => void
  onSOSTriggered: (() => void) | null
  setSOSTriggerHandler: (handler: () => void) => void
}

const DrowsinessContext = createContext<DrowsinessContextType | undefined>(undefined)

export function DrowsinessProvider({ children }: { children: React.ReactNode }) {
  const [drowsinessCount, setDrowsinessCount] = useState(0)
  const [lastDetectionTime, setLastDetectionTime] = useState<Date | null>(null)
  const sosTriggerRef = useRef<(() => void) | null>(null)
  
  // Reset count after 30 minutes of no detections
  const RESET_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds

  const checkAndResetCount = () => {
    if (lastDetectionTime && new Date().getTime() - lastDetectionTime.getTime() > RESET_TIMEOUT) {
      setDrowsinessCount(0)
    }
  }

  const acknowledgeAlert = () => {
    checkAndResetCount()
    // Don't reset count, just update last detection time
    setLastDetectionTime(new Date())
  }

  const resetCount = () => {
    setDrowsinessCount(0)
    setLastDetectionTime(null)
  }

  const triggerDrowsinessAlert = () => {
    checkAndResetCount()
    const newCount = drowsinessCount + 1
    setDrowsinessCount(newCount)
    setLastDetectionTime(new Date())

    // If drowsiness detected 3 or more times, trigger SOS
    if (newCount >= 3 && sosTriggerRef.current) {
      sosTriggerRef.current()
    }
  }

  const setSOSTriggerHandler = (handler: () => void) => {
    sosTriggerRef.current = handler
  }

  return (
    <DrowsinessContext.Provider
      value={{
        drowsinessCount,
        lastDetectionTime,
        acknowledgeAlert,
        resetCount,
        triggerDrowsinessAlert,
        onSOSTriggered: sosTriggerRef.current,
        setSOSTriggerHandler,
      }}
    >
      {children}
    </DrowsinessContext.Provider>
  )
}

export function useDrowsiness() {
  const context = useContext(DrowsinessContext)
  if (context === undefined) {
    throw new Error("useDrowsiness must be used within a DrowsinessProvider")
  }
  return context
} 
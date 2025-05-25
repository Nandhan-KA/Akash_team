"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SirenIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useDrowsiness } from "@/app/contexts/DrowsinessContext"

export function SOSAlert() {
  const [isOpen, setIsOpen] = useState(false)
  const [isActivated, setIsActivated] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string[]>([])
  const [isAutoTriggered, setIsAutoTriggered] = useState(false)
  const { setSOSTriggerHandler } = useDrowsiness()

  useEffect(() => {
    // Register the trigger handler with the drowsiness context
    setSOSTriggerHandler(() => {
      setIsAutoTriggered(true)
      setIsOpen(true)
      simulateEmergencyResponse()
    })
  }, [])

  const simulateEmergencyResponse = async () => {
    setIsActivated(true)
    setProgress(0)
    setStatus([])

    // Add auto-trigger message if applicable
    if (isAutoTriggered) {
      setStatus(["⚠️ Automatically triggered due to repeated drowsiness detection"])
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Simulate getting location
    setStatus(prev => [...prev, "📍 Getting current location..."])
    await new Promise(resolve => setTimeout(resolve, 1000))
    setProgress(20)
    setStatus(prev => [...prev, "📍 Location acquired: Sample Location, City"])

    // Simulate contacting emergency services
    setStatus(prev => [...prev, "🚨 Contacting emergency services..."])
    await new Promise(resolve => setTimeout(resolve, 1500))
    setProgress(40)
    setStatus(prev => [...prev, "🚨 Emergency services notified"])
    setStatus(prev => [...prev, "🚓 Police dispatch estimated arrival: 8 minutes"])

    // Simulate sending alerts to emergency contacts
    setStatus(prev => [...prev, "👥 Notifying emergency contacts..."])
    await new Promise(resolve => setTimeout(resolve, 1000))
    setProgress(60)
    setStatus(prev => [...prev, "✉️ Alert sent to: Family Member 1"])
    await new Promise(resolve => setTimeout(resolve, 500))
    setProgress(80)
    setStatus(prev => [...prev, "✉️ Alert sent to: Family Member 2"])

    // Simulation complete
    await new Promise(resolve => setTimeout(resolve, 1000))
    setProgress(100)
    setStatus(prev => [...prev, "✅ Emergency response protocol completed"])
  }

  const cancelEmergency = () => {
    setIsActivated(false)
    setIsOpen(false)
    setProgress(0)
    setStatus([])
    setIsAutoTriggered(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 border-red-500 text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
        onClick={() => setIsOpen(true)}
      >
        <SirenIcon className="mr-2 h-4 w-4" />
        SOS
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <SirenIcon className="mr-2 h-5 w-5" />
              Emergency SOS Alert
            </DialogTitle>
            <DialogDescription>
              {!isActivated
                ? "Activate emergency response protocol? This will alert emergency services and your emergency contacts."
                : "Emergency response protocol activated"}
            </DialogDescription>
          </DialogHeader>

          {isActivated && (
            <div className="py-4 space-y-4">
              <Progress value={progress} className="h-2 bg-red-100" />
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {status.map((message, index) => (
                  <Alert key={index} variant="default" className="py-2">
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between">
            {!isActivated ? (
              <>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={simulateEmergencyResponse}
                >
                  <SirenIcon className="mr-2 h-4 w-4" />
                  Activate SOS
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={cancelEmergency}>
                Cancel Emergency
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 
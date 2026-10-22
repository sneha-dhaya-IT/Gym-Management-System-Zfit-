"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, UserPlus, Sun, Moon } from "lucide-react"
import { QRScannerModal } from "@/components/QRScannerModal"
import { SignupModal } from "@/components/SignupModal"

export default function FrontDeskPage() {
  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const [currentDay, setCurrentDay] = useState("")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date()
      const hour = now.getHours()
      const day = now.toLocaleDateString('en-US', { weekday: 'long' })
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })

      setCurrentDay(day)
      setCurrentTime(time)

      if (hour < 12) {
        setGreeting("Good Morning")
      } else if (hour < 17) {
        setGreeting("Good Afternoon")
      } else {
        setGreeting("Good Evening")
      }
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const handleJoinGym = () => {
    setIsSignupOpen(true)
  }

  const handleScanQR = () => {
    setIsScannerOpen(true)
  }

  return (
    <>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto text-center space-y-12">
        {/* Greeting Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            {greeting.includes("Morning") || greeting.includes("Afternoon") ? (
              <Sun className="h-8 w-8 text-primary" />
            ) : (
              <Moon className="h-8 w-8 text-primary" />
            )}
            <h1 className="text-5xl font-bold text-foreground tracking-tight">
              {greeting}
            </h1>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-medium text-muted-foreground">
              {currentDay}
            </p>
            <p className="text-lg text-muted-foreground">
              {currentTime}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Button
            onClick={handleJoinGym}
            className="aspect-square h-80 text-3xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <UserPlus className="h-20 w-20" />
              <span>Join the Gym</span>
            </div>
          </Button>

          <Button
            onClick={handleScanQR}
            className="aspect-square h-80 text-3xl font-bold bg-card hover:bg-card/80 text-card-foreground border border-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex flex-col items-center gap-3">
              <QrCode className="h-20 w-20" />
              <span>Scan QR</span>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-8">
          <p className="text-muted-foreground text-lg">
            ZFit Gym Management System
          </p>
        </div>
      </div>
    </div>

    <QRScannerModal
      isOpen={isScannerOpen}
      onClose={() => setIsScannerOpen(false)}
    />

    <SignupModal
      isOpen={isSignupOpen}
      onClose={() => setIsSignupOpen(false)}
      isFrontDesk={true}
    />
    </>
  )
}
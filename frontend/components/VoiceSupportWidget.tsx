"use client"

import { useState, useEffect } from "react"
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import Vapi from "@vapi-ai/web"

export function VoiceSupportWidget() {
  const { isMember } = useAuth()
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [vapi, setVapi] = useState<Vapi | null>(null)

  useEffect(() => {
    // Initialize Vapi
    const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_AGENT_PUBLIC_KEY || "")
    setVapi(vapiInstance)

    // Set up event listeners
    vapiInstance.on("call-start", () => {
      console.log("Call started")
      setIsCallActive(true)
      setIsConnecting(false)
    })

    vapiInstance.on("call-end", () => {
      console.log("Call ended")
      setIsCallActive(false)
      setIsMuted(false)
    })

    vapiInstance.on("error", (error: Error) => {
      console.error("Vapi error:", error)
      setIsConnecting(false)
      setIsCallActive(false)
    })

    return () => {
      // Cleanup
      if (vapiInstance) {
        vapiInstance.stop()
      }
    }
  }, [])

  // Only show widget for members
  if (!isMember) {
    return null
  }

  const startCall = async () => {
    if (!vapi) return

    setIsConnecting(true)
    try {
      await vapi.start(process.env.NEXT_PUBLIC_ASSISTANT_ID || "")
    } catch (error) {
      console.error("Failed to start call:", error)
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    if (vapi) {
      vapi.stop()
    }
    setIsCallActive(false)
    setIsMuted(false)
  }

  const toggleMute = () => {
    // TODO: Implement mute functionality when Vapi SDK supports it
    setIsMuted(!isMuted)
  }

  if (isCallActive) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 bg-card border-border">
          <CardContent className="p-8 text-center space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Connected to ZFit Support
              </h3>
              <p className="text-muted-foreground">
                How can we help you today?
              </p>
            </div>

            {/* Call Controls */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                className="w-14 h-14 rounded-full p-0"
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>

              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="w-14 h-14 rounded-full p-0"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>

            {/* Status */}
            <div className="text-sm text-muted-foreground">
              {isMuted ? "Microphone muted" : "Microphone active"}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={startCall}
        disabled={isConnecting}
        className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        size="lg"
      >
        {isConnecting ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Phone className="w-6 h-6" />
        )}
      </Button>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Voice Support
      </div>
    </div>
  )
}
"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import QrScanner from 'qr-scanner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, CameraOff, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { attendanceApi } from "@/lib/api/attendanceApi"

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanner, setScanner] = useState<QrScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const startScanning = useCallback(async () => {
    try {
      if (!videoRef.current) {
        console.log('Video ref not available')
        return
      }

      // Stop any existing video stream
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }

      console.log('Starting scanner...')
      const qrScanner = new QrScanner(
        videoRef.current,
        async (result) => {
          console.log('QR code detected:', result.data)

          // Pause scanning temporarily
          qrScanner.pause()

          setScanResult(result.data)
          setIsScanning(false)

          // Automatically process attendance
          try {
            setScanStatus('idle')
            setErrorMessage('')

            const response = await attendanceApi.checkIn({
              qrToken: result.data,
            })

            if (response.success && response.data) {
              setScanStatus('success')
              const action = response.data.action || 'checked-in'
              setErrorMessage(`${action === 'checked-out' ? 'Checked out' : 'Checked in'} successfully!`)
            } else {
              throw new Error('Failed to process attendance')
            }

            // Keep the message visible for 2 seconds, then resume scanning
            setTimeout(() => {
              setScanResult(null)
              setScanStatus('idle')
              setErrorMessage('')
              setIsScanning(true)
              // Resume scanning
              qrScanner.start()
            }, 2000)

          } catch (error) {
            console.error('Error processing attendance:', error)
            setScanStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Failed to process attendance. Please try again.')

            // Keep error message visible for 2 seconds, then resume scanning
            setTimeout(() => {
              setScanResult(null)
              setScanStatus('idle')
              setErrorMessage('')
              setIsScanning(true)
              // Resume scanning
              qrScanner.start()
            }, 2000)
          }
        },
        {
          onDecodeError: (error) => {
            console.log('QR decode error:', error)
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      await qrScanner.start()
      console.log('Scanner started successfully')
      setScanner(qrScanner)
      setIsScanning(true)
      setScanStatus('idle')
      setErrorMessage('')
    } catch (error) {
      console.error('Error starting scanner:', error)
      setErrorMessage('Failed to access camera. Please check permissions.')
      setScanStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      // Clean up when modal closes
      if (scanner) {
        scanner.destroy()
        setScanner(null)
      }

      // Stop video stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }

      setIsScanning(false)
      setScanResult(null)
      setScanStatus('idle')
      setErrorMessage('')
    }
  }, [isOpen, scanner])

  useEffect(() => {
    if (isOpen && !scanner && !isScanning) {
      // Small delay to ensure video element is rendered
      const timer = setTimeout(() => {
        startScanning()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, scanner, isScanning, startScanning])

  const stopScanning = () => {
    if (scanner) {
      scanner.destroy()
      setScanner(null)
    }

    // Stop video stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
    setScanStatus('idle')
  }

  const resetScanner = () => {
    setScanResult(null)
    setScanStatus('idle')
    setErrorMessage('')
  }

  const handleClose = () => {
    if (scanner) {
      scanner.destroy()
      setScanner(null)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-hidden [&_button[data-slot='dialog-close']_svg]:size-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </DialogTitle>
          <DialogDescription>
            Scan QR codes to automatically check attendance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              {/* Camera Section */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-6">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!isScanning && !scanResult && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <CameraOff className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg">Camera is off</p>
                    </div>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-48 h-48 border border-primary/50 border-dashed rounded-lg"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Section */}
              <div className="space-y-6">
                <div className="flex gap-4 justify-center">
                  {isScanning && (
                    <Button onClick={stopScanning} variant="outline" size="lg" className="px-8 py-3">
                      <CameraOff className="h-5 w-5 mr-3" />
                      Stop Scanning
                    </Button>
                  )}

                  {scanResult && (
                    <Button onClick={resetScanner} variant="outline" size="lg" className="px-8 py-3">
                      <RotateCcw className="h-5 w-5 mr-3" />
                      Scan Another
                    </Button>
                  )}
                </div>

                {/* Status Messages */}
                {scanResult && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      {scanStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                      {scanStatus === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
                      <h4 className="text-lg font-medium">Attendance Status</h4>
                    </div>

                    {errorMessage && (
                      <div className={`p-4 border rounded-lg max-w-md mx-auto ${
                        scanStatus === 'success'
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-destructive/10 border-destructive/20 text-destructive'
                      }`}>
                        <p className="text-base font-medium">{errorMessage}</p>
                      </div>
                    )}
                  </div>
                )}

                {!scanResult && (
                  <div className="text-center text-muted-foreground">
                    <p className="text-base">Position QR code within the scanning frame</p>
                    <p className="text-sm mt-1">Attendance will be processed automatically</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
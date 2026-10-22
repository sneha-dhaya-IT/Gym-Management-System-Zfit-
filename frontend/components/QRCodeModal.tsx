"use client"

import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Copy } from "lucide-react"
import { useState } from "react"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  qrCodeData: string
  userName?: string
}

export function QRCodeModal({ isOpen, onClose, qrCodeData, userName }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy QR code data:', err)
    }
  }

  const handleDownload = () => {
    // Create a temporary canvas to convert SVG to PNG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const svg = document.querySelector('.qr-code-svg') as SVGElement

    if (!ctx || !svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Download as PNG
      const link = document.createElement('a')
      link.download = `${userName || 'user'}-qr-code.png`
      link.href = canvas.toDataURL()
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            {userName ? `${userName}'s QR Code` : 'Your QR Code'} - Scan or share this code
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeSVG
              value={qrCodeData}
              size={200}
              level="M"
              className="qr-code-svg"
            />
          </div>

          <div className="text-sm text-muted-foreground text-center max-w-xs">
            <p className="font-medium mb-1">QR Code Data:</p>
            <p className="font-mono text-xs break-all bg-muted p-2 rounded">
              {qrCodeData}
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Data'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
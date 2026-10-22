"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, FileImage, Building2, CreditCard, CheckCircle } from "lucide-react"
import { apiRequest } from "@/lib/apiRequest"

interface BankTransferFormProps {
  paymentData: {
    planId: string
    planName: string
    amount: number
    currency: string
  }
  onSubmit: (formData: BankTransferFormData) => Promise<void>
  isSubmitting: boolean
}

export interface BankTransferFormData {
  receiptImage: File | null
  notes: string
}

export default function BankTransferForm({ paymentData, onSubmit, isSubmitting }: BankTransferFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setError('Please upload a receipt image')
      return
    }

    try {
      await onSubmit({
        receiptImage: selectedFile,
        notes: notes.trim()
      })
    } catch (err) {
      setError('Failed to submit payment. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transfer Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Transfer Instructions
            </CardTitle>
            <CardDescription>
              Please transfer the payment amount to the following account and upload your receipt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bank Name</Label>
                <p className="text-sm text-muted-foreground">Bank of Ceylon</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Name</Label>
                <p className="text-sm text-muted-foreground">ZFit Gym Management</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Number</Label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">123456789012</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Branch</Label>
                <p className="text-sm text-muted-foreground">Colombo Main Branch</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span>{paymentData.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">
                    {paymentData.currency} {paymentData.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-black border border-red-500/75 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-red-500/75" />
                <div className="text-sm text-red-500/75">
                  <strong>Important:</strong> Please include your membership plan name &quot;MMA NO Xcuse&quot;
                  in the transfer description for faster processing.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Payment Receipt
            </CardTitle>
            <CardDescription>
              Upload a clear photo of your bank transfer receipt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <Label htmlFor="receipt">Receipt Image *</Label>

              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload receipt image
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF up to 5MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {previewUrl && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">Preview</Label>
                      <div className="border rounded-lg p-2 bg-background">
                        <img
                          src={previewUrl}
                          alt="Receipt preview"
                          className="max-w-full h-auto max-h-48 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                id="receipt"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about your transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !selectedFile}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Payment for Review
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
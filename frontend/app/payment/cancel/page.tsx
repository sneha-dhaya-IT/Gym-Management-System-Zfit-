"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"

interface PaymentData {
  orderId?: string
  amount?: string
  currency?: string
}

export default function PaymentCancelPage() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)

  useEffect(() => {
    // Extract payment data from URL parameters (if available)
    const orderId = searchParams.get('order_id')
    const amount = searchParams.get('payhere_amount')
    const currency = searchParams.get('payhere_currency')
    
    setPaymentData({
      orderId: orderId || undefined,
      amount: amount || undefined,
      currency: currency || undefined
    })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Payment Cancelled
          </CardTitle>
          <CardDescription>
            Your payment was cancelled or failed to process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentData?.orderId && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Order ID:</span>
                <span className="text-sm text-gray-600">{paymentData.orderId}</span>
              </div>
              {paymentData.amount && paymentData.currency && (
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span className="text-sm text-gray-600">
                    {paymentData.currency} {paymentData.amount}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              No charges have been made to your account. You can try again or browse other membership options.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/memberDashboard/memberships/browse">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/memberDashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
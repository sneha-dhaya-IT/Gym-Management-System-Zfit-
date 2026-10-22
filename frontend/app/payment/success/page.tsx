"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, CreditCard, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"

interface PaymentData {
  orderId: string
  paymentId?: string
  amount?: string
  currency?: string
}

interface PaymentVerification {
  verified: boolean
  status: string
  payment?: any
  membership?: any
  error?: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [verification, setVerification] = useState<PaymentVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const verifyPayment = async (orderId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/gateways/status/${orderId}`)
      const result = await response.json()
      
      if (result.success) {
        setVerification({
          verified: true,
          status: result.status,
          payment: result.payment
        })
      } else {
        setVerification({
          verified: false,
          status: 'unknown',
          error: result.message
        })
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      setVerification({
        verified: false,
        status: 'error',
        error: 'Failed to verify payment status'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetryVerification = () => {
    if (paymentData?.orderId) {
      setLoading(true)
      setRetryCount(prev => prev + 1)
      verifyPayment(paymentData.orderId)
    }
  }

  // Development only: Manual payment completion
  const handleTestComplete = async () => {
    if (!paymentData?.orderId) return

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/v1/gateways/dev/complete-payment/${paymentData.orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount || '1000.00'
        })
      })

      const result = await response.json()

      if (response.status === 403 && result.message === 'Not available in production') {
        console.log('🚫 Dev endpoint not available in production mode, payment will complete via webhook')
        return
      }

      if (result.success) {
        console.log('✅ Payment completed automatically:', result)
        // Refresh payment status
        await verifyPayment(paymentData.orderId)
      } else {
        console.error('❌ Failed to complete payment:', result.message)
      }
    } catch (error) {
      console.error('❌ Auto completion failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Extract payment data from URL parameters (PayHere returns these)
    const orderId = searchParams.get('order_id')
    const paymentId = searchParams.get('payment_id')
    const amount = searchParams.get('payhere_amount')
    const currency = searchParams.get('payhere_currency')
    
    if (orderId) {
      const data = {
        orderId,
        paymentId: paymentId || undefined,
        amount: amount || undefined,
        currency: currency || undefined
      }
      setPaymentData(data)
      
      // Verify payment status
      verifyPayment(orderId)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  // Auto-complete payment in development if it's pending
  useEffect(() => {
    if (verification?.status === 'pending' && !loading && process.env.NODE_ENV !== 'production') {
      console.log('🧪 DEV: Auto-completing pending membership payment...')
      // Wait a moment then auto-complete
      const timer = setTimeout(() => {
        handleTestComplete()
      }, 2000) // Wait 2 seconds then auto-complete
      
      return () => clearTimeout(timer)
    }
  }, [verification?.status, loading])

  const getStatusIcon = () => {
    if (loading) {
      return <Loader2 className="h-16 w-16 text-foreground animate-spin" />
    }
    
    if (!verification?.verified) {
      return <AlertCircle className="h-16 w-16 text-yellow-500" />
    }
    
    if (verification.status === 'completed') {
      return <CheckCircle className="h-16 w-16 text-green-500" />
    }
    
    if (verification.status === 'pending') {
      return <Loader2 className="h-16 w-16 text-green-500 animate-spin" />
    }
    
    return <AlertCircle className="h-16 w-16 text-red-500" />
  }

  const getStatusMessage = () => {
    if (loading) {
      return {
        title: "Verifying Payment...",
        description: "Please wait while we confirm your payment"
      }
    }
    
    if (!verification?.verified) {
      return {
        title: "Payment Verification Pending",
        description: "We're still processing your payment. Please try refreshing."
      }
    }
    
    if (verification.status === 'completed') {
      return {
        title: "Payment Successful!",
        description: "Your membership has been purchased successfully"
      }
    }
    
    if (verification.status === 'pending') {
      // Check if we're in development and will auto-complete
      if (process.env.NODE_ENV !== 'production') {
        return {
          title: "Finalizing Membership",
          description: "This will complete automatically in a moment."
        }
      }
      return {
        title: "Payment Processing",
        description: "Your payment is being processed. This may take a few moments."
      }
    }
    
    return {
      title: "Payment Issue",
      description: verification.error || "There was an issue with your payment"
    }
  }

  const statusMessage = getStatusMessage()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {statusMessage.title}
          </CardTitle>
          <CardDescription>
            {statusMessage.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentData && (
            <div className="bg-secondary p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Order ID:</span>
                <span className="text-sm text-muted-foreground">{paymentData.orderId}</span>
              </div>
              {paymentData.paymentId && (
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Payment ID:</span>
                  <span className="text-sm text-muted-foreground">{paymentData.paymentId}</span>
                </div>
              )}
              {paymentData.amount && paymentData.currency && (
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Amount:</span>
                  <span className="text-sm text-muted-foreground">
                    {paymentData.currency} {paymentData.amount}
                  </span>
                </div>
              )}
              {verification && (
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Status:</span>
                  <span className={`text-sm font-medium ${
                    verification.status === 'completed' ? 'text-green-600' :
                    verification.status === 'pending' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            


            {!verification?.verified && !loading && (
              <div className="bg-black border border-green-600 p-4 rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    Verification Pending
                  </p>
                  <p className="text-gray-300 text-xs">
                    We're still confirming your payment. You can refresh or contact support if this persists.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {verification?.status === 'completed' ? (
                <>
                  <Button 
                    asChild 
                    className="w-full"
                  >
                    <Link href="/memberDashboard/memberships/my-memberships">
                      <CreditCard className="w-4 h-4 mr-2" />
                      View My Memberships
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full"
                  >
                    <Link href="/memberDashboard">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleRetryVerification}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-green-500" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Checking...' : 'Refresh Status'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full"
                  >
                    <Link href="/memberDashboard/memberships/browse">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Back to Memberships
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
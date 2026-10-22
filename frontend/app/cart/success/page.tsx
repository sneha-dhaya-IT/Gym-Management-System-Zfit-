"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, ShoppingCart, Loader2, AlertCircle, RefreshCw, Package } from "lucide-react"
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
  error?: string
}

export default function CartSuccessPage() {
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

  // Auto-complete payment in development if it's pending
  useEffect(() => {
    if (verification?.status === 'pending' && !loading && process.env.NODE_ENV !== 'production') {
      console.log('🧪 DEV: Auto-completing pending payment...')
      // Wait a moment then auto-complete
      const timer = setTimeout(() => {
        handleTestComplete()
      }, 2000) // Wait 2 seconds then auto-complete

      return () => clearTimeout(timer)
    }
  }, [verification?.status, loading])

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
      return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
    }
    
    return <AlertCircle className="h-16 w-16 text-red-500" />
  }

  const getStatusMessage = () => {
    if (loading) {
      return {
        title: "Processing Order...",
        description: "Please wait while we confirm and complete your order payment"
      }
    }
    
    if (!verification?.verified) {
      return {
        title: "Order Verification Pending",
        description: "We're still processing your order. Please try refreshing."
      }
    }
    
    if (verification.status === 'completed') {
      return {
        title: "Order Confirmed!",
        description: "Your order has been successfully placed and confirmed"
      }
    }
    
    if (verification.status === 'pending') {
      return {
        title: "Finalizing Order",
        description: "We're completing your order processing. This will just take a moment."
      }
    }
    
    return {
      title: "Order Issue",
      description: verification.error || "There was an issue with your order"
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
            <div className="bg-black p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-white">Order ID:</span>
                <span className="text-sm text-gray-300">{paymentData.orderId}</span>
              </div>
              {paymentData.paymentId && (
                <div className="flex justify-between">
                  <span className="font-medium text-white">Payment ID:</span>
                  <span className="text-sm text-gray-300">{paymentData.paymentId}</span>
                </div>
              )}
              {paymentData.amount && paymentData.currency && (
                <div className="flex justify-between">
                  <span className="font-medium text-white">Amount:</span>
                  <span className="text-sm text-gray-300">
                    {paymentData.currency} {paymentData.amount}
                  </span>
                </div>
              )}
              {verification && (
                <div className="flex justify-between">
                  <span className="font-medium text-white">Status:</span>
                  <span className={`text-sm font-medium ${
                    verification.status === 'completed' ? 'text-green-400' :
                    verification.status === 'pending' ? 'text-blue-400' :
                    'text-yellow-400'
                  }`}>
                    {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {verification?.status === 'completed' && (
              <div className="bg-black border border-green-600 p-3 rounded-lg">
                <p className="text-white font-medium text-sm mb-1">
                  ✅ Order Confirmed!
                </p>
                <p className="text-gray-300 text-xs">
                  Your order has been successfully placed! Check your email for order details and pickup/delivery information.
                </p>
              </div>
            )}
            
            {(verification?.status === 'pending' || loading) && (
              <div className="bg-black border border-green-600 p-3 rounded-lg">
                <p className="text-white font-medium text-sm mb-1">
                  ⏳ Finalizing Order
                </p>
                <p className="text-gray-300 text-xs">
                  We're completing your order processing. This will complete automatically in a moment.
                </p>
              </div>
            )}

            {!verification?.verified && !loading && (
              <div className="bg-black border border-yellow-600 p-3 rounded-lg">
                <p className="text-white font-medium text-sm mb-1">
                  ⚠️ Verification Pending
                </p>
                <p className="text-gray-300 text-xs">
                  We're still confirming your payment. You can refresh or contact support if this persists.
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {verification?.status === 'completed' ? (
                <>
                  <Button 
                    asChild 
                    className="w-full"
                  >
                    <Link href="/memberDashboard/orders">
                      <Package className="w-4 h-4 mr-2" />
                      View My Orders
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full"
                  >
                    <Link href="/memberDashboard/store">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                    <Link href="/memberDashboard/cart">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Back to Cart
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    asChild 
                    className="w-full"
                  >
                    <Link href="/memberDashboard/store">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continue Shopping
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
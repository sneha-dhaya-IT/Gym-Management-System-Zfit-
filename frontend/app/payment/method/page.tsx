"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Building2, ArrowRight, Loader2 } from "lucide-react"
import { initiatePayHerePayment, type PayHerePaymentRequest, uploadBankTransferReceipt, createBankTransferPayment } from "@/lib/api/paymentApi"
import { useAuth } from "@/lib/auth-context"
import BankTransferForm, { type BankTransferFormData } from "@/components/BankTransferForm"

interface PaymentData {
  planId?: string
  planName?: string
  amount?: number
  currency?: string
  type?: string
  description?: string
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  customerCity?: string
  // Cart payment fields
  items?: Array<{
    _id: string
    itemName: string
    price: number
    cartQuantity: number
  }>
  totalAmount?: number
  totalItems?: number
}

export default function PaymentMethodPage() {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBankTransferForm, setShowBankTransferForm] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      setError('You must be logged in to access this page.')
      return
    }

    // Load payment data from localStorage - check for both membership and cart payments
    const membershipData = localStorage.getItem('membershipPaymentData')
    const cartData = localStorage.getItem('cartPaymentData')

    if (membershipData) {
      try {
        const parsedData = JSON.parse(membershipData)
        setPaymentData(parsedData)
      } catch (err) {
        console.error('Error parsing membership payment data:', err)
        setError('Invalid payment data. Please try purchasing again.')
      }
    } else if (cartData) {
      try {
        const parsedData = JSON.parse(cartData)
        setPaymentData(parsedData)
        // For cart payments, automatically select card payment and proceed
        setSelectedMethod('card')
        // Auto-trigger card payment for cart
        setTimeout(() => {
          handleCardPayment(parsedData)
        }, 1000)
      } catch (err) {
        console.error('Error parsing cart payment data:', err)
        setError('Invalid cart data. Please try again.')
      }
    } else {
      setError('No payment data found. Please select a membership plan or add items to cart first.')
    }
  }, [user])

  const handleCardPayment = async (data?: PaymentData) => {
    const paymentDataToUse = data || paymentData
    if (!paymentDataToUse || !user) return
    
    setIsProcessing(true)
    setError(null)

    try {
      let response: { paymentForm: string }

      if (paymentDataToUse.type === 'cart') {
        // Handle cart payment
        const nameParts = (user.name || 'Customer').split(' ')
        const paymentRequest: PayHerePaymentRequest = {
          userId: user?._id || '',
          amount: paymentDataToUse.totalAmount || 0,
          currency: paymentDataToUse.currency || 'LKR',
          type: 'other' as const,
          relatedId: '', // Cart payments don't have a single related ID
          description: `Purchase of ${paymentDataToUse.totalItems} items`,
          customerFirstName: nameParts[0] || 'Customer',
          customerLastName: nameParts.slice(1).join(' ') || 'User',
          customerEmail: user.email || 'customer@example.com',
          customerPhone: user.contactNo || '0000000000',
          customerAddress: user.profile?.address || 'No address provided',
          customerCity: 'Colombo', // Default city
        }

        console.log('Initiating PayHere cart payment:', paymentRequest)

        response = await initiatePayHerePayment(paymentRequest)
      } else {
        // Handle membership payment
        const nameParts = (user.name || 'Customer').split(' ')
        const paymentRequest: PayHerePaymentRequest = {
          userId: user?._id || '',
          amount: paymentDataToUse.amount || 0,
          currency: paymentDataToUse.currency || 'LKR',
          type: 'membership' as const,
          relatedId: paymentDataToUse.planId || '',
          description: paymentDataToUse.description || '',
          customerFirstName: nameParts[0] || 'Customer',
          customerLastName: nameParts.slice(1).join(' ') || 'User',
          customerEmail: user.email || 'customer@example.com',
          customerPhone: user.contactNo || '0000000000',
          customerAddress: user.profile?.address || 'No address provided',
          customerCity: 'Colombo', // Default city
        }

        console.log('Initiating PayHere membership payment:', paymentRequest)

        response = await initiatePayHerePayment(paymentRequest)
      }

      if (response.paymentForm) {
        console.log('Payment form received, submitting...')

        // Create form in current window and submit immediately
        const formContainer = document.createElement('div')
        formContainer.innerHTML = response.paymentForm
        document.body.appendChild(formContainer)

        // Find the form and submit it manually
        const paymentForm = document.getElementById('payhere-form') as HTMLFormElement
        if (paymentForm) {
          setTimeout(() => {
            paymentForm.submit()
          }, 100)
        } else {
          throw new Error('Payment form element not found')
        }
      } else {
        throw new Error('Payment form not received')
      }
    } catch (err) {
      console.error('Payment initiation failed:', err)
      setError(err instanceof Error ? err.message : 'Payment initiation failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMethodSelect = (method: 'card' | 'bank') => {
    setSelectedMethod(method)
    setError(null)
  }

  const handleProceed = async () => {
    if (!selectedMethod || !paymentData) return

    if (!user) {
      setError('You must be logged in to make a payment.')
      return
    }

    if (selectedMethod === 'card') {
      setIsProcessing(true)
      setError(null)

      try {
        let response: { paymentForm: string }

        if (paymentData.type === 'cart') {
          // Handle cart payment
          const nameParts = (user.name || 'Customer').split(' ')
          const paymentRequest: PayHerePaymentRequest = {
            userId: user?._id || '',
            amount: paymentData.totalAmount || 0,
            currency: paymentData.currency || 'LKR',
            type: 'other' as const,
            relatedId: '', // Cart payments don't have a single related ID
            description: `Purchase of ${paymentData.totalItems} items`,
            customerFirstName: nameParts[0] || 'Customer',
            customerLastName: nameParts.slice(1).join(' ') || 'User',
            customerEmail: user.email || 'customer@example.com',
            customerPhone: user.contactNo || '0000000000',
            customerAddress: user.profile?.address || 'No address provided',
            customerCity: 'Colombo', // Default city
          }

          console.log('Initiating PayHere cart payment:', paymentRequest)

          response = await initiatePayHerePayment(paymentRequest)
        } else {
          // Handle membership payment
          const nameParts = (user.name || 'Customer').split(' ')
          const paymentRequest: PayHerePaymentRequest = {
            userId: user?._id || '',
            amount: paymentData.amount || 0,
            currency: paymentData.currency || 'LKR',
            type: 'membership' as const,
            relatedId: paymentData.planId || '',
            description: paymentData.description || '',
            customerFirstName: nameParts[0] || 'Customer',
            customerLastName: nameParts.slice(1).join(' ') || 'User',
            customerEmail: user.email || 'customer@example.com',
            customerPhone: user.contactNo || '0000000000',
            customerAddress: user.profile?.address || 'No address provided',
            customerCity: 'Colombo', // Default city
          }

          console.log('Initiating PayHere membership payment:', paymentRequest)

          response = await initiatePayHerePayment(paymentRequest)
        }

        if (response.paymentForm) {
          console.log('Payment form received, submitting...')

          // Create form in current window and submit immediately
          const formContainer = document.createElement('div')
          formContainer.innerHTML = response.paymentForm
          document.body.appendChild(formContainer)

          // Find the form and submit it manually
          const paymentForm = document.getElementById('payhere-form') as HTMLFormElement
          if (paymentForm) {
            setTimeout(() => {
              paymentForm.submit()
            }, 100)
          } else {
            throw new Error('Payment form element not found')
          }
        } else {
          throw new Error('Payment form not received')
        }
      } catch (err) {
        console.error('Payment initiation failed:', err)
        setError('Failed to initiate payment. Please try again.')
        setIsProcessing(false)
      }
    } else if (selectedMethod === 'bank') {
      // Show bank transfer form
      setShowBankTransferForm(true)
    }
  }

  const handleBankTransferSubmit = async (formData: BankTransferFormData) => {
    if (!paymentData || !user) return

    setIsProcessing(true)
    setError(null)

    try {
      // Step 1: Upload the receipt image
      console.log('Uploading receipt image...')
      const uploadResponse = await uploadBankTransferReceipt(formData.receiptImage!)
      console.log('Receipt uploaded successfully:', uploadResponse)

      if (paymentData.type === 'cart') {
        // For cart payments, we need to create an order first
        // For now, show an error as cart bank transfers are not implemented yet
        throw new Error('Bank transfer for cart payments is not yet implemented. Please use card payment.')
      } else {
        // Step 2: Create bank transfer payment record for membership
        console.log('Creating bank transfer payment...')
        const paymentRequest = {
          userId: user._id, // Include the current user's ID
          membershipId: paymentData.planId || '',
          amount: paymentData.amount || 0,
          currency: paymentData.currency || 'LKR',
          receiptImageUrl: uploadResponse.fileUrl,
          notes: formData.notes
        }

        const paymentResponse = await createBankTransferPayment(paymentRequest)
        console.log('Bank transfer payment created successfully:', paymentResponse)
      }

      // Success - redirect to success page
      alert('Bank transfer payment submitted successfully! Your payment will be reviewed by our admin team within 24 hours.')

      // Reset form and redirect
      setShowBankTransferForm(false)
      setSelectedMethod(null)
      localStorage.removeItem(paymentData.type === 'cart' ? 'cartPaymentData' : 'membershipPaymentData')

      // Redirect to success page
      window.location.href = '/payment/success'

    } catch (err) {
      console.error('Bank transfer submission failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit bank transfer payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {showBankTransferForm && paymentData ? (
        <div className="w-full max-w-4xl">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowBankTransferForm(false)}
              className="mb-4"
            >
              ← Back to Payment Methods
            </Button>
          </div>
          <BankTransferForm
            paymentData={{
              planId: paymentData.type === 'cart' ? 'cart-payment' : (paymentData.planId || ''),
              planName: paymentData.type === 'cart' ? `Cart Purchase (${paymentData.totalItems} items)` : (paymentData.planName || ''),
              amount: paymentData.type === 'cart' ? (paymentData.totalAmount || 0) : (paymentData.amount || 0),
              currency: paymentData.currency || 'LKR'
            }}
            onSubmit={handleBankTransferSubmit}
            isSubmitting={isProcessing}
          />
        </div>
      ) : (
        <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground">
            Choose Payment Method
          </CardTitle>
          <CardDescription className="text-lg">
            Select how you&apos;d like to complete your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Options */}
          <div className={`grid gap-4 ${paymentData?.type === 'cart' ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
            {/* Card Payment Option */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMethod === 'card'
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleMethodSelect('card')}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Card Payment
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Pay securely with your credit or debit card through our payment gateway
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Supported cards:</p>
                  <p className="text-xs font-medium text-foreground">
                    Visa, MasterCard, American Express
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer Option - Only show for membership payments */}
            {paymentData?.type !== 'cart' && (
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedMethod === 'bank'
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleMethodSelect('bank')}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Bank Transfer
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Transfer directly from your bank account to our account
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Processing time:</p>
                    <p className="text-xs font-medium text-foreground">
                      1-3 business days
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cart Payment Info */}
          {paymentData?.type === 'cart' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Cart Purchase:</strong> For cart orders, only card payment is available for instant processing and immediate order confirmation.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            <Button
              className="w-full max-w-xs"
              onClick={handleProceed}
              disabled={!selectedMethod}
            >
              Proceed to Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Additional Information */}
          <div className="text-center space-y-2 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              All payments are processed securely and your information is protected
            </p>
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team for assistance
            </p>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
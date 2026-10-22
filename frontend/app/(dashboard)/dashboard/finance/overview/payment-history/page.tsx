"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  User,
  CreditCard,
  DollarSign
} from "lucide-react"
import { getPaymentsByUserId, getUserById } from "@/lib/api/paymentApi"
import { Payment, User as UserType } from "@/lib/api/paymentApi"

export default function PaymentHistoryPage() {
  const router = useRouter()
  // Get userId from sessionStorage instead of URL params
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('paymentHistoryUserId') : null

  const [user, setUser] = useState<UserType | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        console.error('No userId found in sessionStorage')
        router.push('/dashboard/finance/overview')
        return
      }

      try {
        setLoading(true)
        console.log("Fetching data for userId:", userId)

        // Fetch user details and payment history
        const [userResponse, paymentsResponse] = await Promise.all([
          getUserById(userId),
          getPaymentsByUserId(userId)
        ])

        setUser(userResponse.data || null)
        setPayments(paymentsResponse.data || [])
        setFilteredPayments(paymentsResponse.data || [])
      } catch (error) {
        console.error("Error fetching payment history:", error)
        setPayments([])
        setFilteredPayments([])
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    } else {
      // If no userId in sessionStorage, redirect back
      router.push('/dashboard/finance/overview')
    }
  }, [userId, router])

  useEffect(() => {
    // Sort payments by date (newest first)
    const sorted = [...payments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setFilteredPayments(sorted)
  }, [payments])

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "membership":
        return <User className="h-4 w-4 text-blue-500" />
      case "booking":
        return <Calendar className="h-4 w-4 text-green-500" />
      case "inventory":
      case "other":
        return <DollarSign className="h-4 w-4 text-purple-500" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Loading payment history...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground">
            Complete payment history for {user?.name || 'User'}
          </p>
        </div>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History ({filteredPayments.length} transactions)</CardTitle>
          <CardDescription>
            Complete transaction history with detailed information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] w-full">
            <div className="p-6">
              {filteredPayments.length > 0 ? (
                <div className="space-y-3">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment._id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                          {/* Date and Transaction ID */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{formatDate(payment.createdAt)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              {payment.transactionId || 'No Transaction ID'}
                            </p>
                          </div>

                          {/* Type and Method */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(payment.type)}
                              <span className="font-medium text-sm capitalize">
                                {payment.type === 'other' ? 'inventory' : payment.type}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {payment.method || 'Unknown Method'}
                            </p>
                          </div>

                          {/* Amount */}
                          <div className="space-y-1">
                            <div className="font-bold text-lg text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {payment.currency || 'USD'}
                            </p>
                          </div>

                          {/* Status */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(payment.status)}
                              <Badge variant={getStatusBadgeVariant(payment.status)}>
                                {payment.status}
                              </Badge>
                            </div>
                            {payment.refundedAmount > 0 && (
                              <p className="text-xs text-red-600">
                                Refunded: {formatCurrency(payment.refundedAmount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Payment History</h3>
                  <p className="text-muted-foreground">
                    No payments found for the selected filters.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
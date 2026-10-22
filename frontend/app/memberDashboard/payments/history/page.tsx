"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getPaymentsByUserId } from "@/lib/api/paymentApi"
import { getRefundRequestsByUser, createRefundRequest, type RefundRequest } from "@/lib/api/refundRequestApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Search, Calendar, Eye } from "lucide-react"
import { toast } from "sonner"

interface Payment {
  _id: string
  userId: string | {
    _id: string
    name: string
    email: string
    contactNo: string
    role: string
    status: string
  }
  amount: number
  currency: string
  type: 'membership' | 'inventory' | 'booking' | 'other'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: 'card' | 'bank-transfer' | 'cash'
  relatedId: string
  transactionId: string
  date: string
  createdAt: string
  updatedAt: string
  refundedAmount: number
}

export default function PaymentHistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [pendingRefundCount, setPendingRefundCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundNotes, setRefundNotes] = useState("")
  const [submittingRefund, setSubmittingRefund] = useState(false)
  const [requestedRefunds, setRequestedRefunds] = useState<Set<string>>(new Set())

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortBy, setSortBy] = useState<string>("date-desc")

  const loadData = useCallback(async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const [paymentsResponse, refundRequestsResponse] = await Promise.all([
        getPaymentsByUserId(user._id),
        getRefundRequestsByUser(user._id)
      ])

      if (paymentsResponse.success && paymentsResponse.data) {
        setPayments(paymentsResponse.data)
      }

      setRefundRequests(refundRequestsResponse)

      // Initialize requested refunds set with existing refund request payment IDs
      const existingRefundPaymentIds = new Set(
        refundRequestsResponse.map((request: RefundRequest) => 
          typeof request.paymentId === 'string' ? request.paymentId : request.paymentId._id
        )
      )
      setRequestedRefunds(existingRefundPaymentIds)

      // Calculate pending refund count
      const pendingCount = refundRequestsResponse.filter((request: RefundRequest) => request.status === 'pending').length
      setPendingRefundCount(pendingCount)
    } catch (error) {
      console.error('Error loading payment data:', error)
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user?._id) {
      loadData()
    }
  }, [user, loadData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1" />Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'card':
        return <Badge variant="outline">💳 Card</Badge>
      case 'bank-transfer':
        return <Badge variant="outline">🏦 Bank Transfer</Badge>
      case 'cash':
        return <Badge variant="outline">💵 Cash</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const getRefundStatus = (payment: Payment) => {
    const refundRequest = refundRequests.find(req => 
      (typeof req.paymentId === 'string' ? req.paymentId : req.paymentId._id) === payment._id
    )
    return refundRequest ? refundRequest.status : null
  }

  const getDisplayStatus = (payment: Payment) => {
    const refundStatus = getRefundStatus(payment)
    // If refund is approved, show as refunded
    if (refundStatus === 'approved') {
      return 'refunded'
    }
    // Otherwise show the original payment status
    return payment.status
  }

  const canRequestRefund = (payment: Payment) => {
    // Can request refund if payment is completed and not fully refunded
    if (payment.status !== 'completed') return false
    if (payment.refundedAmount >= payment.amount) return false

    // Check if there's any refund request for this payment
    const existingRequest = refundRequests.find(req => 
      (typeof req.paymentId === 'string' ? req.paymentId : req.paymentId._id) === payment._id
    )
    if (existingRequest) return false

    // Check if refund has been requested in this session
    if (requestedRefunds.has(payment._id)) return false

    return true
  }

  const handleRefundRequest = async () => {
    if (!selectedPayment || !user?._id) return

    const amount = parseFloat(refundAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid refund amount')
      return
    }

    const maxRefundable = selectedPayment.amount - selectedPayment.refundedAmount
    if (amount > maxRefundable) {
      toast.error(`Maximum refundable amount is ${selectedPayment.currency} ${maxRefundable}`)
      return
    }

    try {
      setSubmittingRefund(true)
      
      // Add to requested refunds set immediately to disable button
      setRequestedRefunds(prev => new Set(prev).add(selectedPayment._id))
      
      await createRefundRequest({
        paymentId: selectedPayment._id,
        userId: user._id,
        requestedAmount: amount,
        notes: refundNotes.trim()
      })

      toast.success('Refund request submitted successfully!')
      setRefundDialogOpen(false)
      setRefundAmount("")
      setRefundNotes("")
      setSelectedPayment(null)

      // Reload data to show the new refund request
      loadData()
    } catch (error) {
      console.error('Error submitting refund request:', error)
      toast.error('Failed to submit refund request')
      
      // Remove from requested refunds set if there was an error
      setRequestedRefunds(prev => {
        const newSet = new Set(prev)
        newSet.delete(selectedPayment._id)
        return newSet
      })
    } finally {
      setSubmittingRefund(false)
    }
  }

  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment)
    setRefundAmount((payment.amount - payment.refundedAmount).toString())
    setRefundNotes("")
    setRefundDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredPayments = payments
    .filter((payment) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
          payment.transactionId.toLowerCase().includes(searchLower) ||
          payment.type.toLowerCase().includes(searchLower) ||
          payment.method.toLowerCase().includes(searchLower) ||
          payment.currency.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter - removed, no longer filtering by status

      // Type filter
      if (typeFilter !== "all" && payment.type !== typeFilter) {
        return false
      }

      // Method filter
      if (methodFilter !== "all" && payment.method !== methodFilter) {
        return false
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const paymentDate = new Date(payment.date)
        if (dateFrom) {
          const fromDate = new Date(dateFrom)
          if (paymentDate < fromDate) return false
        }
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999) // End of day
          if (paymentDate > toDate) return false
        }
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          // Sort by date in descending order (newest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date-asc':
          // Sort by date in ascending order (oldest first)
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount-desc':
          // Sort by amount in descending order (highest first)
          return b.amount - a.amount
        case 'amount-asc':
          // Sort by amount in ascending order (lowest first)
          return a.amount - b.amount
        case 'type':
          // Sort by type alphabetically
          return a.type.localeCompare(b.type)
        case 'status':
          // Sort by status
          const statusA = getDisplayStatus(a)
          const statusB = getDisplayStatus(b)
          return statusA.localeCompare(statusB)
        default:
          // Default to date descending
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setMethodFilter("all")
    setDateFrom("")
    setDateTo("")
    setSortBy("date-desc")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">
            View your payment history and manage refund requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/memberDashboard/payments/refunds')} variant="outline" size="sm" className="relative">
            <Eye className="w-4 h-4 mr-2" />
            View Refunds
            {pendingRefundCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0">
                {pendingRefundCount}
              </Badge>
            )}
          </Button>
          
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by transaction ID, type, method, or currency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="membership">Membership</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="amount-desc">Highest Amount</SelectItem>
            <SelectItem value="amount-asc">Lowest Amount</SelectItem>
            <SelectItem value="type">Type (A-Z)</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Label htmlFor="date-from" className="text-sm font-medium">From:</Label>
          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-8 w-[140px]"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="date-to" className="text-sm font-medium">To:</Label>
          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pl-8 w-[140px]"
            />
          </div>
        </div>
        <Button variant="outline" onClick={clearFilters} size="sm">
          Clear Filters
        </Button>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {payments.length === 0 ? "No payments found" : "No payments match your filters"}
              </h3>
              <p className="text-muted-foreground">
                {payments.length === 0
                  ? "You haven't made any payments yet."
                  : "Try adjusting your search criteria or clearing filters."
                }
              </p>
              {payments.length > 0 && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell className="capitalize">{payment.type}</TableCell>
                      <TableCell>{getMethodBadge(payment.method)}</TableCell>
                      <TableCell className="font-medium">
                        {payment.currency} {payment.amount.toLocaleString()}
                        {payment.refundedAmount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Refunded: {payment.currency} {payment.refundedAmount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(getDisplayStatus(payment))}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.transactionId}</TableCell>
                      <TableCell>
                        {(() => {
                          const refundStatus = getRefundStatus(payment)
                          
                          if (refundStatus === 'pending') {
                            return (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-yellow-700 font-medium">Refund Pending</span>
                              </div>
                            )
                          }
                          
                          if (refundStatus === 'approved') {
                            return (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-700 font-medium">Refund Completed</span>
                              </div>
                            )
                          }
                          
                          if (refundStatus === 'declined') {
                            return (
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-700 font-medium">Refund Declined</span>
                              </div>
                            )
                          }
                          
                          if (canRequestRefund(payment)) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRefundDialog(payment)}
                              >
                                Request Refund
                              </Button>
                            )
                          }

                          // Show disabled button if refund was requested in this session
                          if (requestedRefunds.has(payment._id)) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="cursor-not-allowed opacity-50"
                              >
                                Refund Requested
                              </Button>
                            )
                          }
                          
                          return null
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Request Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Request a refund for your payment. Please provide the amount and reason.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Payment Details</div>
                <div className="font-medium">
                  {selectedPayment.currency} {selectedPayment.amount.toLocaleString()} - {selectedPayment.type}
                </div>
                <div className="text-sm text-muted-foreground">
                  Transaction: {selectedPayment.transactionId}
                </div>
                {selectedPayment.refundedAmount > 0 && (
                  <div className="text-sm text-orange-600">
                    Already refunded: {selectedPayment.currency} {selectedPayment.refundedAmount.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund Amount</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={selectedPayment.amount - selectedPayment.refundedAmount}
                  min="0.01"
                  step="0.01"
                />
                <div className="text-sm text-muted-foreground">
                  Maximum refundable: {selectedPayment.currency} {(selectedPayment.amount - selectedPayment.refundedAmount).toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-notes">Reason for Refund</Label>
                <Textarea
                  id="refund-notes"
                  placeholder="Please explain why you're requesting a refund..."
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
              disabled={submittingRefund}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefundRequest}
              disabled={submittingRefund || !refundAmount || !refundNotes.trim()}
            >
              {submittingRefund ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
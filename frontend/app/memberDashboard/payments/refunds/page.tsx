"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getRefundRequestsByUser, type RefundRequest } from "@/lib/api/refundRequestApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, Clock, RefreshCw, CreditCard, FileText, Search, Calendar, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface User {
  _id: string
  name: string
  email: string
  contactNo: string
  role: string
  status: string
}

interface Payment {
  _id: string
  userId: string | User
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

export default function RefundRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const loadRefundRequests = useCallback(async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const response = await getRefundRequestsByUser(user._id)

      if (response) {
        setRefundRequests(response)
      }
    } catch (error) {
      console.error('Error loading refund requests:', error)
      toast.error('Failed to load refund requests')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user?._id) {
      loadRefundRequests()
    }
  }, [user, loadRefundRequests])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-secondary text-secondary-foreground border-secondary-foreground/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'declined':
        return <Badge className="bg-destructive text-destructive-foreground"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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

  const getPaymentInfo = (request: RefundRequest) => {
    if (typeof request.paymentId === 'object' && request.paymentId) {
      return {
        transactionId: request.paymentId.transactionId,
        type: request.paymentId.type,
        amount: request.paymentId.amount,
        currency: request.paymentId.currency
      }
    }
    return {
      transactionId: 'N/A',
      type: 'N/A',
      amount: 0,
      currency: 'LKR'
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  const filteredRefundRequests = refundRequests.filter((request) => {
    const paymentInfo = getPaymentInfo(request)

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        request.requestId.toLowerCase().includes(searchLower) ||
        paymentInfo.transactionId.toLowerCase().includes(searchLower) ||
        request.notes.toLowerCase().includes(searchLower) ||
        paymentInfo.type.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Status filter
    if (statusFilter !== "all" && request.status !== statusFilter) {
      return false
    }

    // Type filter
    if (typeFilter !== "all" && paymentInfo.type !== typeFilter) {
      return false
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const requestDate = new Date(request.createdAt)
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        if (requestDate < fromDate) return false
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        if (requestDate > toDate) return false
      }
    }

    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading refund requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/memberDashboard/payments/history')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Refund Requests</h1>
            <p className="text-muted-foreground">
              View and track your refund request status
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by request ID, transaction ID, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Refund Requests
          </CardTitle>
          <CardDescription className="mt-1">
            Track the status and details of all your refund requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRefundRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {refundRequests.length === 0 ? "No Refund Requests" : "No requests match your filters"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {refundRequests.length === 0
                  ? "You haven't submitted any refund requests yet."
                  : "Try adjusting your search criteria or clearing filters."
                }
              </p>
              {refundRequests.length === 0 ? (
                <Button onClick={() => router.push('/memberDashboard/payments/history')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Payment History
                </Button>
              ) : (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2">
                    <TableHead className="font-semibold text-foreground">Request ID</TableHead>
                    <TableHead className="font-semibold text-foreground">Payment Details</TableHead>
                    <TableHead className="font-semibold text-foreground">Amount</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Requested Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Notes & Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefundRequests.map((request) => {
                    const paymentInfo = getPaymentInfo(request)
                    return (
                      <TableRow key={request._id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            #{request.requestId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              <CreditCard className="w-3 h-3 text-muted-foreground" />
                              {paymentInfo.transactionId}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {paymentInfo.type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-lg">
                            {paymentInfo.currency} {request.requestedAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            of {paymentInfo.currency} {paymentInfo.amount?.toLocaleString() || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatDate(request.createdAt).split(',')[0]}</div>
                            <div className="text-muted-foreground text-xs">
                              {formatDate(request.createdAt).split(',')[1]?.trim()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {(request.notes || request.adminNotes) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel>Notes & Responses</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {request.notes && (
                                  <div className="px-2 py-1.5">
                                    <div className="font-medium text-xs text-muted-foreground mb-2">YOUR NOTES:</div>
                                    <div className="bg-muted/50 p-3 rounded-md text-sm leading-relaxed">
                                      {request.notes}
                                    </div>
                                  </div>
                                )}
                                {request.notes && request.adminNotes && <DropdownMenuSeparator />}
                                {request.adminNotes && (
                                  <div className="px-2 py-1.5">
                                    <div className="font-medium text-xs text-primary mb-2 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      ADMIN RESPONSE:
                                    </div>
                                    <div className="text-sm leading-relaxed">
                                      {request.adminNotes}
                                    </div>
                                  </div>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-muted-foreground text-sm">No notes</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
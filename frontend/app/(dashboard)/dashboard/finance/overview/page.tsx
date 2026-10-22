"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  MoreHorizontal,
  Search,
  Download,
  Eye,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getPayments, type Payment, deletePayment } from "@/lib/api/paymentApi"
import { getRefundRequests, type RefundRequest } from "@/lib/api/refundRequestApi"


const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    pending: "secondary",
    failed: "destructive",
    refunded: "outline",
  }
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

const getTypeBadge = (type: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    membership: "default",
    booking: "secondary",
    inventory: "outline",
    other: "destructive",
  }

  // Display "orders" for cart payments (stored as 'other' type)
  const displayText = type === 'other' ? 'orders' : type

  return <Badge variant={variants[type] || "outline"}>{displayText}</Badge>
}

const getMethodBadge = (method: string) => {
  return <Badge variant="outline">{method}</Badge>
}

const getEffectivePaymentStatus = (payment: Payment, refundRequests: RefundRequest[]) => {
  // Check if there's an approved refund for this payment
  const hasApprovedRefund = refundRequests.some(refund => {
    const refundPaymentId = typeof refund.paymentId === 'string' 
      ? refund.paymentId 
      : refund.paymentId._id
    return refundPaymentId === payment._id && refund.status === 'approved'
  })
  
  // If there's an approved refund, show as refunded regardless of payment status
  return hasApprovedRefund ? 'refunded' : payment.status
}

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const router = useRouter()

  // Fetch payments on component mount
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        const [paymentsData, refundData] = await Promise.all([
          getPayments(),
          getRefundRequests('approved') // Only get approved refunds
        ])
        setPayments(paymentsData)
        setRefundRequests(refundData)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch payments:', err)
        setError('Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [])

  // Auto-remove pending payments after 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      let removedCount = 0
      
      setPayments(currentPayments => 
        currentPayments.filter(payment => {
          // Only remove pending payments that are older than 10 minutes
          if (payment.status === 'pending') {
            const paymentDate = new Date(payment.createdAt)
            const timeDiff = now.getTime() - paymentDate.getTime()
            const minutesDiff = timeDiff / (1000 * 60) // Convert to minutes
            
            if (minutesDiff >= 10) {
              removedCount++
              console.log(`Auto-removing expired pending payment: ${payment.transactionId || payment._id}`)
              return false // Remove this payment
            }
          }
          return true // Keep this payment
        })
      )
      
      // Show notification if payments were removed
      if (removedCount > 0) {
        setNotification(`${removedCount} expired pending payment${removedCount > 1 ? 's' : ''} removed automatically`)
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000)
      }
    }, 60000) // Check every 60 seconds (1 minute)

    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase()
    const effectiveStatus = getEffectivePaymentStatus(payment, refundRequests)
    const matchesSearch = payment.transactionId?.toLowerCase().includes(searchLower) ||
                         payment._id?.toLowerCase().includes(searchLower) ||
                         effectiveStatus?.toLowerCase().includes(searchLower) ||
                         payment.type?.toLowerCase().includes(searchLower) ||
                         payment.method?.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter
    const matchesType = typeFilter === "all" || payment.type === typeFilter
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter
    return matchesSearch && matchesStatus && matchesType && matchesMethod
  })

  const handleDeletePayment = async (payment: Payment) => {
    if (!confirm(`Are you sure you want to delete payment ${payment.transactionId}?`)) return

    try {
      await deletePayment(payment._id)
      setPayments(payments.filter(p => p._id !== payment._id))
    } catch (error) {
      console.error('Error deleting payment:', error)
      setError('Failed to delete payment')
    }
  }

  const handleGenerateReport = async () => {
    try {
      // Build query parameters based on current filters
      const queryParams = new URLSearchParams()
      
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm)
      }
      
      if (statusFilter && statusFilter !== 'all') {
        queryParams.append('status', statusFilter)
      }
      
      if (typeFilter && typeFilter !== 'all') {
        queryParams.append('type', typeFilter)
      }
      
      if (methodFilter && methodFilter !== 'all') {
        queryParams.append('method', methodFilter)
      }
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/payments/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = downloadUrl
      
      // Use filtered filename if filters are applied
      const hasFilters = searchTerm || (statusFilter && statusFilter !== 'all') || (typeFilter && typeFilter !== 'all') || (methodFilter && methodFilter !== 'all')
      const filename = hasFilters ? `ZFit_Payments_Report_Filtered_${new Date().toISOString().split('T')[0]}.pdf` : `ZFit_Payments_Report_${new Date().toISOString().split('T')[0]}.pdf`
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      a.remove()
    } catch (error) {
      console.error('Error generating report:', error)
      // Error handling for report generation
    }
  }

  const handleViewUserDetails = async (payment: Payment) => {
    console.log('Selected payment:', payment)
    console.log('User ID type:', typeof payment.userId)
    console.log('User ID value:', payment.userId)
    
    setSelectedPayment(payment)
    setShowUserModal(true)
  }

  const getUserData = (payment: Payment) => {
    console.log('Getting user data for payment:', payment)
    console.log('UserId:', payment.userId)
    console.log('UserId type:', typeof payment.userId)
    
    // Check if userId is an object with user details (populated)
    if (typeof payment.userId === 'object' && payment.userId !== null && '_id' in payment.userId) {
      console.log('Found populated user data:', payment.userId)
      return payment.userId
    }
    
    // If userId is just a string (ObjectId), create a fallback object
    if (typeof payment.userId === 'string') {
      console.log('UserId is string, creating fallback')
      return {
        _id: payment.userId,
        name: 'User details not loaded',
        email: 'Please ensure backend is running',
        contactNo: 'N/A',
        role: 'unknown',
        status: 'unknown'
      }
    }
    
    console.log('No valid user data found')
    return null
  }

  // UserDetailsModal Component
  const UserDetailsModal = () => {
    const userData = selectedPayment ? getUserData(selectedPayment) : null
    
    console.log('Modal userData:', userData)
    console.log('Selected payment in modal:', selectedPayment)
    
    if (!userData) {
      return (
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                User information for this payment
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">User details not available</p>
              {selectedPayment && (
                <div className="text-xs text-muted-foreground">
                  <p>Debug Info:</p>
                  <p>User ID: {typeof selectedPayment.userId === 'string' ? selectedPayment.userId : 'Object'}</p>
                  <p>Type: {typeof selectedPayment.userId}</p>
                  <p>Transaction ID: {selectedPayment.transactionId}</p>
                  <p className="text-red-500 mt-2">
                    Note: Make sure the backend server is running with populated user data
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="text-xl">User Details</DialogTitle>
            <DialogDescription className="text-base">
              Customer information for payment {selectedPayment?.transactionId}
            </DialogDescription>
          </DialogHeader>
          
          {/* Show warning if this is fallback data */}
          {userData.name === 'User details not loaded' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4 flex-shrink-0">
              <p className="text-sm text-yellow-800">
                ⚠️ Showing limited data. Backend server may not be running or user data not populated.
              </p>
            </div>
          )}
          
          {/* Main content with fixed height */}
          <div className="flex-1 min-h-0 space-y-6">
            {/* User Information Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                User Information
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm font-medium">{userData.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Role</label>
                  <div>
                    <Badge variant="outline" className="capitalize text-xs">{userData.role}</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <div>
                    <Badge 
                      variant={userData.status === 'active' ? 'default' : 'secondary'} 
                      className="capitalize text-xs"
                    >
                      {userData.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <p className="text-sm break-all">{userData.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Contact Number</label>
                  <p className="text-sm font-medium">{userData.contactNo}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">User ID</label>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{userData._id}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Current Payment Information Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Current Payment Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Amount</label>
                  <p className="text-lg font-semibold text-green-600">
                    {selectedPayment?.currency} {selectedPayment?.amount.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                  <p className="text-sm capitalize">{selectedPayment?.method}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
                  <p className="text-sm capitalize">{selectedPayment?.type}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Payment Status</label>
                  <div>
                    {selectedPayment && getStatusBadge(getEffectivePaymentStatus(selectedPayment, refundRequests))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Transaction ID</label>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {selectedPayment?.transactionId || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Transaction Date</label>
                  <p className="text-sm">{selectedPayment ? new Date(selectedPayment.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with Action Button */}
          <DialogFooter className="pt-4 border-t flex-shrink-0">
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowUserModal(false)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  if (userData._id) {
                    setShowUserModal(false)
                    // Navigate to member details page with payments tab
                    router.push(`/dashboard/users/members/${userData._id}?tab=payments`)
                  }
                }}
                className="bg-primary hover:bg-primary/90"
              >
                View Payment History
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
            <p className="text-muted-foreground">Manage all payment transactions.</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading payments...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
          <p className="text-muted-foreground">
            Manage all payment transactions and financial records.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <p className="text-sm text-blue-800">{notification}</p>
          <button 
            onClick={() => setNotification(null)}
            className="ml-auto text-blue-600 hover:text-blue-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="membership">Membership</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="other">Orders</SelectItem>
            <SelectItem value="inventory">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            All Payments
          </CardTitle>
          <CardDescription>
            Complete list of all payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell className="font-medium">{payment.transactionId}</TableCell>
                    <TableCell>
                      {getTypeBadge(payment.type)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getMethodBadge(payment.method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(getEffectivePaymentStatus(payment, refundRequests))}
                    </TableCell>
                    <TableCell>{new Date(payment.date).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewUserDetails(payment)}
                            className="flex items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View User Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePayment(payment)}
                            className="text-destructive"
                          >
                            Delete Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payments found. Create your first payment to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <UserDetailsModal />
    </div>
  )
}
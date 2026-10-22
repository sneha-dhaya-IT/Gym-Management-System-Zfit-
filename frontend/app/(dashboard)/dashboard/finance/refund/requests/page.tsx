"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Plus,
  Loader2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getRefundRequests, approveRefundRequest, declineRefundRequest, deleteRefundRequest, getPendingRequestsCount, updateRefundRequest, type RefundRequest } from "@/lib/api/refundRequestApi"
import { updatePayment, initiatePayHereRefund, type PayHereRefundRequest } from "@/lib/api/paymentApi"
import { generateRefundRequestsReport } from "@/lib/api/reportApi"

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "declined":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    approved: "default",
    pending: "secondary",
    declined: "destructive",
  }
  return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}

export default function RefundRequestsManagementPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState<"approve" | "decline" | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [pendingCount, setPendingCount] = useState(0)
  const [processingRequest, setProcessingRequest] = useState(false)
  
  // State for admin notes editing
  const [editableAdminNotes, setEditableAdminNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Fetch requests on component mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true)
        const [requestsData, countData] = await Promise.all([
          getRefundRequests(undefined, ['userId', 'paymentId']),
          getPendingRequestsCount()
        ])
        setRequests(requestsData)
        setPendingCount(countData)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch refund requests:', err)
        setError('Failed to load refund requests')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase()
    const userName = typeof request.userId === 'object' ? request.userId?.name : ''
    const userEmail = typeof request.userId === 'object' ? request.userId?.email : ''

    const matchesSearch = request.requestId?.toLowerCase().includes(searchLower) ||
                         userName?.toLowerCase().includes(searchLower) ||
                         userEmail?.toLowerCase().includes(searchLower) ||
                         request.notes?.toLowerCase().includes(searchLower) ||
                         request.status?.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (request: RefundRequest) => {
    setSelectedRequest(request)
    setEditableAdminNotes(request.adminNotes || "")
    setIsViewModalOpen(true)
  }

  const handleSaveAdminNotes = async () => {
    if (!selectedRequest) return

    try {
      setIsSavingNotes(true)
      const updatedRequest = await updateRefundRequest(selectedRequest._id, {
        adminNotes: editableAdminNotes
      })

      // Update the selected request and the requests list
      setSelectedRequest(updatedRequest)
      setRequests(prev => 
        prev.map(req => 
          req._id === updatedRequest._id ? updatedRequest : req
        )
      )

      // Show success message (you could replace this with a toast notification)
      alert('Admin notes updated successfully!')
    } catch (error) {
      console.error('Error saving admin notes:', error)
      alert('Failed to save admin notes. Please try again.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleProcessRequest = async (request: RefundRequest, action: "approve" | "decline") => {
    if (action === 'decline') {
      // Handle decline with modal
      setSelectedRequest(request)
      setProcessingAction(action)
      setAdminNotes("")
      setIsProcessingModalOpen(true)
      return
    }

    // Handle approve with PayHere refund
    if (action === 'approve') {
      try {
        setProcessingRequest(true)
        
        // Get payment details
        const paymentId = typeof request.paymentId === 'string' 
          ? request.paymentId 
          : request.paymentId._id

        // Initiate PayHere refund
        const refundRequest: PayHereRefundRequest = {
          paymentId: paymentId,
          amount: request.requestedAmount,
          reason: request.notes || 'Refund request approved'
        }

        console.log('Initiating PayHere refund:', refundRequest)
        
        const refundResponse = await initiatePayHereRefund(refundRequest)
        
        console.log('PayHere refund response:', refundResponse)

        // Handle redirect-based refunds (like payments)
        if (refundResponse.checkoutUrl) {
          window.location.href = refundResponse.checkoutUrl
          return // Exit here as we're redirecting
        }

        // Handle form-based refunds
        if (refundResponse.paymentForm) {
          const formContainer = document.createElement('div')
          formContainer.innerHTML = refundResponse.paymentForm
          document.body.appendChild(formContainer)

          const refundForm = document.getElementById('payhere-refund-form') as HTMLFormElement
          if (refundForm) {
            setTimeout(() => {
              refundForm.submit()
            }, 100)
          } else {
            throw new Error('Refund form not found')
          }
          return // Exit here as we're submitting form
        }

        // If refund is successful without redirect, approve the request
        if (refundResponse.status === 'completed' || refundResponse.status === 'success' || refundResponse.status === 'pending_verification') {
          await approveRefundRequest(request._id, `PayHere refund processed - ${refundResponse.refundId}`)
          
          // Update payment status to 'refunded'
          await updatePayment(paymentId, { status: 'refunded' })
          
          // Refresh requests list and count
          const [updatedRequests, newCount] = await Promise.all([
            getRefundRequests(),
            getPendingRequestsCount()
          ])
          setRequests(updatedRequests)
          setPendingCount(newCount)
          
          // Show success message
          alert('Refund processed successfully via PayHere')
        } else {
          throw new Error('Refund processing failed')
        }
        
      } catch (error) {
        console.error('Error processing PayHere refund:', error)
        alert('Failed to process refund via PayHere. Please try again.')
      } finally {
        setProcessingRequest(false)
      }
    }
  }

  const handleConfirmProcessing = async () => {
    if (!selectedRequest || !processingAction) return

    try {
      if (processingAction === 'approve') {
        await approveRefundRequest(selectedRequest._id, adminNotes || undefined)
      } else if (processingAction === 'decline') {
        await declineRefundRequest(selectedRequest._id, adminNotes || undefined)
      }

      // Refresh requests list and count
      const [updatedRequests, newCount] = await Promise.all([
        getRefundRequests(),
        getPendingRequestsCount()
      ])
      setRequests(updatedRequests)
      setPendingCount(newCount)
    } catch (error) {
      console.error('Error processing refund request:', error)
      // TODO: Show error toast
    }

    setIsProcessingModalOpen(false)
    setSelectedRequest(null)
    setProcessingAction(null)
    setAdminNotes("")
  }

  const handleDeleteRequest = async (request: RefundRequest) => {
    if (!confirm(`Are you sure you want to delete refund request ${request.requestId}?`)) return

    try {
      await deleteRefundRequest(request._id)
      // Refresh requests list and count
      const [updatedRequests, newCount] = await Promise.all([
        getRefundRequests(),
        getPendingRequestsCount()
      ])
      setRequests(updatedRequests)
      setPendingCount(newCount)
    } catch (error) {
      console.error('Error deleting refund request:', error)
      // TODO: Show error toast
    }
  }

  const handleGenerateReport = async () => {
    try {
      // Prepare filter parameters to match current frontend filtering
      const filterParams = new URLSearchParams()
      
      if (searchTerm) {
        filterParams.append('searchTerm', searchTerm)
      }
      
      if (statusFilter && statusFilter !== 'all') {
        filterParams.append('status', statusFilter)
      }

      // Make API request with filter parameters
      const response = await fetch(`/api/v1/reports/refund-requests/pdf?${filterParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reportBlob = await response.blob()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(reportBlob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename based on whether filters are applied
      const hasFilters = searchTerm || (statusFilter && statusFilter !== 'all')
      const filename = hasFilters 
        ? `Zfit_Refund_Requests_Filtered_${new Date().toISOString().split('T')[0]}.pdf`
        : `Zfit_Refund_Requests_${new Date().toISOString().split('T')[0]}.pdf`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
      // TODO: Show error toast
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Refund Requests</h2>
          <p className="text-muted-foreground">
            Review and process refund requests from members.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => router.push('/dashboard/finance/refund')}>
          
            Create Refund
          </Button>
          <Button variant="outline" onClick={handleGenerateReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by request ID, user name, email, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests Queue</CardTitle>
          <CardDescription>
            {filteredRequests.length} refund request{filteredRequests.length !== 1 ? 's' : ''} found
            {pendingCount > 0 && (
              <span className="ml-2 text-sm text-orange-600">
                ({pendingCount} pending)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading refund requests...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">{request.requestId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {typeof request.userId === 'object' && request.userId?.name
                                ? request.userId.name.charAt(0).toUpperCase()
                                : 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {typeof request.userId === 'object' && request.userId?.name
                                ? request.userId.name
                                : 'Unknown User'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {typeof request.userId === 'object' && request.userId?.email
                                ? request.userId.email
                                : typeof request.userId === 'string'
                                ? request.userId
                                : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>LKR {request.requestedAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequest(request)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No refund requests found. Requests will appear here when submitted.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Refund Request Details
            </DialogTitle>
            <DialogDescription className="text-base font-mono bg-muted px-3 py-2 rounded-md">
              Request ID: {selectedRequest?.requestId}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Row 1: User Information and Payment Information side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">User Information</h3>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {typeof selectedRequest.userId === 'object' && selectedRequest.userId?.name
                            ? selectedRequest.userId.name.charAt(0).toUpperCase()
                            : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">
                          {typeof selectedRequest.userId === 'object' && selectedRequest.userId?.name
                            ? selectedRequest.userId.name
                            : 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">ID: {selectedRequest._id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Email:</span> {typeof selectedRequest.userId === 'object' && selectedRequest.userId?.email ? selectedRequest.userId.email : 'N/A'}</p>
                      <p><span className="font-medium">Phone:</span> {typeof selectedRequest.userId === 'object' && selectedRequest.userId?.contactNo ? selectedRequest.userId.contactNo : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">Payment Information</h3>
                  {typeof selectedRequest.paymentId === 'object' && selectedRequest.paymentId ? (
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <div>
                        <p className="text-sm font-medium">Transaction ID</p>
                        <p className="text-sm font-mono bg-background px-2 py-1 rounded border">
                          {selectedRequest.paymentId.transactionId}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Original Amount</p>
                          <p className="text-lg font-semibold">
                            {selectedRequest.paymentId.currency || 'LKR'} {selectedRequest.paymentId.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Type:</span> {selectedRequest.paymentId.type}
                        </div>
                        <div>
                          <span className="font-medium">Method:</span> <span className="font-semibold text-primary">{selectedRequest.paymentId.method || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm">Payment details not available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Refund Details and Timeline side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Refund Amount, Status, Date */}
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">LKR {selectedRequest.requestedAmount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Refund Amount Requested</p>
                    </div>
                    <div className="flex justify-center">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Requested on</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Request Timeline */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">Request Timeline</h3>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Request Created</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedRequest.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt && (
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          selectedRequest.status === 'approved' ? 'bg-green-500' :
                          selectedRequest.status === 'declined' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            Request {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedRequest.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Request Notes and Admin Notes side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Notes */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">Request Notes</h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedRequest.notes || 'No notes provided'}
                    </p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wide">Admin Notes</h3>
                  <div className="space-y-3">
                    <Textarea
                      value={editableAdminNotes}
                      onChange={(e) => setEditableAdminNotes(e.target.value)}
                      placeholder="Add admin notes here..."
                      className="min-h-[60px] resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveAdminNotes}
                        disabled={isSavingNotes}
                        size="sm"
                        className="w-auto"
                      >
                        {isSavingNotes ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Notes'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsViewModalOpen(false)
                        handleProcessRequest(selectedRequest, 'decline')
                      }}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      onClick={() => {
                        setIsViewModalOpen(false)
                        handleProcessRequest(selectedRequest, 'approve')
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Processing Modal */}
      <Dialog open={isProcessingModalOpen} onOpenChange={setIsProcessingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {processingAction === 'approve' && 'Approve Refund Request'}
              {processingAction === 'decline' && 'Decline Refund Request'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>Processing refund request <strong>{selectedRequest.requestId}</strong> - LKR {selectedRequest.requestedAmount.toFixed(2)}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add any notes for this decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsProcessingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmProcessing}
                className={processingAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
              >
                {processingAction === 'approve' && (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Request
                  </>
                )}
                {processingAction === 'decline' && (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
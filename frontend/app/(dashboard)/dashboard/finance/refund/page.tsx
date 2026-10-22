"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  RefreshCw,
  Download,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Mail,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
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
import { getPendingRequestsCount } from "@/lib/api/refundRequestApi"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { getRefunds, approveRefund, denyRefund, deleteRefund, createRefund, updateRefund, type Refund } from "@/lib/api/refundApi"
import { getPayments, type Payment } from "@/lib/api/paymentApi"
import { getMembers } from "@/lib/api/userApi"
import { generateRefundsReport } from "@/lib/api/reportApi"

interface User {
  _id: string
  name: string
  email: string
  contactNo?: string
  role: string
  status: string
}

// Mock refund data - REMOVED
// const refunds = [...]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    pending: "secondary",
    failed: "destructive",
  }
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

export default function RefundManagementPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [processingAction, setProcessingAction] = useState<"approve" | "deny" | "partial" | null>(null)
  const [partialAmount, setPartialAmount] = useState("")
  const [processingNotes, setProcessingNotes] = useState("")
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createFormErrors, setCreateFormErrors] = useState<{[key: string]: string}>({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRefund, setEditingRefund] = useState<Refund | null>(null)
  const [editFormErrors, setEditFormErrors] = useState<{[key: string]: string}>({})
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingRefund, setViewingRefund] = useState<Refund | null>(null)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [editFormData, setEditFormData] = useState({
    paymentId: '',
    userId: '',
    refundAmount: '',
    originalAmount: '',
    notes: '',
    status: '' as 'pending' | 'completed' | 'failed'
  })
  const [createFormData, setCreateFormData] = useState({
    paymentId: '',
    userId: '',
    refundAmount: '',
    originalAmount: '',
    notes: ''
  })
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])

  // Fetch refunds on component mount
  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true)
        const data = await getRefunds()
        setRefunds(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch refunds:', err)
        setError('Failed to load refunds')
      } finally {
        setLoading(false)
      }
    }

    fetchRefunds()
  }, [])

  // Fetch pending requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const count = await getPendingRequestsCount()
        setPendingRequestsCount(count)
      } catch (err) {
        console.error('Failed to fetch pending requests count:', err)
      }
    }

    fetchPendingCount()
  }, [])

  // Load all users for search functionality
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await getMembers()
        if (response.success && response.data && Array.isArray(response.data)) {
          setAllUsers(response.data)
        }
      } catch (err) {
        console.error('Failed to load users:', err)
      }
    }

    loadUsers()
  }, [])

  const filteredRefunds = refunds.filter(refund => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = refund.refundId?.toLowerCase().includes(searchLower) ||
                         refund.userId?.toLowerCase().includes(searchLower) ||
                         refund.notes?.toLowerCase().includes(searchLower) ||
                         refund.status?.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === "all" || refund.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleProcessRefund = (refund: Refund, action: "approve" | "deny" | "partial") => {
    setSelectedRefund(refund)
    setProcessingAction(action)
    setPartialAmount(action === "partial" ? refund.refundAmount?.toString() || "" : "")
    setProcessingNotes("")
    setIsProcessingModalOpen(true)
  }

  const handleConfirmProcessing = async () => {
    if (!selectedRefund || !processingAction) return

    try {
      if (processingAction === 'approve') {
        await approveRefund(selectedRefund._id)
      } else if (processingAction === 'deny') {
        await denyRefund(selectedRefund._id)
      }
      // Refresh refunds list
      const updatedRefunds = await getRefunds()
      setRefunds(updatedRefunds)
    } catch (error) {
      console.error('Error processing refund:', error)
      // TODO: Show error toast
    }

    setIsProcessingModalOpen(false)
    setSelectedRefund(null)
    setProcessingAction(null)
  }

  const handleUpdateRefund = (refund: Refund) => {
    if (refund.status === 'failed' || refund.status === 'completed') {
      return; // Don't allow editing of disapproved or approved refunds
    }
    
    setEditingRefund(refund)
    setEditFormData({
      paymentId: refund.paymentId,
      userId: refund.userId,
      refundAmount: refund.refundAmount.toString(),
      originalAmount: refund.originalAmount.toString(),
      notes: refund.notes,
      status: refund.status
    })
    setEditFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleViewRefund = (refund: Refund) => {
    setViewingRefund(refund)
    setIsViewModalOpen(true)
  }

  const handleDeleteRefund = async (refund: Refund) => {
    if (!confirm(`Are you sure you want to delete refund ${refund.refundId}?`)) return

    try {
      await deleteRefund(refund._id)
      // Refresh refunds list
      const updatedRefunds = await getRefunds()
      setRefunds(updatedRefunds)
    } catch (error) {
      console.error('Error deleting refund:', error)
      // TODO: Show error toast
    }
  }

  // User search functions
  const handleUserSearch = (searchTerm: string) => {
    setUserSearchTerm(searchTerm)
    if (searchTerm.trim().length > 0) {
      const filtered = allUsers.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.contactNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user._id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      // Sort by relevance: exact matches first, then partial matches
      const sorted = filtered.sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        const search = searchTerm.toLowerCase()

        // Exact name match gets highest priority
        if (aName === search) return -1
        if (bName === search) return 1

        // Name starts with search term
        if (aName.startsWith(search) && !bName.startsWith(search)) return -1
        if (bName.startsWith(search) && !aName.startsWith(search)) return 1

        // Alphabetical order as fallback
        return aName.localeCompare(bName)
      })

      setUserSearchResults(sorted.slice(0, 10)) // Limit to 10 results
      setShowUserDropdown(true)
    } else {
      setUserSearchResults([])
      setShowUserDropdown(false)
    }
  }

  const selectUser = (user: User) => {
    setCreateFormData(prev => ({ ...prev, userId: user._id }))
    setUserSearchTerm(`${user.name} (${user.email})`)
    setShowUserDropdown(false)
    setUserSearchResults([])
    // Clear any userId validation errors
    if (createFormErrors.userId) {
      setCreateFormErrors(prev => ({ ...prev, userId: '' }))
    }
  }

  // Helper function to highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-green-600 text-white font-semibold px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  const validateObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!createFormData.paymentId.trim()) {
      errors.paymentId = 'Transaction ID is required';
    }

    if (!createFormData.userId.trim()) {
      errors.userId = 'User ID is required';
    } else if (!validateObjectId(createFormData.userId)) {
      errors.userId = 'User ID must be a valid 24-character ObjectId';
    }

    if (!createFormData.originalAmount.trim()) {
      errors.originalAmount = 'Original amount is required';
    } else {
      const amount = parseFloat(createFormData.originalAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.originalAmount = 'Original amount must be a positive number';
      }
    }

    if (!createFormData.refundAmount.trim()) {
      errors.refundAmount = 'Refund amount is required';
    } else {
      const amount = parseFloat(createFormData.refundAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.refundAmount = 'Refund amount must be a positive number';
      } else if (parseFloat(createFormData.originalAmount) > 0 && amount > parseFloat(createFormData.originalAmount)) {
        errors.refundAmount = 'Refund amount cannot exceed original amount';
      }
    }

    if (!createFormData.notes.trim()) {
      errors.notes = 'Notes are required';
    }

    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleCreateRefund = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreateFormErrors({});

      // If paymentId looks like a transaction ID (not a 24-char ObjectId), look up the actual payment
      let actualPaymentId = createFormData.paymentId;
      if (!validateObjectId(createFormData.paymentId)) {
        // It's a transaction ID, find the payment
        const allPayments = await getPayments();
        const payment = allPayments.find((p: Payment) => p.transactionId === createFormData.paymentId);
        if (!payment) {
          setCreateFormErrors({ paymentId: 'No payment found with this transaction ID' });
          return;
        }
        actualPaymentId = payment._id;
      }

      const refundData = {
        paymentId: actualPaymentId,
        userId: createFormData.userId,
        refundAmount: parseFloat(createFormData.refundAmount),
        originalAmount: parseFloat(createFormData.originalAmount),
        notes: createFormData.notes
      }

      await createRefund(refundData)

      // Reset form and close modal
      setCreateFormData({
        paymentId: '',
        userId: '',
        refundAmount: '',
        originalAmount: '',
        notes: ''
      })
      setUserSearchTerm('')
      setUserSearchResults([])
      setShowUserDropdown(false)
      setIsCreateModalOpen(false)

      // Refresh refunds list
      const updatedRefunds = await getRefunds()
      setRefunds(updatedRefunds)
    } catch (error: unknown) {
      console.error('Error creating refund:', error)
      
      // Handle API validation errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        setCreateFormErrors({ general: 'Invalid data provided. Please check all fields and try again.' });
      } else {
        setCreateFormErrors({ general: 'Failed to create refund. Please try again.' });
      }
    }
  }

  // Edit form validation
  const validateEditForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!editFormData.paymentId.trim()) {
      errors.paymentId = 'Payment ID is required';
    } else if (!validateObjectId(editFormData.paymentId)) {
      errors.paymentId = 'Payment ID must be a valid 24-character ObjectId';
    }

    if (!editFormData.userId.trim()) {
      errors.userId = 'User ID is required';
    } else if (!validateObjectId(editFormData.userId)) {
      errors.userId = 'User ID must be a valid 24-character ObjectId';
    }

    if (!editFormData.originalAmount.trim()) {
      errors.originalAmount = 'Original amount is required';
    } else {
      const amount = parseFloat(editFormData.originalAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.originalAmount = 'Original amount must be a positive number';
      }
    }

    if (!editFormData.refundAmount.trim()) {
      errors.refundAmount = 'Refund amount is required';
    } else {
      const amount = parseFloat(editFormData.refundAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.refundAmount = 'Refund amount must be a positive number';
      } else if (parseFloat(editFormData.originalAmount) > 0 && amount > parseFloat(editFormData.originalAmount)) {
        errors.refundAmount = 'Refund amount cannot exceed original amount';
      }
    }

    if (!editFormData.notes.trim()) {
      errors.notes = 'Notes are required';
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleEditRefund = async () => {
    if (!validateEditForm() || !editingRefund) {
      return;
    }

    try {
      const refundData = {
        paymentId: editFormData.paymentId,
        userId: editFormData.userId,
        refundAmount: parseFloat(editFormData.refundAmount),
        originalAmount: parseFloat(editFormData.originalAmount),
        status: editFormData.status,
        notes: editFormData.notes
      }

      await updateRefund(editingRefund._id, refundData)

      // Reset form and close modal
      setEditFormData({
        paymentId: '',
        userId: '',
        refundAmount: '',
        originalAmount: '',
        notes: '',
        status: '' as 'pending' | 'completed' | 'failed'
      })
      setIsEditModalOpen(false)
      setEditingRefund(null)

      // Refresh refunds list
      const updatedRefunds = await getRefunds()
      setRefunds(updatedRefunds)
    } catch (error: unknown) {
      console.error('Error updating refund:', error)
      
      // Handle API validation errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        setEditFormErrors({ general: 'Invalid data provided. Please check all fields and try again.' });
      } else {
        setEditFormErrors({ general: 'Failed to update refund. Please try again.' });
      }
    }
  }

  const handleGenerateReport = async () => {
    try {
      const reportBlob = await generateRefundsReport()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(reportBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Zfit_Refund_${new Date().toISOString().split('T')[0]}.pdf`
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
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/dashboard/finance/refund/requests')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Refund Requests
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Refund Management</h2>
            <p className="text-muted-foreground">
              Process and track refund requests from your members.
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
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
            placeholder="Search by refund ID, user ID, notes, or status..."
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Refund Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests Queue</CardTitle>
          <CardDescription>
            {filteredRefunds.length} refund{filteredRefunds.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading refunds...
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
                <TableHead>Refund ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Refund Amount</TableHead>
                <TableHead>Original Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.length > 0 ? (
                filteredRefunds.map((refund) => (
                  <TableRow key={refund._id}>
                    <TableCell className="font-medium">{refund.refundId}</TableCell>
                    <TableCell>{refund.userId}</TableCell>
                    <TableCell>LKR {refund.refundAmount.toFixed(2)}</TableCell>
                    <TableCell>LKR {refund.originalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(refund.status)}
                        {getStatusBadge(refund.status)}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(refund.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewRefund(refund)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {refund.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleProcessRefund(refund, 'approve')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleProcessRefund(refund, 'deny')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Deny
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRefund(refund)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteRefund(refund)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No refund requests found. Refunds will appear here when requested.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Refund Processing Modal */}
      <Dialog open={isProcessingModalOpen} onOpenChange={setIsProcessingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {processingAction === 'approve' && 'Approve Refund'}
              {processingAction === 'deny' && 'Deny Refund'}
              {processingAction === 'partial' && 'Process Partial Refund'}
            </DialogTitle>
            <DialogDescription>
              {selectedRefund && (
                <>Processing refund request for <strong>{selectedRefund.refundId}</strong> - LKR {selectedRefund.refundAmount.toFixed(2)}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {processingAction === 'partial' && (
              <div className="space-y-2">
                <Label htmlFor="partial-amount">Refund Amount</Label>
                <Input
                  id="partial-amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter partial refund amount"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Original amount: LKR {selectedRefund?.originalAmount?.toFixed(2)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="processing-notes">Processing Notes</Label>
              <Textarea
                id="processing-notes"
                placeholder="Add notes about this refund decision..."
                value={processingNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProcessingNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsProcessingModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmProcessing}>
                {processingAction === 'approve' && 'Approve Refund'}
                {processingAction === 'deny' && 'Deny Refund'}
                {processingAction === 'partial' && 'Process Partial Refund'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Refund Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Refund Request
            </DialogTitle>
            <DialogDescription className="text-base">
              Create a new refund request for a member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* General Error Message */}
            {createFormErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{createFormErrors.general}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="refund-payment-id" className="text-sm font-medium">
                  Payment ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="refund-payment-id"
                  placeholder="Enter transaction ID"
                  value={createFormData.paymentId}
                  onChange={(e) => {
                    setCreateFormData(prev => ({ ...prev, paymentId: e.target.value }));
                    if (createFormErrors.paymentId) {
                      setCreateFormErrors(prev => ({ ...prev, paymentId: '' }));
                    }
                  }}
                  className={`transition-colors ${createFormErrors.paymentId ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                />
                {createFormErrors.paymentId && (
                  <p className="text-sm text-red-600">{createFormErrors.paymentId}</p>
                )}
              </div>
            <div className="space-y-2">
              <Label htmlFor="refund-user">Search User *</Label>
              <div className="relative">
                <Input
                  id="refund-user"
                  placeholder="Search by name, email, or ID"
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  onFocus={() => {
                    if (userSearchResults.length > 0) {
                      setShowUserDropdown(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding dropdown to allow click on items
                    setTimeout(() => setShowUserDropdown(false), 200)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowUserDropdown(false)
                      setUserSearchResults([])
                    }
                  }}
                  className={`transition-all duration-200 ${
                    createFormErrors.userId
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-green-500 focus:ring-green-200 hover:border-green-400'
                  }`}
                />
                {showUserDropdown && userSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="p-1">
                      {userSearchResults.map((user, index) => (
                        <div
                          key={user._id}
                          className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors rounded-sm border-b border-border last:border-b-0"
                          onClick={() => selectUser(user)}
                        >
                          <div className="flex items-center space-x-3">
                            {/* User Avatar/Initials */}
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {highlightText(user.name, userSearchTerm)}
                                </p>
                                <Badge
                                  variant={user.role === 'member' ? 'default' : user.role === 'staff' ? 'secondary' : 'outline'}
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {user.role}
                                </Badge>
                                <Badge
                                  variant={user.status === 'active' ? 'default' : user.status === 'inactive' ? 'secondary' : 'destructive'}
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {user.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {highlightText(user.email, userSearchTerm)}
                              </p>
                              {user.contactNo && (
                                <p className="text-xs text-muted-foreground truncate">
                                  📞 {highlightText(user.contactNo, userSearchTerm)}
                                </p>
                              )}
                            </div>

                            {/* User ID */}
                            <div className="flex-shrink-0 text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                              {user._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer with result count */}
                    <div className="px-3 py-2 bg-muted border-t border-border rounded-b-md">
                      <p className="text-xs text-muted-foreground font-medium text-center">
                        {userSearchResults.length} user{userSearchResults.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                  </div>
                )}

                {/* No results message */}
                {showUserDropdown && userSearchTerm.trim().length > 0 && userSearchResults.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-black border-2 border-red-400 rounded-xl shadow-2xl">
                    <div className="px-4 py-6 text-center">
                      <div className="text-red-400 mb-2">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-red-400">No users found</p>
                      <p className="text-xs text-red-500 mt-1">Try a different search term</p>
                    </div>
                  </div>
                )}
              </div>
              {createFormErrors.userId && (
                <p className="text-sm text-red-600">{createFormErrors.userId}</p>
              )}
            </div>
              <div className="space-y-2">
                <Label htmlFor="create-original-amount" className="text-sm font-medium">
                  Original Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-original-amount"
                  type="number"
                  step="0.01"
                  placeholder="25000"
                  value={createFormData.originalAmount}
                  onChange={(e) => {
                    setCreateFormData(prev => ({ ...prev, originalAmount: e.target.value }));
                    if (createFormErrors.originalAmount) {
                      setCreateFormErrors(prev => ({ ...prev, originalAmount: '' }));
                    }
                  }}
                  className={`transition-colors ${createFormErrors.originalAmount ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                />
                {createFormErrors.originalAmount && (
                  <p className="text-sm text-red-600">{createFormErrors.originalAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-refund-amount" className="text-sm font-medium">
                  Refund Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-refund-amount"
                  type="number"
                  step="0.01"
                  placeholder="12500"
                  value={createFormData.refundAmount}
                  onChange={(e) => {
                    setCreateFormData(prev => ({ ...prev, refundAmount: e.target.value }));
                    if (createFormErrors.refundAmount) {
                      setCreateFormErrors(prev => ({ ...prev, refundAmount: '' }));
                    }
                  }}
                  className={`transition-colors ${createFormErrors.refundAmount ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                />
                {createFormErrors.refundAmount && (
                  <p className="text-sm text-red-600">{createFormErrors.refundAmount}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-notes" className="text-sm font-medium">
                Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="create-notes"
                placeholder="Customer accidentally charged twice for premium membership upgrade"
                rows={3}
                value={createFormData.notes}
                onChange={(e) => {
                  setCreateFormData(prev => ({ ...prev, notes: e.target.value }));
                  if (createFormErrors.notes) {
                    setCreateFormErrors(prev => ({ ...prev, notes: '' }));
                  }
                }}
                className={`transition-colors resize-none ${createFormErrors.notes ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
              />
              {createFormErrors.notes && (
                <p className="text-sm text-red-600">{createFormErrors.notes}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRefund}
              className="px-6"
            >
              Create Refund Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Refund Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Refund Request
            </DialogTitle>
            <DialogDescription className="text-base font-mono bg-muted px-3 py-2 rounded-md">
              Update refund details for {editingRefund?.refundId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* General Error Message */}
            {editFormErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{editFormErrors.general}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-payment-id" className="text-sm font-medium">
                  Payment ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-payment-id"
                  placeholder="Enter payment ID"
                  value={editFormData.paymentId}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, paymentId: e.target.value }));
                    if (editFormErrors.paymentId) {
                      setEditFormErrors(prev => ({ ...prev, paymentId: '' }));
                    }
                  }}
                  className={`transition-colors ${editFormErrors.paymentId ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                />
                {editFormErrors.paymentId && (
                  <p className="text-sm text-red-600">{editFormErrors.paymentId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-id" className="text-sm font-medium">
                  User ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-user-id"
                  placeholder="Enter user ID"
                  value={editFormData.userId}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, userId: e.target.value }));
                    if (editFormErrors.userId) {
                      setEditFormErrors(prev => ({ ...prev, userId: '' }));
                    }
                  }}
                  className={`transition-colors ${editFormErrors.userId ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                />
                {editFormErrors.userId && (
                  <p className="text-sm text-red-600">{editFormErrors.userId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-original-amount" className="text-sm font-medium">
                  Original Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-original-amount"
                  type="number"
                  step="0.01"
                  placeholder="25000"
                  value={editFormData.originalAmount}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, originalAmount: e.target.value }));
                    if (editFormErrors.originalAmount) {
                      setEditFormErrors(prev => ({ ...prev, originalAmount: '' }));
                    }
                  }}
                  className={`transition-colors ${editFormErrors.originalAmount ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                />
                {editFormErrors.originalAmount && (
                  <p className="text-sm text-red-600">{editFormErrors.originalAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-refund-amount" className="text-sm font-medium">
                  Refund Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-refund-amount"
                  type="number"
                  step="0.01"
                  placeholder="12500"
                  value={editFormData.refundAmount}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, refundAmount: e.target.value }));
                    if (editFormErrors.refundAmount) {
                      setEditFormErrors(prev => ({ ...prev, refundAmount: '' }));
                    }
                  }}
                  className={`transition-colors ${editFormErrors.refundAmount ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
                />
                {editFormErrors.refundAmount && (
                  <p className="text-sm text-red-600">{editFormErrors.refundAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-sm font-medium">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value: 'pending' | 'completed' | 'failed') => {
                    setEditFormData(prev => ({ ...prev, status: value }));
                    if (editFormErrors.status) {
                      setEditFormErrors(prev => ({ ...prev, status: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={`transition-colors ${editFormErrors.status ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                {editFormErrors.status && (
                  <p className="text-sm text-red-600">{editFormErrors.status}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-sm font-medium">
                Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-notes"
                placeholder="Customer accidentally charged twice for premium membership upgrade"
                rows={3}
                value={editFormData.notes}
                onChange={(e) => {
                  setEditFormData(prev => ({ ...prev, notes: e.target.value }));
                  if (editFormErrors.notes) {
                    setEditFormErrors(prev => ({ ...prev, notes: '' }));
                  }
                }}
                className={`transition-colors resize-none ${editFormErrors.notes ? 'border-red-500 focus:border-red-500' : 'focus:border-green-500'}`}
              />
              {editFormErrors.notes && (
                <p className="text-sm text-red-600">{editFormErrors.notes}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditRefund}
              disabled={editingRefund?.status === 'failed' || editingRefund?.status === 'completed'}
              className="px-6"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Refund Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
            <DialogDescription>
              View detailed information about this refund request.
            </DialogDescription>
          </DialogHeader>
          {viewingRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Refund ID</Label>
                  <p className="text-sm text-muted-foreground">{viewingRefund.refundId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(viewingRefund.status)}
                    {getStatusBadge(viewingRefund.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User ID</Label>
                  <p className="text-sm text-muted-foreground">{viewingRefund.userId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment ID</Label>
                  <p className="text-sm text-muted-foreground">{viewingRefund.paymentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Refund Amount</Label>
                  <p className="text-sm text-muted-foreground">LKR {viewingRefund.refundAmount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Original Amount</Label>
                  <p className="text-sm text-muted-foreground">LKR {viewingRefund.originalAmount.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{viewingRefund.notes}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created Date</Label>
                  <p className="text-sm text-muted-foreground">{new Date(viewingRefund.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Updated Date</Label>
                  <p className="text-sm text-muted-foreground">{new Date(viewingRefund.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
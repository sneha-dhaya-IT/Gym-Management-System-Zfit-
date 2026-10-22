"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle, XCircle, Eye, Loader2, AlertCircle, Mail, Phone, CreditCard, MoreHorizontal, Search, RefreshCw, Trash2 } from "lucide-react"
import { getPendingBankTransfers, approveBankTransfer, declineBankTransfer, deleteBankTransfer, type BankTransferAdmin } from "@/lib/api/paymentApi"

export default function BankTransfersPage() {
  const router = useRouter()
  const [transfers, setTransfers] = useState<BankTransferAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<BankTransferAdmin | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [actionType, setActionType] = useState<'approve' | 'decline' | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [membershipFilter, setMembershipFilter] = useState("all")

  useEffect(() => {
    fetchPendingTransfers()
  }, [])

  const fetchPendingTransfers = async () => {
    try {
      setLoading(true)
      const response = await getPendingBankTransfers()
      setTransfers(response.payments)
    } catch (error) {
      console.error('Error fetching pending transfers:', error)
      alert('Failed to load pending bank transfers')
    } finally {
      setLoading(false)
    }
  }

  // Get unique membership names for filter
  const membershipOptions = Array.from(
    new Set(
      transfers
        .map(transfer => transfer.membershipId?.name)
        .filter((name): name is string => name !== undefined)
    )
  ).sort()

  // Filter transfers based on search and filters
  const filteredTransfers = transfers.filter(transfer => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      transfer.userId?.name?.toLowerCase().includes(searchLower) ||
      transfer.userId?.email?.toLowerCase().includes(searchLower) ||
      transfer.membershipId?.name?.toLowerCase().includes(searchLower) ||
      transfer._id?.toLowerCase().includes(searchLower) ||
      transfer.notes?.toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter
    const matchesMembership = membershipFilter === "all" || transfer.membershipId?.name === membershipFilter
    
    return matchesSearch && matchesStatus && matchesMembership
  })

  const handleAction = async (transfer: BankTransferAdmin, action: 'approve' | 'decline') => {
    setSelectedTransfer(transfer)
    setActionType(action)
    setAdminNotes("")
    setDialogOpen(true)
  }

  const handleViewUserDetails = (transfer: BankTransferAdmin) => {
    setSelectedTransfer(transfer)
    setShowUserModal(true)
  }

  const handleViewPaymentHistory = (transfer: BankTransferAdmin) => {
    if (transfer.userId?._id) {
      // Store userId in sessionStorage to avoid showing in URL
      sessionStorage.setItem('paymentHistoryUserId', transfer.userId._id)
      router.push('/dashboard/finance/overview/payment-history')
    }
  }

  const handleDeleteTransfer = async (transfer: BankTransferAdmin) => {
    if (!confirm(`Are you sure you want to delete this bank transfer from ${transfer.userId?.name || 'Unknown User'}? This action cannot be undone.`)) {
      return
    }

    try {
      setProcessing(transfer._id)
      const result = await deleteBankTransfer(transfer._id)
      
      // Show success message
      alert(`Success: ${result.message}`)
      
      // Remove from list
      setTransfers(prev => prev.filter(t => t._id !== transfer._id))
    } catch (error) {
      console.error('Error deleting transfer:', error)
      alert(`Error: Failed to delete bank transfer`)
    } finally {
      setProcessing(null)
    }
  }

  const confirmAction = async () => {
    if (!selectedTransfer || !actionType) return

    try {
      setProcessing(selectedTransfer._id)

      const actionFunction = actionType === 'approve' ? approveBankTransfer : declineBankTransfer
      const result = await actionFunction(selectedTransfer._id, { adminNotes: adminNotes.trim() || undefined })

      // Show success message
      alert(`Success: ${result.message}`)

      if (actionType === 'approve') {
        // Navigate to payment management table after approval
        router.push('/dashboard/finance/overview')
        return
      }

      // For decline, just remove from list
      setTransfers(prev => prev.filter(t => t._id !== selectedTransfer._id))
      setDialogOpen(false)
      setSelectedTransfer(null)
      setActionType(null)
    } catch (error) {
      console.error(`Error ${actionType}ing transfer:`, error)
      alert(`Error: Failed to ${actionType} bank transfer`)
    } finally {
      setProcessing(null)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency === 'LKR' ? 'LKR' : 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bank Transfer Management</h1>
        <p className="text-muted-foreground">
          Review and manage pending bank transfer payments from members
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, membership, or notes..."
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
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Select value={membershipFilter} onValueChange={setMembershipFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Membership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Memberships</SelectItem>
            {membershipOptions.map(membership => (
              <SelectItem key={membership} value={membership}>
                {membership}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
       
         
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Bank Transfers</CardTitle>
          <CardDescription>
            {filteredTransfers.length} pending transfer{filteredTransfers.length !== 1 ? 's' : ''} requiring approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No transfers found</h3>
              <p className="text-muted-foreground">
                {transfers.length === 0 
                  ? "All bank transfers have been processed"
                  : "No transfers match your search criteria"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Membership Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transfer.userId?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transfer.userId?.email || 'No email'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transfer.membershipId?.name || 'Unknown Plan'}</div>
                        <div className="text-sm text-muted-foreground">
                          {transfer.membershipId ? formatCurrency(transfer.membershipId.price, transfer.currency) : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(transfer.amount, transfer.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(transfer.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`http://localhost:5000${transfer.receiptImageUrl}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">
                        {transfer.notes ? (
                          <span title={transfer.notes}>{transfer.notes}</span>
                        ) : (
                          <span className="text-muted-foreground">No notes</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleAction(transfer, 'approve')}
                          disabled={processing === transfer._id}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {processing === transfer._id && actionType === 'approve' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(transfer, 'decline')}
                          disabled={processing === transfer._id}
                        >
                          {processing === transfer._id && actionType === 'decline' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Decline
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewUserDetails(transfer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPaymentHistory(transfer)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Payment History
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTransfer(transfer)}
                              disabled={processing === transfer._id}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Transfer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Decline'} Bank Transfer
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Are you sure you want to approve this bank transfer payment?'
                : 'Are you sure you want to decline this bank transfer payment?'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Member</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTransfer.userId?.name || 'Unknown User'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedTransfer.amount, selectedTransfer.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTransfer.membershipId?.name || 'Unknown Plan'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedTransfer.createdAt)}
                  </p>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div>
                  <Label className="text-sm font-medium">Member Notes</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {selectedTransfer.notes}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="admin-notes" className="text-sm font-medium">
                  Admin Notes (Optional)
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processing !== null}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionType === 'approve' ? 'Approve' : 'Decline'} Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="text-xl">User Details</DialogTitle>
            <DialogDescription className="text-base">
              Customer information for bank transfer payment
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && selectedTransfer.userId && (
            <div className="flex-1 min-h-0 space-y-6">
              {/* User Information Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  User Information
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                    <p className="text-sm font-medium">{selectedTransfer.userId.name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Role</label>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {selectedTransfer.userId.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <div>
                      <Badge variant={selectedTransfer.userId.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {selectedTransfer.userId.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{selectedTransfer.userId.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Contact Number</label>
                      <p className="text-sm">{selectedTransfer.userId.contactNo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Payment Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Amount</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedTransfer.amount, selectedTransfer.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Membership Plan</label>
                    <p className="text-sm">{selectedTransfer.membershipId?.name || 'Unknown Plan'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Transaction ID</label>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {selectedTransfer.transferId || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

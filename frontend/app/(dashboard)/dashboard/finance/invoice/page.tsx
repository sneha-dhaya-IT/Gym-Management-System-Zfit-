"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  RefreshCw,
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
  DropdownMenuSeparator,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, type Invoice, type InvoiceItem, type CreateInvoiceData, type UpdateInvoiceData } from "@/lib/api/invoiceApi"
import { generateInvoicesReport } from "@/lib/api/reportApi"

const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "overdue":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case "sent":
      return <Mail className="h-4 w-4 text-blue-600" />
    case "draft":
      return <FileText className="h-4 w-4 text-gray-600" />
    default:
      return <XCircle className="h-4 w-4 text-gray-600" />
  }
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    paid: "default",
    pending: "secondary",
    overdue: "destructive",
    sent: "outline",
    draft: "outline",
  }
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

export default function InvoiceManagementPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [createFormErrors, setCreateFormErrors] = useState<{[key: string]: string}>({})
  const [editFormErrors, setEditFormErrors] = useState<{[key: string]: string}>({})
  const [paymentValidationLoading, setPaymentValidationLoading] = useState(false)

  // Function to validate payment ID exists
  const validatePaymentId = async (paymentId: string): Promise<boolean> => {
    if (!paymentId.trim()) return false

    try {
      setPaymentValidationLoading(true)
      // Make a request to check if payment exists
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/payments?transactionId=${encodeURIComponent(paymentId)}`)
      if (!response.ok) return false

      const data = await response.json()
      return data.success && data.data && data.data.length > 0
    } catch (error) {
      console.error('Error validating payment ID:', error)
      return false
    } finally {
      setPaymentValidationLoading(false)
    }
  }

  // Form data states
  const [createFormData, setCreateFormData] = useState({
    paymentId: '',
    subtotal: '',
    tax: '',
    discount: '',
    total: '',
    dueDate: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue',
    generatedAt: new Date().toISOString().split('T')[0]
  })

  const [editFormData, setEditFormData] = useState({
    paymentId: '',
    subtotal: '',
    tax: '',
    discount: '',
    total: '',
    dueDate: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue',
    generatedAt: ''
  })

  // Fetch invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const data = await getInvoices()
        setInvoices(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch invoices:', err)
        setError('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const filteredInvoices = invoices
    .filter(invoice => invoice !== null && invoice !== undefined) // Filter out null/undefined invoices
    .filter(invoice => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = invoice.number?.toLowerCase().includes(searchLower) ||
                           invoice.status?.toLowerCase().includes(searchLower)
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
      return matchesSearch && matchesStatus
    })

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setEditFormData({
      paymentId: invoice.paymentId && typeof invoice.paymentId === 'object' ? invoice.paymentId._id : (invoice.paymentId || ''),
      subtotal: invoice.subtotal.toString(),
      tax: invoice.tax.toString(),
      discount: invoice.discount.toString(),
      total: invoice.total.toString(),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      status: invoice.status,
      generatedAt: new Date(invoice.generatedAt).toISOString().split('T')[0]
    })
    setEditFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice)
    setIsViewModalOpen(true)
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.number}?`)) return

    try {
      await deleteInvoice(invoice._id)
      setInvoices(invoices.filter(inv => inv._id !== invoice._id))
    } catch (error) {
      console.error('Error deleting invoice:', error)
      setError('Failed to delete invoice')
    }
  }

  const handleCreateInvoice = () => {
    setCreateFormData({
      paymentId: '',
      subtotal: '',
      tax: '',
      discount: '',
      total: '',
      dueDate: '',
      status: 'draft',
      generatedAt: new Date().toISOString().split('T')[0]
    })
    setCreateFormErrors({})
    setIsCreateModalOpen(true)
  }

  const validateCreateForm = async (): Promise<boolean> => {
    const errors: {[key: string]: string} = {}

    if (!createFormData.paymentId.trim()) {
      errors.paymentId = 'Payment ID is required'
    } else {
      // Validate that payment exists
      const paymentExists = await validatePaymentId(createFormData.paymentId)
      if (!paymentExists) {
        errors.paymentId = 'Payment ID not found. Please enter a valid transaction ID.'
      }
    }

    if (!createFormData.subtotal.trim()) {
      errors.subtotal = 'Subtotal is required'
    } else {
      const subtotal = parseFloat(createFormData.subtotal)
      if (isNaN(subtotal) || subtotal < 0) {
        errors.subtotal = 'Subtotal must be a positive number'
      }
    }

    if (!createFormData.tax.trim()) {
      errors.tax = 'Tax is required'
    } else {
      const tax = parseFloat(createFormData.tax)
      if (isNaN(tax) || tax < 0) {
        errors.tax = 'Tax must be a non-negative number'
      }
    }

    if (!createFormData.total.trim()) {
      errors.total = 'Total is required'
    } else {
      const total = parseFloat(createFormData.total)
      if (isNaN(total) || total < 0) {
        errors.total = 'Total must be a positive number'
      } else {
        // Validate that total equals subtotal + tax - discount
        const expectedTotal = (parseFloat(createFormData.subtotal) || 0) +
                             (parseFloat(createFormData.tax) || 0) -
                             (parseFloat(createFormData.discount) || 0)
        if (Math.abs(total - expectedTotal) > 0.01) { // Allow for small floating point differences
          errors.total = `Total should be ${expectedTotal.toFixed(2)} (subtotal + tax - discount)`
        }
      }
    }

    setCreateFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSubmit = async () => {
    const isValid = await validateCreateForm()
    if (!isValid) return

    try {
      const invoiceData: CreateInvoiceData = {
        paymentId: createFormData.paymentId,
        subtotal: parseFloat(createFormData.subtotal),
        tax: parseFloat(createFormData.tax) || 0,
        discount: parseFloat(createFormData.discount) || 0,
        total: parseFloat(createFormData.total),
        dueDate: createFormData.dueDate || undefined,
        status: createFormData.status,
        generatedAt: createFormData.generatedAt
      }

      await createInvoice(invoiceData)
      setIsCreateModalOpen(false)

      // Refresh invoices
      const updatedInvoices = await getInvoices()
      setInvoices(updatedInvoices)
    } catch (error) {
      console.error('Error creating invoice:', error)
      setCreateFormErrors({ general: 'Failed to create invoice' })
    }
  }

  const validateEditForm = async (): Promise<boolean> => {
    const errors: {[key: string]: string} = {}

    if (!editFormData.paymentId.trim()) {
      errors.paymentId = 'Payment ID is required'
    } else {
      // Validate that payment exists
      const paymentExists = await validatePaymentId(editFormData.paymentId)
      if (!paymentExists) {
        errors.paymentId = 'Payment ID not found. Please enter a valid transaction ID.'
      }
    }

    if (!editFormData.subtotal.trim()) {
      errors.subtotal = 'Subtotal is required'
    } else {
      const subtotal = parseFloat(editFormData.subtotal)
      if (isNaN(subtotal) || subtotal < 0) {
        errors.subtotal = 'Subtotal must be a positive number'
      }
    }

    if (!editFormData.tax.trim()) {
      errors.tax = 'Tax is required'
    } else {
      const tax = parseFloat(editFormData.tax)
      if (isNaN(tax) || tax < 0) {
        errors.tax = 'Tax must be a non-negative number'
      }
    }

    if (!editFormData.total.trim()) {
      errors.total = 'Total is required'
    } else {
      const total = parseFloat(editFormData.total)
      if (isNaN(total) || total < 0) {
        errors.total = 'Total must be a positive number'
      } else {
        // Validate that total equals subtotal + tax - discount
        const expectedTotal = (parseFloat(editFormData.subtotal) || 0) +
                             (parseFloat(editFormData.tax) || 0) -
                             (parseFloat(editFormData.discount) || 0)
        if (Math.abs(total - expectedTotal) > 0.01) { // Allow for small floating point differences
          errors.total = `Total should be ${expectedTotal.toFixed(2)} (subtotal + tax - discount)`
        }
      }
    }

    setEditFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEditSubmit = async () => {
    const isValid = await validateEditForm()
    if (!isValid || !editingInvoice) return

    try {
      const invoiceData: UpdateInvoiceData = {
        paymentId: editFormData.paymentId,
        subtotal: parseFloat(editFormData.subtotal),
        tax: parseFloat(editFormData.tax) || 0,
        discount: parseFloat(editFormData.discount) || 0,
        total: parseFloat(editFormData.total),
        dueDate: editFormData.dueDate || undefined,
        status: editFormData.status,
        generatedAt: editFormData.generatedAt
      }

      await updateInvoice(editingInvoice._id, invoiceData)
      setIsEditModalOpen(false)
      setEditingInvoice(null)

      // Refresh invoices
      const updatedInvoices = await getInvoices()
      setInvoices(updatedInvoices)
    } catch (error) {
      console.error('Error updating invoice:', error)
      setEditFormErrors({ general: 'Failed to update invoice' })
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
      const response = await fetch(`/api/v1/reports/invoices/pdf?${filterParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Generate filename based on whether filters are applied
      const hasFilters = searchTerm || (statusFilter && statusFilter !== 'all')
      const filename = hasFilters 
        ? `ZFit_Invoices_Report_Filtered_${new Date().toISOString().split('T')[0]}.pdf`
        : `ZFit_Invoices_Report_${new Date().toISOString().split('T')[0]}.pdf`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate report')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
            <p className="text-muted-foreground">Create, manage, and track invoices for your members.</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading invoices...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Invoice Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and track invoices for your members.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateInvoice}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
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
            placeholder="Search by invoice number or status..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Invoices
          </CardTitle>
          <CardDescription>
            View and manage all invoices
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
                <TableHead>Invoice Number</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>
                      {invoice.paymentId && typeof invoice.paymentId === 'object' && invoice.paymentId.transactionId 
                        ? invoice.paymentId.transactionId 
                        : (typeof invoice.paymentId === 'string' ? invoice.paymentId : 'Payment Not Found')}
                    </TableCell>
                    <TableCell>LKR {invoice.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invoice.status)}
                        {getStatusBadge(invoice.status)}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice)}
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
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <Button onClick={handleCreateInvoice}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a payment.
            </DialogDescription>
          </DialogHeader>

          {/* Invoice Details Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {createFormErrors.general && (
                <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{createFormErrors.general}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="create-payment-id">Payment ID (Transaction ID) *</Label>
                <div className="relative">
                  <Input
                    id="create-payment-id"
                    placeholder="Enter payment transaction ID"
                    value={createFormData.paymentId}
                    onChange={(e) => {
                      setCreateFormData(prev => ({ ...prev, paymentId: e.target.value }))
                      if (createFormErrors.paymentId) {
                        setCreateFormErrors(prev => ({ ...prev, paymentId: '' }))
                      }
                    }}
                    className={createFormErrors.paymentId ? 'border-red-500 pr-8' : 'pr-8'}
                    disabled={paymentValidationLoading}
                  />
                  {paymentValidationLoading && (
                    <div className="absolute right-2 top-2.5">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {createFormErrors.paymentId && (
                  <p className="text-sm text-red-600">{createFormErrors.paymentId}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter the transaction ID from a completed payment
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-generated-at">Generated Date *</Label>
                <Input
                  id="create-generated-at"
                  type="date"
                  value={createFormData.generatedAt}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, generatedAt: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-subtotal">Subtotal (LKR) *</Label>
                <Input
                  id="create-subtotal"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={createFormData.subtotal}
                  onChange={(e) => {
                    const subtotal = Number(e.target.value) || 0
                    const tax = Number(createFormData.tax) || 0
                    const discount = Number(createFormData.discount) || 0
                    const total = subtotal + tax - discount
                    setCreateFormData(prev => ({
                      ...prev,
                      subtotal: e.target.value,
                      total: total.toString()
                    }))
                    if (createFormErrors.subtotal) {
                      setCreateFormErrors(prev => ({ ...prev, subtotal: '' }))
                    }
                  }}
                  className={createFormErrors.subtotal ? 'border-red-500' : ''}
                />
                {createFormErrors.subtotal && (
                  <p className="text-sm text-red-600">{createFormErrors.subtotal}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-tax">Tax (LKR) *</Label>
                <Input
                  id="create-tax"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={createFormData.tax}
                  onChange={(e) => {
                    const tax = Number(e.target.value) || 0
                    const subtotal = Number(createFormData.subtotal) || 0
                    const discount = Number(createFormData.discount) || 0
                    const total = subtotal + tax - discount
                    setCreateFormData(prev => ({
                      ...prev,
                      tax: e.target.value,
                      total: total.toString()
                    }))
                    if (createFormErrors.tax) {
                      setCreateFormErrors(prev => ({ ...prev, tax: '' }))
                    }
                  }}
                  className={createFormErrors.tax ? 'border-red-500' : ''}
                />
                {createFormErrors.tax && (
                  <p className="text-sm text-red-600">{createFormErrors.tax}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-discount">Discount (LKR)</Label>
                <Input
                  id="create-discount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={createFormData.discount}
                  onChange={(e) => {
                    const discount = Number(e.target.value) || 0
                    const subtotal = Number(createFormData.subtotal) || 0
                    const tax = Number(createFormData.tax) || 0
                    const total = subtotal + tax - discount
                    setCreateFormData(prev => ({
                      ...prev,
                      discount: e.target.value,
                      total: total.toString()
                    }))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-total">Total (LKR) *</Label>
                <Input
                  id="create-total"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={createFormData.total}
                  readOnly
                  className="font-semibold"
                />
                {createFormErrors.total && (
                  <p className="text-sm text-red-600">{createFormErrors.total}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-due-date">Due Date</Label>
                <Input
                  id="create-due-date"
                  type="date"
                  value={createFormData.dueDate}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-status">Status *</Label>
                <Select
                  value={createFormData.status}
                  onValueChange={(value: 'draft' | 'sent' | 'paid' | 'overdue') =>
                    setCreateFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit}>
              Create Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update invoice details for {editingInvoice?.number}
            </DialogDescription>
          </DialogHeader>

          {/* Invoice Details Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {editFormErrors.general && (
                <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{editFormErrors.general}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-payment-id">Payment ID *</Label>
                <Input
                  id="edit-payment-id"
                  placeholder="Enter payment transaction ID"
                  value={editFormData.paymentId}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, paymentId: e.target.value }))
                    if (editFormErrors.paymentId) {
                      setEditFormErrors(prev => ({ ...prev, paymentId: '' }))
                    }
                  }}
                  className={editFormErrors.paymentId ? 'border-red-500' : ''}
                />
                {editFormErrors.paymentId && (
                  <p className="text-sm text-red-600">{editFormErrors.paymentId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-generated-at">Generated Date *</Label>
                <Input
                  id="edit-generated-at"
                  type="date"
                  value={editFormData.generatedAt}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, generatedAt: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-subtotal">Subtotal (LKR) *</Label>
                <Input
                  id="edit-subtotal"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.subtotal}
                  onChange={(e) => {
                    const subtotal = Number(e.target.value) || 0
                    const tax = Number(editFormData.tax) || 0
                    const discount = Number(editFormData.discount) || 0
                    const total = subtotal + tax - discount
                    setEditFormData(prev => ({
                      ...prev,
                      subtotal: e.target.value,
                      total: total.toString()
                    }))
                    if (editFormErrors.subtotal) {
                      setEditFormErrors(prev => ({ ...prev, subtotal: '' }))
                    }
                  }}
                  className={editFormErrors.subtotal ? 'border-red-500' : ''}
                />
                {editFormErrors.subtotal && (
                  <p className="text-sm text-red-600">{editFormErrors.subtotal}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tax">Tax (LKR) *</Label>
                <Input
                  id="edit-tax"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.tax}
                  onChange={(e) => {
                    const tax = Number(e.target.value) || 0
                    const subtotal = Number(editFormData.subtotal) || 0
                    const discount = Number(editFormData.discount) || 0
                    const total = subtotal + tax - discount
                    setEditFormData(prev => ({
                      ...prev,
                      tax: e.target.value,
                      total: total.toString()
                    }))
                    if (editFormErrors.tax) {
                      setEditFormErrors(prev => ({ ...prev, tax: '' }))
                    }
                  }}
                  className={editFormErrors.tax ? 'border-red-500' : ''}
                />
                {editFormErrors.tax && (
                  <p className="text-sm text-red-600">{editFormErrors.tax}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-discount">Discount (LKR)</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.discount}
                  onChange={(e) => {
                    const discount = Number(e.target.value) || 0
                    const subtotal = Number(editFormData.subtotal) || 0
                    const tax = Number(editFormData.tax) || 0
                    const total = subtotal + tax - discount
                    setEditFormData(prev => ({
                      ...prev,
                      discount: e.target.value,
                      total: total.toString()
                    }))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-total">Total (LKR) *</Label>
                <Input
                  id="edit-total"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.total}
                  readOnly
                  className="font-semibold"
                />
                {editFormErrors.total && (
                  <p className="text-sm text-red-600">{editFormErrors.total}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value: 'draft' | 'sent' | 'paid' | 'overdue') =>
                    setEditFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Invoice</DialogTitle>
            <DialogDescription>
              Invoice details and information
            </DialogDescription>
          </DialogHeader>
          
          {viewingInvoice && (
            <div className="space-y-6">
              {/* User Details Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.userId && typeof viewingInvoice.userId === 'object' ? viewingInvoice.userId.name : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.userId && typeof viewingInvoice.userId === 'object' ? viewingInvoice.userId.email : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Number</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.userId && typeof viewingInvoice.userId === 'object' && viewingInvoice.userId.contactNo 
                        ? viewingInvoice.userId.contactNo 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer ID</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.userId && typeof viewingInvoice.userId === 'object' ? viewingInvoice.userId._id : (viewingInvoice.userId || 'N/A')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Transaction ID</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.paymentId && typeof viewingInvoice.paymentId === 'object' ? viewingInvoice.paymentId.transactionId : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.paymentId && typeof viewingInvoice.paymentId === 'object' ? viewingInvoice.paymentId.method : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Type</label>
                    <p className="text-sm text-muted-foreground">
                      {typeof viewingInvoice.paymentId === 'object' ? viewingInvoice.paymentId.type : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Status</label>
                    <p className="text-sm text-muted-foreground">
                      {typeof viewingInvoice.paymentId === 'object' ? viewingInvoice.paymentId.status : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Amount</label>
                    <p className="text-sm text-muted-foreground">
                      {typeof viewingInvoice.paymentId === 'object' 
                        ? `LKR ${viewingInvoice.paymentId.amount.toFixed(2)}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Date</label>
                    <p className="text-sm text-muted-foreground">
                      {typeof viewingInvoice.paymentId === 'object' 
                        ? new Date(viewingInvoice.paymentId.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice Details Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Invoice Number</label>
                    <p className="text-sm text-muted-foreground">{viewingInvoice.number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment ID</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.paymentId && typeof viewingInvoice.paymentId === 'object' ? viewingInvoice.paymentId._id : (viewingInvoice.paymentId || 'N/A')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(viewingInvoice.status)}
                      {getStatusBadge(viewingInvoice.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Generated Date</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingInvoice.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due Date</label>
                    <p className="text-sm text-muted-foreground">
                      {viewingInvoice.dueDate ? new Date(viewingInvoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created Date</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(viewingInvoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Invoice Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>LKR {viewingInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>LKR {viewingInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>LKR {viewingInvoice.discount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total:</span>
                    <span>LKR {viewingInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Calendar as CalendarIcon, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { transactionApiService, type Transaction, type TransactionHistory } from '@/lib/api/transactionApi'

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, selectedReason, selectedType, startDate, endDate])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const filters: any = {
        page: currentPage,
        limit: 20
      }

      if (selectedReason) filters.reason = selectedReason
      if (selectedType) filters.transactionType = selectedType
      if (startDate) filters.startDate = startDate.toISOString()
      if (endDate) filters.endDate = endDate.toISOString()

      const response = await transactionApiService.getTransactionHistory(filters)
      const data = response.data as TransactionHistory

      setTransactions(data.transactions)
      setTotalCount(data.totalCount)
      setCurrentPage(data.currentPage)
      setTotalPages(data.totalPages)
      setError('')
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }

  const getReasonBadgeColor = (reason: string) => {
    const colors = {
      SALE: 'bg-green-100 text-green-800',
      PURCHASE: 'bg-blue-100 text-blue-800',
      ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
      RETURN: 'bg-purple-100 text-purple-800',
      DAMAGE: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    }
    return colors[reason as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTransactionIcon = (type: 'IN' | 'OUT') => {
    return type === 'IN' ? (
      <ArrowUpCircle className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownCircle className="h-4 w-4 text-red-600" />
    )
  }

  const clearFilters = () => {
    setSelectedReason('')
    setSelectedType('')
    setStartDate(undefined)
    setEndDate(undefined)
    setSearchTerm('')
    setCurrentPage(1)
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
            <p className="text-muted-foreground">View all inventory transactions and movements</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p>Loading transactions...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-muted-foreground">
            View all inventory transactions and movements ({totalCount} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Items</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by item name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="IN">Stock In</SelectItem>
                  <SelectItem value="OUT">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All reasons</SelectItem>
                  <SelectItem value="SALE">Sale</SelectItem>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="DAMAGE">Damage</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                    placeholder="Start date"
                  />
                </div>
                
                <div className="flex-1">
                  <Input
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={fetchTransactions} disabled={loading}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Showing {transactions.length} of {totalCount} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Stock Change</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(transaction.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.itemId.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transactionType)}
                        <span className={`text-sm font-medium ${
                          transaction.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transactionType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge className={getReasonBadgeColor(transaction.reason)}>
                        {transaction.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{transaction.previousStock} → {transaction.newStock}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {transaction.performedBy.firstName} {transaction.performedBy.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.performedBy.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.notes || '-'}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
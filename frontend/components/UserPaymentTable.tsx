"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import {
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { getPaymentsByUserId, type Payment } from '@/lib/api/paymentApi'

interface UserPaymentTableProps {
  userId: string
  userName: string
}

export function UserPaymentTable({ userId, userName }: UserPaymentTableProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getPaymentsByUserId(userId)

      if (response.success && response.data) {
        setPayments(response.data)
        setTotalPages(Math.ceil(response.data.length / itemsPerPage))
      } else {
        setError(response.error || 'Failed to fetch payment history')
      }
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError('Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }, [userId, itemsPerPage])

  useEffect(() => {
    if (userId) {
      fetchPayments()
    }
  }, [userId, fetchPayments])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'refunded':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'bank-transfer':
        return <DollarSign className="h-4 w-4" />
      case 'cash':
        return <DollarSign className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'membership':
        return 'Membership'
      case 'inventory':
        return 'Inventory'
      case 'booking':
        return 'Booking'
      case 'other':
        return 'Other'
      default:
        return type
    }
  }

  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Payment records for {userName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading payment history...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Payment records for {userName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Payments</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchPayments} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>
          Payment records for {userName} ({payments.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
            <p className="text-muted-foreground">
              {userName} has no payment records yet.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(payment.date).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(payment.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.method)}
                          <span className="capitalize">{payment.method.replace('-', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.transactionId || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
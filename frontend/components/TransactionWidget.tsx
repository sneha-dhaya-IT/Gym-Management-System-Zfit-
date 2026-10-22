"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Activity,
  Clock,
  User,
  Package,
  TrendingUp,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { transactionApiService, type Transaction } from '@/lib/api/transactionApi'

interface TransactionSummary {
  todayTransactions: number
  todayStockIn: number
  todayStockOut: number
  recentTransactions: Transaction[]
}

export default function TransactionWidget() {
  const [summary, setSummary] = useState<TransactionSummary>({
    todayTransactions: 0,
    todayStockIn: 0,
    todayStockOut: 0,
    recentTransactions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransactionSummary()
  }, [])

  const fetchTransactionSummary = async () => {
    try {
      setLoading(true)

      // Get today's date range
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

      // Fetch recent transactions
      const response = await transactionApiService.getTransactionHistory({
        startDate: startOfToday.toISOString(),
        endDate: endOfToday.toISOString(),
        limit: 5,
        page: 1
      })

      const transactions = response.data?.transactions || []
      
      // Calculate today's summary
      const todayStockIn = transactions
        .filter(t => t.transactionType === 'IN')
        .reduce((sum, t) => sum + t.quantity, 0)
      
      const todayStockOut = transactions
        .filter(t => t.transactionType === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0)

      setSummary({
        todayTransactions: transactions.length,
        todayStockIn,
        todayStockOut,
        recentTransactions: transactions.slice(0, 5)
      })
      
      setError('')
    } catch (error) {
      console.error('Failed to fetch transaction summary:', error)
      setError('Failed to load transaction data')
      
      // Fallback data for development
      setSummary({
        todayTransactions: 12,
        todayStockIn: 150,
        todayStockOut: 89,
        recentTransactions: [
          {
            _id: '1',
            itemId: { _id: '1', name: 'Whey Protein', categoryID: 'cat1' },
            transactionType: 'OUT' as const,
            quantity: 5,
            reason: 'SALE',
            previousStock: 45,
            newStock: 40,
            performedBy: { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@gym.com' },
            notes: 'Member purchase',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: '2',
            itemId: { _id: '2', name: 'Creatine', categoryID: 'cat1' },
            transactionType: 'IN' as const,
            quantity: 20,
            reason: 'PURCHASE',
            previousStock: 30,
            newStock: 50,
            performedBy: { _id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@gym.com' },
            notes: 'Stock replenishment',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const getReasonBadgeColor = (reason: string) => {
    const colors = {
      SALE: 'bg-green-100 text-green-800 border-green-200',
      PURCHASE: 'bg-blue-100 text-blue-800 border-blue-200',
      ADJUSTMENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      RETURN: 'bg-purple-100 text-purple-800 border-purple-200',
      DAMAGE: 'bg-red-100 text-red-800 border-red-200',
      EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[reason as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getTransactionIcon = (type: 'IN' | 'OUT') => {
    return type === 'IN' ? (
      <ArrowUpCircle className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownCircle className="h-4 w-4 text-red-600" />
    )
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transaction Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transaction Activity
            </CardTitle>
            <CardDescription>Today's inventory movements</CardDescription>
          </div>
          <Link href="/dashboard/inventory/transactions">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Today's Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{summary.todayTransactions}</div>
            <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
              <Activity className="h-3 w-3" />
              Transactions
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">+{summary.todayStockIn}</div>
            <div className="text-xs text-green-700 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Stock In
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">-{summary.todayStockOut}</div>
            <div className="text-xs text-red-700 flex items-center justify-center gap-1">
              <ArrowDownCircle className="h-3 w-3" />
              Stock Out
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Recent Transactions</h4>
          
          {summary.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {summary.recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transactionType)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.itemId.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <User className="h-3 w-3" />
                        {transaction.performedBy.firstName} {transaction.performedBy.lastName}
                        <Clock className="h-3 w-3 ml-1" />
                        {formatTimeAgo(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        transaction.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transactionType === 'IN' ? '+' : '-'}{transaction.quantity}
                      </span>
                      <Badge 
                        variant="outline"
                        className={getReasonBadgeColor(transaction.reason)}
                      >
                        {transaction.reason}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: {transaction.previousStock} → {transaction.newStock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No transactions today</p>
              <p className="text-xs text-gray-500">Inventory activity will appear here</p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
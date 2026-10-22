"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Package, Download, AlertTriangle } from 'lucide-react'
import { itemApiService } from '@/lib/api/itemApi'
import { format } from 'date-fns'

const handleGenerateReport = async () => {
  try {
    const response = await fetch('/api/reports/stock-levels', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to generate report')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `stock-levels-report-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Failed to generate report')
  }
}

interface StockItem {
  _id: string
  name: string
  categoryID: {
    _id: string
    name: string
    description?: string
  } | string
  supplierID: {
    _id: string
    supplierName: string
    supplierEmail: string
    supplierPhone: string
  } | string
  type: "sellable" | "equipment"
  isActive: boolean
  
  // Sellable fields
  price?: number
  stock?: number
  expiryDate?: string
  lowStockAlert?: number
  
  // Equipment fields
  purchaseDate?: string
  maintenanceSchedule?: string
  warrantyPeriod?: string
  
  createdAt: string
  updatedAt: string
}

export default function StockManagementPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')


  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const itemsResponse = await itemApiService.getItems()
      setItems(itemsResponse.data as StockItem[])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  // Filter items based on search term - only sellable items have stock
  const sellableItems = items.filter(item => item.type === 'sellable')
  
  const filteredItems = sellableItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    const categoryName = typeof item.categoryID === 'string' ? item.categoryID : item.categoryID.name
    const supplierName = typeof item.supplierID === 'string' ? item.supplierID : item.supplierID?.supplierName || ''
    
    return (
      item.name.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower) ||
      supplierName.toLowerCase().includes(searchLower)
    )
  })

  // Helper functions
  const getCategoryName = (categoryID: any) => {
    if (typeof categoryID === 'string') return categoryID
    return categoryID?.name || 'Unknown Category'
  }

  const getSupplierName = (supplierID: any) => {
    if (typeof supplierID === 'string') return 'Supplier ID: ' + supplierID.slice(-4)
    return supplierID?.supplierName || 'No Supplier'
  }

  const getStockStatus = (stock: number, lowStockAlert?: number) => {
    if (stock === 0) return { status: 'out-of-stock', color: 'destructive', label: 'Out of Stock' }
    if (lowStockAlert && stock <= lowStockAlert) return { status: 'low-stock', color: 'warning', label: 'Low Stock' }
    return { status: 'in-stock', color: 'success', label: 'In Stock' }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'Invalid Date'
    }
  }

  const handleGenerateReport = async () => {
    try {
      // Build query parameters based on current filters
      const queryParams = new URLSearchParams()
      
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm)
      }
      
      // You can add more filter parameters here as needed
      // if (categoryFilter) queryParams.append('categoryId', categoryFilter)
      // if (lowStockOnly) queryParams.append('lowStockOnly', 'true')
      
      const url = `http://localhost:5000/api/v1/reports/stock-levels/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Failed to generate report')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Include filter info in filename if filters are applied
      const filterSuffix = searchTerm ? `-filtered` : ''
      link.download = `stock-levels-report${filterSuffix}-${new Date().toISOString().split('T')[0]}.pdf`
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate stock levels report')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Stock Management</h2>
            <p className="text-muted-foreground">Manage inventory stock levels and maintenance</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading stock data...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Stock Management</h2>
          <p className="text-muted-foreground">Monitor and manage inventory stock levels</p>
        </div>
        <Button variant="outline" onClick={handleGenerateReport}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stock items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Stock Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Levels
          </CardTitle>
          <CardDescription>
            Monitor stock levels, alerts, and inventory status for sellable items
          </CardDescription>
        </CardHeader>
        <CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Low Stock Alert</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item.stock || 0, item.lowStockAlert)
                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryName(item.categoryID)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {getSupplierName(item.supplierID)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.stock || 0}</span>
                        {stockStatus.status === 'low-stock' && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {item.lowStockAlert || 'Not set'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        LKR {item.price?.toFixed(2) || '0.00'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={stockStatus.color === 'destructive' ? 'destructive' : 
                               stockStatus.color === 'warning' ? 'secondary' : 'default'}
                        className={
                          stockStatus.color === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                          stockStatus.color === 'warning' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''
                        }
                      >
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {formatDate(item.expiryDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredItems.length === 0 && sellableItems.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No stock items found matching your search</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          )}

          {sellableItems.length === 0 && items.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sellable items found</p>
              <p className="text-sm">Only sellable items are shown in stock management</p>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items found</p>
              <p className="text-sm">Stock items will appear here once sellable items are created</p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  )
}
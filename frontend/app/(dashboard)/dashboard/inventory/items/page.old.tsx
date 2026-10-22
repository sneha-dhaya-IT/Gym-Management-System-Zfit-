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
import { Plus, Edit, Trash2, Package2, Search, FileText } from 'lucide-react'
import { itemApiService } from '@/lib/api/itemApi'
import { supplierApiService } from '@/lib/api/supplierApi'
import { categoryApiService } from '@/lib/api/categoryApi'
import { generateInvoicesReport } from '@/lib/api/reportApi'
import type { ItemData } from '@/lib/api/itemApi'
import type { Category } from '@/lib/api/categoryApi'
import { ItemFormModal, ItemFormData, UpdateItemFormData } from '@/components/ItemFormModal'

interface Item {
  _id: string
  itemName: string
  itemDescription: string
  categoryID: {
    _id: string
    name: string
  } | string // Can be populated or just ID
  quantity: number
  price?: number
  supplierID: {
    _id: string
    supplierName: string
  } | null
  lowStockThreshold: number
  maintenanceStatus: "good" | "maintenance_required" | "under_repair"
  lastMaintenanceDate?: string
  createdAt: string
  updatedAt?: string
}

interface Supplier {
  _id: string
  supplierName: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    Promise.all([
      fetchItems(),
      fetchSuppliers(),
      fetchCategories()
    ])
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await itemApiService.getItems()
      // Filter out items with invalid data to prevent errors
      const validItems = (response.data as Item[]).filter(item => 
        item && item._id && item.itemName
      )
      setItems(validItems)
    } catch (error) {
      console.error('Error fetching items:', error)
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }



  const fetchSuppliers = async () => {
    try {
      console.log('Fetching suppliers...')
      const response = await supplierApiService.getSuppliers()
      console.log('Suppliers response:', response)
      setSuppliers(response.data as Supplier[])
      console.log('Suppliers set:', response.data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...')
      const response = await categoryApiService.getCategories()
      console.log('Categories response:', response)
      setCategories(response.data as Category[])
      console.log('Categories set:', response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddItem = () => {
    console.log('Add item clicked. Suppliers available:', suppliers.length, 'Categories available:', categories.length)
    if (suppliers.length === 0) {
      setError('Please create at least one supplier before adding items')
      return
    }
    if (categories.length === 0) {
      setError('Please create at least one category before adding items')
      return
    }
    setEditingItem(null)
    setModalOpen(true)
  }

  const handleCreateInvoice = () => {
    // TODO: Implement invoice creation functionality
    alert('Invoice creation functionality will be implemented here')
  }

  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await itemApiService.deleteItem(itemId)
      setItems(items.filter(item => item._id !== itemId))
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Failed to delete item')
    }
  }

  const handleModalSubmit = async (formData: ItemFormData | UpdateItemFormData) => {
    try {
      console.log('Submitting form data:', formData)
      console.log('Form data JSON:', JSON.stringify(formData, null, 2))
      console.log('Editing item:', editingItem)
      
      if (editingItem) {
        // Update existing item
        console.log('Updating item with ID:', editingItem._id)
        await itemApiService.updateItem(editingItem._id, formData)
      } else {
        // Create new item
        console.log('Creating new item')
        console.log('Sending to API:', JSON.stringify(formData, null, 2))
        const response = await itemApiService.createItem(formData as ItemData)
        console.log('Create item response:', response)
      }
      fetchItems() // Refresh the list
    } catch (error) {
      console.error('Error saving item:', error)
      console.error('Full error details:', error)
      setError(`Failed to save item: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  const getMaintenanceStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'good':
        return 'default'
      case 'maintenance_required':
        return 'secondary'
      case 'under_repair':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getMaintenanceStatusLabel = (status: string) => {
    switch (status) {
      case 'good':
        return 'Good'
      case 'maintenance_required':
        return 'Maintenance Required'
      case 'under_repair':
        return 'Under Repair'
      default:
        return status
    }
  }

  const isLowStock = (quantity: number, threshold: number) => {
    return quantity <= threshold
  }

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    const supplierName = item.supplierID?.supplierName || ''
    const categoryName = typeof item.categoryID === 'object' 
      ? item.categoryID.name 
      : item.categoryID || ''
    
    return (
      item.itemName.toLowerCase().includes(searchLower) ||
      item.itemDescription.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower) ||
      supplierName.toLowerCase().includes(searchLower) ||
      item.maintenanceStatus.toLowerCase().includes(searchLower)
    )
  })

  const handleGenerateReport = async () => {
    try {
      const response = await fetch('/api/v1/reports/inventory-items/pdf')
      if (!response.ok) throw new Error('Failed to generate report')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'inventory-items-report.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate report')
    }
  }

  const handleGenerateInvoiceReport = async () => {
    try {
      const blob = await generateInvoicesReport()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'invoices-report.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating invoice report:', error)
      setError('Failed to generate invoice report')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Items</h2>
            <p className="text-muted-foreground">Manage inventory items</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading items...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Items</h2>
          <p className="text-muted-foreground">Manage inventory items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={handleCreateInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
          <Button variant="outline" onClick={handleGenerateInvoiceReport}>
            <FileText className="h-4 w-4 mr-2" />
            Invoice Report
          </Button>
          <Button onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            All Items
          </CardTitle>
          <CardDescription>
            View and manage all inventory items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{item.itemName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.itemDescription}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {typeof item.categoryID === 'object' 
                      ? item.categoryID.name 
                      : item.categoryID || 'No Category'}
                  </TableCell>
                  <TableCell>
                    {item.supplierID && typeof item.supplierID === 'object' 
                      ? item.supplierID.supplierName 
                      : item.supplierID || 'No Supplier'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{item.quantity}</span>
                      {isLowStock(item.quantity, item.lowStockThreshold) && (
                        <Badge variant="destructive" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>LKR {item.price ? item.price.toFixed(2) : '0.00'}</TableCell>
                  <TableCell>
                    <Badge variant={getMaintenanceStatusBadgeVariant(item.maintenanceStatus)}>
                      {getMaintenanceStatusLabel(item.maintenanceStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredItems.length === 0 && items.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items found matching your search</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items found</p>
              <p className="text-sm">Add your first item to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ItemFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        suppliers={suppliers}
        categories={categories}
        initialData={editingItem ? {
          itemName: editingItem.itemName,
          itemDescription: editingItem.itemDescription,
          categoryID: typeof editingItem.categoryID === 'object' 
            ? editingItem.categoryID._id 
            : editingItem.categoryID || '',
          quantity: editingItem.quantity,
          price: editingItem.price,
          supplierID: editingItem.supplierID && typeof editingItem.supplierID === 'object' 
            ? editingItem.supplierID._id 
            : editingItem.supplierID || '',
          lowStockThreshold: editingItem.lowStockThreshold,
          maintenanceStatus: editingItem.maintenanceStatus,
          lastMaintenanceDate: editingItem.lastMaintenanceDate,
        } : undefined}
        mode={editingItem ? 'edit' : 'add'}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
      />
    </div>
  )
}
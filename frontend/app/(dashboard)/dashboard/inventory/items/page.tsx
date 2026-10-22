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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Package, Search, ShoppingCart, Settings, Calendar, Download } from 'lucide-react'
import { itemApiService, type Item } from '@/lib/api/itemApi'
import { categoryApiService, type Category } from '@/lib/api/categoryApi'
import { ItemFormModal, type ItemFormData, type UpdateItemFormData } from '@/components/ItemFormModal'
import { format } from 'date-fns'

export default function ItemsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, activeTab, searchTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch categories and items in parallel
      const [categoriesResponse, itemsResponse] = await Promise.all([
        categoryApiService.getCategories(),
        itemApiService.getItems()
      ])
      
      setCategories(categoriesResponse.data as Category[])
      setItems(itemsResponse.data as Item[])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = items

    // Filter by tab selection
    if (activeTab === 'sellable') {
      filtered = filtered.filter(item => item.type === 'sellable')
    } else if (activeTab === 'equipment') {
      filtered = filtered.filter(item => item.type === 'equipment')
    } else if (activeTab !== 'all') {
      // Filter by specific category
      filtered = filtered.filter(item => {
        const categoryId = typeof item.categoryID === 'string' 
          ? item.categoryID 
          : item.categoryID?._id || ''
        return categoryId === activeTab
      })
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredItems(filtered)
  }

  const handleAddItem = () => {
    setEditingItem(null)
    setModalOpen(true)
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
      setError('') // Clear any previous errors
    } catch (error: any) {
      console.error('Error deleting item:', error)
      
      let errorMessage = 'Failed to delete item'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    }
  }

  const handleModalSubmit = async (formData: ItemFormData | UpdateItemFormData) => {
    try {
      if (editingItem) {
        // Update existing item
        await itemApiService.updateItem(editingItem._id, formData)
      } else {
        // Create new item
        await itemApiService.createItem(formData as ItemFormData)
      }
      fetchData() // Refresh the list
      setModalOpen(false)
      setError('') // Clear any previous errors
    } catch (error: any) {
      console.error('Error saving item:', error)
      
      let errorMessage = 'Failed to save item'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      throw new Error(errorMessage) // Re-throw to be handled by the modal
    }
  }

  const getCategoryName = (categoryID: any) => {
    if (typeof categoryID === 'string') {
      const category = categories.find(cat => cat._id === categoryID)
      return category?.name || 'Unknown Category'
    }
    return categoryID.name || 'Unknown Category'
  }

  const getSupplierName = (supplierID: any) => {
    if (typeof supplierID === 'string') {
      // For now, return the ID since we don't have suppliers loaded in this component
      return 'Supplier ID: ' + supplierID.slice(-4)
    }
    return supplierID?.supplierName || 'Unknown Supplier'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'Invalid Date'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'sellable' ? (
      <ShoppingCart className="h-4 w-4" />
    ) : (
      <Settings className="h-4 w-4" />
    )
  }

  const isLowStock = (item: Item) => {
    if (item.type !== 'sellable') return false
    const currentStock = item.stock || 0
    const alertThreshold = item.lowStockAlert || 0
    return currentStock <= alertThreshold && alertThreshold > 0
  }

  const getTypeColor = (type: string) => {
    return type === 'sellable' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  }

  const handleGenerateReport = async () => {
    try {
      // Build query parameters based on current filters
      const queryParams = new URLSearchParams()
      
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm)
      }
      
      if (activeTab !== 'all') {
        if (activeTab === 'sellable' || activeTab === 'equipment') {
          queryParams.append('type', activeTab)
        } else {
          // It's a category ID
          queryParams.append('categoryId', activeTab)
        }
      }
      
      const url = `http://localhost:5000/api/v1/reports/inventory-items/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Failed to generate report')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Include filter info in filename if filters are applied
      const filterSuffix = (searchTerm || activeTab !== 'all') ? '-filtered' : ''
      link.download = `inventory-items-report${filterSuffix}-${new Date().toISOString().split('T')[0]}.pdf`
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate inventory items report')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Items</h2>
            <p className="text-muted-foreground">Manage your inventory items</p>
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
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Items</h2>
            {(() => {
              const lowStockCount = filteredItems.filter(item => isLowStock(item)).length;
              return lowStockCount > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  {lowStockCount} Low Stock
                </Badge>
              ) : null;
            })()}
          </div>
          <p className="text-muted-foreground">Manage your gym inventory items</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
          <Button onClick={handleGenerateReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
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

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full overflow-x-auto gap-1">
          <TabsTrigger value="all" className="flex items-center gap-2 whitespace-nowrap">
            <Package className="h-4 w-4" />
            All Items ({items.length})
          </TabsTrigger>
          <TabsTrigger value="sellable" className="flex items-center gap-2 whitespace-nowrap">
            <ShoppingCart className="h-4 w-4" />
            Sellable Items ({items.filter(item => item.type === 'sellable').length})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2 whitespace-nowrap">
            <Settings className="h-4 w-4" />
            Equipment ({items.filter(item => item.type === 'equipment').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'all' && <Package className="h-5 w-5" />}
                {activeTab === 'sellable' && <ShoppingCart className="h-5 w-5" />}
                {activeTab === 'equipment' && <Settings className="h-5 w-5" />}
                {activeTab !== 'all' && activeTab !== 'sellable' && activeTab !== 'equipment' && <Package className="h-5 w-5" />}
                {activeTab === 'all' 
                  ? 'All Items'
                  : activeTab === 'sellable'
                  ? 'Sellable Items'
                  : activeTab === 'equipment'
                  ? 'Equipment Items'
                  : categories.find(cat => cat._id === activeTab)?.name + ' Items'
                }
              </CardTitle>
              <CardDescription>
                {activeTab === 'all' 
                  ? 'View and manage all inventory items across all categories and types'
                  : activeTab === 'sellable'
                  ? 'Items that can be sold to customers (supplements, accessories, etc.)'
                  : activeTab === 'equipment'
                  ? 'Gym equipment and machines for facility use'
                  : `Items in the ${categories.find(cat => cat._id === activeTab)?.name} category`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Low Stock Legend */}
              {filteredItems.some(item => isLowStock(item)) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <span className="font-medium">🔴 Low Stock Alert:</span>
                    <span>Red highlighted items are at or below their stock alert threshold and need restocking.</span>
                  </div>
                </div>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Supplier</TableHead>
                      
                      {/* Sellable Items specific columns */}
                      {activeTab === 'sellable' && (
                        <>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Low Stock Alert</TableHead>
                          <TableHead>Expiry Date</TableHead>
                        </>
                      )}
                      
                      {/* Equipment specific columns */}
                      {activeTab === 'equipment' && (
                        <>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Maintenance</TableHead>
                          <TableHead>Warranty</TableHead>
                        </>
                      )}
                      
                      {/* All items and category tabs - show type and general details */}
                      {(activeTab === 'all' || categories.some(cat => cat._id === activeTab)) && (
                        <>
                          <TableHead>Type</TableHead>
                          <TableHead>Details</TableHead>
                        </>
                      )}
                      
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item._id} className={isLowStock(item) ? 'bg-red-50 border-red-200' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className={`font-medium ${isLowStock(item) ? 'text-red-700' : ''}`}>
                              {item.name}
                              {isLowStock(item) && <span className="ml-2 text-red-600">🔴</span>}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={isLowStock(item) ? "destructive" : "outline"}>
                            {getCategoryName(item.categoryID)}
                            {isLowStock(item) && <span className="ml-1">⚠️</span>}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-muted-foreground">
                            {getSupplierName(item.supplierID)}
                          </span>
                        </TableCell>
                        
                        {/* Sellable Items specific columns */}
                        {activeTab === 'sellable' && (
                          <>
                            <TableCell>
                              <span className="font-medium">LKR {item.price?.toFixed(2) || '0.00'}</span>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${isLowStock(item) ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : ''}`}>
                                {item.stock || 0}
                                {isLowStock(item) && <span className="ml-1 text-xs">⚠️ LOW</span>}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">{item.lowStockAlert || 'Not set'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">
                                {item.expiryDate ? formatDate(item.expiryDate) : 'No expiry'}
                              </span>
                            </TableCell>
                          </>
                        )}
                        
                        {/* Equipment specific columns */}
                        {activeTab === 'equipment' && (
                          <>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="font-medium">{formatDate(item.purchaseDate)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">
                                {item.maintenanceSchedule || 'Not scheduled'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">
                                {item.warrantyPeriod || 'No warranty'}
                              </span>
                            </TableCell>
                          </>
                        )}
                        
                        {/* All items and category tabs - show type and general details */}
                        {(activeTab === 'all' || categories.some(cat => cat._id === activeTab)) && (
                          <>
                            <TableCell>
                              <Badge className={getTypeColor(item.type)}>
                                {item.type === 'sellable' ? 'Sellable' : 'Equipment'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.type === 'sellable' ? (
                                <div className="text-sm">
                                  <div className="font-medium">LKR {item.price?.toFixed(2) || '0.00'}</div>
                                  <div className={`text-muted-foreground ${isLowStock(item) ? 'text-red-600 font-medium' : ''}`}>
                                  Stock: {item.stock || 0}
                                  {isLowStock(item) && <span className="ml-1 text-xs">⚠️ LOW</span>}
                                </div>
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <div className="font-medium">
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    {formatDate(item.purchaseDate)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {item.maintenanceSchedule || 'No maintenance'}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </>
                        )}
                        
                        <TableCell>
                          <span className="text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem(item._id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    {searchTerm ? (
                      <>
                        <p>No items found matching "{searchTerm}"</p>
                        <p className="text-sm">Try adjusting your search terms</p>
                      </>
                    ) : activeTab === 'all' ? (
                      <>
                        <p>No items found</p>
                        <p className="text-sm">Add your first item to get started</p>
                      </>
                    ) : activeTab === 'sellable' ? (
                      <>
                        <p>No sellable items found</p>
                        <p className="text-sm">Add sellable items like supplements or accessories</p>
                      </>
                    ) : activeTab === 'equipment' ? (
                      <>
                        <p>No equipment found</p>
                        <p className="text-sm">Add gym equipment and machines</p>
                      </>
                    ) : (
                      <>
                        <p>No items in this category</p>
                        <p className="text-sm">Add items to this category to see them here</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Form Modal */}
      <ItemFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingItem ? {
          name: editingItem.name,
          categoryID: typeof editingItem.categoryID === 'string' 
            ? editingItem.categoryID 
            : editingItem.categoryID?._id || '',
          supplierID: typeof editingItem.supplierID === 'string' 
            ? editingItem.supplierID 
            : editingItem.supplierID?._id || '',
          type: editingItem.type,
          price: editingItem.price,
          stock: editingItem.stock,
          expiryDate: editingItem.expiryDate ? new Date(editingItem.expiryDate).toISOString().split('T')[0] : '',
          lowStockAlert: editingItem.lowStockAlert,
          purchaseDate: editingItem.purchaseDate ? new Date(editingItem.purchaseDate).toISOString().split('T')[0] : '',
          maintenanceSchedule: editingItem.maintenanceSchedule,
          warrantyPeriod: editingItem.warrantyPeriod,
        } : undefined}
        mode={editingItem ? 'edit' : 'add'}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
      />
    </div>
  )
}
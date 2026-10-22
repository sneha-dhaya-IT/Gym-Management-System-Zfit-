"use client"

import { useState, useEffect } from 'react'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ShoppingCart, Settings, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryApiService, type Category } from '@/lib/api/categoryApi'
import { supplierApiService } from '@/lib/api/supplierApi'
import type { ItemData } from '@/lib/api/itemApi'

interface Supplier {
  _id: string
  supplierName: string
  supplierEmail: string
  supplierPhone: string
  supplierAddress: string
}

// Validation schemas
const itemFormSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Name cannot exceed 100 characters'),
  categoryID: z.string().min(1, 'Category is required'),
  supplierID: z.string().min(1, 'Supplier is required'),
  type: z.enum(['sellable', 'equipment']),
  
  // Sellable fields
  price: z.number().min(0, 'Price cannot be negative').optional(),
  stock: z.number().min(0, 'Stock cannot be negative').optional(),
  expiryDate: z.string().optional(),
  lowStockAlert: z.number().min(1, 'Low stock alert must be at least 1').optional(),
  
  // Equipment fields
  purchaseDate: z.string().optional(),
  maintenanceSchedule: z.string().max(200, 'Maintenance schedule cannot exceed 200 characters').optional(),
  warrantyPeriod: z.string().max(100, 'Warranty period cannot exceed 100 characters').optional(),
}).refine((data) => {
  if (data.type === 'sellable') {
    return typeof data.price === 'number' && typeof data.stock === 'number'
  }
  return true
}, {
  message: 'Price and stock are required for sellable items',
  path: ['price']
}).refine((data) => {
  if (data.type === 'equipment') {
    return !!data.purchaseDate
  }
  return true
}, {
  message: 'Purchase date is required for equipment',
  path: ['purchaseDate']
})

export interface ItemFormData {
  name: string
  categoryID: string
  supplierID: string
  type: "sellable" | "equipment"
  price?: number
  stock?: number
  expiryDate?: string
  lowStockAlert?: number
  purchaseDate?: string
  maintenanceSchedule?: string
  warrantyPeriod?: string
}

export interface UpdateItemFormData extends Partial<ItemFormData> {
  supplierID?: string
}

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ItemFormData | UpdateItemFormData) => Promise<void>
  initialData?: UpdateItemFormData
  mode: 'add' | 'edit'
  title: string
}

export function ItemFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  title
}: ItemFormModalProps) {
  const [step, setStep] = useState<'type' | 'details'>(mode === 'edit' ? 'details' : 'type')
  const [selectedType, setSelectedType] = useState<"sellable" | "equipment" | undefined>(
    initialData?.type || undefined
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [formData, setFormData] = useState<ItemFormData>(() => {
    if (mode === 'edit' && initialData) {
      return {
        name: initialData.name || '',
        categoryID: initialData.categoryID || '',
        supplierID: initialData.supplierID || '',
        type: initialData.type || 'sellable',
        price: initialData.price,
        stock: initialData.stock,
        expiryDate: initialData.expiryDate || '',
        lowStockAlert: initialData.lowStockAlert,
        purchaseDate: initialData.purchaseDate || '',
        maintenanceSchedule: initialData.maintenanceSchedule || '',
        warrantyPeriod: initialData.warrantyPeriod || '',
      }
    }
    return {
      name: '',
      categoryID: '',
      supplierID: '',
      type: 'sellable',
      price: undefined,
      stock: undefined,
      expiryDate: '',
      lowStockAlert: undefined,
      purchaseDate: '',
      maintenanceSchedule: '',
      warrantyPeriod: '',
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch categories and suppliers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          categoryApiService.getCategories(),
          supplierApiService.getSuppliers()
        ])
        setCategories(categoriesResponse.data as Category[])
        setSuppliers(suppliersResponse.data as Supplier[])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened - Mode:', mode, 'InitialData:', initialData)
      setStep(mode === 'edit' ? 'details' : 'type')
      setSelectedType(initialData?.type || undefined)
      setErrors({})
      
      if (mode === 'add') {
        setFormData({
          name: '',
          categoryID: '',
          supplierID: '',
          type: 'sellable',
          price: undefined,
          stock: undefined,
          expiryDate: '',
          lowStockAlert: undefined,
          purchaseDate: '',
          maintenanceSchedule: '',
          warrantyPeriod: '',
        })
      } else {
        setFormData({
          name: initialData?.name || '',
          categoryID: initialData?.categoryID || '',
          supplierID: initialData?.supplierID || '',
          type: initialData?.type || 'sellable',
          price: initialData?.price,
          stock: initialData?.stock,
          expiryDate: initialData?.expiryDate || '',
          lowStockAlert: initialData?.lowStockAlert,
          purchaseDate: initialData?.purchaseDate || '',
          maintenanceSchedule: initialData?.maintenanceSchedule || '',
          warrantyPeriod: initialData?.warrantyPeriod || '',
        })
      }
    } else {
      // Reset when modal closes
      setStep('type')
      setSelectedType(undefined)
      setErrors({})
      setFormData({
        name: '',
        categoryID: '',
        supplierID: '',
        type: 'sellable',
        price: undefined,
        stock: undefined,
        expiryDate: '',
        lowStockAlert: undefined,
        purchaseDate: '',
        maintenanceSchedule: '',
        warrantyPeriod: '',
      })
    }
  }, [isOpen, mode, initialData])

  const handleTypeSelection = (type: "sellable" | "equipment") => {
    setSelectedType(type)
    setFormData(prev => ({ ...prev, type }))
    setStep('details')
  }

  const validateForm = () => {
    try {
      itemFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const zodErrors: Record<string, string> = {}
      if (error.issues) {
        error.issues.forEach((issue: any) => {
          const path = issue.path.join('.')
          zodErrors[path] = issue.message
        })
      }
      setErrors(zodErrors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
      onClose()
    } catch (error: any) {
      console.error('Error submitting form:', error)
      setErrors({ general: error.message || 'Failed to save item' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ItemFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const goBackToTypeSelection = () => {
    setStep('type')
    setSelectedType(undefined)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' 
              ? 'Choose the type of item you want to add'
              : `Enter the details for your ${selectedType} item`
            }
          </DialogDescription>
        </DialogHeader>

        {errors.general && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{errors.general}</p>
          </div>
        )}

        {/* Step 1: Type Selection */}
        {step === 'type' && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Item Type</Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div
                  className={cn(
                    "relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:bg-accent",
                    selectedType === 'sellable' 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                  onClick={() => handleTypeSelection('sellable')}
                >
                  <ShoppingCart className="mx-auto h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Sellable Item</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Products for sale with inventory tracking
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Price, Stock, Expiry
                  </Badge>
                </div>
                
                <div
                  className={cn(
                    "relative cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:bg-accent",
                    selectedType === 'equipment' 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                  onClick={() => handleTypeSelection('equipment')}
                >
                  <Settings className="mx-auto h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Equipment</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gym equipment with maintenance tracking
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Purchase, Maintenance
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Item Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show selected type */}
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              {selectedType === 'sellable' ? (
                <ShoppingCart className="h-4 w-4 text-primary" />
              ) : (
                <Settings className="h-4 w-4 text-primary" />
              )}
              <span className="font-medium capitalize">{selectedType} Item</span>
              {mode === 'add' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goBackToTypeSelection}
                  className="ml-auto"
                >
                  Change Type
                </Button>
              )}
            </div>

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter item name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="categoryID">Category *</Label>
                <Select
                  value={formData.categoryID}
                  onValueChange={(value) => handleInputChange('categoryID', value)}
                >
                  <SelectTrigger className={errors.categoryID ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryID && (
                  <p className="text-sm text-red-500 mt-1">{errors.categoryID}</p>
                )}
              </div>

              <div>
                <Label htmlFor="supplierID">Supplier *</Label>
                <Select
                  value={formData.supplierID}
                  onValueChange={(value) => handleInputChange('supplierID', value)}
                >
                  <SelectTrigger className={errors.supplierID ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier._id} value={supplier._id}>
                        {supplier.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierID && (
                  <p className="text-sm text-red-500 mt-1">{errors.supplierID}</p>
                )}
              </div>
            </div>

            {/* Type-specific fields */}
            {selectedType === 'sellable' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (LKR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="0.00"
                      className={errors.price ? 'border-red-500' : ''}
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock || ''}
                      onChange={(e) => handleInputChange('stock', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="0"
                      className={errors.stock ? 'border-red-500' : ''}
                    />
                    {errors.stock && (
                      <p className="text-sm text-red-500 mt-1">{errors.stock}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                    <Input
                      id="lowStockAlert"
                      type="number"
                      min="1"
                      value={formData.lowStockAlert || ''}
                      onChange={(e) => handleInputChange('lowStockAlert', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="5"
                    />
                  </div>
                </div>
              </>
            )}

            {selectedType === 'equipment' && (
              <>
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.purchaseDate ? 'border-red-500' : ''}
                  />
                  {errors.purchaseDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.purchaseDate}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maintenanceSchedule">Maintenance Schedule</Label>
                    <Input
                      id="maintenanceSchedule"
                      value={formData.maintenanceSchedule}
                      onChange={(e) => handleInputChange('maintenanceSchedule', e.target.value)}
                      placeholder="e.g., Monthly, Quarterly"
                    />
                  </div>

                  <div>
                    <Label htmlFor="warrantyPeriod">Warranty Period</Label>
                    <Input
                      id="warrantyPeriod"
                      value={formData.warrantyPeriod}
                      onChange={(e) => handleInputChange('warrantyPeriod', e.target.value)}
                      placeholder="e.g., 2 years, 6 months"
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Item' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { z } from 'zod'
import { ZodError } from 'zod'

// Supplier form validation schemas - SAME PATTERN AS CategoryFormModal
const createSupplierFormSchema = z.object({
  supplierName: z.string()
    .min(2, "Supplier name must be at least 2 characters long")
    .max(100, "Supplier name must be at most 100 characters long"),
  supplierEmail: z.string()
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must be at most 100 characters long"),
  supplierPhone: z.string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^[0-9+\-\s()]+$/, "Phone number can only contain digits, +, -, spaces, and parentheses"),
  supplierAddress: z.string()
    .min(10, "Address must be at least 10 characters long")
    .max(200, "Address must be at most 200 characters long"),
})

const updateSupplierFormSchema = z.object({
  supplierName: z.string()
    .min(2, "Supplier name must be at least 2 characters long")
    .max(100, "Supplier name must be at most 100 characters long")
    .optional(),
  supplierEmail: z.string()
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters long")
    .max(100, "Email must be at most 100 characters long")
    .optional(),
  supplierPhone: z.string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^[0-9+\-\s()]+$/, "Phone number can only contain digits, +, -, spaces, and parentheses")
    .optional(),
  supplierAddress: z.string()
    .min(10, "Address must be at least 10 characters long")
    .max(200, "Address must be at most 200 characters long")
    .optional(),
})

type SupplierFormData = z.infer<typeof createSupplierFormSchema>
type UpdateSupplierFormData = z.infer<typeof updateSupplierFormSchema>

export type { SupplierFormData, UpdateSupplierFormData }

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SupplierFormData | UpdateSupplierFormData) => Promise<void>
  initialData?: Partial<SupplierFormData>
  mode: 'add' | 'edit'
  title: string
}

export function SupplierFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  title,
}: SupplierFormModalProps) {
  type FormDataType = SupplierFormData | UpdateSupplierFormData

  const [formData, setFormData] = useState<FormDataType>({
    supplierName: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierAddress: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        supplierName: initialData.supplierName || '',
        supplierEmail: initialData.supplierEmail || '',
        supplierPhone: initialData.supplierPhone || '',
        supplierAddress: initialData.supplierAddress || '',
      })
    } else {
      setFormData({
        supplierName: '',
        supplierEmail: '',
        supplierPhone: '',
        supplierAddress: '',
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const validateForm = () => {
    try {
      const schema = mode === 'add' ? createSupplierFormSchema : updateSupplierFormSchema
      schema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const zodErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          const path = issue.path.join('.')
          zodErrors[path] = issue.message
        })
        setErrors(zodErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // For updates, only send fields that have values - SAME LOGIC AS CategoryFormModal
      let dataToSend = formData

      if (mode === 'edit') {
        // Filter out empty/undefined values for updates
        const filteredData: Record<string, string> = {}
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            filteredData[key] = value
          }
        })
        dataToSend = filteredData as SupplierFormData
      }

      await onSubmit(dataToSend)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Create a new supplier. Fill in all required fields.' 
              : 'Update the supplier information. Only fill in the fields you want to change.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            {/* Supplier Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplierName" className="text-right">
                Name *
              </Label>
              <div className="col-span-3">
                <Input
                  id="supplierName"
                  value={(formData as SupplierFormData).supplierName || ''}
                  onChange={(e) => handleInputChange('supplierName', e.target.value)}
                  placeholder="Enter supplier name"
                  className={errors.supplierName ? 'border-red-500' : ''}
                />
                {errors.supplierName && (
                  <p className="text-sm text-red-500 mt-1">{errors.supplierName}</p>
                )}
              </div>
            </div>

            {/* Supplier Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplierEmail" className="text-right">
                Email *
              </Label>
              <div className="col-span-3">
                <Input
                  id="supplierEmail"
                  type="email"
                  value={(formData as SupplierFormData).supplierEmail || ''}
                  onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
                  placeholder="Enter supplier email"
                  className={errors.supplierEmail ? 'border-red-500' : ''}
                />
                {errors.supplierEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.supplierEmail}</p>
                )}
              </div>
            </div>

            {/* Supplier Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplierPhone" className="text-right">
                Phone *
              </Label>
              <div className="col-span-3">
                <Input
                  id="supplierPhone"
                  value={(formData as SupplierFormData).supplierPhone || ''}
                  onChange={(e) => handleInputChange('supplierPhone', e.target.value)}
                  placeholder="Enter supplier phone"
                  className={errors.supplierPhone ? 'border-red-500' : ''}
                />
                {errors.supplierPhone && (
                  <p className="text-sm text-red-500 mt-1">{errors.supplierPhone}</p>
                )}
              </div>
            </div>

            {/* Supplier Address */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="supplierAddress" className="text-right mt-2">
                Address *
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="supplierAddress"
                  value={(formData as SupplierFormData).supplierAddress || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    handleInputChange('supplierAddress', e.target.value)
                  }
                  placeholder="Enter supplier address"
                  className={errors.supplierAddress ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.supplierAddress && (
                  <p className="text-sm text-red-500 mt-1">{errors.supplierAddress}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Create Supplier' : 'Update Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
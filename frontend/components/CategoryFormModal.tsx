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

// Category form validation schemas - Updated for new API structure
const createCategoryFormSchema = z.object({
  name: z.string()
    .min(1, "Category name is required")
    .max(50, "Category name cannot exceed 50 characters")
    .trim(),
  description: z.string()
    .max(200, "Description cannot exceed 200 characters")
    .trim()
    .optional(),
})

const updateCategoryFormSchema = z.object({
  name: z.string()
    .min(1, "Category name is required")
    .max(50, "Category name cannot exceed 50 characters")
    .trim()
    .optional(),
  description: z.string()
    .max(200, "Description cannot exceed 200 characters")
    .trim()
    .optional(),
})

type CategoryFormData = z.infer<typeof createCategoryFormSchema>
type UpdateCategoryFormData = z.infer<typeof updateCategoryFormSchema>

export type { CategoryFormData, UpdateCategoryFormData }

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CategoryFormData | UpdateCategoryFormData) => Promise<void>
  initialData?: Partial<CategoryFormData>
  mode: 'add' | 'edit'
  title: string
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  title,
}: CategoryFormModalProps) {
type FormDataType = CategoryFormData | UpdateCategoryFormData

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const validateForm = () => {
    try {
      const schema = mode === 'add' ? createCategoryFormSchema : updateCategoryFormSchema
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
      // For updates, only send fields that have values - SAME LOGIC AS UserFormModal
      let dataToSend = formData

      if (mode === 'edit') {
        // Filter out empty/undefined values for updates
        const filteredData: Record<string, string> = {}
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            filteredData[key] = value
          }
        })
        dataToSend = filteredData as CategoryFormData
      }

      await onSubmit(dataToSend)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
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
              ? 'Create a new inventory category. Fill in all required fields.' 
              : 'Update the category information. Only fill in the fields you want to change.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            {/* Category Name - SAME PATTERN AS UserFormModal */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={(formData as CategoryFormData).name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter category name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Category Description */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={(formData as CategoryFormData).description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Enter category description (optional)"
                  className={errors.description ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
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
              {loading ? 'Saving...' : mode === 'add' ? 'Create Category' : 'Update Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
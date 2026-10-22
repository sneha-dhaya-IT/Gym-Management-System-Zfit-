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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { z } from 'zod'
import { ZodError } from 'zod'

// Membership plan form validation schemas
const createMembershipPlanFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters").trim(),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  currency: z.enum(['LKR', 'USD']),
  durationInDays: z.number().int().min(1, "Duration must be at least 1 day"),
  category: z.enum(['weights', 'crossfit', 'yoga', 'mma', 'other']),
})

const updateMembershipPlanFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters").trim().optional(),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
  price: z.number().min(0.01, "Price must be greater than 0").optional(),
  currency: z.enum(['LKR', 'USD']).optional(),
  durationInDays: z.number().int().min(1, "Duration must be at least 1 day").optional(),
  category: z.enum(['weights', 'crossfit', 'yoga', 'mma', 'other']).optional(),
})

type MembershipPlanFormData = z.infer<typeof createMembershipPlanFormSchema>
type UpdateMembershipPlanFormData = z.infer<typeof updateMembershipPlanFormSchema>

export type { MembershipPlanFormData, UpdateMembershipPlanFormData }

interface MembershipPlanFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MembershipPlanFormData | UpdateMembershipPlanFormData) => Promise<void>
  initialData?: Partial<MembershipPlanFormData>
  mode: 'add' | 'edit'
  title: string
}

export function MembershipPlanFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  title,
}: MembershipPlanFormModalProps) {
  type FormDataType = MembershipPlanFormData | UpdateMembershipPlanFormData

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    description: '',
    price: 0,
    currency: 'LKR',
    durationInDays: 30,
    category: 'weights',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || 0,
        currency: initialData.currency || 'LKR',
        durationInDays: initialData.durationInDays || 30,
        category: initialData.category || 'weights',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'LKR',
        durationInDays: 30,
        category: 'weights',
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const validateForm = () => {
    try {
      const schema = mode === 'add' ? createMembershipPlanFormSchema : updateMembershipPlanFormSchema
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
      // For updates, only send fields that have values
      let dataToSend = formData

      if (mode === 'edit') {
        // Filter out empty/undefined values for updates
        const filteredData: Record<string, string | number> = {}
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            filteredData[key] = value
          }
        })
        dataToSend = filteredData as MembershipPlanFormData
      }

      await onSubmit(dataToSend)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
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
              ? 'Fill in the details to create a new membership plan.'
              : 'Update the membership plan information below.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Basic Monthly Plan"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description of the plan"
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <div className="col-span-3">
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.currency}
                  onValueChange={(value: 'LKR' | 'USD') =>
                    handleInputChange('currency', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LKR">LKR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="durationInDays" className="text-right">
                Duration (Days)
              </Label>
              <div className="col-span-3">
                <Input
                  id="durationInDays"
                  type="number"
                  min="1"
                  value={formData.durationInDays}
                  onChange={(e) => handleInputChange('durationInDays', parseInt(e.target.value) || 1)}
                  placeholder="30"
                  className={errors.durationInDays ? 'border-red-500' : ''}
                />
                {errors.durationInDays && (
                  <p className="text-sm text-red-500 mt-1">{errors.durationInDays}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.category}
                  onValueChange={(value: 'weights' | 'crossfit' | 'yoga' | 'mma' | 'other') =>
                    handleInputChange('category', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weights">Weights</SelectItem>
                    <SelectItem value="crossfit">CrossFit</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="mma">MMA</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Create' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
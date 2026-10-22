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
import { Checkbox } from '@/components/ui/checkbox'
import { z } from 'zod'
import { ZodError } from 'zod'

// Membership form validation schemas
const createMembershipFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  membershipPlanId: z.string().min(1, "Membership plan is required"),
  startDate: z.string().optional(),
  transactionId: z.string().optional(),
  autoRenew: z.boolean().default(false),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
})

const updateMembershipFormSchema = z.object({
  endDate: z.string().optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'paused']).optional(),
  autoRenew: z.boolean().optional(),
  transactionId: z.string().optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
})

type MembershipFormData = z.infer<typeof createMembershipFormSchema>
type UpdateMembershipFormData = z.infer<typeof updateMembershipFormSchema>

export type { MembershipFormData, UpdateMembershipFormData }

interface MembershipFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MembershipFormData | UpdateMembershipFormData) => Promise<void>
  initialData?: Partial<MembershipFormData & { endDate?: string }>
  mode: 'add' | 'edit'
  title: string
  users?: Array<{ _id: string; name: string; email: string }>
  membershipPlans?: Array<{ _id: string; name: string; price: number; currency: string; durationInDays: number }>
}

export function MembershipFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  title,
  users = [],
  membershipPlans = [],
}: MembershipFormModalProps) {
  const [formData, setFormData] = useState<{
    userId?: string
    membershipPlanId?: string
    startDate?: string
    endDate?: string
    status?: 'active' | 'expired' | 'cancelled' | 'paused'
    transactionId?: string
    autoRenew?: boolean
    notes?: string
  }>(() => {
    // Set today's date as default for startDate
    const today = new Date()
    const todayISOString = today.toISOString().slice(0, 16) // Format for datetime-local input
    
    return {
      userId: '',
      membershipPlanId: '',
      startDate: todayISOString,
      transactionId: '',
      autoRenew: false,
      notes: '',
      ...(mode === 'edit' ? { status: 'active' as const } : {}),
    }
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        userId: initialData.userId || '',
        membershipPlanId: initialData.membershipPlanId || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        transactionId: initialData.transactionId || '',
        autoRenew: initialData.autoRenew || false,
        notes: initialData.notes || '',
        status: 'active',
      })
    } else {
      // Set today's date as default for startDate in add mode
      const today = new Date()
      const todayISOString = today.toISOString().slice(0, 16) // Format for datetime-local input
      
      setFormData({
        userId: '',
        membershipPlanId: '',
        startDate: todayISOString,
        transactionId: '',
        autoRenew: false,
        notes: '',
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const validateForm = () => {
    try {
      const schema = mode === 'add' ? createMembershipFormSchema : updateMembershipFormSchema
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
      
      let dataToSend = formData

      if (mode === 'add') {
        const processedData = { ...formData }
        if (processedData.startDate) {
          const date = new Date(processedData.startDate)
          processedData.startDate = date.toISOString()
        }
        dataToSend = processedData as MembershipFormData
      } else {
        const filteredData: Record<string, string | boolean> = {}
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            if ((key === 'startDate' || key === 'endDate') && typeof value === 'string') {
              const date = new Date(value)
              filteredData[key] = date.toISOString()
            } else {
              filteredData[key] = value
            }
          }
        })
        dataToSend = filteredData as UpdateMembershipFormData
      }

      await onSubmit(dataToSend)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details to create a new membership.'
              : 'Update the membership information below.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {mode === 'add' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userId" className="text-right">
                    User
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.userId}
                      onValueChange={(value: string) =>
                        handleInputChange('userId', value)
                      }
                    >
                      <SelectTrigger className={errors.userId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.userId && (
                      <p className="text-sm text-red-500 mt-1">{errors.userId}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="membershipPlanId" className="text-right">
                    Membership Plan
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.membershipPlanId}
                      onValueChange={(value: string) =>
                        handleInputChange('membershipPlanId', value)
                      }
                    >
                      <SelectTrigger className={errors.membershipPlanId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a membership plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {membershipPlans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.name} - {plan.currency} {plan.price} ({plan.durationInDays} days)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.membershipPlanId && (
                      <p className="text-sm text-red-500 mt-1">{errors.membershipPlanId}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={errors.startDate ? 'border-red-500' : ''}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transactionId" className="text-right">
                    Transaction ID
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="transactionId"
                      value={formData.transactionId}
                      onChange={(e) => handleInputChange('transactionId', e.target.value)}
                      placeholder="Optional transaction ID"
                      className={errors.transactionId ? 'border-red-500' : ''}
                    />
                    {errors.transactionId && (
                      <p className="text-sm text-red-500 mt-1">{errors.transactionId}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {mode === 'edit' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={'status' in formData ? formData.status : 'active'}
                      onValueChange={(value: 'active' | 'expired' | 'cancelled' | 'paused') =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={'endDate' in formData ? formData.endDate : ''}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className={errors.endDate ? 'border-red-500' : ''}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="autoRenew" className="text-right pt-2">
                Auto Renew
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => handleInputChange('autoRenew', checked as boolean)}
                />
                <Label htmlFor="autoRenew" className="text-sm font-normal">
                  Enable automatic renewal
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional notes"
                  rows={3}
                  className={errors.notes ? 'border-red-500' : ''}
                />
                {errors.notes && (
                  <p className="text-sm text-red-500 mt-1">{errors.notes}</p>
                )}
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


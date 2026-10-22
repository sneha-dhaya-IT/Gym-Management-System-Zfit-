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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { z } from 'zod'
import { ZodError } from 'zod'

// Password validation schema 
const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" })

// User form validation schemas 
const createUserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email format"),
  contactNo: z.string()
    .min(1, "Phone number is required")
    .regex(/^(?:\+94|0)[1-9]\d{8}$/, "Enter a valid Sri Lankan Phone number"),
  password: passwordSchema,
  role: z.enum(['member', 'staff', 'manager']),
  status: z.enum(['active', 'inactive', 'expired']),
  dob: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.union([
    z.literal(''),
    z.string().regex(/^(?:\+94|0)[1-9]\d{8}$/, "Enter a valid Sri Lankan Phone number")
  ]).optional(),
})

const updateUserFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.email("Invalid email format").optional(),
  contactNo: z.union([
    z.literal(''),
    z.string().regex(/^(?:\+94|0)[1-9]\d{8}$/, "Enter a valid Sri Lankan Phone number")
  ]).optional(),
  role: z.enum(['member', 'staff', 'manager']).optional(),
  status: z.enum(['active', 'inactive', 'expired']).optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.union([
    z.literal(''),
    z.string().regex(/^(?:\+94|0)[1-9]\d{8}$/, "Enter a valid Sri Lankan Phone number")
  ]).optional(),
})

type UserFormData = z.infer<typeof createUserFormSchema>
type UpdateUserFormData = z.infer<typeof updateUserFormSchema>

export type { UserFormData, UpdateUserFormData }

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: UserFormData | UpdateUserFormData) => Promise<void>
  initialData?: Partial<UserFormData>
  mode: 'add' | 'edit'
  title: string
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  title,
}: UserFormModalProps) {
type FormDataType = UserFormData | UpdateUserFormData

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    email: '',
    contactNo: '',
    ...(mode === 'add' ? { password: '' } : {}),
    role: 'member',
    status: 'active',
    dob: '',
    address: '',
    emergencyContact: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        contactNo: initialData.contactNo || '',
        password: '', // Don't populate password for editing
        role: initialData.role || 'member',
        status: initialData.status || 'active',
        dob: initialData.dob || '',
        address: initialData.address || '',
        emergencyContact: initialData.emergencyContact || '',
      })
    } else {
      setFormData({
        name: '',
        email: '',
        contactNo: '',
        password: '',
        role: 'member',
        status: 'active',
        dob: '',
        address: '',
        emergencyContact: '',
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const schema = mode === 'add' ? createUserFormSchema : updateUserFormSchema
      const validatedData = schema.parse(formData)
      
      setLoading(true)
      
      let dataToSend: Record<string, unknown> = validatedData as Record<string, unknown>
      
      if (mode === 'add') {
        // For add mode, structure the data correctly for the API
        const { address, emergencyContact, ...restData } = validatedData as Record<string, unknown>
        dataToSend = {
          ...restData,
          profile: {
            address: address || undefined,
            emergencyContact: emergencyContact || undefined,
          },
          consent: {
            gdpr: true, // Default to true for admin-created users
            marketing: false, // Default to false
          },
        }
      } else if (mode === 'edit') {
        // For edit mode, only send non-empty fields
        const filteredData: Record<string, unknown> = {}
        Object.entries(validatedData).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            if (key === 'address' || key === 'emergencyContact') {
              // Nest address and emergencyContact under profile
              if (!filteredData.profile) {
                filteredData.profile = {}
              }
              ;(filteredData.profile as Record<string, unknown>)[key] = value
            } else {
              filteredData[key] = value
            }
          }
        })
        dataToSend = filteredData
      }
      
      await onSubmit(dataToSend)
      onClose()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        console.error('Error submitting form:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details to create a new user.'
              : 'Update the user information below.'
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
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactNo" className="text-right">
                Phone
              </Label>
              <div className="col-span-3">
                <Input
                  id="contactNo"
                  type="tel"
                  value={formData.contactNo}
                  onChange={(e) => handleInputChange('contactNo', e.target.value.replace(/[^0-9+]/g, ''))}
                  placeholder="+94712345678"
                  maxLength={10}
                  className={errors.contactNo ? 'border-red-500' : ''}
                />
                {errors.contactNo && (
                  <p className="text-sm text-red-500 mt-1">{errors.contactNo}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.role}
                  onValueChange={(value: 'member' | 'staff' | 'manager') =>
                    handleInputChange('role', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'expired') =>
                    handleInputChange('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dob" className="text-right">
                Date of Birth
              </Label>
              <div className="col-span-3">
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  min="1950-01-01"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <div className="col-span-3">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emergencyContact" className="text-right">
                Emergency Contact
              </Label>
              <div className="col-span-3">
                <Input
                  id="emergencyContact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value.replace(/[^0-9+]/g, ''))}
                  placeholder="Emergency contact phone"
                  maxLength={10}
                  className={errors.emergencyContact ? 'border-red-500' : ''}
                />
                {errors.emergencyContact && (
                  <p className="text-sm text-red-500 mt-1">{errors.emergencyContact}</p>
                )}
              </div>
            </div>

            {mode === 'add' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <div className="col-span-3">
                  <Input
                    id="password"
                    type="password"
                    value={'password' in formData ? formData.password : ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                  )}
                </div>
              </div>
            )}
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
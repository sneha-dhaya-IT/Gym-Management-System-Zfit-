"use client"

// ClassModal component for managing fitness classes - Updated
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiRequest } from "@/lib/apiRequest"
import { toast } from "sonner"

interface ClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classData?: {
    _id: string
    name: string
    type: string
    duration: number
    maxCapacity: number
    price: number
    status: string
  } | null
}

interface FormData {
  name: string
  type: string
  duration: number
  maxCapacity: number
  price: number | string
  status: string
}

export function ClassModal({ isOpen, onClose, onSuccess, classData }: ClassModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: classData?.name || "",
    type: classData?.type || "",
    duration: classData?.duration || 60,
    maxCapacity: classData?.maxCapacity || 1,
    price: classData?.price || "",
    status: classData?.status || "active"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Class name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Class name must be at least 2 characters"
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Class name must be less than 100 characters"
    }

    // Type validation
    if (!formData.type.trim()) {
      newErrors.type = "Class type is required"
    } else if (formData.type.trim().length < 2) {
      newErrors.type = "Class type must be at least 2 characters"
    } else if (formData.type.trim().length > 50) {
      newErrors.type = "Class type must be less than 50 characters"
    }

    // Duration validation
    if (formData.duration < 60) {
      newErrors.duration = "Duration must be at least 60 minutes"
    } else if (formData.duration > 180) {
      newErrors.duration = "Duration cannot exceed 180 minutes"
    } else if (!Number.isInteger(formData.duration)) {
      newErrors.duration = "Duration must be a whole number"
    }

    // Max Capacity validation
    if (formData.maxCapacity < 1) {
      newErrors.maxCapacity = "Max capacity must be at least 1"
    } else if (formData.maxCapacity > 50) {
      newErrors.maxCapacity = "Max capacity cannot exceed 50"
    } else if (!Number.isInteger(formData.maxCapacity)) {
      newErrors.maxCapacity = "Max capacity must be a whole number"
    }

    // Price validation
    if (formData.price !== "" && (formData.price < 0 || formData.price > 1000000)) {
      if (formData.price < 0) {
        newErrors.price = "Price cannot be negative"
      } else if (formData.price > 1000000) {
        newErrors.price = "Price cannot exceed 1,000,000"
      }
    }

    // Status validation
    if (!formData.status) {
      newErrors.status = "Status is required"
    } else if (!["active", "inactive"].includes(formData.status)) {
      newErrors.status = "Status must be either active or inactive"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting")
      return
    }

    setIsLoading(true)

    try {
      const endpoint = classData 
        ? `/bookings/classes/${classData._id}`
        : "/bookings/classes"
      
      const method = classData ? "PATCH" : "POST"
      
      // Prepare data for submission - convert empty price to 0
      const submitData = {
        ...formData,
        price: formData.price === "" ? 0 : formData.price
      }
      
      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(submitData)
      })

      toast.success(classData ? "Class updated successfully!" : "Class created successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to save class")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#202022] border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {classData ? "Edit Class" : "Add New Class"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {classData ? "Update class information" : "Create a new fitness class"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Class Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              placeholder="Enter class name"
            />
            {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type" className="text-gray-300">Class Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.type ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}>
                <SelectValue placeholder="Select class type" />
              </SelectTrigger>
              <SelectContent className="bg-[#202022] border-gray-700">
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="pilates">Pilates</SelectItem>
                <SelectItem value="zumba">Zumba</SelectItem>
                <SelectItem value="spinning">Spinning</SelectItem>
                <SelectItem value="crossfit">CrossFit</SelectItem>
                <SelectItem value="strength">Strength Training</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-400 text-sm">{errors.type}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-gray-300">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="180"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 60)}
                className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                  errors.duration ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="60"
              />
              {errors.duration && <p className="text-red-400 text-sm">{errors.duration}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxCapacity" className="text-gray-300">Max Capacity *</Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                max="100"
                value={formData.maxCapacity}
                onChange={(e) => handleInputChange("maxCapacity", parseInt(e.target.value) || 10)}
                className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                  errors.maxCapacity ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="10"
              />
              {errors.maxCapacity && <p className="text-red-400 text-sm">{errors.maxCapacity}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-gray-300">Price (LKR) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value === "" ? "" : parseFloat(e.target.value))}
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.price ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              placeholder="0.00"
            />
            {errors.price && <p className="text-red-400 text-sm">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-300">Status *</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.status ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#202022] border-gray-700">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-400 text-sm">{errors.status}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
            >
              {isLoading ? "Saving..." : classData ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface FacilityFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  facilityData?: {
    _id: string
    name: string
    capacity: number
    status: string
    equipments: string[]
  } | null
}

export function FacilityFormModal({ isOpen, onClose, onSuccess, facilityData }: FacilityFormModalProps) {
  const [formData, setFormData] = useState({
    name: facilityData?.name || "",
    capacity: facilityData?.capacity || 10,
    status: facilityData?.status || "active",
    equipments: facilityData?.equipments?.join(", ") || ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Facility name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Facility name must be at least 2 characters"
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Facility name must be less than 100 characters"
    }

    // Capacity validation
    if (formData.capacity < 1) {
      newErrors.capacity = "Capacity must be at least 1"
    } else if (formData.capacity > 50) {
      newErrors.capacity = "Capacity cannot exceed 50"
    } else if (!Number.isInteger(formData.capacity)) {
      newErrors.capacity = "Capacity must be a whole number"
    }

    // Status validation
    if (!formData.status) {
      newErrors.status = "Status is required"
    } else if (!["active", "inactive", "maintenance"].includes(formData.status)) {
      newErrors.status = "Status must be active, inactive, or maintenance"
    }

    // Equipment validation (optional but if provided, should be valid)
    if (formData.equipments.trim()) {
      const equipmentList = formData.equipments.split(",").map(eq => eq.trim()).filter(eq => eq)
      if (equipmentList.some(eq => eq.length < 2)) {
        newErrors.equipments = "Each equipment item must be at least 2 characters"
      } else if (equipmentList.some(eq => eq.length > 50)) {
        newErrors.equipments = "Each equipment item must be less than 50 characters"
      }
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
      const endpoint = facilityData 
        ? `/bookings/facilities/${facilityData._id}`
        : "/bookings/facilities"
      
      const method = facilityData ? "PATCH" : "POST"
      
      // Convert equipments string to array
      const equipmentsArray = formData.equipments
        .split(",")
        .map(item => item.trim())
        .filter(item => item.length > 0)
      
      const submitData = {
        ...formData,
        equipments: equipmentsArray
      }
      
      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(submitData)
      })

      toast.success(facilityData ? "Facility updated successfully!" : "Facility created successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to save facility")
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
            {facilityData ? "Edit Facility" : "Add New Facility"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {facilityData ? "Update facility information" : "Create a new gym facility"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Facility Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              placeholder="Enter facility name"
            />
            {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-gray-300">Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              max="1000"
              value={formData.capacity}
              onChange={(e) => handleInputChange("capacity", parseInt(e.target.value) || 1)}
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.capacity ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              placeholder="Enter maximum capacity"
            />
            {errors.capacity && <p className="text-red-400 text-sm">{errors.capacity}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipments" className="text-gray-300">Equipment (comma-separated)</Label>
            <Textarea
              id="equipments"
              value={formData.equipments}
              onChange={(e) => handleInputChange("equipments", e.target.value)}
              placeholder="e.g., Treadmill, Dumbbells, Yoga Mats"
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.equipments ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              rows={3}
            />
            {errors.equipments && <p className="text-red-400 text-sm">{errors.equipments}</p>}
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
                <SelectItem value="maintenance">Maintenance</SelectItem>
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
              {isLoading ? "Saving..." : facilityData ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
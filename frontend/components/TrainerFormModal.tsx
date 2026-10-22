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

interface TrainerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  trainerData?: {
    _id: string
    name: string
    specialization: string
    experience: number
    status: string
  } | null
}

export function TrainerFormModal({ isOpen, onClose, onSuccess, trainerData }: TrainerFormModalProps) {
  const [formData, setFormData] = useState({
    name: trainerData?.name || "",
    specialization: trainerData?.specialization || "",
    experience: trainerData?.experience || 0,
    status: trainerData?.status || "active"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Trainer name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Trainer name must be at least 2 characters"
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Trainer name must be less than 50 characters"
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = "Trainer name can only contain letters and spaces"
    }

    // Specialization validation
    if (!formData.specialization.trim()) {
      newErrors.specialization = "Specialization is required"
    } else if (formData.specialization.trim().length < 2) {
      newErrors.specialization = "Specialization must be at least 2 characters"
    } else if (formData.specialization.trim().length > 100) {
      newErrors.specialization = "Specialization must be less than 100 characters"
    }

    // Experience validation
    if (formData.experience < 1) {
      newErrors.experience = "Experience cannot be less than 1 year"
    } else if (formData.experience > 50) {
      newErrors.experience = "Experience cannot exceed 50 years"
    } else if (!Number.isInteger(formData.experience)) {
      newErrors.experience = "Experience must be a whole number"
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
      const endpoint = trainerData 
        ? `/bookings/trainers/${trainerData._id}`
        : "/bookings/trainers"
      
      const method = trainerData ? "PATCH" : "POST"
      
      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData)
      })

      toast.success(trainerData ? "Trainer updated successfully!" : "Trainer created successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to save trainer")
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
            {trainerData ? "Edit Trainer" : "Add New Trainer"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {trainerData ? "Update trainer information" : "Create a new fitness trainer"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Trainer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              placeholder="Enter trainer's full name"
            />
            {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialization" className="text-gray-300">Specialization *</Label>
            <Select value={formData.specialization} onValueChange={(value) => handleInputChange("specialization", value)}>
              <SelectTrigger className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.specialization ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}>
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent className="bg-[#202022] border-gray-700">
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="pilates">Pilates</SelectItem>
                <SelectItem value="strength">Strength Training</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="crossfit">CrossFit</SelectItem>
                <SelectItem value="martial-arts">Martial Arts</SelectItem>
                <SelectItem value="dance">Dance</SelectItem>
                <SelectItem value="swimming">Swimming</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.specialization && <p className="text-red-400 text-sm">{errors.specialization}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="text-gray-300">Experience (years) *</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              max="50"
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", parseInt(e.target.value) || 0)}
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                errors.experience ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
              }`}
              placeholder="Enter years of experience"
            />
            {errors.experience && <p className="text-red-400 text-sm">{errors.experience}</p>}
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
              {isLoading ? "Saving..." : trainerData ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
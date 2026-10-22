"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface BookingFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  showStatusField?: boolean // New prop to control status field visibility
  isReschedule?: boolean // New prop to indicate if this is a reschedule operation
  bookingData?: {
    _id: string
    memberId: string
    classId: string
    trainerId: string
    facilityId: string
    classType: string
    scheduledDate: string
    fee: number
    status: string
  } | null
}

interface Class {
  _id: string
  name: string
  type: string
  duration: number
  maxCapacity: number
  price: number
  status: string
}

interface Trainer {
  _id: string
  name: string
  specialization: string
  experience: number
  status: string
}

interface Facility {
  _id: string
  name: string
  capacity: number
  status: string
  equipments: string[]
}

export function BookingFormModal({ isOpen, onClose, onSuccess, showStatusField = true, isReschedule = false, bookingData }: BookingFormModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    memberId: bookingData?.memberId || user?._id || "",
    classId: bookingData?.classId || "",
    trainerId: bookingData?.trainerId || "",
    facilityId: bookingData?.facilityId || "",
    classType: bookingData?.classType || "",
    scheduledDate: bookingData?.scheduledDate ? new Date(bookingData.scheduledDate).toISOString().slice(0, 16) : "",
    fee: bookingData?.fee || 0,
    status: bookingData?.status || (showStatusField ? "confirmed" : "confirmed"), // Always default to confirmed for members
    agreedToPolicy: false // New field for policy agreement
  })
  const [isLoading, setIsLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Update form data when bookingData changes (for reschedule/edit)
  useEffect(() => {
    if (bookingData && isOpen) {
      setFormData({
        memberId: bookingData.memberId || user?._id || "",
        classId: bookingData.classId || "",
        trainerId: bookingData.trainerId || "",
        facilityId: bookingData.facilityId || "",
        classType: bookingData.classType || "",
        scheduledDate: bookingData.scheduledDate ? new Date(bookingData.scheduledDate).toISOString().slice(0, 16) : "",
        fee: bookingData.fee || 0,
        status: bookingData.status || (showStatusField ? "confirmed" : "confirmed"),
        agreedToPolicy: true // Set to true for existing bookings
      })
    }
  }, [bookingData, isOpen, user?._id, showStatusField])

  const fetchData = async () => {
    try {
      const [classesRes, trainersRes, facilitiesRes] = await Promise.all([
        apiRequest("/bookings/classes"),
        apiRequest("/bookings/trainers"),
        apiRequest("/bookings/facilities")
      ])

      setClasses(Array.isArray(classesRes.data) ? classesRes.data.filter((c: Class) => c.status === "active") : [])
      setTrainers(Array.isArray(trainersRes.data) ? trainersRes.data.filter((t: Trainer) => t.status === "active") : [])
      setFacilities(Array.isArray(facilitiesRes.data) ? facilitiesRes.data.filter((f: Facility) => f.status === "active") : [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load form data")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
            // Check if policy agreement is required for new bookings (not for editing or rescheduling)
            if (!bookingData && !showStatusField && !isReschedule && !formData.agreedToPolicy) {
              toast.error("You must agree to the cancellation policy to create a booking")
              return
            }
    
    setIsLoading(true)

    try {
      let endpoint, method, requestBody
      
      if (isReschedule && bookingData) {
        // Use the reschedule endpoint for rescheduling
        endpoint = `/bookings/${bookingData._id}/reschedule`
        method = "PUT"
        requestBody = JSON.stringify({
          scheduledDate: formData.scheduledDate
        })
      } else {
        // Use regular update/create endpoints
        endpoint = bookingData 
          ? `/bookings/${bookingData._id}`
          : "/bookings"
        method = bookingData ? "PATCH" : "POST"
        requestBody = JSON.stringify(formData)
      }
      
      await apiRequest(endpoint, {
        method,
        body: requestBody
      })

      toast.success(isReschedule ? "Booking rescheduled successfully!" : bookingData ? "Booking updated successfully!" : "Booking created successfully!")
      
      // Show notification for admin if this is a member rescheduling
      if (isReschedule && !showStatusField) {
        toast.info("Admin has been notified of this rescheduling", {
          duration: 4000,
        })
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Booking submission error:", error)
      
      // Handle specific error types
      if (error.message?.includes("Server is busy")) {
        toast.error("Server is busy. Please wait a few minutes and try again.")
      } else if (error.message?.includes("Too many")) {
        toast.error("Too many requests. Please wait a moment and try again.")
      } else if (error.message?.includes("rate limit")) {
        toast.error("Rate limit exceeded. Please wait before making another booking.")
      } else if (error.message?.includes("validation")) {
        toast.error("Please check your booking details and try again.")
      } else {
        toast.error(error.message || "Failed to save booking")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    // Prevent fee changes for members (when showStatusField is false)
    if (field === "fee" && !showStatusField) {
      return // Don't allow fee changes for members
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-fill class type when class is selected
    if (field === "classId") {
      const selectedClass = classes.find(c => c._id === value)
      if (selectedClass) {
        setFormData(prev => ({ 
          ...prev, 
          classId: String(value),
          classType: selectedClass.type,
          fee: selectedClass.price
        }))
      }
    }
  }

  const selectedClass = classes.find(c => c._id === formData.classId)
  const selectedTrainer = trainers.find(t => t._id === formData.trainerId)
  const selectedFacility = facilities.find(f => f._id === formData.facilityId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#202022] border-gray-700 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {isReschedule ? "Reschedule Booking" : bookingData ? "Edit Booking" : "Create New Booking"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {isReschedule ? "Change the date and time of your booking" : bookingData ? "Update booking information" : "Book a fitness class"}
                  </DialogDescription>
                </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classId" className="text-gray-300">Class *</Label>
            <Select value={formData.classId} onValueChange={(value) => handleInputChange("classId", value)}>
              <SelectTrigger className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent className="bg-[#202022] border-gray-700">
                {classes.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.name} - {cls.type} (LKR {cls.price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClass && (
              <div className="text-sm text-gray-400">
                Duration: {selectedClass.duration} min | Capacity: {selectedClass.maxCapacity}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trainerId" className="text-gray-300">Trainer *</Label>
            <Select value={formData.trainerId} onValueChange={(value) => handleInputChange("trainerId", value)}>
              <SelectTrigger className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]">
                <SelectValue placeholder="Select a trainer" />
              </SelectTrigger>
              <SelectContent className="bg-[#202022] border-gray-700">
                {trainers.map((trainer) => (
                  <SelectItem key={trainer._id} value={trainer._id}>
                    {trainer.name} - {trainer.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTrainer && (
              <div className="text-sm text-gray-400">
                Experience: {selectedTrainer.experience} years
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facilityId" className="text-gray-300">Facility *</Label>
            <Select value={formData.facilityId} onValueChange={(value) => handleInputChange("facilityId", value)}>
              <SelectTrigger className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]">
                <SelectValue placeholder="Select a facility" />
              </SelectTrigger>
              <SelectContent className="bg-[#202022] border-gray-700">
                {facilities.map((facility) => (
                  <SelectItem key={facility._id} value={facility._id}>
                    {facility.name} (Capacity: {facility.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFacility && (
              <div className="text-sm text-gray-400">
                Equipment: {selectedFacility.equipments?.join(", ") || "None"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="classType" className="text-gray-300">Class Type</Label>
            <Input
              id="classType"
              value={formData.classType}
              onChange={(e) => handleInputChange("classType", e.target.value)}
              className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="text-gray-300">Scheduled Date & Time *</Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => handleInputChange("scheduledDate", e.target.value)}
              className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee" className="text-gray-300">
              Fee (LKR) {!showStatusField && <span className="text-xs text-gray-400">(Auto-calculated)</span>}
            </Label>
            <Input
              id="fee"
              type="number"
              min="0"
              step="0.01"
              value={formData.fee}
              onChange={(e) => handleInputChange("fee", parseFloat(e.target.value))}
              className={`bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69] ${
                !showStatusField ? 'opacity-60 cursor-not-allowed bg-gray-800' : ''
              }`}
              disabled={!showStatusField} // Disable for members (when showStatusField is false)
              required
            />
            {!showStatusField && (
              <p className="text-xs text-gray-400">
                Fee is automatically set based on the selected class and cannot be modified
              </p>
            )}
          </div>

          {showStatusField && (
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#202022] border-gray-700">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!showStatusField && !isReschedule && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="space-y-3">
                <div className="text-blue-400 text-sm">
                  <strong>📋 Cancellation Policy:</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>You can cancel or reschedule your booking up to 1 day before the scheduled date</li>
                    <li>After the 1-day deadline, changes are not allowed</li>
                    <li>No refunds for cancellations made after the deadline</li>
                    <li>Rescheduling is subject to availability</li>
                  </ul>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="policy-agreement"
                    checked={formData.agreedToPolicy}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, agreedToPolicy: checked === true }))
                    }
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="policy-agreement" 
                    className="text-sm text-gray-300 cursor-pointer leading-relaxed"
                  >
                    I have read and agree to the cancellation policy above. I understand that I can only cancel or reschedule my booking at least 1 day before the scheduled date.
                  </Label>
                </div>
              </div>
            </div>
          )}

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
                      disabled={isLoading || (!bookingData && !showStatusField && !isReschedule && !formData.agreedToPolicy)}
                      className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Saving..." : isReschedule ? "Reschedule" : bookingData ? "Update" : "Create Booking"}
                    </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

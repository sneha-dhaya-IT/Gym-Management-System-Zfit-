"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Edit, 
  Trash2, 
  X,
  Calendar,
  Clock,
  User,
  Dumbbell,
  MapPin,
  RefreshCw,
  CheckSquare,
  Square
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiRequest } from "@/lib/apiRequest"
import { toast } from "sonner"

interface Booking {
  _id: string
  memberId: string | {
    _id: string
    name: string
    email: string
  }
  classId: string | {
    _id: string
    name: string
    type: string
  }
  trainerId: string | {
    _id: string
    name: string
    specialization: string
  }
  facilityId: string | {
    _id: string
    name: string
    capacity: number
  }
  classType: string
  scheduledDate: string
  cancellationDeadline: string
  rescheduledDate?: string
  fee: number
  status: string
  member?: {
    name: string
    email: string
  }
  class?: {
    name: string
    type: string
  }
  trainer?: {
    name: string
    specialization: string
  }
  facility?: {
    name: string
  }
}

interface BookingTableProps {
  bookings: Booking[]
  onRefresh: () => void
  onEdit?: (booking: Booking) => void
  onReschedule?: (booking: Booking) => void
  onBulkDelete?: (bookingIds: string[]) => void
  isAdmin?: boolean
}

export function BookingTable({ bookings, onRefresh, onEdit, onReschedule, onBulkDelete, isAdmin = false }: BookingTableProps) {
  const { isManager, isStaff } = useAuth()
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Debug: Log received bookings
  console.log("BookingTable received bookings:", bookings)
  console.log("BookingTable bookings count:", bookings.length)
  console.log("BookingTable isManager:", isManager, "isStaff:", isStaff)


  const canCancelBooking = (booking: Booking) => {
    const bookingDate = new Date(booking.scheduledDate)
    const today = new Date()
    const oneDayBefore = new Date(bookingDate)
    oneDayBefore.setDate(bookingDate.getDate() - 1)
    
    // Can cancel if booking is more than 1 day away
    return today < oneDayBefore && booking.status !== 'cancelled' && booking.status !== 'completed'
  }

  const handleCancel = async (bookingId: string) => {
    const booking = bookings.find(b => b._id === bookingId)
    if (!booking) return

    // Check if booking can be cancelled
    if (!canCancelBooking(booking)) {
      const bookingDate = new Date(booking.scheduledDate)
      const today = new Date()
      const oneDayBefore = new Date(bookingDate)
      oneDayBefore.setDate(bookingDate.getDate() - 1)
      
      if (today >= oneDayBefore) {
        toast.error("You can only cancel bookings at least one day before the scheduled date")
        return
      }
      
      if (booking.status === 'cancelled') {
        toast.error("This booking is already cancelled")
        return
      }
      
      if (booking.status === 'completed') {
        toast.error("Cannot cancel a completed booking")
        return
      }
    }

    if (!confirm("Are you sure you want to cancel this booking?")) return
    
    setLoadingStates(prev => ({ ...prev, [bookingId]: true }))
    
    try {
      const response = await apiRequest(`/bookings/${bookingId}/cancel`, {
        method: "PUT"
      })
      
      toast.success("Booking cancelled successfully!")
      
      // Show notification for admin if this is a member cancellation
      if (!isAdmin) {
        toast.info("Admin has been notified of this cancellation", {
          duration: 4000,
        })
      }
      
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel booking")
    } finally {
      setLoadingStates(prev => ({ ...prev, [bookingId]: false }))
    }
  }

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedBookings.size === bookings.length) {
      setSelectedBookings(new Set())
    } else {
      setSelectedBookings(new Set(bookings.map(booking => booking._id)))
    }
  }

  const handleSelectBooking = (bookingId: string) => {
    const newSelected = new Set(selectedBookings)
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId)
    } else {
      newSelected.add(bookingId)
    }
    setSelectedBookings(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedBookings.size === 0) {
      toast.error("Please select bookings to delete")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedBookings.size} booking(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsBulkDeleting(true)
    try {
      if (onBulkDelete) {
        await onBulkDelete(Array.from(selectedBookings))
      } else {
        // Fallback: delete one by one
        for (const bookingId of selectedBookings) {
          await apiRequest(`/bookings/${bookingId}`, {
            method: "DELETE"
          })
        }
        toast.success(`${selectedBookings.size} booking(s) deleted successfully!`)
        onRefresh()
      }
      setSelectedBookings(new Set())
    } catch (error: any) {
      console.error("Failed to delete bookings:", error)
      toast.error(error.message || "Failed to delete bookings")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const canRescheduleBooking = (booking: Booking) => {
    const bookingDate = new Date(booking.scheduledDate)
    const today = new Date()
    const oneDayBefore = new Date(bookingDate)
    oneDayBefore.setDate(bookingDate.getDate() - 1)
    
    // Can reschedule if booking is more than 1 day away
    return today < oneDayBefore && booking.status !== 'cancelled' && booking.status !== 'completed'
  }

  const handleReschedule = async (bookingId: string) => {
    const booking = bookings.find(b => b._id === bookingId)
    if (!booking) return

    // Check if booking can be rescheduled
    if (!canRescheduleBooking(booking)) {
      const bookingDate = new Date(booking.scheduledDate)
      const today = new Date()
      const oneDayBefore = new Date(bookingDate)
      oneDayBefore.setDate(bookingDate.getDate() - 1)
      
      if (today >= oneDayBefore) {
        toast.error("You can only reschedule bookings at least one day before the scheduled date")
        return
      }
      
      if (booking.status === 'cancelled') {
        toast.error("Cannot reschedule a cancelled booking")
        return
      }
      
      if (booking.status === 'completed') {
        toast.error("Cannot reschedule a completed booking")
        return
      }
    }

    // Use the onReschedule prop if provided (for modal-based rescheduling)
    if (onReschedule) {
      onReschedule(booking)
      return
    }

    // Fallback to inline rescheduling with prompt (for backward compatibility)
    const newDate = prompt("Enter new date (YYYY-MM-DD):")
    if (!newDate) return
    
    setLoadingStates(prev => ({ ...prev, [bookingId]: true }))
    
    try {
      await apiRequest(`/bookings/${bookingId}/reschedule`, {
        method: "PUT",
        body: JSON.stringify({ scheduledDate: newDate })
      })
      
      toast.success("Booking rescheduled successfully!")
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to reschedule booking")
    } finally {
      setLoadingStates(prev => ({ ...prev, [bookingId]: false }))
    }
  }

  const handleDelete = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return
    
    setLoadingStates(prev => ({ ...prev, [bookingId]: true }))
    
    try {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "DELETE"
      })
      
      toast.success("Booking deleted successfully!")
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete booking")
    } finally {
      setLoadingStates(prev => ({ ...prev, [bookingId]: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
      completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      rescheduled: "bg-purple-500/20 text-purple-400 border-purple-500/30"
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const canCancel = (booking: Booking) => {
    return canCancelBooking(booking)
  }

  const canReschedule = (booking: Booking) => {
    return canRescheduleBooking(booking)
  }

  return (
    <Card className="bg-[#202022] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#AAFF69]" />
            Bookings ({bookings.length})
          </CardTitle>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk Actions for Admin */}
        {isAdmin && bookings.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedBookings.size === bookings.length && bookings.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                />
                <span className="text-gray-300 text-sm">
                  {selectedBookings.size === bookings.length ? "Deselect All" : "Select All"}
                </span>
              </div>
              {selectedBookings.size > 0 && (
                <span className="text-[#AAFF69] text-sm font-medium">
                  {selectedBookings.size} booking(s) selected
                </span>
              )}
            </div>
            {selectedBookings.size > 0 && (
              <Button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                {isBulkDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedBookings.size})
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        
        <div className="bg-[#202022] border border-gray-700 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                {isAdmin && (
                  <TableHead className="text-gray-300 w-12">
                    <Checkbox
                      checked={selectedBookings.size === bookings.length && bookings.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                    />
                  </TableHead>
                )}
                <TableHead className="text-gray-300">Member</TableHead>
                <TableHead className="text-gray-300">Class</TableHead>
                <TableHead className="text-gray-300">Trainer</TableHead>
                <TableHead className="text-gray-300">Facility</TableHead>
                <TableHead className="text-gray-300">Date & Time</TableHead>
                <TableHead className="text-gray-300">Fee</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id} className="border-gray-700 hover:bg-gray-800/50">
                  {isAdmin && (
                    <TableCell className="text-white">
                      <Checkbox
                        checked={selectedBookings.has(booking._id)}
                        onCheckedChange={() => handleSelectBooking(booking._id)}
                        className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {booking.member?.name || 
                           (typeof booking.memberId === 'object' && booking.memberId?.name) || 
                           "Unknown"}
                        </div>
                        <div className="text-sm text-gray-400">
                          {booking.member?.email || 
                           (typeof booking.memberId === 'object' && booking.memberId?.email) || 
                           ""}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {booking.class?.name || 
                           (typeof booking.classId === 'object' && booking.classId?.name) || 
                           "Unknown"}
                        </div>
                        <div className="text-sm text-gray-400 capitalize">{booking.classType}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div>
                      <div className="font-medium">
                        {booking.trainer?.name || 
                         (typeof booking.trainerId === 'object' && booking.trainerId?.name) || 
                         "Unknown"}
                      </div>
                      <div className="text-sm text-gray-400 capitalize">
                        {booking.trainer?.specialization || 
                         (typeof booking.trainerId === 'object' && booking.trainerId?.specialization) || 
                         ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {booking.facility?.name || 
                       (typeof booking.facilityId === 'object' && booking.facilityId?.name) || 
                       "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <div>{formatDate(booking.scheduledDate)}</div>
                        <div className="text-sm text-gray-400">{formatTime(booking.scheduledDate)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">LKR {booking.fee}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Member actions */}
                      {!isAdmin && (
                        <>
                          {canReschedule(booking) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReschedule ? onReschedule(booking) : handleReschedule(booking._id)}
                              disabled={loadingStates[booking._id]}
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                              title="Reschedule booking"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="border-gray-500/30 text-gray-500 cursor-not-allowed"
                              title="Cannot reschedule: Must be at least 1 day before booking date"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}
                          {canCancel(booking) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(booking._id)}
                              disabled={loadingStates[booking._id]}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              title="Cancel booking"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="border-gray-500/30 text-gray-500 cursor-not-allowed"
                              title="Cannot cancel: Must be at least 1 day before booking date"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      
                      {/* Admin actions */}
                      {isAdmin && (
                        <>
                          {onEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(booking)}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(booking._id)}
                            disabled={loadingStates[booking._id]}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {bookings.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No bookings found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
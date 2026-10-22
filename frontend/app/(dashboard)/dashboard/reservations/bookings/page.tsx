"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarView } from "@/components/CalendarView"
import { BookingTable } from "@/components/BookingTable"
import { BookingFormModal } from "@/components/BookingFormModal"
import { 
  Plus, 
  Calendar,
  BookOpen,
  Filter,
  Search,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Bell,
  X,
  AlertCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { apiRequest } from "@/lib/apiRequest"
import { toast } from "sonner"

interface Booking {
  _id: string
  memberId: string
  classId: string
  trainerId: string
  facilityId: string
  classType: string
  scheduledDate: string
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

export default function BookingsPage() {
  const { isManager } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showPastBookings, setShowPastBookings] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'cancellation' | 'reschedule'
    message: string
    bookingId: string
    timestamp: Date
  }>>([])
  
  // Modal states
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })
  const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })

  useEffect(() => {
    fetchAllBookings()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchAllBookings()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const addNotification = (type: 'cancellation' | 'reschedule', message: string, bookingId: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      bookingId,
      timestamp: new Date()
    }
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep only last 10 notifications
    
    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 10000)
  }

  const fetchAllBookings = async () => {
    setIsLoading(true)
    try {
      const response = await apiRequest("/bookings")
      const newBookings = response.data || []
      
      // Check for status changes to detect cancellations/reschedules
      if (allBookings.length > 0) {
        newBookings.forEach((newBooking: Booking) => {
          const oldBooking = allBookings.find(b => b._id === newBooking._id)
          if (oldBooking && oldBooking.status !== newBooking.status) {
            if (newBooking.status === 'cancelled' && oldBooking.status !== 'cancelled') {
              addNotification('cancellation', `Booking cancelled by member`, newBooking._id)
            } else if (newBooking.status === 'rescheduled' && oldBooking.status !== 'rescheduled') {
              addNotification('reschedule', `Booking rescheduled by member`, newBooking._id)
            }
          }
        })
      }
      
      setAllBookings(newBookings as Booking[])
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: Date, bookings: Booking[]) => {
    setSelectedDate(date)
    setSelectedBookings(bookings)
  }

  const handleRefresh = () => {
    fetchAllBookings()
    setSelectedDate(undefined)
    setSelectedBookings([])
  }

  const handleEditBooking = (booking: Booking) => {
    setBookingModal({ isOpen: true, booking })
  }

  const handleRescheduleBooking = (booking: Booking) => {
    setRescheduleModal({ isOpen: true, booking })
  }

  const handleBulkDelete = async (bookingIds: string[]) => {
    try {
      // Delete bookings one by one (since we don't have a bulk delete endpoint)
      for (const bookingId of bookingIds) {
        await apiRequest(`/bookings/${bookingId}`, {
          method: "DELETE"
        })
      }
      toast.success(`${bookingIds.length} booking(s) deleted successfully!`)
      handleRefresh()
    } catch (error: any) {
      console.error("Failed to delete bookings:", error)
      toast.error(error.message || "Failed to delete bookings")
    }
  }

  const getBookingStats = () => {
    const total = allBookings.length
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length
    const pending = allBookings.filter(b => b.status === 'pending').length
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length
    const rescheduled = allBookings.filter(b => b.status === 'rescheduled').length
    const completed = allBookings.filter(b => b.status === 'completed').length
    
    return { total, confirmed, pending, cancelled, rescheduled, completed }
  }

  const stats = getBookingStats()

  const filteredBookings = allBookings.filter(booking => {
    const matchesSearch = 
      booking.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trainer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.facility?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.classType?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    
    const isPastBooking = new Date(booking.scheduledDate) < new Date()
    const matchesTimeFilter = showPastBookings || !isPastBooking
    
    return matchesSearch && matchesStatus && matchesTimeFilter
  })

  // Access control removed - all users can access this page

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bookings Management</h1>
          <p className="text-gray-400">Manage all fitness class bookings</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.href = '/dashboard/reports/bookings'}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button
            onClick={() => setBookingModal({ isOpen: true, booking: null })}
            className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <Card className="bg-[#202022] border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#AAFF69]" />
              Recent Activity ({notifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    notification.type === 'cancellation' 
                      ? 'bg-red-500/10 border-red-500/20' 
                      : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`h-4 w-4 ${
                      notification.type === 'cancellation' ? 'text-red-400' : 'text-blue-400'
                    }`} />
                    <div>
                      <p className="text-sm text-white font-medium">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-[#202022] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#202022] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#202022] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#202022] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#202022] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Rescheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.rescheduled}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#202022] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#AAFF69]" />
            Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView 
            onDateSelect={handleDateSelect as (date: Date, bookings: Booking[]) => void}
            selectedDate={selectedDate}
            bookings={allBookings}
            isAdmin={true}
          />
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#AAFF69]" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by member, class, trainer, facility, or class type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#202022] border border-gray-700 text-white rounded-md focus:border-[#AAFF69] focus:ring-[#AAFF69] min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
              <Button
                variant={showPastBookings ? "default" : "outline"}
                onClick={() => setShowPastBookings(!showPastBookings)}
                className={showPastBookings 
                  ? "bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90" 
                  : "border-gray-700 text-gray-300 hover:bg-gray-800"
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showPastBookings ? "Hide Past" : "Show Past"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setShowPastBookings(true)
                }}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredBookings.length} of {allBookings.length} bookings
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter !== "all" && ` with status "${statusFilter}"`}
            {!showPastBookings && " (future bookings only)"}
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#AAFF69]" />
              {selectedDate ? `Bookings for ${selectedDate.toLocaleDateString()}` : "All Bookings"}
            </CardTitle>
            <div className="text-sm text-gray-400">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BookingTable
            bookings={selectedDate ? selectedBookings : filteredBookings as Booking[]}
            onRefresh={handleRefresh}
            onEdit={handleEditBooking as (booking: Booking) => void}
            onReschedule={handleRescheduleBooking as (booking: Booking) => void}
            onBulkDelete={handleBulkDelete}
            isAdmin={true}
          />
        </CardContent>
      </Card>

      {/* Booking Modal */}
      <BookingFormModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, booking: null })}
        onSuccess={handleRefresh}
        bookingData={bookingModal.booking}
      />

      {/* Reschedule Modal */}
      <BookingFormModal
        isOpen={rescheduleModal.isOpen}
        onClose={() => setRescheduleModal({ isOpen: false, booking: null })}
        onSuccess={handleRefresh}
        showStatusField={true}
        bookingData={rescheduleModal.booking}
        isReschedule={true}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarView } from "@/components/CalendarView"
import { BookingTable } from "@/components/BookingTable"
import { BookingFormModal } from "@/components/BookingFormModal"
import { 
  Plus, 
  Calendar, 
  BookOpen
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

export default function MemberReservationsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [activeTab, setActiveTab] = useState("bookings")
  const [isLoading, setIsLoading] = useState(false)

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#AAFF69]"></div>
      </div>
    )
  }

  // Show message if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-[#202022] border-gray-700">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Please Login</h2>
            <p className="text-gray-400">You need to be logged in to view your bookings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Modal states
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  })

  useEffect(() => {
    if (user?._id) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    if (!user?._id) {
      console.log("No user ID available")
      return
    }
    
    setIsLoading(true)
    try {
      console.log("Fetching bookings for user:", user._id)
      const response = await apiRequest<{ data: Booking[] }>("/bookings")
      console.log("All bookings response:", response)
      
      // Debug: Check the structure of the first booking
      if (response.data && response.data.length > 0) {
        console.log("First booking structure:", response.data[0])
        console.log("First booking class:", response.data[0].class)
        console.log("First booking trainer:", response.data[0].trainer)
        console.log("First booking facility:", response.data[0].facility)
      }
      
      // Filter bookings for current member only
      const memberBookings = Array.isArray(response.data) ? response.data.filter((booking: Booking) => {
        // Handle both string ID and populated object
        const memberId = typeof booking.memberId === 'string' 
          ? booking.memberId 
          : booking.memberId?._id
        const matches = memberId === user._id || memberId === String(user._id)
        console.log(`Booking ${booking._id}: memberId=${memberId}, user._id=${user._id}, matches=${matches}`)
        return matches
      }) : []
      
      console.log("Filtered member bookings:", memberBookings)
      console.log("Total bookings found:", memberBookings.length)
      setBookings(memberBookings)
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setActiveTab("bookings")
  }

  const handleEditBooking = (booking: Booking) => {
    setBookingModal({ isOpen: true, booking })
  }

  const handleRefresh = () => {
    fetchBookings()
  }

  const selectedBookings = selectedDate 
    ? bookings.filter(booking => {
        const bookingDate = new Date(booking.scheduledDate)
        return bookingDate.toDateString() === selectedDate.toDateString()
      })
    : bookings

  // Debug: Show what's being passed to BookingTable
  console.log("Current bookings state:", bookings)
  console.log("Selected bookings:", selectedBookings)
  console.log("Selected date:", selectedDate)



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Reservations</h1>
          <p className="text-gray-400">Manage your fitness class bookings</p>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2">
            Debug: {bookings.length} bookings loaded | User ID: {user?._id}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setBookingModal({ isOpen: true, booking: null })}
            className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-[#202022] border-gray-700">
          <TabsTrigger
            value="calendar"
            className="data-[state=active]:bg-[#AAFF69] data-[state=active]:text-black"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="data-[state=active]:bg-[#AAFF69] data-[state=active]:text-black"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            My Bookings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            bookings={bookings}
            isAdmin={false}
          />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">My Bookings</h2>
              {selectedDate ? (
                <div className="flex items-center gap-2">
                  <p className="text-gray-400">
                    Bookings for {selectedDate.toLocaleDateString()}
                  </p>
                  <Button
                    onClick={() => setSelectedDate(undefined)}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Show All
                  </Button>
                </div>
              ) : (
                <p className="text-gray-400">All your bookings</p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AAFF69]"></div>
              <span className="ml-2 text-gray-400">Loading bookings...</span>
            </div>
          ) : (
            <BookingTable
              bookings={selectedBookings}
              onRefresh={handleRefresh}
              onEdit={handleEditBooking}
              isAdmin={false}
            />
          )}
        </TabsContent>

      </Tabs>

      {/* Booking Modal */}
      <BookingFormModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, booking: null })}
        onSuccess={handleRefresh}
        showStatusField={false}
        bookingData={bookingModal.booking}
      />
    </div>
  )
}
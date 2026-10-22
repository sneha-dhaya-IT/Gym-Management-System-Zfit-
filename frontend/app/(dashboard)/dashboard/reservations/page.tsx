"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarView } from "@/components/CalendarView"
import { BookingTable } from "@/components/BookingTable"
import { BookingFormModal } from "@/components/BookingFormModal"
import { ClassModal } from "@/components/ClassModal"
import { TrainerFormModal } from "@/components/TrainerFormModal"
import { FacilityFormModal } from "@/components/FacilityFormModal"
import { 
  Plus, 
  Calendar, 
  Users, 
  Dumbbell, 
  MapPin,
  BookOpen,
  ArrowRight,
  FileText,
  Bell,
  X,
  AlertCircle
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
// import { AuthDebug } from "@/components/AuthDebug"

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

export default function ReservationsPage() {
  const { isManager } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState("calendar")
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
  const [classModal, setClassModal] = useState<{ isOpen: boolean; classData: any }>({
    isOpen: false,
    classData: null
  })
  const [trainerModal, setTrainerModal] = useState<{ isOpen: boolean; trainerData: any }>({
    isOpen: false,
    trainerData: null
  })
  const [facilityModal, setFacilityModal] = useState<{ isOpen: boolean; facilityData: any }>({
    isOpen: false,
    facilityData: null
  })

  const handleDateSelect = (date: Date, bookings: Booking[]) => {
    setSelectedDate(date)
    setSelectedBookings(bookings)
    setActiveTab("bookings")
  }

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
    try {
      const response = await apiRequest("/bookings")
      const newBookings = Array.isArray(response.data) ? response.data : []
      
      // Check for status changes to detect cancellations/reschedules
      if (allBookings.length > 0) {
        newBookings.forEach(newBooking => {
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
      
      setAllBookings(newBookings)
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
    }
  }

  useEffect(() => {
    fetchAllBookings()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchAllBookings()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    // This will trigger a re-render and refetch data
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

  if (!isManager) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-[#202022] border-gray-700">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-400">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reservations Management</h1>
          <p className="text-gray-400">Manage classes, trainers, facilities, and bookings</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-[#202022] border-gray-700">
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
            Bookings
          </TabsTrigger>
          <TabsTrigger 
            value="classes" 
            className="data-[state=active]:bg-[#AAFF69] data-[state=active]:text-black"
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger 
            value="trainers" 
            className="data-[state=active]:bg-[#AAFF69] data-[state=active]:text-black"
          >
            <Users className="h-4 w-4 mr-2" />
            Trainers
          </TabsTrigger>
          <TabsTrigger 
            value="facilities" 
            className="data-[state=active]:bg-[#AAFF69] data-[state=active]:text-black"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Facilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            bookings={allBookings}
            isAdmin={true}
          />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Bookings</h2>
              {selectedDate && (
                <p className="text-gray-400">
                  Bookings for {selectedDate.toLocaleDateString()}
                </p>
              )}
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
                onClick={() => window.location.href = '/dashboard/reservations/bookings'}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Manage Bookings
              </Button>
            </div>
          </div>
          
          <BookingTable
            bookings={selectedBookings}
            onRefresh={handleRefresh}
            onEdit={handleEditBooking}
            onReschedule={handleRescheduleBooking}
            onBulkDelete={handleBulkDelete}
            isAdmin={true}
          />
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Classes</h2>
              <p className="text-gray-400">Manage fitness classes</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setClassModal({ isOpen: true, classData: null })}
                className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard/reservations/classes'}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Manage Classes
              </Button>
            </div>
          </div>
          
          <Card className="bg-[#202022] border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <Dumbbell className="h-12 w-12 text-[#AAFF69] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Classes Management</h3>
                <p className="text-gray-400 mb-4">Access the full classes management interface</p>
                <Button
                  onClick={() => window.location.href = '/dashboard/reservations/classes'}
                  className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
                >
                  Go to Classes Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trainers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Trainers</h2>
              <p className="text-gray-400">Manage fitness trainers</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setTrainerModal({ isOpen: true, trainerData: null })}
                className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Trainer
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard/reservations/trainers'}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Manage Trainers
              </Button>
            </div>
          </div>
          
          <Card className="bg-[#202022] border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-[#AAFF69] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Trainers Management</h3>
                <p className="text-gray-400 mb-4">Access the full trainers management interface</p>
                <Button
                  onClick={() => window.location.href = '/dashboard/reservations/trainers'}
                  className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
                >
                  Go to Trainers Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Facilities</h2>
              <p className="text-gray-400">Manage gym facilities</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setFacilityModal({ isOpen: true, facilityData: null })}
                className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
              <Button
                onClick={() => window.location.href = '/dashboard/reservations/facilities'}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Manage Facilities
              </Button>
            </div>
          </div>
          
          <Card className="bg-[#202022] border-gray-700">
            <CardContent className="p-6">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-[#AAFF69] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Facilities Management</h3>
                <p className="text-gray-400 mb-4">Access the full facilities management interface</p>
                <Button
                  onClick={() => window.location.href = '/dashboard/reservations/facilities'}
                  className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
                >
                  Go to Facilities Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
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

      <ClassModal
        isOpen={classModal.isOpen}
        onClose={() => setClassModal({ isOpen: false, classData: null })}
        onSuccess={handleRefresh}
        classData={classModal.classData}
      />

      <TrainerFormModal
        isOpen={trainerModal.isOpen}
        onClose={() => setTrainerModal({ isOpen: false, trainerData: null })}
        onSuccess={handleRefresh}
        trainerData={trainerModal.trainerData}
      />

      <FacilityFormModal
        isOpen={facilityModal.isOpen}
        onClose={() => setFacilityModal({ isOpen: false, facilityData: null })}
        onSuccess={handleRefresh}
        facilityData={facilityModal.facilityData}
      />
    </div>
  )
}

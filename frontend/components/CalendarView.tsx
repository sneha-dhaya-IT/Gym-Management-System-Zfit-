"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface Booking {
  _id: string
  scheduledDate: string
  status: string
  classType?: string
  member?: {
    name: string
  }
}

interface CalendarViewProps {
  onDateSelect: (date: Date, bookings: Booking[]) => void
  selectedDate?: Date
  bookings: Booking[]
  isAdmin?: boolean
}

export function CalendarView({ onDateSelect, selectedDate, bookings, isAdmin = false }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => {
      // Handle different date formats
      const bookingDate = new Date(booking.scheduledDate)
      const bookingDateStr = bookingDate.toISOString().split('T')[0]
      return bookingDateStr === dateStr
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-green-500",
      cancelled: "bg-red-500",
      completed: "bg-blue-500",
      rescheduled: "bg-purple-500"
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="bg-[#202022] border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#AAFF69]" />
            Calendar View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-white font-medium min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="h-16" />
              }

              const dayBookings = getBookingsForDate(date)
              const hasBookings = dayBookings.length > 0

              return (
                <div
                  key={date.toISOString()}
                  className={`
                    h-16 border border-gray-700 rounded-lg p-1 cursor-pointer transition-colors
                    ${isToday(date) ? 'bg-[#AAFF69]/20 border-[#AAFF69]/50' : ''}
                    ${isSelected(date) ? 'bg-[#AAFF69]/30 border-[#AAFF69]' : ''}
                    ${hasBookings ? 'hover:bg-gray-800/50' : 'hover:bg-gray-800/30'}
                  `}
                  onClick={() => onDateSelect(date, dayBookings)}
                >
                  <div className="flex flex-col h-full">
                    <div className={`
                      text-sm font-medium
                      ${isToday(date) ? 'text-[#AAFF69]' : 'text-white'}
                      ${isSelected(date) ? 'text-black' : ''}
                    `}>
                      {date.getDate()}
                    </div>
                    
                    {/* Booking indicators */}
                    <div className="flex-1 flex flex-wrap gap-0.5 mt-1">
                      {dayBookings.slice(0, 3).map((booking, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${getStatusColor(booking.status)}`}
                          title={`${booking.status} - ${booking.classType || 'Booking'}`}
                        />
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" title={`+${dayBookings.length - 3} more`} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-300">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-300">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-300">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-300">Rescheduled</span>
            </div>
          </div>

          {/* Selected date info */}
          {selectedDate && (
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-white font-medium mb-2">
                Bookings for {selectedDate.toLocaleDateString()}
              </h4>
              <div className="space-y-2">
                {getBookingsForDate(selectedDate).map(booking => (
                  <div key={booking._id} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(booking.status)}`}></div>
                    <span className="text-sm text-gray-300">
                      {booking.classType || 'Booking'} - {booking.status}
                      {isAdmin && booking.member && ` (${booking.member.name})`}
                    </span>
                  </div>
                ))}
                {getBookingsForDate(selectedDate).length === 0 && (
                  <p className="text-sm text-gray-400">No bookings for this date</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
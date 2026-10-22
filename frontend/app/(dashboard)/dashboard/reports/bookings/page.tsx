"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Filter,
  Search
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiRequest } from "@/lib/apiRequest"
import { toast } from "sonner"
import { format } from "date-fns"

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
    price: number
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
  createdAt: string
  updatedAt: string
  member?: {
    name: string
    email: string
  }
  class?: {
    name: string
    type: string
    price: number
  }
  trainer?: {
    name: string
    specialization: string
  }
  facility?: {
    name: string
    capacity: number
  }
}

interface ReportStats {
  totalBookings: number
  totalRevenue: number
  confirmedBookings: number
  cancelledBookings: number
  pendingBookings: number
  completedBookings: number
  rescheduledBookings: number
  averageBookingValue: number
  mostPopularClass: string
  mostActiveTrainer: string
  mostUsedFacility: string
}

export default function BookingReportsPage() {
  const { isManager } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [reportStats, setReportStats] = useState<ReportStats | null>(null)
  
  // Filter states
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [classFilter, setClassFilter] = useState("all")
  const [trainerFilter, setTrainerFilter] = useState("all")
  const [facilityFilter, setFacilityFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [bookings, dateFrom, dateTo, statusFilter, classFilter, trainerFilter, facilityFilter, searchTerm])

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const response = await apiRequest<{ data: Booking[] }>("/bookings")
      setBookings(response.data || [])
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.scheduledDate) >= new Date(dateFrom)
      )
    }
    if (dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.scheduledDate) <= new Date(dateTo)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter(booking => booking.classId === classFilter)
    }

    // Trainer filter
    if (trainerFilter !== "all") {
      filtered = filtered.filter(booking => booking.trainerId === trainerFilter)
    }

    // Facility filter
    if (facilityFilter !== "all") {
      filtered = filtered.filter(booking => booking.facilityId === facilityFilter)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        (booking.member?.name || 
         (typeof booking.memberId === 'object' && booking.memberId?.name) || '')
          .toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.class?.name || 
         (typeof booking.classId === 'object' && booking.classId?.name) || '')
          .toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.trainer?.name || 
         (typeof booking.trainerId === 'object' && booking.trainerId?.name) || '')
          .toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.facility?.name || 
         (typeof booking.facilityId === 'object' && booking.facilityId?.name) || '')
          .toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.classType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredBookings(filtered)
    calculateStats(filtered)
  }

  const calculateStats = (bookings: Booking[]) => {
    const totalBookings = bookings.length
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.fee || 0), 0)
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    const completedBookings = bookings.filter(b => b.status === 'completed').length
    const rescheduledBookings = bookings.filter(b => b.status === 'rescheduled').length
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

    // Most popular class
    const classCounts = bookings.reduce((acc, booking) => {
      const className = booking.class?.name || 
                       (typeof booking.classId === 'object' && booking.classId?.name) || 
                       booking.classType || 'Unknown'
      acc[className] = (acc[className] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostPopularClass = Object.entries(classCounts).reduce((a, b) => 
      classCounts[a[0]] > classCounts[b[0]] ? a : b, ['', 0]
    )[0] || 'N/A'

    // Most active trainer
    const trainerCounts = bookings.reduce((acc, booking) => {
      const trainerName = booking.trainer?.name || 
                         (typeof booking.trainerId === 'object' && booking.trainerId?.name) || 
                         'Unknown'
      acc[trainerName] = (acc[trainerName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostActiveTrainer = Object.entries(trainerCounts).reduce((a, b) => 
      trainerCounts[a[0]] > trainerCounts[b[0]] ? a : b, ['', 0]
    )[0] || 'N/A'

    // Most used facility
    const facilityCounts = bookings.reduce((acc, booking) => {
      const facilityName = booking.facility?.name || 
                          (typeof booking.facilityId === 'object' && booking.facilityId?.name) || 
                          'Unknown'
      acc[facilityName] = (acc[facilityName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostUsedFacility = Object.entries(facilityCounts).reduce((a, b) => 
      facilityCounts[a[0]] > facilityCounts[b[0]] ? a : b, ['', 0]
    )[0] || 'N/A'

    setReportStats({
      totalBookings,
      totalRevenue,
      confirmedBookings,
      cancelledBookings,
      pendingBookings,
      completedBookings,
      rescheduledBookings,
      averageBookingValue,
      mostPopularClass,
      mostActiveTrainer,
      mostUsedFacility
    })
  }

  const generateCSVReport = () => {
    const headers = [
      'Booking ID',
      'Member Name',
      'Member Email',
      'Class Name',
      'Class Type',
      'Trainer Name',
      'Facility Name',
      'Scheduled Date',
      'Fee',
      'Status',
      'Created Date'
    ]

    const csvData = filteredBookings.map(booking => [
      booking._id,
      booking.member?.name || 
      (typeof booking.memberId === 'object' && booking.memberId?.name) || 'N/A',
      booking.member?.email || 
      (typeof booking.memberId === 'object' && booking.memberId?.email) || 'N/A',
      booking.class?.name || 
      (typeof booking.classId === 'object' && booking.classId?.name) || 'N/A',
      booking.classType,
      booking.trainer?.name || 
      (typeof booking.trainerId === 'object' && booking.trainerId?.name) || 'N/A',
      booking.facility?.name || 
      (typeof booking.facilityId === 'object' && booking.facilityId?.name) || 'N/A',
      format(new Date(booking.scheduledDate), 'yyyy-MM-dd HH:mm'),
      booking.fee || 0,
      booking.status,
      format(new Date(booking.createdAt), 'yyyy-MM-dd HH:mm')
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `booking-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success("CSV report downloaded successfully!")
  }

  const generatePDFReport = () => {
    // For now, we'll create a simple HTML report that can be printed as PDF
    const reportContent = `
      <html>
        <head>
          <title>Booking Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #333; }
            .stat-label { color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Report</h1>
            <p>Generated on: ${format(new Date(), 'PPP')}</p>
            <p>Report Period: ${dateFrom ? format(new Date(dateFrom), 'PPP') : 'All time'} - ${dateTo ? format(new Date(dateTo), 'PPP') : 'Present'}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p>Total Bookings: ${reportStats?.totalBookings || 0}</p>
            <p>Total Revenue: LKR ${reportStats?.totalRevenue?.toLocaleString() || 0}</p>
            <p>Average Booking Value: LKR ${reportStats?.averageBookingValue?.toFixed(2) || 0}</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${reportStats?.confirmedBookings || 0}</div>
              <div class="stat-label">Confirmed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportStats?.cancelledBookings || 0}</div>
              <div class="stat-label">Cancelled</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportStats?.completedBookings || 0}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportStats?.pendingBookings || 0}</div>
              <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportStats?.rescheduledBookings || 0}</div>
              <div class="stat-label">Rescheduled</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${reportStats?.mostPopularClass || 'N/A'}</div>
              <div class="stat-label">Most Popular Class</div>
            </div>
          </div>

          <h2>Booking Details</h2>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Class</th>
                <th>Trainer</th>
                <th>Facility</th>
                <th>Date</th>
                <th>Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBookings.map(booking => `
                <tr>
                  <td>${booking.member?.name || 
                      (typeof booking.memberId === 'object' && booking.memberId?.name) || 'N/A'}</td>
                  <td>${booking.class?.name || 
                      (typeof booking.classId === 'object' && booking.classId?.name) || 
                      booking.classType}</td>
                  <td>${booking.trainer?.name || 
                      (typeof booking.trainerId === 'object' && booking.trainerId?.name) || 'N/A'}</td>
                  <td>${booking.facility?.name || 
                      (typeof booking.facilityId === 'object' && booking.facilityId?.name) || 'N/A'}</td>
                  <td>${format(new Date(booking.scheduledDate), 'PPP p')}</td>
                  <td>LKR ${booking.fee || 0}</td>
                  <td>${booking.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(reportContent)
      printWindow.document.close()
      printWindow.print()
    }

    toast.success("PDF report generated successfully!")
  }

  const clearFilters = () => {
    setDateFrom("")
    setDateTo("")
    setStatusFilter("all")
    setClassFilter("all")
    setTrainerFilter("all")
    setFacilityFilter("all")
    setSearchTerm("")
  }

  // Get unique values for filters
  const uniqueClasses = [...new Set(bookings.map(b => b.classId))].map(id => 
    bookings.find(b => b.classId === id)
  ).filter(Boolean)

  const uniqueTrainers = [...new Set(bookings.map(b => b.trainerId))].map(id => 
    bookings.find(b => b.trainerId === id)
  ).filter(Boolean)

  const uniqueFacilities = [...new Set(bookings.map(b => b.facilityId))].map(id => 
    bookings.find(b => b.facilityId === id)
  ).filter(Boolean)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Booking Reports</h1>
          <p className="text-gray-400">Generate comprehensive reports for all bookings</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateCSVReport}
            className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
            disabled={filteredBookings.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={generatePDFReport}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            disabled={filteredBookings.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {reportStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#202022] border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{reportStats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#202022] border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">LKR {reportStats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#202022] border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Avg. Booking Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">LKR {reportStats.averageBookingValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#202022] border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Most Popular Class</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white truncate">{reportStats.mostPopularClass}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#AAFF69]" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#202022] border-gray-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Clear Filters
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Member</TableHead>
                  <TableHead className="text-gray-300">Class</TableHead>
                  <TableHead className="text-gray-300">Trainer</TableHead>
                  <TableHead className="text-gray-300">Facility</TableHead>
                  <TableHead className="text-gray-300">Scheduled Date</TableHead>
                  <TableHead className="text-gray-300">Fee</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id} className="border-gray-700">
                    <TableCell className="text-white">
                      <div>
                        <div className="font-medium">
                          {booking.member?.name || 
                           (typeof booking.memberId === 'object' && booking.memberId?.name) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {booking.member?.email || 
                           (typeof booking.memberId === 'object' && booking.memberId?.email) || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <div>
                        <div className="font-medium">
                          {booking.class?.name || 
                           (typeof booking.classId === 'object' && booking.classId?.name) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">{booking.classType}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <div>
                        <div className="font-medium">
                          {booking.trainer?.name || 
                           (typeof booking.trainerId === 'object' && booking.trainerId?.name) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {booking.trainer?.specialization || 
                           (typeof booking.trainerId === 'object' && booking.trainerId?.specialization) || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <div>
                        <div className="font-medium">
                          {booking.facility?.name || 
                           (typeof booking.facilityId === 'object' && booking.facilityId?.name) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">
                          Capacity: {booking.facility?.capacity || 
                                   (typeof booking.facilityId === 'object' && booking.facilityId?.capacity) || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      {format(new Date(booking.scheduledDate), 'PPP p')}
                    </TableCell>
                    <TableCell className="text-white">
                      LKR {booking.fee || 0}
                    </TableCell>
                    <TableCell className="text-white">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {booking.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No bookings found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

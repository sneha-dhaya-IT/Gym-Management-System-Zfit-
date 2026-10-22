"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { attendanceApi, AttendanceRecord } from '@/lib/api/attendanceApi'
import { Pagination } from '@/components/ui/pagination'

interface UserAttendanceTableProps {
  userId: string
  userName: string
}

export function UserAttendanceTable({ userId, userName }: UserAttendanceTableProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true)
      const response = await attendanceApi.getUserAttendance(userId)

      if (response.success && response.data) {
        setAttendanceRecords(response.data)
        setTotalItems(response.data.length)
        setTotalPages(Math.ceil(response.data.length / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      setAttendanceRecords([])
    } finally {
      setLoading(false)
    }
  }, [userId, itemsPerPage])

  useEffect(() => {
    if (userId) {
      fetchAttendanceRecords()
    }
  }, [userId, fetchAttendanceRecords])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'checked-in': return 'default'
      case 'checked-out': return 'secondary'
      case 'auto-checkout': return 'destructive'
      default: return 'outline'
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Get paginated data for current page
  const paginatedRecords = attendanceRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Attendance History
        </CardTitle>
        <CardDescription>
          Check-in and check-out records for {userName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.checkInTime), 'HH:mm')}
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime
                        ? format(new Date(record.checkOutTime), 'HH:mm')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {record.duration
                        ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {record.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.notes || record.isManualEntry ? 'Manual entry' : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {attendanceRecords.length > itemsPerPage && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </>
        )}

        {attendanceRecords.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No attendance records found</p>
            <p className="text-sm">Attendance records will appear here when available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { attendanceApi, AttendanceRecord } from '@/lib/api/attendanceApi'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export default function MemberAttendancePage() {
  const { user } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttendanceRecords = useCallback(async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const response = await attendanceApi.getUserAttendance(user._id)
      if (response.success && response.data) {
        setAttendanceRecords(response.data)
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      alert('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [fetchAttendanceRecords])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'checked-in': return 'default'
      case 'checked-out': return 'secondary'
      case 'auto-checkout': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Attendance History</h2>
          <p className="text-muted-foreground">View your check-in and check-out records</p>
        </div>
        
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Showing {attendanceRecords.length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      {format(new Date(record.checkInTime), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {record.checkOutTime
                        ? format(new Date(record.checkOutTime), 'MMM dd, HH:mm')
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
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {attendanceRecords.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records found</p>
              <p className="text-sm">Your check-in records will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
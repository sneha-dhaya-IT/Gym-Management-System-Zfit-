'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, RefreshCw, Search } from 'lucide-react'
import { format } from 'date-fns'
import { attendanceApi, AttendanceRecord } from '@/lib/api/attendanceApi'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AttendanceHistoryPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  const recordsPerPage = 20

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: recordsPerPage,
      }

      const response = await attendanceApi.getAllAttendance(params)
      if (response.success && response.data) {
        setAttendanceRecords(response.data)
        // Calculate total pages (assuming backend provides total count)
        setTotalPages(Math.ceil(response.data.length / recordsPerPage))
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error)
      alert('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchAttendanceRecords()
  }, [fetchAttendanceRecords])

  const filteredRecords = attendanceRecords.filter(record => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (record.userId?.name?.toLowerCase().includes(searchLower) || false) ||
                         (record.userId?.email?.toLowerCase().includes(searchLower) || false) ||
                         record.status.toLowerCase().includes(searchLower) ||
                         record.userRole.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    const matchesRole = roleFilter === "all" || record.userRole === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return

    try {
      const response = await attendanceApi.deleteAttendance(id)
      if (response.success) {
        alert('Attendance record deleted successfully')
        fetchAttendanceRecords()
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete attendance record')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'checked-in': return 'default'
      case 'checked-out': return 'secondary'
      case 'auto-checkout': return 'destructive'
      default: return 'outline'
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'manager': return 'destructive'
      case 'staff': return 'default'
      case 'member': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance History</h2>
          <p className="text-muted-foreground">Manage and view attendance records</p>
        </div>
        <div className="flex gap-2">
          {/*<Button onClick={fetchAttendanceRecords} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>*/}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="checked-in">Checked In</SelectItem>
            <SelectItem value="checked-out">Checked Out</SelectItem>
            <SelectItem value="auto-checkout">Auto Checkout</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Showing {filteredRecords.length} of {attendanceRecords.length} records
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.userId ? record.userId.name : 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.userId ? record.userId.email : 'User not found'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(record.userRole)}>
                        {record.userRole}
                      </Badge>
                    </TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(record._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredRecords.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records found</p>
              <p className="text-sm">Attendance records will appear here when users check in</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { UserCheck, Download, Search, Plus } from 'lucide-react'
import { apiService } from '@/lib/api/userApi'
import { UserFormModal } from '@/components/UserFormModal'

interface Staff {
  _id: string
  name: string
  email: string
  contactNo: string
  status: 'active' | 'inactive' | 'expired'
  createdAt: string
  qrCode?: string
  profile?: {
    emergencyContact?: string
    medicalConditions?: string
  }
  consent?: {
    termsAccepted: boolean
    marketingEmails: boolean
  }
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchStaff()
  }, [])

  const filteredStaff = staff.filter(staffMember =>
    staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await apiService.getStaff()
      setStaff(response.data as Staff[])
    } catch (error) {
      console.error('Error fetching staff:', error)
      setError('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const handleViewStaff = (staffMember: Staff) => {
    router.push(`/dashboard/users/staff/${staffMember._id}`)
  }

  const handleAddStaff = async (staffData: any) => {
    try {
      await apiService.createUser({ ...staffData, role: 'staff' })
      fetchStaff() // Refresh the list
    } catch (error) {
      console.error('Error adding staff:', error)
      throw error
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'expired':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const handleDownloadReport = async () => {
    try {
      // Build query parameters based on current filters
      const queryParams = new URLSearchParams()
      
      if (searchQuery) {
        queryParams.append('searchTerm', searchQuery)
      }
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/staff/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      
      // Use filtered filename if filters are applied
      const filename = searchQuery ? 'staff-report-filtered.pdf' : 'staff-report.pdf'
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
      setError('Failed to download report')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
            <p className="text-muted-foreground">Manage gym staff</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading staff...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
          <p className="text-muted-foreground">Manage gym staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            All Staff
          </CardTitle>
          <CardDescription>
            View and manage all gym staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staffMember) => (
                <TableRow key={staffMember._id}>
                  <TableCell className="font-medium">{staffMember.name}</TableCell>
                  <TableCell>{staffMember.email}</TableCell>
                  <TableCell>{staffMember.contactNo}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(staffMember.status)}>
                      {staffMember.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(staffMember.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewStaff(staffMember)}
                      >
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredStaff.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff found</p>
              <p className="text-sm">Add your first staff member to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStaff}
        mode="add"
        title="Add New Staff"
      />
    </div>
  )
}
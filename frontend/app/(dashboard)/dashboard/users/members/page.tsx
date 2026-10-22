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
import { User, Download, Search, Plus } from 'lucide-react'
import { apiService } from '@/lib/api/userApi'
import { UserFormModal } from '@/components/UserFormModal'

interface Member {
  _id: string
  name: string
  email: string
  contactNo: string
  role: string
  status: string
  qrCode?: string
  createdAt: string
  updatedAt: string
  profile?: {
    address?: string
    emergencyContact?: string
  }
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchMembers()
  }, [])

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await apiService.getMembers()
      setMembers(response.data as Member[])
    } catch (error) {
      console.error('Error fetching members:', error)
      setError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleViewMember = (member: Member) => {
    router.push(`/dashboard/users/members/${member._id}`)
  }

  const handleAddMember = async (memberData: any) => {
    try {
      await apiService.createUser({ ...memberData, role: 'member' })
      fetchMembers() // Refresh the list
    } catch (error) {
      console.error('Error adding member:', error)
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
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/members/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
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
      const filename = searchQuery ? 'members-report-filtered.pdf' : 'members-report.pdf'
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
            <h2 className="text-3xl font-bold tracking-tight">Members</h2>
            <p className="text-muted-foreground">Manage gym members</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading members...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">Manage gym members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
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
            placeholder="Search members by name or email..."
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

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            All Members
          </CardTitle>
          <CardDescription>
            View and manage all gym members
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
              {filteredMembers.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.contactNo}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMember(member)}
                      >
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members found</p>
              <p className="text-sm">Add your first member to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMember}
        mode="add"
        title="Add New Member"
      />
    </div>
  )
}
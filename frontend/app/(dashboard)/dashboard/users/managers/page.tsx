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
import { Shield, Download, Search, Plus } from 'lucide-react'
import { apiService } from '@/lib/api/userApi'
import { UserFormModal } from '@/components/UserFormModal'

interface Manager {
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

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const router = useRouter()

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    try {
      setLoading(true)
      const response = await apiService.getManagers()
      setManagers(response.data as Manager[])
    } catch (error) {
      console.error('Error fetching managers:', error)
      setError('Failed to load managers')
    } finally {
      setLoading(false)
    }
  }

  const handleViewManager = (manager: Manager) => {
    router.push(`/dashboard/users/managers/${manager._id}`)
  }

  const handleAddManager = async (managerData: any) => {
    try {
      await apiService.createUser({ ...managerData, role: 'manager' })
      fetchManagers() // Refresh the list
    } catch (error) {
      console.error('Error adding manager:', error)
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
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/managers/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
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
      const filename = searchQuery ? 'managers-report-filtered.pdf' : 'managers-report.pdf'
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
            <h2 className="text-3xl font-bold tracking-tight">Managers</h2>
            <p className="text-muted-foreground">Manage gym managers</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading managers...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Managers</h2>
          <p className="text-muted-foreground">Manage gym managers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manager
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
            placeholder="Search managers by name or email..."
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

      {/* Managers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            All Managers
          </CardTitle>
          <CardDescription>
            View and manage all gym managers
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
              {filteredManagers.map((manager) => (
                <TableRow key={manager._id}>
                  <TableCell className="font-medium">{manager.name}</TableCell>
                  <TableCell>{manager.email}</TableCell>
                  <TableCell>{manager.contactNo}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(manager.status)}>
                      {manager.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(manager.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewManager(manager)}
                      >
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredManagers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? 'No managers found matching your search' : 'No managers found'}</p>
              <p className="text-sm">{searchQuery ? 'Try adjusting your search terms' : 'Add your first manager to get started'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddManager}
        mode="add"
        title="Add New Manager"
      />
    </div>
  )
}
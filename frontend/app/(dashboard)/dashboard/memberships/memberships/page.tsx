"use client"

import { useState, useEffect } from 'react'
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
import { Plus, Edit, Trash2, UserCheck, MoreHorizontal, Search, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { membershipApi } from '@/lib/api/membershipApi'
import { membershipPlanApi } from '@/lib/api/membershipPlanApi'
import { apiService } from '@/lib/api/userApi'
import type { Membership } from '@/lib/api/membershipApi'
import type { MembershipPlan } from '@/lib/api/membershipPlanApi'
import { MembershipFormModal, MembershipFormData, UpdateMembershipFormData } from '@/components/MembershipFormModal'

interface User {
  _id: string
  name: string
  email: string
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [membershipsResponse, usersResponse, plansResponse] = await Promise.all([
        membershipApi.getAllMemberships(),
        apiService.getMembers(),
        membershipPlanApi.getAllMembershipPlans(),
      ])

      setMemberships(membershipsResponse.data)
      setUsers(usersResponse.data as User[])
      setMembershipPlans(plansResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load memberships')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMembership = async (membershipId: string) => {
    if (!confirm('Are you sure you want to delete this membership?')) return

    try {
      await membershipApi.deleteMembership(membershipId)
      setMemberships(memberships.filter(membership => membership._id !== membershipId))
    } catch (error) {
      console.error('Error deleting membership:', error)
      setError('Failed to delete membership')
    }
  }

  const handleEditMembership = (membership: Membership) => {
    setEditingMembership(membership)
    setModalOpen(true)
  }

  const handleAddMembership = () => {
    setEditingMembership(null)
    setModalOpen(true)
  }

  const handleCancelMembership = async (membershipId: string) => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason) return

    try {
      await membershipApi.cancelMembership(membershipId, { reason })
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error cancelling membership:', error)
      setError('Failed to cancel membership')
    }
  }

  const handlePauseMembership = async (membershipId: string) => {
    const reason = prompt('Please provide a reason for pausing:')
    if (!reason) return

    try {
      await membershipApi.pauseMembership(membershipId, { reason })
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error pausing membership:', error)
      setError('Failed to pause membership')
    }
  }

  const handleResumeMembership = async (membershipId: string) => {
    try {
      await membershipApi.resumeMembership(membershipId)
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error resuming membership:', error)
      setError('Failed to resume membership')
    }
  }

  const handleExtendMembership = async (membershipId: string) => {
    const days = prompt('Enter number of additional days:')
    if (!days || isNaN(Number(days))) return

    try {
      await membershipApi.extendMembership(membershipId, { additionalDays: Number(days) })
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error extending membership:', error)
      setError('Failed to extend membership')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: 'default',
      expired: 'secondary',
      cancelled: 'destructive',
      paused: 'outline',
    }
    return variants[status] || 'secondary'
  }

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`
  }

  const getDaysRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Filter memberships based on search term
  const filteredMemberships = memberships.filter(membership => {
    const searchLower = searchTerm.toLowerCase()
    const userName = membership.userId && typeof membership.userId === 'object' ? membership.userId.name : ''
    const userEmail = membership.userId && typeof membership.userId === 'object' ? membership.userId.email : ''
    const planName = membership.membershipPlanId && typeof membership.membershipPlanId === 'object' ? membership.membershipPlanId.name : ''

    return (
      userName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      planName.toLowerCase().includes(searchLower) ||
      membership.status.toLowerCase().includes(searchLower) ||
      (membership.transactionId && membership.transactionId.toLowerCase().includes(searchLower))
    )
  })

  const handleDownloadReport = async () => {
    try {
      // Build query parameters based on current filters
      const queryParams = new URLSearchParams()
      
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm)
      }
      
      const url = `${process.env.NEXT_PUBLIC_API_URL}/reports/memberships/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
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
      const filename = searchTerm ? 'memberships-report-filtered.pdf' : 'memberships-report.pdf'
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

  const handleModalSubmit = async (formData: MembershipFormData | UpdateMembershipFormData) => {
    try {
      if (editingMembership) {
        // Update existing membership
        const updateData: UpdateMembershipFormData = formData as UpdateMembershipFormData
        await membershipApi.updateMembership(editingMembership._id, updateData)
      } else {
        // Create new membership
        const createData: MembershipFormData = formData as MembershipFormData
        await membershipApi.createMembership(createData)
      }
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error saving membership:', error)
      setError('Failed to save membership')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Memberships</h2>
            <p className="text-muted-foreground">Manage gym memberships</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading memberships...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Memberships</h2>
          <p className="text-muted-foreground">Manage gym memberships</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddMembership}>
            <Plus className="h-4 w-4 mr-2" />
            Add Membership
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
            placeholder="Search memberships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Memberships Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            All Memberships
          </CardTitle>
          <CardDescription>
            View and manage all gym memberships
          </CardDescription>
        </CardHeader>
        <CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Membership Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead>Auto Renew</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemberships.map((membership) => (
                <TableRow key={membership._id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        {membership.userId && typeof membership.userId === 'object'
                          ? membership.userId.name
                          : 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {membership.userId && typeof membership.userId === 'object'
                          ? membership.userId.email
                          : 'No email available'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold">
                        {membership.membershipPlanId && typeof membership.membershipPlanId === 'object'
                          ? membership.membershipPlanId.name
                          : 'Unknown Plan'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {membership.membershipPlanId && typeof membership.membershipPlanId === 'object'
                          ? formatPrice(membership.membershipPlanId.price, membership.membershipPlanId.currency)
                          : 'No pricing info'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(membership.status)} className="capitalize">
                      {membership.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(membership.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(membership.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={getDaysRemaining(membership.endDate) < 0 ? 'text-red-500' :
                                   getDaysRemaining(membership.endDate) <= 7 ? 'text-yellow-500' : 'text-green-500'}>
                      {getDaysRemaining(membership.endDate) < 0
                        ? `Expired ${Math.abs(getDaysRemaining(membership.endDate))} days ago`
                        : `${getDaysRemaining(membership.endDate)} days`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={membership.autoRenew ? 'default' : 'secondary'}>
                      {membership.autoRenew ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditMembership(membership)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {membership.status === 'active' && (
                          <>
                            <DropdownMenuItem onClick={() => handlePauseMembership(membership._id)}>
                              Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExtendMembership(membership._id)}>
                              Extend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancelMembership(membership._id)}
                              className="text-red-600"
                            >
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                        {membership.status === 'paused' && (
                          <DropdownMenuItem onClick={() => handleResumeMembership(membership._id)}>
                            Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteMembership(membership._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMemberships.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? 'No memberships found matching your search' : 'No memberships found'}</p>
              <p className="text-sm">{searchTerm ? 'Try adjusting your search terms' : 'Add your first membership to get started'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <MembershipFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingMembership ? {
          userId: editingMembership.userId && typeof editingMembership.userId === 'object'
            ? editingMembership.userId._id
            : '',
          membershipPlanId: editingMembership.membershipPlanId && typeof editingMembership.membershipPlanId === 'object'
            ? editingMembership.membershipPlanId._id
            : '',
          startDate: editingMembership.startDate,
          endDate: editingMembership.endDate,
          transactionId: editingMembership.transactionId,
          autoRenew: editingMembership.autoRenew,
          notes: editingMembership.notes,
        } : undefined}
        mode={editingMembership ? 'edit' : 'add'}
        title={editingMembership ? 'Edit Membership' : 'Add New Membership'}
        users={users}
        membershipPlans={membershipPlans}
      />
    </div>
  )
}
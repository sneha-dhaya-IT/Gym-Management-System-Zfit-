"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MapPin,
  AlertTriangle,
  Building,
  Briefcase,
  Users,
  TrendingUp,
  Edit,
  Trash2
} from 'lucide-react'
import { getUserById, deleteUser, updateUser } from '@/lib/api/userApi'
import { QRCodeModal } from '@/components/QRCodeModal'
import { UserFormModal } from '@/components/UserFormModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { UserAttendanceTable } from '@/components/UserAttendanceTable'

interface ManagerDetails {
  _id: string
  name: string
  email: string
  contactNo: string
  role: string
  status: string
  verified: boolean
  qrCode?: string
  createdAt: string
  updatedAt: string
  dob?: string
  department?: string
  position?: string
  employeeId?: string
  hireDate?: string
  salary?: number
  manager?: string
  teamSize?: number
  performanceRating?: number
  profile?: {
    address?: string
    emergencyContact?: string
    avatar?: string
  }
  consent?: {
    gdpr?: boolean
    marketing?: boolean
    date?: string
  }
}

export default function ManagerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const managerId = params.id as string

  const [manager, setManager] = useState<ManagerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const fetchManagerDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getUserById(managerId)

      if (response.success && response.data) {
        setManager(response.data as ManagerDetails)
      } else {
        setError(response.message || 'Failed to fetch manager details')
      }
    } catch (err) {
      console.error('Error fetching manager details:', err)
      setError('Failed to load manager details')
    } finally {
      setLoading(false)
    }
  }, [managerId])

  useEffect(() => {
    if (managerId) {
      fetchManagerDetails()
    }
  }, [managerId, fetchManagerDetails])

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

  const handleEditManager = () => {
    setShowEditModal(true)
  }

  const handleDeleteManager = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await deleteUser(managerId)
      if (response.success) {
        // After successful deletion, redirect back to managers list
        router.push('/dashboard/users/managers')
      } else {
        setError(response.message || 'Failed to delete manager')
      }
    } catch (error) {
      console.error('Error deleting manager:', error)
      setError('Failed to delete manager')
    }
  }

  const handleUpdateManager = async (data: any) => {
    try {
      const response = await updateUser(managerId, data)
      if (response.success) {
        // After successful update, refresh the data
        await fetchManagerDetails()
      } else {
        setError(response.message || 'Failed to update manager')
      }
    } catch (error) {
      console.error('Error updating manager:', error)
      setError('Failed to update manager')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Managers
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading manager details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !manager) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Managers
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Manager</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'Manager not found'}
              </p>
              <Button onClick={() => router.back()}>
                Back to Managers
              </Button>
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
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Managers
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Manager Details</h2>
          <p className="text-muted-foreground">
            Complete information for {manager.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleEditManager}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Information
          </Button>
          {manager.qrCode && (
            <Button variant="outline" onClick={() => setShowQRModal(true)}>
              View QR Code
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteManager}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Manager
          </Button>
        </div>
      </div>

      {/* Manager Overview */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Personal Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic account information and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={manager.profile?.avatar || "/avatars/user.jpg"} alt={manager.name} />
                    <AvatarFallback className="text-lg">
                      {manager.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold">{manager.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Manager
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(manager.status)}>
                        {manager.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manager since {new Date(manager.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </div>
                    <p className="font-medium">{manager.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </div>
                    <p className="font-medium">{manager.contactNo}</p>
                  </div>

                  {manager.dob && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </div>
                      <p className="font-medium">
                        {new Date(manager.dob).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Verification Status
                    </div>
                    <p className="font-medium">
                      {manager.verified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          Pending Verification
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Last Updated
                    </div>
                    <p className="font-medium">
                      {new Date(manager.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </div>
                    <p className="font-medium">
                      {new Date(manager.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Employment Information */}
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Employment Information</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {manager.employeeId && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          Employee ID
                        </div>
                        <p className="font-medium">{manager.employeeId}</p>
                      </div>
                    )}

                    {manager.department && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          Department
                        </div>
                        <p className="font-medium">{manager.department}</p>
                      </div>
                    )}

                    {manager.position && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          Position
                        </div>
                        <p className="font-medium">{manager.position}</p>
                      </div>
                    )}

                    {manager.hireDate && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Hire Date
                        </div>
                        <p className="font-medium">
                          {new Date(manager.hireDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {manager.teamSize && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Team Size
                        </div>
                        <p className="font-medium">{manager.teamSize} members</p>
                      </div>
                    )}

                    {manager.performanceRating && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          Performance Rating
                        </div>
                        <p className="font-medium">{manager.performanceRating}/5</p>
                      </div>
                    )}

                    {manager.salary && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          Salary
                        </div>
                        <p className="font-medium">LKR {manager.salary.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                {manager.profile?.address && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Address
                      </div>
                      <p className="font-medium">{manager.profile.address}</p>
                    </div>
                  </>
                )}

                {/* Emergency Contact */}
                {manager.profile?.emergencyContact && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Emergency Contact</h4>
                      <p className="text-sm">{manager.profile.emergencyContact}</p>
                    </div>
                  </>
                )}

                {/* Consent Information */}
                {manager.consent && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Privacy & Consent</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        <p className="text-sm">
                          <span className="font-medium">GDPR Consent:</span> {manager.consent.gdpr ? 'Granted' : 'Not Granted'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Marketing Consent:</span> {manager.consent.marketing ? 'Opted In' : 'Opted Out'}
                        </p>
                        {manager.consent.date && (
                          <p className="text-sm md:col-span-2">
                            <span className="font-medium">Consent Date:</span> {new Date(manager.consent.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Summary
                </CardTitle>
                <CardDescription>
                  Account status and key information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={getStatusBadgeVariant(manager.status)}>
                      {manager.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge variant="secondary">
                      Manager
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Verified</span>
                    {manager.verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Manager ID</span>
                    <span className="text-sm font-mono">{manager._id.slice(-8)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Account Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Created:</span> {new Date(manager.createdAt).toLocaleDateString()}</p>
                    <p><span className="text-muted-foreground">Updated:</span> {new Date(manager.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Manager-specific metrics */}
                {manager.teamSize && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Management Metrics</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Team Size:</span> {manager.teamSize} members</p>
                        {manager.performanceRating && (
                          <p><span className="text-muted-foreground">Performance:</span> {manager.performanceRating}/5</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance History */}
          <UserAttendanceTable userId={managerId} userName={manager.name} />
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      {manager.qrCode && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          qrCodeData={manager.qrCode}
          userName={manager.name}
        />
      )}

      {/* Edit Manager Modal */}
      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateManager}
        initialData={{
          name: manager.name,
          email: manager.email,
          contactNo: manager.contactNo,
          role: manager.role as 'member' | 'staff' | 'manager',
          status: manager.status as 'active' | 'inactive' | 'expired',
          dob: manager.dob,
          address: manager.profile?.address,
          emergencyContact: manager.profile?.emergencyContact,
        }}
        mode="edit"
        title="Edit Manager Information"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Manager"
        description="Are you sure you want to delete this manager? This action cannot be undone."
        confirmText="Delete Manager"
        cancelText="Cancel"
      />
    </div>
  )
}
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
  Edit,
  Trash2
} from 'lucide-react'
import { getUserById, deleteUser, updateUser } from '@/lib/api/userApi'
import { QRCodeModal } from '@/components/QRCodeModal'
import { UserFormModal } from '@/components/UserFormModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { UserAttendanceTable } from '@/components/UserAttendanceTable'

interface StaffDetails {
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

export default function StaffDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const staffId = params.id as string

  const [staff, setStaff] = useState<StaffDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const fetchStaffDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getUserById(staffId)

      if (response.success && response.data) {
        setStaff(response.data as StaffDetails)
      } else {
        setError(response.message || 'Failed to fetch staff details')
      }
    } catch (err) {
      console.error('Error fetching staff details:', err)
      setError('Failed to load staff details')
    } finally {
      setLoading(false)
    }
  }, [staffId])

  useEffect(() => {
    if (staffId) {
      fetchStaffDetails()
    }
  }, [staffId, fetchStaffDetails])

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

  const handleEditStaff = () => {
    setShowEditModal(true)
  }

  const handleDeleteStaff = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await deleteUser(staffId)
      if (response.success) {
        // After successful deletion, redirect back to staff list
        router.push('/dashboard/users/staff')
      } else {
        setError(response.message || 'Failed to delete staff member')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      setError('Failed to delete staff member')
    }
  }

  const handleUpdateStaff = async (data: any) => {
    try {
      const response = await updateUser(staffId, data)
      if (response.success) {
        // After successful update, refresh the data
        await fetchStaffDetails()
      } else {
        setError(response.message || 'Failed to update staff member')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      setError('Failed to update staff member')
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
            Back to Staff
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading staff details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !staff) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Staff
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Staff</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'Staff member not found'}
              </p>
              <Button onClick={() => router.back()}>
                Back to Staff
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
            Back to Staff
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Staff Details</h2>
          <p className="text-muted-foreground">
            Complete information for {staff.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleEditStaff}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Information
          </Button>
          {staff.qrCode && (
            <Button variant="outline" onClick={() => setShowQRModal(true)}>
              View QR Code
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteStaff}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Staff
          </Button>
        </div>
      </div>

      {/* Staff Overview */}
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
                    <AvatarImage src={staff.profile?.avatar || "/avatars/user.jpg"} alt={staff.name} />
                    <AvatarFallback className="text-lg">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold">{staff.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Staff
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(staff.status)}>
                        {staff.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Staff since {new Date(staff.createdAt).toLocaleDateString()}
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
                    <p className="font-medium">{staff.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </div>
                    <p className="font-medium">{staff.contactNo}</p>
                  </div>

                  {staff.dob && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </div>
                      <p className="font-medium">
                        {new Date(staff.dob).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Verification Status
                    </div>
                    <p className="font-medium">
                      {staff.verified ? (
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
                      {new Date(staff.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </div>
                    <p className="font-medium">
                      {new Date(staff.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Employment Information */}
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Employment Information</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {staff.employeeId && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          Employee ID
                        </div>
                        <p className="font-medium">{staff.employeeId}</p>
                      </div>
                    )}

                    {staff.department && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          Department
                        </div>
                        <p className="font-medium">{staff.department}</p>
                      </div>
                    )}

                    {staff.position && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          Position
                        </div>
                        <p className="font-medium">{staff.position}</p>
                      </div>
                    )}

                    {staff.hireDate && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Hire Date
                        </div>
                        <p className="font-medium">
                          {new Date(staff.hireDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {staff.manager && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          Manager
                        </div>
                        <p className="font-medium">{staff.manager}</p>
                      </div>
                    )}

                    {staff.salary && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          Salary
                        </div>
                        <p className="font-medium">LKR {staff.salary.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                {staff.profile?.address && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Address
                      </div>
                      <p className="font-medium">{staff.profile.address}</p>
                    </div>
                  </>
                )}

                {/* Emergency Contact */}
                {staff.profile?.emergencyContact && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Emergency Contact</h4>
                      <p className="text-sm">{staff.profile.emergencyContact}</p>
                    </div>
                  </>
                )}

                {/* Consent Information */}
                {staff.consent && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Privacy & Consent</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        <p className="text-sm">
                          <span className="font-medium">GDPR Consent:</span> {staff.consent.gdpr ? 'Granted' : 'Not Granted'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Marketing Consent:</span> {staff.consent.marketing ? 'Opted In' : 'Opted Out'}
                        </p>
                        {staff.consent.date && (
                          <p className="text-sm md:col-span-2">
                            <span className="font-medium">Consent Date:</span> {new Date(staff.consent.date).toLocaleDateString()}
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
                    <Badge variant={getStatusBadgeVariant(staff.status)}>
                      {staff.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge variant="secondary">
                      Staff
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Verified</span>
                    {staff.verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Staff ID</span>
                    <span className="text-sm font-mono">{staff._id.slice(-8)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Account Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Created:</span> {new Date(staff.createdAt).toLocaleDateString()}</p>
                    <p><span className="text-muted-foreground">Updated:</span> {new Date(staff.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance History */}
          <UserAttendanceTable userId={staffId} userName={staff.name} />
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      {staff.qrCode && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          qrCodeData={staff.qrCode}
          userName={staff.name}
        />
      )}

      {/* Edit Staff Modal */}
      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateStaff}
        initialData={{
          name: staff.name,
          email: staff.email,
          contactNo: staff.contactNo,
          role: staff.role as 'member' | 'staff' | 'manager',
          status: staff.status as 'active' | 'inactive' | 'expired',
          dob: staff.dob,
          address: staff.profile?.address,
          emergencyContact: staff.profile?.emergencyContact,
        }}
        mode="edit"
        title="Edit Staff Information"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Staff Member"
        description="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText="Delete Staff"
        cancelText="Cancel"
      />
    </div>
  )
}
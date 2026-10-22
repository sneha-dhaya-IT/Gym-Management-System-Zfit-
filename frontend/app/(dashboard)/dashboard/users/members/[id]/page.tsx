"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  Edit,
  Trash2
} from 'lucide-react'
import { getUserById, deleteUser, updateUser } from '@/lib/api/userApi'
import { QRCodeModal } from '@/components/QRCodeModal'
import { UserFormModal } from '@/components/UserFormModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { UserAttendanceTable } from '@/components/UserAttendanceTable'
import { UserPaymentTable } from '@/components/UserPaymentTable'

interface MemberDetails {
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
  fitnessGoals?: string[]
}

export default function MemberDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const memberId = params.id as string

  // Get tab from URL query parameter, default to 'personal'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal')

  // Update active tab when search params change
  useEffect(() => {
    const tab = searchParams.get('tab') || 'personal'
    setActiveTab(tab)
  }, [searchParams])

  const [member, setMember] = useState<MemberDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const fetchMemberDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getUserById(memberId)

      if (response.success && response.data) {
        setMember(response.data as MemberDetails)
      } else {
        setError(response.message || 'Failed to fetch member details')
      }
    } catch (err) {
      console.error('Error fetching member details:', err)
      setError('Failed to load member details')
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    if (memberId) {
      fetchMemberDetails()
    }
  }, [memberId, fetchMemberDetails])

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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'member':
        return 'default'
      case 'staff':
        return 'secondary'
      case 'manager':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const handleEditMember = () => {
    setShowEditModal(true)
  }

  const handleDeleteMember = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await deleteUser(memberId)
      if (response.success) {
        // After successful deletion, redirect back to members list
        router.push('/dashboard/users/members')
      } else {
        setError(response.message || 'Failed to delete member')
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      setError('Failed to delete member')
    }
  }

  const handleUpdateMember = async (data: any) => {
    try {
      const response = await updateUser(memberId, data)
      if (response.success) {
        // After successful update, refresh the data
        await fetchMemberDetails()
      } else {
        setError(response.message || 'Failed to update member')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      setError('Failed to update member')
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
            Back to Members
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading member details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Member</h3>
              <p className="text-muted-foreground mb-4">
                {error || 'Member not found'}
              </p>
              <Button onClick={() => router.back()}>
                Back to Members
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
            Back to Members
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Member Details</h2>
          <p className="text-muted-foreground">
            Complete information for {member.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleEditMember}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Information
          </Button>
          {member.qrCode && (
            <Button variant="outline" onClick={() => setShowQRModal(true)}>
              View QR Code
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteMember}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Member
          </Button>
        </div>
      </div>

      {/* Member Overview */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
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
                    <AvatarImage src={member.profile?.avatar || "/avatars/user.jpg"} alt={member.name} />
                    <AvatarFallback className="text-lg">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold">{member.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(member.status)}>
                        {member.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(member.createdAt).toLocaleDateString()}
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
                    <p className="font-medium">{member.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </div>
                    <p className="font-medium">{member.contactNo}</p>
                  </div>

                  {member.dob && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </div>
                      <p className="font-medium">
                        {new Date(member.dob).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Verification Status
                    </div>
                    <p className="font-medium">
                      {member.verified ? (
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
                      {new Date(member.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Account Created
                    </div>
                    <p className="font-medium">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Address */}
                {member.profile?.address && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Address
                      </div>
                      <p className="font-medium">{member.profile.address}</p>
                    </div>
                  </>
                )}

                {/* Fitness Goals */}
                {member.fitnessGoals && member.fitnessGoals.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Fitness Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {member.fitnessGoals.map((goal, index) => (
                          <Badge key={index} variant="secondary">{goal}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Emergency Contact */}
                {member.profile?.emergencyContact && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Emergency Contact</h4>
                      <p className="text-sm">{member.profile.emergencyContact}</p>
                    </div>
                  </>
                )}

                {/* Consent Information */}
                {member.consent && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">Privacy & Consent</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        <p className="text-sm">
                          <span className="font-medium">GDPR Consent:</span> {member.consent.gdpr ? 'Granted' : 'Not Granted'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Marketing Consent:</span> {member.consent.marketing ? 'Opted In' : 'Opted Out'}
                        </p>
                        {member.consent.date && (
                          <p className="text-sm md:col-span-2">
                            <span className="font-medium">Consent Date:</span> {new Date(member.consent.date).toLocaleDateString()}
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
                    <Badge variant={getStatusBadgeVariant(member.status)}>
                      {member.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Verified</span>
                    {member.verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Member ID</span>
                    <span className="text-sm font-mono">{member._id.slice(-8)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Account Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Created:</span> {new Date(member.createdAt).toLocaleDateString()}</p>
                    <p><span className="text-muted-foreground">Updated:</span> {new Date(member.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance History */}
          <UserAttendanceTable userId={memberId} userName={member.name} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Payment History */}
          <UserPaymentTable userId={memberId} userName={member.name} />
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      {member.qrCode && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          qrCodeData={member.qrCode}
          userName={member.name}
        />
      )}

      {/* Edit Member Modal */}
      <UserFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateMember}
        initialData={{
          name: member.name,
          email: member.email,
          contactNo: member.contactNo,
          role: member.role as 'member' | 'staff' | 'manager',
          status: member.status as 'active' | 'inactive' | 'expired',
          dob: member.dob,
          address: member.profile?.address,
          emergencyContact: member.profile?.emergencyContact,
        }}
        mode="edit"
        title="Edit Member Information"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Member"
        description="Are you sure you want to delete this member? This action cannot be undone."
        confirmText="Delete Member"
        cancelText="Cancel"
      />
    </div>
  )
}
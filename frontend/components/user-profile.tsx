"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Settings,
  Edit,
  Shield,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserById, updateUser } from "@/lib/api/userApi"
import { UserFormModal, UpdateUserFormData } from "@/components/UserFormModal"
import { QRCodeModal } from "@/components/QRCodeModal"
import { authApi } from "@/lib/api/authApi"

interface UserProfileData {
  _id?: string
  name?: string
  email?: string
  contactNo?: string
  role?: 'member' | 'staff' | 'manager'
  status?: 'active' | 'inactive' | 'expired'
  verified?: boolean
  dateOfBirth?: string
  address?: string
  emergencyContact?: {
    name?: string
    phone?: string
  }
  profile?: {
    avatar?: string
    address?: string
    emergencyContact?: string
  }
  consent?: {
    gdpr?: boolean
    marketing?: boolean
    date?: string
  }
  qrCode?: string
  joinDate?: string
  lastLogin?: string
  updatedAt?: string
  fitnessGoals?: string[]
  employeeId?: string
  manager?: string
  salary?: number
  hireDate?: string
}

interface Payment {
  _id?: string
  transactionId?: string
  type?: string
  amount?: number
  currency?: string
  status?: 'completed' | 'pending' | 'failed' | 'refunded'
  date?: string
  description?: string
}

interface UserProfileProps {
  profileData?: UserProfileData
  payments?: Payment[]
  showEditButton?: boolean
  showFitnessStats?: boolean
  showPaymentHistory?: boolean
  showAccountSettings?: boolean
  className?: string
}

const getStatusBadge = (status?: string) => {
  if (!status) return <Badge variant="outline">N/A</Badge>

  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    inactive: "secondary",
    expired: "destructive",
    cancelled: "outline",
  }
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

const getRoleBadge = (role?: string) => {
  if (!role) return <Badge variant="outline">N/A</Badge>

  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    member: "default",
    staff: "secondary",
    manager: "destructive",
  }
  return <Badge variant={variants[role] || "outline"}>{role}</Badge>
}

const getPaymentStatusBadge = (status?: string) => {
  if (!status) return <Badge variant="outline">N/A</Badge>

  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    completed: "default",
    pending: "secondary",
    failed: "destructive",
    refunded: "outline",
  }
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

const getPaymentStatusIcon = (status?: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

export function UserProfile({
  profileData: initialProfileData,
  payments = [],
  showEditButton = true,
  showFitnessStats = true,
  showPaymentHistory = true,
  showAccountSettings = true,
  className = ""
}: UserProfileProps) {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<UserProfileData | undefined>(initialProfileData)
  const [loading, setLoading] = useState(!initialProfileData)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [resetPasswordMessage, setResetPasswordMessage] = useState<string | null>(null)
  const [verifyEmailLoading, setVerifyEmailLoading] = useState(false)
  const [verifyEmailMessage, setVerifyEmailMessage] = useState<string | null>(null)

  // Fetch user profile data if not provided via props
  useEffect(() => {
    if (initialProfileData) {
      setProfileData(initialProfileData)
      return
    }

    const fetchUserProfile = async () => {
      if (!user?._id) {
        setError("User ID not found")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await getUserById(user._id)

        if (response.success && response.data) {
          // Map API response to profileData format
          const userData = response.data as any // Type assertion for API response
          const mappedData: UserProfileData = {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            contactNo: userData.contactNo,
            role: userData.role,
            status: userData.status,
            verified: userData.verified,
            dateOfBirth: (() => {
              if (!userData.dob) return undefined;
              try {
                const date = new Date(userData.dob);
                if (isNaN(date.getTime())) return undefined;
                return date.toISOString().substring(0, 10);
              } catch {
                return undefined;
              }
            })(),
            address: userData.profile?.address,
            profile: {
              avatar: userData.profile?.avatar,
              address: userData.profile?.address,
              emergencyContact: userData.profile?.emergencyContact,
            },
            consent: {
              gdpr: userData.consent?.gdpr,
              marketing: userData.consent?.marketing,
              date: userData.consent?.date ? new Date(userData.consent.date).toISOString() : undefined,
            },
            qrCode: userData.qrCode,
            joinDate: new Date(userData.createdAt).toISOString().split('T')[0],
            updatedAt: new Date(userData.updatedAt).toISOString(),
          }
          setProfileData(mappedData)
        } else {
          setError(response.message || "Failed to fetch user profile")
        }
      } catch (err) {
        console.error("Error fetching user profile:", err)
        setError("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user?._id, initialProfileData])

  const handleSaveProfile = async (formData: UpdateUserFormData) => {
    if (!profileData?._id) {
      throw new Error("User ID not found")
    }

    // Call the update API
    await updateUser(profileData._id, formData)
    
    // Refresh the profile data
    const response = await getUserById(profileData._id)
    if (response.success && response.data) {
      const userData = response.data as any
      const mappedData: UserProfileData = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        contactNo: userData.contactNo,
        role: userData.role,
        status: userData.status,
        verified: userData.verified,
        dateOfBirth: (() => {
          if (!userData.dob) return undefined;
          try {
            const date = new Date(userData.dob);
            if (isNaN(date.getTime())) return undefined;
            return date.toISOString().substring(0, 10);
          } catch {
            return undefined;
          }
        })(),
        address: userData.profile?.address,
        profile: {
          avatar: userData.profile?.avatar,
          address: userData.profile?.address,
          emergencyContact: userData.profile?.emergencyContact,
        },
        consent: {
          gdpr: userData.consent?.gdpr,
          marketing: userData.consent?.marketing,
          date: userData.consent?.date ? new Date(userData.consent.date).toISOString() : undefined,
        },
        qrCode: userData.qrCode,
        joinDate: new Date(userData.createdAt).toISOString().split('T')[0],
        updatedAt: new Date(userData.updatedAt).toISOString(),
      }
      setProfileData(mappedData)
    }
  }

  const handleResetPassword = async () => {
    if (!profileData?.email) {
      setResetPasswordMessage("Email address not found")
      return
    }

    try {
      setResetPasswordLoading(true)
      setResetPasswordMessage(null)

      const response = await authApi.sendPasswordResetEmail(profileData.email)

      if (response.message) {
        setResetPasswordMessage("Password reset email sent successfully! Please check your inbox.")
      } else {
        setResetPasswordMessage("Failed to send password reset email")
      }
    } catch (error) {
      console.error("Error sending password reset email:", error)
      setResetPasswordMessage("Failed to send password reset email. Please try again.")
    } finally {
      setResetPasswordLoading(false)
    }
  }

  const handleSendEmailVerification = async () => {
    if (!profileData?.email) {
      setVerifyEmailMessage("Email address not found")
      return
    }

    try {
      setVerifyEmailLoading(true)
      setVerifyEmailMessage(null)

      const response = await authApi.sendEmailVerification(profileData.email)

      if (response.message) {
        setVerifyEmailMessage("Email verification sent successfully! Please check your inbox.")
      } else {
        setVerifyEmailMessage("Failed to send email verification")
      }
    } catch (error) {
      console.error("Error sending email verification:", error)
      setVerifyEmailMessage("Failed to send email verification. Please try again.")
    } finally {
      setVerifyEmailLoading(false)
    }
  }

  const isMember = profileData?.role === 'member'
  const isStaff = profileData?.role === 'staff' || profileData?.role === 'manager'

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!profileData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No profile data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Profile</h2>
          <p className="text-muted-foreground">
            View and manage user account information.
          </p>
        </div>
        {showEditButton && (
          <Button onClick={() => setEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}

        <UserFormModal
          isOpen={editing}
          onClose={() => setEditing(false)}
          onSubmit={handleSaveProfile}
          initialData={{
            name: profileData?.name,
            email: profileData?.email,
            contactNo: profileData?.contactNo,
            role: profileData?.role,
            status: profileData?.status,
            dob: profileData?.dateOfBirth,
            address: profileData?.address,
            emergencyContact: profileData?.profile?.emergencyContact,
          }}
          mode="edit"
          title="Edit Profile"
        />
      </div>

      {/* Profile Overview */}
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
                <AvatarImage src={profileData?.profile?.avatar || "/avatars/user.jpg"} alt={profileData?.name || 'User'} />
                <AvatarFallback className="text-lg">
                  {profileData?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold">{profileData?.name || 'N/A'}</h3>
                <div className="flex items-center gap-2">
                  {getRoleBadge(profileData?.role)}
                  {getStatusBadge(profileData?.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Joined {profileData?.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
                <p className="font-medium">{profileData?.email || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </div>
                <p className="font-medium">{profileData?.contactNo || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </div>
                <p className="font-medium">
                  {profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not set'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Verification Status
                </div>
                <p className="font-medium">
                  {profileData?.verified !== undefined ? (
                    profileData.verified ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Pending Verification
                      </span>
                    )
                  ) : 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last Updated
                </div>
                <p className="font-medium">
                  {profileData?.updatedAt ? new Date(profileData.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {/* Role-specific fields */}
              {isMember && (
                <>
                </>
              )}

              {isStaff && (
                <>
                </>
              )}
            </div>

            {/* Fitness Goals for Members */}
            {isMember && profileData?.fitnessGoals && profileData.fitnessGoals.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Fitness Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.fitnessGoals.map((goal, index) => (
                      <Badge key={index} variant="secondary">{goal}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Emergency Contact */}
            {(profileData?.emergencyContact || profileData?.profile?.emergencyContact) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Emergency Contact</h4>
                  {profileData.emergencyContact ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <p className="text-sm"><span className="font-medium">Name:</span> {profileData.emergencyContact.name || 'N/A'}</p>
                      <p className="text-sm"><span className="font-medium">Phone:</span> {profileData.emergencyContact.phone || 'N/A'}</p>
                    </div>
                  ) : (
                    <p className="text-sm"><span className="font-medium">Contact:</span> {profileData.profile?.emergencyContact || 'N/A'}</p>
                  )}
                </div>
              </>
            )}

            {/* Consent Information */}
            {profileData?.consent && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Privacy & Consent</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <p className="text-sm">
                      <span className="font-medium">GDPR Consent:</span> {profileData.consent.gdpr ? 'Granted' : 'Not Granted'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Marketing Consent:</span> {profileData.consent.marketing ? 'Opted In' : 'Opted Out'}
                    </p>
                    <p className="text-sm md:col-span-2">
                      <span className="font-medium">Consent Date:</span> {profileData.consent.date ? new Date(profileData.consent.date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Settings */}
        {showAccountSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage account preferences and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleResetPassword}
                disabled={resetPasswordLoading}
              >
                <Lock className="mr-2 h-4 w-4" />
                {resetPasswordLoading ? "Sending..." : "Reset Password"}
              </Button>

              {resetPasswordMessage && (
                <p className={`text-sm ${resetPasswordMessage.includes("successfully") ? "text-[#AAFF69]" : "text-red-600"}`}>
                  {resetPasswordMessage}
                </p>
              )}

              {profileData?.verified === false && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleSendEmailVerification}
                    disabled={verifyEmailLoading}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {verifyEmailLoading ? "Sending..." : "Verify Email"}
                  </Button>

                  {verifyEmailMessage && (
                    <p className={`text-sm ${verifyEmailMessage.includes("successfully") ? "text-[#AAFF69]" : "text-red-600"}`}>
                      {verifyEmailMessage}
                    </p>
                  )}
                </>
              )}

              {profileData?.qrCode && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowQRModal(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View QR Code
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Payment History - Only for Members */}
      {showPaymentHistory && isMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              Recent payment transactions and billing history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-medium">{payment.description || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{payment.type || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">
                        {payment.currency || 'LKR'} {payment.amount?.toFixed(2) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(payment.status)}
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                      </TableCell>
                      <TableCell>{payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No payment history found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Code Modal */}
      {profileData?.qrCode && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          qrCodeData={profileData.qrCode}
          userName={profileData.name}
        />
      )}
    </div>
  )
}
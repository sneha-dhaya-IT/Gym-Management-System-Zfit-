"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  RefreshCw,
  Play,
  RotateCcw,
  Eye,
  X
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { membershipApi, type Membership } from "@/lib/api/membershipApi"

export default function MyMembershipsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [membershipToCancel, setMembershipToCancel] = useState<Membership | null>(null)

  const fetchMemberships = useCallback(async () => {
    if (!user?._id) {
      console.log('No user ID available for fetching memberships')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('Fetching memberships for user:', user._id)
      const response = await membershipApi.getUserMemberships(user._id)
      console.log('Memberships API response:', response)
      setMemberships(response.data || [])
      console.log('Memberships set:', response.data || [])
    } catch (err) {
      console.error('Failed to fetch memberships:', err)
      setError('Failed to load your memberships. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchMemberships()
  }, [fetchMemberships])

  console.log('Component render - memberships:', memberships)
  console.log('Component render - memberships.length:', memberships.length)
  console.log('Component render - loading:', loading)

  const getStatusBadge = (status: Membership['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
      case 'paused':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <PauseCircle className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (endDate: string, status: Membership['status']) => {
    if (status !== 'active') return null

    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Expires today'
    if (diffDays === 1) return '1 day left'
    return `${diffDays} days left`
  }

  const handlePauseMembership = async (membershipId: string) => {
    try {
      setActionLoading(membershipId)
      await membershipApi.pauseMembership(membershipId, { reason: 'Paused by user' })
      await fetchMemberships() // Refresh the data
      console.log('Membership paused successfully')
    } catch (error) {
      console.error('Failed to pause membership:', error)
      setError('Failed to pause membership. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResumeMembership = async (membershipId: string) => {
    try {
      setActionLoading(membershipId)
      await membershipApi.resumeMembership(membershipId)
      await fetchMemberships() // Refresh the data
      console.log('Membership resumed successfully')
    } catch (error) {
      console.error('Failed to resume membership:', error)
      setError('Failed to resume membership. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRenewMembership = (membership: Membership) => {
    // Get the membership plan ID to redirect to the purchase page
    const membershipPlan = typeof membership.membershipPlanId === 'object' && membership.membershipPlanId !== null
      ? membership.membershipPlanId
      : null

    if (membershipPlan?._id) {
      // Redirect to the membership plans page with the specific plan ID
      router.push(`/memberDashboard/memberships/browse?planId=${membershipPlan._id}&renew=true`)
    } else {
      // Redirect to the general browse page if no specific plan ID
      router.push('/memberDashboard/memberships/browse')
    }
  }

  const handleCancelMembership = (membership: Membership) => {
    setMembershipToCancel(membership)
    setIsCancelDialogOpen(true)
  }

  const confirmCancelMembership = async () => {
    if (!membershipToCancel) return

    try {
      setActionLoading(membershipToCancel._id)
      await membershipApi.cancelMembership(membershipToCancel._id, { 
        reason: cancelReason || 'Cancelled by user' 
      })
      await fetchMemberships() // Refresh the data
      setIsCancelDialogOpen(false)
      setMembershipToCancel(null)
      setCancelReason('')
      console.log('Membership cancelled successfully')
    } catch (error) {
      console.error('Failed to cancel membership:', error)
      setError('Failed to cancel membership. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (membership: Membership) => {
    setSelectedMembership(membership)
    setIsDetailsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Memberships</h2>
          <p className="text-muted-foreground">
            View and manage your gym memberships
          </p>
        </div>

        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Memberships</h2>
          <p className="text-muted-foreground">
            View and manage your gym memberships
          </p>
        </div>

        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>

        <Button onClick={fetchMemberships} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Memberships</h2>
          <p className="text-muted-foreground">
            View and manage your gym memberships
          </p>
        </div>
        
      </div>

      
      {memberships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Memberships Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don&apos;t have any memberships yet. Browse available membership plans to get started.
            </p>
            <Button onClick={() => router.push('/memberDashboard/memberships/browse')}>
              Browse Memberships
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {memberships.map((membership) => {
            const membershipPlan = typeof membership.membershipPlanId === 'object' && membership.membershipPlanId !== null
              ? membership.membershipPlanId
              : null
            const daysRemaining = getDaysRemaining(membership.endDate, membership.status)

            return (
              <Card key={membership._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {membershipPlan?.name || 'Membership Plan'}
                      </CardTitle>
                      <CardDescription>
                        {membershipPlan?.category && `${membershipPlan.category} • `}
                        {membershipPlan?.durationInDays} days duration
                      </CardDescription>
                    </div>
                    {getStatusBadge(membership.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Start Date
                      </div>
                      <p className="font-medium">{formatDate(membership.startDate)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        End Date
                      </div>
                      <p className="font-medium">{formatDate(membership.endDate)}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Status
                      </div>
                      <div className="flex items-center gap-2">
                        {daysRemaining && membership.status === 'active' && (
                          <Badge variant={daysRemaining.includes('Expired') ? 'destructive' : 'secondary'}>
                            {daysRemaining}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Price: {membershipPlan?.currency} {membershipPlan?.price}
                        {membership.transactionId && (
                          <span className="ml-4">
                            Transaction: {membership.transactionId}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {membership.status === 'active' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRenewMembership(membership)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Renew
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePauseMembership(membership._id)}
                              disabled={actionLoading === membership._id}
                            >
                              <PauseCircle className="w-3 h-3 mr-1" />
                              {actionLoading === membership._id ? 'Pausing...' : 'Pause'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelMembership(membership)}
                              disabled={actionLoading === membership._id}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {membership.status === 'paused' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResumeMembership(membership._id)}
                              disabled={actionLoading === membership._id}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              {actionLoading === membership._id ? 'Resuming...' : 'Resume'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelMembership(membership)}
                              disabled={actionLoading === membership._id}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {membership.status === 'expired' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleRenewMembership(membership)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Renew
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(membership)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  {membership.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {membership.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Membership Details</DialogTitle>
            <DialogDescription>
              Complete information about your membership
            </DialogDescription>
          </DialogHeader>
          
          {selectedMembership && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Membership Plan</Label>
                  <p className="text-lg font-semibold">
                    {typeof selectedMembership.membershipPlanId === 'object' && selectedMembership.membershipPlanId?.name || 'Membership Plan'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedMembership.status)}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{formatDate(selectedMembership.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                  <p className="font-medium">{formatDate(selectedMembership.endDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                  <p className="font-medium">
                    {typeof selectedMembership.membershipPlanId === 'object' && selectedMembership.membershipPlanId?.durationInDays || 0} days
                  </p>
                </div>
              </div>

              {/* Price & Transaction */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                  <p className="text-lg font-semibold">
                    {typeof selectedMembership.membershipPlanId === 'object' && selectedMembership.membershipPlanId ? 
                      `${selectedMembership.membershipPlanId.currency} ${selectedMembership.membershipPlanId.price}` : 'N/A'}
                  </p>
                </div>
                {selectedMembership.transactionId && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                    <p className="font-mono text-sm">{selectedMembership.transactionId}</p>
                  </div>
                )}
              </div>

              {/* Category & Auto Renewal */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="font-medium capitalize">
                    {typeof selectedMembership.membershipPlanId === 'object' && selectedMembership.membershipPlanId?.category || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Auto Renewal</Label>
                  <p className="font-medium">
                    {selectedMembership.autoRenew ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedMembership.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedMembership.notes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                  <p className="text-sm">{formatDate(selectedMembership.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm">{formatDate(selectedMembership.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Membership Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Membership</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this membership? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {membershipToCancel && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">
                  {typeof membershipToCancel.membershipPlanId === 'object' && membershipToCancel.membershipPlanId?.name || 'Membership Plan'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Valid until: {new Date(membershipToCancel.endDate).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason for cancellation (optional)</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Please let us know why you're cancelling..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCancelDialogOpen(false)
                setMembershipToCancel(null)
                setCancelReason('')
              }}
            >
              Keep Membership
            </Button>
            <Button 
              variant="outline" 
              onClick={confirmCancelMembership}
              disabled={actionLoading === membershipToCancel?._id}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {actionLoading === membershipToCancel?._id ? 'Cancelling...' : 'Cancel Membership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
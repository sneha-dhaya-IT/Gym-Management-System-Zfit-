"use client"

import { UserProfile } from "@/components/user-profile"

export default function DashboardProfilePage() {
  return (
    <UserProfile
      showFitnessStats={false} // Staff/manager dashboard doesn't show fitness stats
      showPaymentHistory={false} // Staff/manager dashboard doesn't show payment history
      showAccountSettings={true}
    />
  )
}
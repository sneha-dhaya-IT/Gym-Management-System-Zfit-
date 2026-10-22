"use client"

import { UserProfile } from "@/components/user-profile"

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <UserProfile
        payments={[]} // TODO: Fetch payments from API when needed
        showEditButton={true}
        showFitnessStats={false} // Generic profile doesn't show fitness stats by default
        showPaymentHistory={false} // Generic profile doesn't show payment history by default
        showAccountSettings={true}
      />
    </div>
  )
}
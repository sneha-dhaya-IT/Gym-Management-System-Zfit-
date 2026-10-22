"use client"

import { UserProfile } from "@/components/user-profile"

export default function MemberProfilePage() {
  return (
    <UserProfile
      showFitnessStats={false}
      showPaymentHistory={false}
      showAccountSettings={true}
    />
  )
}
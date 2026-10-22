"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to members page by default
    router.replace('/dashboard/users/members')
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Redirecting to Members...</p>
        </div>
      </div>
    </div>
  )
}
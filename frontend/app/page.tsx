"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect based on user role
        if (user.role === 'member') {
          router.push("/memberDashboard")
        } else {
          // staff or manager
          router.push("/dashboard")
        }
      } else {
        router.push("/auth/login")
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
    </div>
  )
}

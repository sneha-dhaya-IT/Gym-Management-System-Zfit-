"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, UserRole } from '@/lib/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requireAnyRole?: UserRole[]
  requireAllRoles?: UserRole[]
}

export function ProtectedRoute({
  children,
  requiredRole,
  requireAnyRole,
  requireAllRoles
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading, canAccess, hasAnyRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
        return
      }

      // Check single required role
      if (requiredRole && !canAccess(requiredRole)) {
        router.push('/dashboard') // Redirect to dashboard if insufficient permissions
        return
      }

      // Check if user has any of the required roles
      if (requireAnyRole && !hasAnyRole(requireAnyRole)) {
        router.push('/dashboard')
        return
      }

      // Check if user has all required roles (for complex permissions)
      if (requireAllRoles && !requireAllRoles.every(role => canAccess(role))) {
        router.push('/dashboard')
        return
      }
    }
  }, [isAuthenticated, user, isLoading, router, requiredRole, requireAnyRole, requireAllRoles, canAccess, hasAnyRole])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
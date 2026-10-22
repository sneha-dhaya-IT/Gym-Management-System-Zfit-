"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'member' | 'staff' | 'manager'
export type UserStatus = 'active' | 'inactive' | 'expired'

interface User {
  _id: string
  name: string
  email: string
  verified: boolean
  contactNo: string
  dob?: Date
  profile: {
    avatar?: string
    address?: string
    emergencyContact?: string
  }
  consent: {
    gdpr: boolean
    marketing: boolean
    date: Date
  }
  role: UserRole
  qrCode?: string
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  // Role-based helpers
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isMember: boolean
  isStaff: boolean
  isManager: boolean
  canAccess: (requiredRole: UserRole) => boolean
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  const login = (newToken: string, userData: User) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isLoading,
    // Role-based helpers
    hasRole: (role: UserRole) => user?.role === role,
    hasAnyRole: (roles: UserRole[]) => user ? roles.includes(user.role) : false,
    isMember: user?.role === 'member',
    isStaff: user?.role === 'staff',
    isManager: user?.role === 'manager',
    canAccess: (requiredRole: UserRole) => {
      const roleHierarchy: Record<UserRole, number> = {
        member: 1,
        staff: 2,
        manager: 3
      }
      return user ? roleHierarchy[user.role] >= roleHierarchy[requiredRole] : false
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export types for use in other components
export type { User, AuthContextType }
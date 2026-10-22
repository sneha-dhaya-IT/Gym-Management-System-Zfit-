"use client"

import { useAuth } from '@/lib/auth-context'

export function RoleBasedExample() {
  const {
    user,
    hasRole,
    hasAnyRole,
    isMember,
    isStaff,
    isManager,
    canAccess
  } = useAuth()

  if (!user) return null

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Role-Based Access Examples</h3>

      <div className="space-y-2">
        <p><strong>Current User:</strong> {user.name} ({user.role})</p>
        <p><strong>Status:</strong> {user.status}</p>
      </div>

      {/* Simple role checks */}
      {isMember && (
        <div className="p-3 bg-blue-100 border border-blue-300 rounded">
          <p className="text-blue-800">👤 Member-only content visible</p>
        </div>
      )}

      {isStaff && (
        <div className="p-3 bg-green-100 border border-green-300 rounded">
          <p className="text-green-800">👨‍💼 Staff-only content visible</p>
        </div>
      )}

      {isManager && (
        <div className="p-3 bg-purple-100 border border-purple-300 rounded">
          <p className="text-purple-800">👔 Manager-only content visible</p>
        </div>
      )}

      {/* Advanced role checks */}
      {hasAnyRole(['staff', 'manager']) && (
        <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
          <p className="text-yellow-800">Staff or Manager content visible</p>
        </div>
      )}

      {canAccess('staff') && (
        <div className="p-3 bg-indigo-100 border border-indigo-300 rounded">
          <p className="text-indigo-800">Content requiring at least Staff level access</p>
        </div>
      )}

      {/* Specific role checks */}
      {hasRole('manager') && (
        <div className="p-3 bg-red-100 border border-red-300 rounded">
          <p className="text-red-800">🔐 Admin/Manager only - sensitive operations</p>
        </div>
      )}
    </div>
  )
}
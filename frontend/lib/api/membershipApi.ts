const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Base request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    // Don't log 404 errors as they're expected when referenced data no longer exists
    if (!(error instanceof Error) || !error.message?.includes('404')) {
      console.error('API request failed:', error)
    }
    throw error
  }
}

export interface Membership {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  } | string | null
  membershipPlanId: {
    _id: string
    name: string
    price: number
    currency: string
    durationInDays: number
    category: string
  } | string | null
  startDate: string
  endDate: string
  status: 'active' | 'expired' | 'cancelled' | 'paused'
  transactionId?: string
  autoRenew: boolean
  renewalAttempts: number
  lastRenewalDate?: string
  cancellationDate?: string
  cancellationReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMembershipData {
  userId: string
  membershipPlanId: string
  startDate?: string
  transactionId?: string
  autoRenew?: boolean
  notes?: string
}

export interface UpdateMembershipData {
  endDate?: string
  status?: 'active' | 'expired' | 'cancelled' | 'paused'
  autoRenew?: boolean
  transactionId?: string
  notes?: string
}

export interface CancelMembershipData {
  reason?: string
}

export interface PauseMembershipData {
  reason?: string
}

export interface ExtendMembershipData {
  additionalDays: number
}

export const membershipApi = {
  // Get all memberships
  getAllMemberships: async (): Promise<{ success: boolean; data: Membership[] }> => {
    const response = await apiRequest<Membership[]>('/memberships')
    return response as { success: boolean; data: Membership[] }
  },

  // Get membership by ID
  getMembershipById: async (id: string): Promise<{ success: boolean; data: Membership }> => {
    const response = await apiRequest<Membership>(`/memberships/${id}`)
    return response as { success: boolean; data: Membership }
  },

  // Get user memberships
  getUserMemberships: async (userId: string): Promise<{ success: boolean; data: Membership[] }> => {
    const response = await apiRequest<Membership[]>(`/memberships/user/${userId}`)
    return response as { success: boolean; data: Membership[] }
  },

  // Get active memberships
  getActiveMemberships: async (): Promise<{ success: boolean; data: Membership[] }> => {
    const response = await apiRequest<Membership[]>('/memberships/active')
    return response as { success: boolean; data: Membership[] }
  },

  // Get expiring memberships
  getExpiringMemberships: async (days: number = 7): Promise<{ success: boolean; data: Membership[] }> => {
    const response = await apiRequest<Membership[]>(`/memberships/expiring?days=${days}`)
    return response as { success: boolean; data: Membership[] }
  },

  // Get user active membership
  getUserActiveMembership: async (userId: string): Promise<{ success: boolean; data: Membership | null }> => {
    const response = await apiRequest<Membership | null>(`/memberships/user/${userId}/active`)
    return response as { success: boolean; data: Membership | null }
  },

  // Create new membership
  createMembership: async (data: CreateMembershipData): Promise<{ success: boolean; message: string; data: Membership }> => {
    const response = await apiRequest<Membership>('/memberships', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: Membership }
  },

  // Update membership
  updateMembership: async (id: string, data: UpdateMembershipData): Promise<{ success: boolean; message: string; data: Membership }> => {
    const response = await apiRequest<Membership>(`/memberships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: Membership }
  },

  // Cancel membership
  cancelMembership: async (id: string, data: CancelMembershipData): Promise<{ success: boolean; message: string; data: Membership }> => {
    const response = await apiRequest<Membership>(`/memberships/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: Membership }
  },

  // Pause membership
  pauseMembership: async (id: string, data: PauseMembershipData): Promise<{ success: boolean; message: string; data: Membership }> => {
    const response = await apiRequest<Membership>(`/memberships/${id}/pause`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: Membership }
  },

  // Resume membership
  resumeMembership: async (id: string): Promise<{ success: boolean; message: string; data: Membership }> => {
    const response = await apiRequest<Membership>(`/memberships/${id}/resume`, {
      method: 'PUT',
    })
    return response as { success: boolean; message: string; data: Membership }
  },

  // Extend membership
  extendMembership: async (id: string, data: ExtendMembershipData): Promise<{ success: boolean; message: string; data: Membership }> => {
    const response = await apiRequest<Membership>(`/memberships/${id}/extend`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: Membership }
  },

  // Delete membership
  deleteMembership: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest(`/memberships/${id}`, {
      method: 'DELETE',
    })
    return response as { success: boolean; message: string }
  },
}
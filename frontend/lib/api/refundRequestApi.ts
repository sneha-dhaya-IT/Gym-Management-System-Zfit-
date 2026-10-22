const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Import types from paymentApi
interface User {
  _id: string
  name: string
  email: string
  contactNo: string
  role: string
  status: string
}

interface Payment {
  _id: string
  userId: string | User
  amount: number
  currency: string
  type: 'membership' | 'inventory' | 'booking' | 'other'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  method: 'card' | 'bank-transfer' | 'cash'
  relatedId: string
  transactionId: string
  gatewayTransactionId?: string
  gatewayPaymentId?: string
  gatewayResponse?: Record<string, unknown>
  failureReason?: string
  refundedAmount: number
  refundReason?: string
  date: string
  createdAt: string
  updatedAt: string
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

  // Add auth token if available
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Types
export interface RefundRequest {
  _id: string
  userId: string | User // Can be string or populated object
  paymentId: string | Payment // Can be string or populated object
  requestedAmount: number
  notes: string
  status: 'pending' | 'approved' | 'declined'
  adminNotes?: string
  requestId: string
  createdAt: string
  updatedAt: string
}

export interface CreateRefundRequestData {
  paymentId: string
  userId: string
  requestedAmount: number
  notes: string
}

export interface UpdateRefundRequestData {
  requestedAmount?: number
  notes?: string
  adminNotes?: string
}

// API Functions

// Create refund request (for users)
export const createRefundRequest = async (data: CreateRefundRequestData): Promise<RefundRequest> => {
  try {
    const response = await apiRequest<RefundRequest>('/refund-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.data) {
      throw new Error('Failed to create refund request')
    }
    return response.data
  } catch (error) {
    console.error('Error creating refund request:', error)
    throw error
  }
}

// Get all refund requests (for admin)
export const getRefundRequests = async (status?: string, populate?: string[]): Promise<RefundRequest[]> => {
  try {
    let query = status ? `?status=${status}` : '?'
    if (populate && populate.length > 0) {
      query += (status ? '&' : '') + `populate=${populate.join(',')}`
    }
    const endpoint = query === '?' ? '/refund-requests' : `/refund-requests${query}`
    const response = await apiRequest<RefundRequest[]>(endpoint)
    return response.data || []
  } catch (error) {
    console.error('Error fetching refund requests:', error)
    throw error
  }
}

// Get refund request by ID
export const getRefundRequestById = async (id: string): Promise<RefundRequest> => {
  try {
    const response = await apiRequest<RefundRequest>(`/refund-requests/${id}`)
    if (!response.data) {
      throw new Error('Refund request not found')
    }
    return response.data
  } catch (error) {
    console.error('Error fetching refund request:', error)
    throw error
  }
}

// Get refund requests by user (for user dashboard)
export const getRefundRequestsByUser = async (userId: string): Promise<RefundRequest[]> => {
  try {
    const response = await apiRequest<RefundRequest[]>(`/refund-requests/user/${userId}?populate=paymentId`)
    return response.data || []
  } catch (error) {
    console.error('Error fetching user refund requests:', error)
    throw error
  }
}

// Update refund request
export const updateRefundRequest = async (id: string, data: UpdateRefundRequestData): Promise<RefundRequest> => {
  try {
    const response = await apiRequest<RefundRequest>(`/refund-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.data) {
      throw new Error('Failed to update refund request')
    }
    return response.data
  } catch (error) {
    console.error('Error updating refund request:', error)
    throw error
  }
}

// Delete refund request
export const deleteRefundRequest = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/refund-requests/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Error deleting refund request:', error)
    throw error
  }
}

// Approve refund request (admin only)
export const approveRefundRequest = async (id: string, adminNotes?: string): Promise<RefundRequest> => {
  try {
    const response = await apiRequest<RefundRequest>(`/refund-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    })
    if (!response.data) {
      throw new Error('Failed to approve refund request')
    }
    return response.data
  } catch (error) {
    console.error('Error approving refund request:', error)
    throw error
  }
}

// Decline refund request (admin only)
export const declineRefundRequest = async (id: string, adminNotes?: string): Promise<RefundRequest> => {
  try {
    const response = await apiRequest<RefundRequest>(`/refund-requests/${id}/decline`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    })
    if (!response.data) {
      throw new Error('Failed to decline refund request')
    }
    return response.data
  } catch (error) {
    console.error('Error declining refund request:', error)
    throw error
  }
}

// Get pending requests count (for admin badge)
export const getPendingRequestsCount = async (): Promise<number> => {
  try {
    const response = await apiRequest<{ count: number }>('/refund-requests/count')
    return response.data?.count || 0
  } catch (error) {
    console.error('Error fetching pending requests count:', error)
    return 0
  }
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface MemberData {
  name: string
  email: string
  contactNo: string
  password?: string
  role?: 'member' | 'staff' | 'manager'
  status?: 'active' | 'inactive' | 'expired'
  consent?: {
    gdpr: boolean
    marketing: boolean
  }
}

export type { MemberData }

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
  const token = localStorage.getItem('authToken')
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

// Export the base API request function
export { apiRequest }

// User API functions
export const getUserById = (id: string) => apiRequest(`/users/${id}`)
export const getMembers = () => apiRequest('/users/members')
export const getStaff = () => apiRequest('/users/staff')
export const getManagers = () => apiRequest('/users/managers')

export const createUser = (userData: MemberData) => {
  console.log('API createUser called with:', { ...userData, password: '***masked***' })
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export const updateUser = (id: string, userData: Partial<MemberData>) =>
  apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  })

export const deleteUser = (id: string) =>
  apiRequest(`/users/${id}`, {
    method: 'DELETE',
  })

// Attendance API functions
export const checkIn = (qrToken: string, location?: string, notes?: string) =>
  apiRequest('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ qrToken, location, notes }),
  })

export const forceCheckIn = (memberQrToken: string, staffQrToken: string, location?: string, notes?: string) =>
  apiRequest('/attendance/force-check-in', {
    method: 'POST',
    body: JSON.stringify({ memberQrToken, staffQrToken, location, notes }),
  })

// Combined API service for backward compatibility
export const apiService = {
  getMembers,
  getStaff,
  getManagers,
  createUser,
  updateUser,
  deleteUser,
  checkIn,
  forceCheckIn,
}
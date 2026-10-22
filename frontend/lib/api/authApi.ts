const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

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
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Auth API functions
export const sendPasswordResetEmail = (email: string) =>
  apiRequest('/api/v1/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const sendEmailVerification = (email: string) =>
  apiRequest('/api/v1/auth/email/verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const validateResetCode = async (code: string) => {
  const url = `${API_BASE_URL}/api/v1/auth/password/validate/${code}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    // Don't log validation errors to console as invalid codes are expected
    throw error
  }
}

export const resetPassword = (password: string, verificationCode: string) =>
  apiRequest('/api/v1/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ password, verificationCode }),
  })

// Combined API service for backward compatibility
export const authApi = {
  sendPasswordResetEmail,
  sendEmailVerification,
  validateResetCode,
  resetPassword,
}
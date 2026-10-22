const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

interface TransactionData {
  itemId: string
  transactionType: 'IN' | 'OUT'
  quantity: number
  reason: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'EXPIRED'
  referenceId?: string
  notes?: string
}

interface Transaction {
  _id: string
  itemId: {
    _id: string
    name: string
    categoryID: string
  }
  transactionType: 'IN' | 'OUT'
  quantity: number
  reason: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'EXPIRED'
  referenceId?: string
  performedBy: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  notes?: string
  previousStock: number
  newStock: number
  createdAt: string
  updatedAt: string
}

interface TransactionHistory {
  transactions: Transaction[]
  totalCount: number
  currentPage: number
  totalPages: number
}

interface TransactionSummary {
  totalIn: number
  totalOut: number
  netChange: number
  transactionCount: number
  lastTransaction: Transaction | null
}

export type { TransactionData, Transaction, TransactionHistory, TransactionSummary }

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
    
    let data
    try {
      data = await response.json()
    } catch {
      // If JSON parsing fails, create a fallback error
      data = { message: `HTTP error! status: ${response.status}` }
    }

    if (!response.ok) {
      // Backend sends errors in 'error' field, successes in 'message' field
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`
      const error = new Error(errorMessage) as Error & {
        response?: {
          data: unknown
          status: number
          statusText: string
        }
        status?: number
      }
      error.response = { 
        data, 
        status: response.status,
        statusText: response.statusText 
      }
      error.status = response.status
      throw error
    }

    return data
  } catch (error: unknown) {
    console.error('API request failed:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        response: 'response' in error ? error.response : undefined,
        status: 'status' in error ? error.status : undefined
      })
      
      // If it's a network error, provide better context
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Network error - unable to connect to server'
      }
    }
    
    throw error
  }
}

// Transaction API functions
export const createTransaction = (transactionData: TransactionData) =>
  apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  })

export const getTransactionHistory = (filters: {
  itemId?: string
  userId?: string
  reason?: string
  transactionType?: 'IN' | 'OUT'
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
} = {}) => {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString())
    }
  })
  
  const queryString = params.toString()
  return apiRequest<TransactionHistory>(`/transactions${queryString ? `?${queryString}` : ''}`)
}

export const getItemTransactionSummary = (itemId: string) =>
  apiRequest<TransactionSummary>(`/transactions/item/${itemId}/summary`)

// Combined API service
export const transactionApiService = {
  createTransaction,
  getTransactionHistory,
  getItemTransactionSummary,
}
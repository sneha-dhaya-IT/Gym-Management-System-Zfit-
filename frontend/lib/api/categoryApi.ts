const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

interface CategoryData {
  name: string
  description?: string
}

interface Category {
  _id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type { CategoryData, Category }

// Base request function - EXACT SAME AS userApi.ts
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

// Category API functions - Updated for new API structure
export const getCategories = (includeInactive?: boolean) => {
  const params = includeInactive ? '?includeInactive=true' : ''
  return apiRequest<Category[]>(`/categories${params}`)
}

export const getCategoryById = (id: string) => 
  apiRequest<Category>(`/categories/${id}`)

export const createCategory = (categoryData: CategoryData) => {
  console.log('API createCategory called with:', categoryData)
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  })
}

export const updateCategory = (id: string, categoryData: Partial<CategoryData>) =>
  apiRequest<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  })

export const deleteCategory = (id: string) =>
  apiRequest<Category>(`/categories/${id}`, {
    method: 'DELETE',
  })

// Combined API service - Updated for new API structure
export const categoryApiService = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}
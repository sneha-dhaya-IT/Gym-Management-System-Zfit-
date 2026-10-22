const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

interface ItemData {
  name: string
  categoryID: string
  supplierID: string
  type: "sellable" | "equipment"
  
  // Sellable fields
  price?: number
  stock?: number
  expiryDate?: string
  lowStockAlert?: number
  
  // Equipment fields
  purchaseDate?: string
  maintenanceSchedule?: string
  warrantyPeriod?: string
}

interface Item {
  _id: string
  name: string
  categoryID: {
    _id: string
    name: string
    description?: string
  } | string
  supplierID: {
    _id: string
    supplierName: string
    supplierEmail: string
    supplierPhone: string
  } | string
  type: "sellable" | "equipment"
  isActive: boolean
  
  // Sellable fields
  price?: number
  stock?: number
  expiryDate?: string
  lowStockAlert?: number
  
  // Equipment fields
  purchaseDate?: string
  maintenanceSchedule?: string
  warrantyPeriod?: string
  
  createdAt: string
  updatedAt: string
}

export type { ItemData, Item }

// Base request function - EXACT SAME AS categoryApi.ts and supplierApi.ts
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
      data = { message: `HTTP error! status: ${response.status}` }
    }

    if (!response.ok) {
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
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Network error - unable to connect to server'
      }
    }
    
    throw error
  }
}

// Item API functions
export const itemApiService = {
  // Get all items (optionally filter by category)
  getItems: (categoryID?: string) => {
    const params = categoryID ? `?categoryID=${categoryID}` : ''
    return apiRequest<Item[]>(`/items${params}`)
  },

  // Get single item
  getItem: (id: string) => {
    return apiRequest<Item>(`/items/${id}`)
  },

  // Create new item
  createItem: (data: ItemData) => {
    console.log('API createItem called with:', data)
    return apiRequest<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update item
  updateItem: (id: string, data: Partial<ItemData>) => {
    console.log('API updateItem called with:', { id, data })
    return apiRequest<Item>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete item (soft delete)
  deleteItem: (id: string) => {
    console.log('API deleteItem called with ID:', id)
    return apiRequest<Item>(`/items/${id}`, {
      method: 'DELETE',
    })
  },
}
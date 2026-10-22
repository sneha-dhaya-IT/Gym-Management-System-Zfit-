const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface SupplierData {
  supplierName: string
  supplierEmail: string
  supplierPhone: string
  supplierAddress: string
}

export type { SupplierData }

// Base request function - EXACT SAME AS categoryApi.ts
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

// Supplier API functions
export const supplierApiService = {
  // Get all suppliers
  getSuppliers: () => apiRequest('/inventory/suppliers'),

  // Get supplier by ID
  getSupplier: (id: string) => apiRequest(`/inventory/suppliers/${id}`),

  // Create new supplier
  createSupplier: (supplierData: SupplierData) =>
    apiRequest('/inventory/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    }),

  // Update supplier
  updateSupplier: (id: string, supplierData: Partial<SupplierData>) =>
    apiRequest(`/inventory/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    }),

  // Delete supplier
  deleteSupplier: (id: string) =>
    apiRequest(`/inventory/suppliers/${id}`, {
      method: 'DELETE',
    }),
}
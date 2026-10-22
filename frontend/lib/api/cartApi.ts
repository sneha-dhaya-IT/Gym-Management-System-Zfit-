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
    console.error('API request failed:', error)
    throw error
  }
}

// Special request function for cart that handles 404 as empty cart
const cartApiRequest = async <T>(
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
    
    // Handle 404 for cart not found - return empty cart instead of error
    if (response.status === 404) {
      try {
        const data = await response.json()
        // Check if it's a cart not found error
        if (data.message === "Cart not found") {
          return {
            success: true,
            data: {
              _id: '',
              memberId: endpoint.split('/').pop() || '', // Extract member ID from endpoint
              items: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as T
          }
        }
      } catch {
        // If JSON parsing fails, still return empty cart for 404
        return {
          success: true,
          data: {
            _id: '',
            memberId: endpoint.split('/').pop() || '',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as T
        }
      }
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    // If this is a network error or other issue, check if it's for a cart endpoint
    if (endpoint.includes('/cart/') && error instanceof Error && error.message?.includes('404')) {
      return {
        success: true,
        data: {
          _id: '',
          memberId: endpoint.split('/').pop() || '',
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as T
      }
    }
    
    console.error('API request failed:', error)
    throw error
  }
}

export interface CartItem {
  itemId: {
    _id: string
    name: string
    categoryID: {
      _id: string
      name: string
    } | string
    supplierID: {
      _id: string
      supplierName: string
    } | string
    type: "sellable" | "equipment"
    isActive: boolean
    price?: number
    stock?: number
    expiryDate?: string
    lowStockAlert?: number
    purchaseDate?: string
    maintenanceSchedule?: string
    warrantyPeriod?: string
    createdAt: string
    updatedAt: string
  }
  quantity: number
  _id: string
}

export interface Cart {
  _id: string
  memberId: string
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

export interface AddToCartData {
  memberId: string
  itemId: string
  quantity: number
}

export interface UpdateCartData {
  quantity: number
}

export const cartApi = {
  // Get cart by member ID
  getCartByMember: async (memberId: string): Promise<{ success: boolean; data: Cart }> => {
    try {
      const response = await cartApiRequest<Cart>(`/inventory/cart/${memberId}`)
      return response as { success: boolean; data: Cart }
    } catch {
      // If there's any error, return an empty cart
      console.log('Cart not found, returning empty cart for member:', memberId)
      return {
        success: true,
        data: {
          _id: '',
          memberId: memberId,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    }
  },

  // Add item to cart
  addToCart: async (data: AddToCartData): Promise<{ success: boolean; message: string; data: Cart }> => {
    const response = await apiRequest<Cart>('/inventory/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: Cart }
  },

  // Update cart item quantity
  updateCartItem: async (
    memberId: string,
    itemId: string,
    data: UpdateCartData
  ): Promise<{ success: boolean; message: string; data: Cart }> => {
    const response = await apiRequest<Cart>(`/inventory/cart/${memberId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response as { success: boolean; message: string; data: Cart }
  },

  // Remove item from cart
  removeCartItem: async (
    memberId: string,
    itemId: string
  ): Promise<{ success: boolean; message: string; data: Cart }> => {
    const response = await apiRequest<Cart>(`/inventory/cart/${memberId}/items/${itemId}`, {
      method: 'DELETE',
    })
    return response as { success: boolean; message: string; data: Cart }
  },

  // Clear entire cart
  clearCart: async (memberId: string): Promise<{ success: boolean; message: string; data: Cart }> => {
    const response = await apiRequest<Cart>(`/inventory/cart/${memberId}/clear`, {
      method: 'DELETE',
    })
    return response as { success: boolean; message: string; data: Cart }
  },
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface StockUpdateData {
  quantity: number
  operation: "increment" | "decrement"
}

interface MaintenanceUpdateData {
  maintenanceStatus: "good" | "maintenance_required" | "under_repair"
  lastMaintenanceDate?: string
}

export type { StockUpdateData, MaintenanceUpdateData }

// Base request function - EXACT SAME AS other APIs
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

// Stock Management API functions
export const stockApiService = {
  // Update stock (increment or decrement)
  updateStock: (id: string, stockData: StockUpdateData) =>
    apiRequest(`/inventory/stock/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    }),

  // Get low stock items
  getLowStockItems: () => apiRequest('/inventory/stock/low-stock'),

  // Get maintenance alerts
  getMaintenanceAlerts: () => apiRequest('/inventory/stock/maintenance-alerts'),

  // Update maintenance status
  updateMaintenance: (id: string, maintenanceData: MaintenanceUpdateData) =>
    apiRequest(`/inventory/stock/${id}/maintenance`, {
      method: 'PUT',
      body: JSON.stringify(maintenanceData),
    }),
}

// Reports API functions
export const reportsApiService = {
  // Get stock levels report
  getStockLevelsReport: () => apiRequest('/inventory/reports/stock-levels'),

  // Get usage trends report
  getUsageTrendsReport: () => apiRequest('/inventory/reports/usage-trends'),
}
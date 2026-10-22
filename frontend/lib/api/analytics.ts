import { apiRequest } from '@/lib/apiRequest'

export interface DashboardOverview {
  totalRevenue: number
  monthlyRevenue: number
  totalMembers: number
  activeMembers: number
  totalAttendance: number
  monthlyAttendance: number
  totalInventoryValue: number
  lowStockItems: number
}

export interface FinanceAnalytics {
  totalRevenue: number
  monthlyRevenue: number
  revenueByMonth: Array<{ month: string; revenue: number }>
  paymentMethods: Record<string, number>
  refunds: {
    total: number
    pending: number
    processed: number
  }
}

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  userGrowth: Array<{ month: string; users: number }>
  membershipStats: {
    active: number
    expired: number
    expiringSoon: number
  }
  attendanceStats: {
    totalSessions: number
    averagePerUser: number
    peakHours: Array<{ hour: number; count: number }>
  }
}

export interface InventoryAnalytics {
  totalItems: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
  valueByCategory: Record<string, number>
  lowStockAlerts: Array<{
    itemId: string
    name: string
    currentStock: number
    minStock: number
  }>
}

export const getDashboardOverview = async (startDate?: string, endDate?: string): Promise<DashboardOverview> => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiRequest<DashboardOverview>(`/analytics/overview${query}`)
  return response.data!
}

export const getFinanceAnalytics = async (startDate?: string, endDate?: string): Promise<FinanceAnalytics> => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiRequest<FinanceAnalytics>(`/analytics/finance${query}`)
  return response.data!
}

export const getUserAnalytics = async (startDate?: string, endDate?: string): Promise<UserAnalytics> => {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiRequest<UserAnalytics>(`/analytics/users${query}`)
  return response.data!
}

export const getInventoryAnalytics = async (): Promise<InventoryAnalytics> => {
  const response = await apiRequest<InventoryAnalytics>('/analytics/inventory')
  return response.data!
}
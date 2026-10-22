import mongoose from 'mongoose'
import Payment from '../models/payment.model.js'
import User from '../models/user.model.js'
import InventoryItem from '../models/inventoryItem.schema.js'
import Attendance from '../models/attendance.model.js'
import Membership from '../models/membership.model.js'
import RefundRequest from '../models/refundRequest.model.js'

interface DateRange {
  startDate?: Date
  endDate?: Date
}

interface DashboardOverview {
  totalRevenue: number
  monthlyRevenue: number
  totalMembers: number
  activeMembers: number
  totalAttendance: number
  monthlyAttendance: number
  totalInventoryValue: number
  lowStockItems: number
  pendingRefunds: number
  revenueChange: number
  membersChange: number
  attendanceChange: number
}

interface FinanceAnalytics {
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

interface UserAnalytics {
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

interface InventoryAnalytics {
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

/**
 * Get dashboard overview metrics
 */
export const getDashboardOverviewService = async (dateRange?: DateRange): Promise<DashboardOverview> => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Revenue calculations
  const totalRevenue = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])

  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startOfMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])

  const lastMonthRevenue = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])

  // Member calculations
  const totalMembers = await User.countDocuments({ role: 'member' })
  const activeMembers = await Membership.countDocuments({
    status: 'active',
    endDate: { $gte: now }
  })

  // Attendance calculations
  const totalAttendance = await Attendance.countDocuments()
  const monthlyAttendance = await Attendance.countDocuments({
    date: { $gte: startOfMonth }
  })

  // Inventory calculations
  const inventoryItems = await InventoryItem.find({})
  const totalInventoryValue = inventoryItems.reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.stock || 0))
  }, 0)

  const lowStockItems = inventoryItems.filter(item =>
    (item.stock || 0) <= (item.lowStockAlert || 0)
  ).length

  // Pending refunds
  const pendingRefunds = await RefundRequest.countDocuments({ status: 'pending' })

  // Calculate changes
  const currentRevenue = monthlyRevenue[0]?.total || 0
  const previousRevenue = lastMonthRevenue[0]?.total || 0
  const revenueChange = previousRevenue > 0
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    monthlyRevenue: currentRevenue,
    totalMembers,
    activeMembers,
    totalAttendance,
    monthlyAttendance,
    totalInventoryValue,
    lowStockItems,
    pendingRefunds,
    revenueChange,
    membersChange: 0, // TODO: Calculate member growth
    attendanceChange: 0 // TODO: Calculate attendance change
  }
}

/**
 * Get finance analytics
 */
export const getFinanceAnalyticsService = async (dateRange?: DateRange): Promise<FinanceAnalytics> => {
  const matchFilter = dateRange?.startDate && dateRange?.endDate
    ? { createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate } }
    : {}

  // Revenue data
  const revenueData = await Payment.aggregate([
    { $match: { status: 'completed', ...matchFilter } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  const revenueTrend = revenueData.map(item => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    amount: item.amount
  }))

  // Payment statistics
  const paymentStats = await Payment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }
    }
  ])

  const payments = {
    total: paymentStats.reduce((sum, stat) => sum + stat.count, 0),
    completed: paymentStats.find(stat => stat._id === 'completed')?.count || 0,
    pending: paymentStats.find(stat => stat._id === 'pending')?.count || 0,
    failed: paymentStats.find(stat => stat._id === 'failed')?.count || 0,
    byMethod: {} as Record<string, number>,
    byType: {} as Record<string, number>
  }

  // Payment methods and types
  const methodStats = await Payment.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$method', count: { $sum: 1 } } }
  ])

  const typeStats = await Payment.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ])

  methodStats.forEach(stat => {
    payments.byMethod[stat._id] = stat.count
  })

  typeStats.forEach(stat => {
    payments.byType[stat._id] = stat.count
  })

  // Refund statistics
  const refundStats = await RefundRequest.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$refundedAmount' }
      }
    }
  ])

  const refunds = {
    total: refundStats.reduce((sum, stat) => sum + stat.count, 0),
    pending: refundStats.find(stat => stat._id === 'pending')?.count || 0,
    approved: refundStats.find(stat => stat._id === 'approved')?.count || 0,
    rejected: refundStats.find(stat => stat._id === 'rejected')?.count || 0,
    totalAmount: refundStats.reduce((sum, stat) => sum + (stat.totalAmount || 0), 0)
  }

  return {
    totalRevenue: revenueTrend.reduce((sum, item) => sum + item.amount, 0),
    monthlyRevenue: revenueTrend[revenueTrend.length - 1]?.amount || 0,
    revenueByMonth: revenueTrend.map(item => ({ month: item.month, revenue: item.amount })),
    paymentMethods: payments.byMethod,
    refunds: {
      total: refunds.total,
      pending: refunds.pending,
      processed: refunds.approved
    }
  }
}

/**
 * Get user analytics
 */
export const getUserAnalyticsService = async (dateRange?: DateRange): Promise<UserAnalytics> => {
  const now = new Date()

  // Member statistics
  const totalMembers = await User.countDocuments({ role: 'member' })
  const activeMembers = await Membership.countDocuments({
    status: 'active',
    endDate: { $gte: now }
  })

  // Member growth trend
  const memberGrowth = await User.aggregate([
    { $match: { role: 'member' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  const growthTrend = memberGrowth.map(item => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    count: item.count
  }))

  // Members by role
  const roleStats = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ])

  const byRole: Record<string, number> = {}
  roleStats.forEach(stat => {
    byRole[stat._id] = stat.count
  })

  // Attendance statistics
  const totalAttendance = await Attendance.countDocuments()

  const attendanceTrend = await Attendance.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    { $limit: 30 } // Last 30 days
  ])

  const attendanceData = attendanceTrend.map(item => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    count: item.count
  }))

  const monthlyAttendance = attendanceData.reduce((sum, item) => sum + item.count, 0)
  const averageDaily = attendanceData.length > 0 ? monthlyAttendance / attendanceData.length : 0

  // Membership statistics
  const membershipStats = await Membership.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  const memberships = {
    total: membershipStats.reduce((sum, stat) => sum + stat.count, 0),
    active: membershipStats.find(stat => stat._id === 'active')?.count || 0,
    expired: membershipStats.find(stat => stat._id === 'expired')?.count || 0,
    byPlan: {} as Record<string, number>
  }

  // Membership plans
  const planStats = await Membership.aggregate([
    {
      $lookup: {
        from: 'membershipplans',
        localField: 'planId',
        foreignField: '_id',
        as: 'plan'
      }
    },
    { $unwind: '$plan' },
    { $group: { _id: '$plan.name', count: { $sum: 1 } } }
  ])

  planStats.forEach(stat => {
    memberships.byPlan[stat._id] = stat.count
  })

  // Calculate new users this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newUsersThisMonth = await User.countDocuments({
    role: 'member',
    createdAt: { $gte: startOfMonth }
  })

  // Calculate expiring soon (next 30 days)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = await Membership.countDocuments({
    status: 'active',
    endDate: { $gte: now, $lte: thirtyDaysFromNow }
  })

  return {
    totalUsers: totalMembers,
    activeUsers: activeMembers,
    newUsersThisMonth,
    userGrowth: growthTrend.map(item => ({ month: item.month, users: item.count })),
    membershipStats: {
      active: memberships.active,
      expired: memberships.expired,
      expiringSoon
    },
    attendanceStats: {
      totalSessions: totalAttendance,
      averagePerUser: totalMembers > 0 ? totalAttendance / totalMembers : 0,
      peakHours: [] // TODO: Calculate peak hours
    }
  }
}

/**
 * Get inventory analytics
 */
export const getInventoryAnalyticsService = async (): Promise<InventoryAnalytics> => {
  const items = await InventoryItem.find({}).populate('categoryID')

  const total = items.length
  const inStock = items.filter(item => (item.stock || 0) > 0).length
  const lowStock = items.filter(item => (item.stock || 0) <= (item.lowStockAlert || 0) && (item.stock || 0) > 0).length
  const outOfStock = items.filter(item => (item.stock || 0) === 0).length

  const totalValue = items.reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.stock || 0))
  }, 0)

  // Value by category
  const categoryValues: Record<string, number> = {}
  items.forEach(item => {
    const categoryName = (item.categoryID as any)?.name || 'Uncategorized'
    if (!categoryValues[categoryName]) {
      categoryValues[categoryName] = 0
    }
    categoryValues[categoryName] += (item.price || 0) * (item.stock || 0)
  })

  // Low stock alerts
  const alerts = items
    .filter(item => (item.stock || 0) <= (item.lowStockAlert || 0))
    .map(item => ({
      itemId: (item._id as mongoose.Types.ObjectId).toString(),
      name: item.name,
      currentStock: item.stock || 0,
      minStock: item.lowStockAlert || 0
    }))

  return {
    totalItems: total,
    inStock,
    lowStock,
    outOfStock,
    totalValue,
    valueByCategory: categoryValues,
    lowStockAlerts: alerts
  }
}
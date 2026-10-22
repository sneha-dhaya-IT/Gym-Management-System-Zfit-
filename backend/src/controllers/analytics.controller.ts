import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  getDashboardOverviewService,
  getFinanceAnalyticsService,
  getUserAnalyticsService,
  getInventoryAnalyticsService
} from '../services/analytics.service.js'

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

/**
 * Get dashboard overview metrics
 */
export const getDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query)

    const dateRange: any = {}
    if (startDate) dateRange.startDate = new Date(startDate)
    if (endDate) dateRange.endDate = new Date(endDate)

    const overview = await getDashboardOverviewService(dateRange)

    res.json({
      success: true,
      data: overview
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get finance analytics
 */
export const getFinanceAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query)

    const dateRange: any = {}
    if (startDate) dateRange.startDate = new Date(startDate)
    if (endDate) dateRange.endDate = new Date(endDate)

    const analytics = await getFinanceAnalyticsService(dateRange)

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user analytics
 */
export const getUserAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = dateRangeSchema.parse(req.query)

    const dateRange: any = {}
    if (startDate) dateRange.startDate = new Date(startDate)
    if (endDate) dateRange.endDate = new Date(endDate)

    const analytics = await getUserAnalyticsService(dateRange)

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get inventory analytics
 */
export const getInventoryAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getInventoryAnalyticsService()

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    next(error)
  }
}
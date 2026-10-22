import type { Request, Response } from 'express'
import { inventoryTransactionService } from '../services/inventoryTransaction.service.js'
import { z } from 'zod'

// Validation schemas for endpoints
const getTransactionHistorySchema = z.object({
  itemId: z.string().optional(),
  userId: z.string().optional(),
  reason: z.enum(['SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'EXPIRED']).optional(),
  transactionType: z.enum(['IN', 'OUT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional()
})

export const inventoryTransactionController = {
  /**
   * Create a new transaction
   */
  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        })
        return
      }

      const transactionData = {
        ...req.body,
        performedBy: userId
      }

      const transaction = await inventoryTransactionService.createTransaction(transactionData)

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      })
    } catch (error) {
      console.error('Error creating transaction:', error)
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create transaction'
      })
    }
  },

  /**
   * Get transaction history with filters
   */
  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const filters = getTransactionHistorySchema.parse(req.query)
      
      // Convert date strings to Date objects and filter out undefined values
      const processedFilters: {
        itemId?: string
        userId?: string
        reason?: string
        transactionType?: 'IN' | 'OUT'
        startDate?: Date
        endDate?: Date
        limit?: number
        page?: number
      } = {}

      if (filters.itemId) processedFilters.itemId = filters.itemId
      if (filters.userId) processedFilters.userId = filters.userId
      if (filters.reason) processedFilters.reason = filters.reason
      if (filters.transactionType) processedFilters.transactionType = filters.transactionType
      if (filters.startDate) processedFilters.startDate = new Date(filters.startDate)
      if (filters.endDate) processedFilters.endDate = new Date(filters.endDate)
      if (filters.limit) processedFilters.limit = filters.limit
      if (filters.page) processedFilters.page = filters.page

      const result = await inventoryTransactionService.getTransactionHistory(processedFilters)

      res.json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: result
      })
    } catch (error) {
      console.error('Error getting transaction history:', error)
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transaction history'
      })
    }
  },

  /**
   * Get transaction summary for a specific item
   */
  async getItemTransactionSummary(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params
      
      if (!itemId) {
        res.status(400).json({
          success: false,
          message: 'Item ID is required'
        })
        return
      }

      const summary = await inventoryTransactionService.getItemTransactionSummary(itemId)

      res.json({
        success: true,
        message: 'Item transaction summary retrieved successfully',
        data: summary
      })
    } catch (error) {
      console.error('Error getting item transaction summary:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get item transaction summary'
      })
    }
  },


}
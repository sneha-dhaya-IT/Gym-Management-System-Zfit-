import { Router } from 'express'
import { inventoryTransactionController } from '../controllers/inventoryTransaction.controller.js'
import authenticate from '../middleware/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Create new transaction
router.post('/', inventoryTransactionController.createTransaction)

// Get transaction history with filters
router.get('/', inventoryTransactionController.getTransactionHistory)

// Get transaction summary for specific item
router.get('/item/:itemId/summary', inventoryTransactionController.getItemTransactionSummary)

export default router
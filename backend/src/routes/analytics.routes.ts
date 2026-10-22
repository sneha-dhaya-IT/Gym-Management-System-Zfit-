import { Router } from 'express'
import { getDashboardOverview, getFinanceAnalytics, getUserAnalytics, getInventoryAnalytics } from '../controllers/analytics.controller.js'
// import authenticate from '../middleware/auth.middleware.js'

const router = Router()

// Apply authentication to all analytics routes (temporarily disabled for testing)
// router.use(authenticate)

// Analytics routes
router.get('/overview', getDashboardOverview)
router.get('/finance', getFinanceAnalytics)
router.get('/users', getUserAnalytics)
router.get('/inventory', getInventoryAnalytics)

export default router
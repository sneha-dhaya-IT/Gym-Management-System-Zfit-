import { Router } from 'express';
import { getLowStockReport, sendLowStockAlerts, checkLowStock } from '../controllers/lowStockAlert.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication and manager/staff role

// GET /api/inventory/low-stock/report - Get detailed low stock report
router.get('/report', authenticate(['manager', 'staff']), getLowStockReport);

// POST /api/inventory/low-stock/send-alerts - Manually trigger low stock alert emails
router.post('/send-alerts', authenticate(['manager']), sendLowStockAlerts);

// GET /api/inventory/low-stock/check - Check for low stock items (no emails sent)
router.get('/check', authenticate(['manager', 'staff']), checkLowStock);

export default router;
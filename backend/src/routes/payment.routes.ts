import { Router } from 'express';
import {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    processPayment,
    deleteAllPayments,
    cleanupPendingPayments,
   
} from '../controllers/payment.controller.js';
import authenticate from '../middleware/auth.middleware.js';

// Import sub-route files
import invoiceRoutes from './invoice.routes.js';
import refundRoutes from './refund.routes.js';
import gatewayRoutes from './gateway.routes.js';

const router = Router();

// Sub-routes for payment-related functionality (must come before parameterized routes)
router.use('/invoices', invoiceRoutes);
router.use('/refunds', refundRoutes);
router.use('/gateways', gatewayRoutes);

// Payment cleanup and stats routes (admin only)
router.post('/cleanup-pending', authenticate, cleanupPendingPayments);


// Main payment routes
// Process payment 
router.post('/process/:id', processPayment);
// Delete all payments
router.delete('/all', deleteAllPayments);
//get all payments
router.get('/', getPayments);
router.get('/:id', getPaymentById);

router.post('/', createPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

// Cleanup pending payments
router.post('/cleanup', cleanupPendingPayments);

export default router;
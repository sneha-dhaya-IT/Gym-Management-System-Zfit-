import { Router } from 'express';
import {
    processPayHerePayment,
    handlePayHereWebhook,
    getPaymentStatus,
    processPayHereRefund,
    testPayHereConfig
} from '../controllers/payhere.controller.js';

const router = Router();

// PayHere payment processing
router.post('/payhere/process', processPayHerePayment);

// PayHere webhook handler (no auth required - PayHere will call this)
router.post('/webhook/payhere', handlePayHereWebhook);

// Get payment status by transaction ID
router.get('/status/:transactionId', getPaymentStatus);

// PayHere refund processing (future enhancement)
router.post('/payhere/refund', processPayHereRefund);

// Test PayHere configuration
router.get('/payhere/test', testPayHereConfig);

// Development only: Manual payment completion for testing
router.post('/dev/complete-payment/:transactionId', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Not available in production' });
    }
    
    try {
        const { transactionId } = req.params;
        
        // Simulate PayHere webhook data for successful payment
        const mockWebhookData = {
            merchant_id: process.env.PAYHERE_MERCHANT_ID || '1232151',
            order_id: transactionId,
            payhere_amount: req.body.amount || '1000.00',
            payhere_currency: 'LKR',
            status_code: '2', // Success status
            md5sig: 'mock_signature',
            method: 'VISA',
            status_message: 'Success',
            payment_id: `test_payment_${Date.now()}`
        };
        
        console.log('🧪 DEV: Manually completing payment:', transactionId);
        
        // Import the PayHere service and trigger webhook
        const { PayHereService } = await import('../services/payhere.service.js');
        const payHereService = new PayHereService();
        
        const result = await payHereService.handleWebhook(mockWebhookData);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Payment completed successfully (DEV)',
                payment: result.payment,
                ...(result.membership && { membership: result.membership })
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('DEV payment completion failed:', error);
        res.status(500).json({
            success: false,
            message: `Failed to complete payment: ${(error as Error).message}`
        });
    }
});

export default router;
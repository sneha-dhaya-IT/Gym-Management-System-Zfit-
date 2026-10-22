import type { Request, Response } from 'express';
import { PayHereService } from '../services/payhere.service.js';
import type { PayHerePaymentRequest, PayHereWebhookData, PayHerePaymentData } from '../services/payhere.service.js';

const payHereService = new PayHereService();

/**
 * Generate PayHere payment form HTML
 */
const generatePayHereForm = (paymentData: PayHerePaymentData, checkoutUrl: string): string => {
    const formFields = Object.entries(paymentData)
        .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
        .join('\n    ');

    return `
<form method="post" action="${checkoutUrl}" id="payhere-form">
    ${formFields}
</form>
<script>
    document.getElementById('payhere-form').submit();
</script>`;
};

/**
 * Process PayHere payment
 * POST /api/v1/gateways/payhere/process
 */
export const processPayHerePayment = async (req: Request, res: Response) => {
    try {
        console.log('PayHere payment request received:', req.body);
        
        // Validate required fields
        const {
            userId,
            amount,
            currency = 'LKR',
            type,
            relatedId,
            description,
            customerFirstName,
            customerLastName,
            customerEmail,
            customerPhone,
            customerAddress,
            customerCity
        } = req.body;

        // Basic validation
        if (!userId || !amount || !type || !description || 
            !customerFirstName || !customerLastName || !customerEmail || 
            !customerPhone || !customerAddress || !customerCity) {
            console.log('Missing required fields:', {
                userId: !!userId,
                amount: !!amount,
                type: !!type,
                relatedId: !!relatedId,
                description: !!description,
                customerFirstName: !!customerFirstName,
                customerLastName: !!customerLastName,
                customerEmail: !!customerEmail,
                customerPhone: !!customerPhone,
                customerAddress: !!customerAddress,
                customerCity: !!customerCity
            });
            return res.status(400).json({
                success: false,
                message: 'Missing required fields for PayHere payment'
            });
        }

        // relatedId is required for membership, inventory, booking but optional for other types (like cart)
        if (!relatedId && !['other'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'relatedId is required for this payment type'
            });
        }

        // Additional validations
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        if (!['membership', 'inventory', 'booking', 'other'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment type'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const paymentRequest: PayHerePaymentRequest = {
            userId,
            amount: parseFloat(amount),
            currency,
            type,
            relatedId,
            description,
            customerFirstName,
            customerLastName,
            customerEmail,
            customerPhone,
            customerAddress,
            customerCity
        };

        const result = await payHereService.initiatePayment(paymentRequest);

        console.log('PayHere service result:', result);

        res.status(200).json({
            success: true,
            message: 'PayHere payment initiated successfully',
            data: {
                paymentId: result.payment._id,
                orderId: result.paymentData.order_id,
                checkoutUrl: result.checkoutUrl,
                paymentData: result.paymentData,
                // Return HTML form for PayHere submission
                paymentForm: generatePayHereForm(result.paymentData, result.checkoutUrl)
            }
        });
    } catch (error) {
        console.error('PayHere payment processing error:', error);
        console.error('Error stack:', (error as Error).stack);
        res.status(500).json({
            success: false,
            message: `PayHere payment processing failed: ${(error as Error).message}`
        });
    }
};

/**
 * Handle PayHere webhook notifications
 * POST /api/v1/gateways/webhook/payhere
 */
export const handlePayHereWebhook = async (req: Request, res: Response) => {
    try {
        console.log('=== PayHere webhook received ===');
        console.log('Webhook headers:', req.headers);
        console.log('Webhook body:', req.body);
        console.log('=====================================');

        const webhookData: PayHereWebhookData = req.body;

        // Validate required webhook fields
        if (!webhookData.merchant_id || !webhookData.order_id || 
            !webhookData.payhere_amount || !webhookData.status_code || 
            !webhookData.md5sig) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook data'
            });
        }

        const result = await payHereService.handleWebhook(webhookData);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // PayHere expects a simple "OK" response for successful webhook processing
        res.status(200).send('OK');
    } catch (error) {
        console.error('PayHere webhook processing error:', error);
        res.status(500).json({
            success: false,
            message: `Webhook processing failed: ${(error as Error).message}`
        });
    }
};

/**
 * Get payment status
 * GET /api/v1/gateways/status/{transactionId}
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID is required'
            });
        }

        const result = await payHereService.getPaymentStatus(transactionId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: `Failed to get payment status: ${(error as Error).message}`
        });
    }
};

/**
 * Process refund (future enhancement)
 * POST /api/v1/gateways/payhere/refund
 */
export const processPayHereRefund = async (req: Request, res: Response) => {
    try {
        const { paymentId, amount, reason } = req.body;

        if (!paymentId || !amount || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: paymentId, amount, reason'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Refund amount must be greater than 0'
            });
        }

        const result = await payHereService.processRefund(paymentId, amount, reason);

        res.status(200).json(result);
    } catch (error) {
        console.error('PayHere refund processing error:', error);
        res.status(500).json({
            success: false,
            message: `Refund processing failed: ${(error as Error).message}`
        });
    }
};

/**
 * Test PayHere configuration
 * GET /api/v1/gateways/payhere/test
 */
export const testPayHereConfig = async (req: Request, res: Response) => {
    try {
        // This endpoint can be used to test if PayHere configuration is working
        res.status(200).json({
            success: true,
            message: 'PayHere gateway is configured and ready',
            config: {
                merchantId: process.env.PAYHERE_MERCHANT_ID ? '***configured***' : 'not configured',
                merchantSecret: process.env.PAYHERE_MERCHANT_SECRET ? '***configured***' : 'not configured',
                environment: process.env.PAYHERE_ENV || 'sandbox'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Configuration test failed: ${(error as Error).message}`
        });
    }
};
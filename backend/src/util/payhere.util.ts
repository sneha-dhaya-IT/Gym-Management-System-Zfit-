import crypto from 'crypto';
import env from '../config/env.js';

/**
 * PayHere utility functions for hash generation and verification
 */
export class PayHereUtils {
    /**
     * Generate MD5 hash for PayHere payment request
     */
    static generatePaymentHash(data: {
        merchant_id: string;
        order_id: string;
        amount: string;
        currency: string;
        merchant_secret: string;
    }): string {
        const hashString = `${data.merchant_id}${data.order_id}${data.amount}${data.currency}${crypto.createHash('md5').update(data.merchant_secret).digest('hex').toUpperCase()}`;
        return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
    }

    /**
     * Generate MD5 hash for PayHere webhook verification
     */
    static generateWebhookHash(data: {
        merchant_id: string;
        order_id: string;
        payhere_amount: string;
        payhere_currency: string;
        status_code: string;
        merchant_secret: string;
    }): string {
        const secretHash = crypto.createHash('md5').update(data.merchant_secret).digest('hex').toUpperCase();
        const hashString = `${data.merchant_id}${data.order_id}${data.payhere_amount}${data.payhere_currency}${data.status_code}${secretHash}`;
        return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
    }

    /**
     * Verify webhook signature from PayHere
     */
    static verifyWebhook(webhookData: any): boolean {
        const expectedHash = this.generateWebhookHash({
            merchant_id: webhookData.merchant_id,
            order_id: webhookData.order_id,
            payhere_amount: webhookData.payhere_amount,
            payhere_currency: webhookData.payhere_currency,
            status_code: webhookData.status_code,
            merchant_secret: env.PAYHERE_MERCHANT_SECRET
        });
        
        return expectedHash === webhookData.md5sig;
    }

    /**
     * Generate unique order ID
     */
    static generateOrderId(prefix: string = 'ORDER'): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Format amount for PayHere (2 decimal places)
     */
    static formatAmount(amount: number): string {
        return amount.toFixed(2);
    }

    /**
     * Parse PayHere status code to payment status
     */
    static parseStatusCode(statusCode: string): 'pending' | 'completed' | 'failed' | 'refunded' {
        switch (statusCode) {
            case '2':
                return 'completed'; // Success
            case '0':
                return 'pending'; // Pending
            case '-1':
            case '-2':
            case '-3':
                return 'failed'; // Various failure codes
            default:
                return 'failed';
        }
    }
}
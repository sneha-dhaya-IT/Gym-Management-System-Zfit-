import env from '../config/env.js';
import mongoose from 'mongoose';
import { PayHereUtils } from '../util/payhere.util.js';
import { createPaymentService, updatePaymentService } from './payment.services.js';
import { createOrExtendMembership } from './membership.service.js';
import { sendMail } from '../util/sendMail.util.js';
import { getCartPurchaseSuccessTemplate, getCartPurchaseFailureTemplate, getMembershipPurchaseSuccessTemplate, getMembershipPurchaseFailureTemplate } from '../util/emailTemplates.js';
import { getMembershipPlanById } from './membershipPlan.service.js';
import UserModel from '../models/user.model.js';
import Payment from '../models/payment.model.js';
import InventoryItem from '../models/inventoryItem.schema.js';
import Orderservice from './order.service.js';

export interface PayHerePaymentRequest {
    userId: string;
    amount: number;
    currency: string;
    type: 'membership' | 'inventory' | 'booking' | 'other';
    relatedId?: string; // Optional for 'other' type payments like cart
    description: string;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
}

export interface PayHerePaymentData {
    merchant_id: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    order_id: string;
    items: string;
    currency: string;
    amount: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    hash: string;
}

export interface PayHereWebhookData {
    merchant_id: string;
    order_id: string;
    payhere_amount: string;
    payhere_currency: string;
    status_code: string;
    md5sig: string;
    custom_1?: string;
    custom_2?: string;
    method: string;
    status_message: string;
    card_holder_name?: string;
    card_no?: string;
    card_expiry?: string;
    payment_id?: string;
}

/**
 * PayHere Payment Gateway Service
 */
export class PayHereService {
    private static readonly PAYHERE_CHECKOUT_URL_SANDBOX = 'https://sandbox.payhere.lk/pay/checkout';
    private static readonly PAYHERE_CHECKOUT_URL_PRODUCTION = 'https://www.payhere.lk/pay/checkout';

    private getCheckoutUrl(): string {
        return env.PAYHERE_ENV === 'production' 
            ? PayHereService.PAYHERE_CHECKOUT_URL_PRODUCTION 
            : PayHereService.PAYHERE_CHECKOUT_URL_SANDBOX;
    }

    /**
     * Initialize PayHere payment and create payment record
     */
    async initiatePayment(paymentRequest: PayHerePaymentRequest): Promise<{
        payment: any;
        paymentData: PayHerePaymentData;
        checkoutUrl: string;
    }> {
        try {
            console.log('PayHere service: Initiating payment for:', paymentRequest);
            console.log('PayHere environment variables check:', {
                merchantId: !!env.PAYHERE_MERCHANT_ID,
                merchantSecret: !!env.PAYHERE_MERCHANT_SECRET,
                environment: env.PAYHERE_ENV,
                returnUrl: env.PAYHERE_RETURN_URL,
                cancelUrl: env.PAYHERE_CANCEL_URL,
                notifyUrl: env.PAYHERE_NOTIFY_URL
            });
            
            // Generate unique order ID
            const orderId = PayHereUtils.generateOrderId('ZFIT');
            
            // Create payment record in database first
            const paymentData: {
                userId: mongoose.Types.ObjectId;
                amount: number;
                currency: string;
                type: 'membership' | 'inventory' | 'booking' | 'other';
                status: 'pending';
                method: 'card';
                transactionId: string;
                date: Date;
                relatedId?: mongoose.Types.ObjectId;
            } = {
                userId: new mongoose.Types.ObjectId(paymentRequest.userId),
                amount: paymentRequest.amount,
                currency: paymentRequest.currency,
                type: paymentRequest.type,
                status: 'pending' as const,
                method: 'card' as const,
                transactionId: orderId,
                date: new Date()
            };

            // Only add relatedId if it exists
            if (paymentRequest.relatedId) {
                paymentData.relatedId = new mongoose.Types.ObjectId(paymentRequest.relatedId);
            }

            const payment = await createPaymentService(paymentData);

            // Prepare PayHere payment data with dynamic return URL based on payment type
            const returnUrl = paymentRequest.type === 'other' || paymentRequest.type === 'inventory' 
                ? `${env.FRONTEND_APP_ORIGIN}/cart/success`
                : env.PAYHERE_RETURN_URL;

            const payhereData: PayHerePaymentData = {
                merchant_id: env.PAYHERE_MERCHANT_ID,
                return_url: returnUrl,
                cancel_url: env.PAYHERE_CANCEL_URL,
                notify_url: env.PAYHERE_NOTIFY_URL,
                order_id: orderId,
                items: paymentRequest.description,
                currency: paymentRequest.currency,
                amount: PayHereUtils.formatAmount(paymentRequest.amount),
                first_name: paymentRequest.customerFirstName,
                last_name: paymentRequest.customerLastName,
                email: paymentRequest.customerEmail,
                phone: paymentRequest.customerPhone,
                address: paymentRequest.customerAddress,
                city: paymentRequest.customerCity,
                country: 'Sri Lanka',
                hash: ''
            };

            // Generate hash for security
            payhereData.hash = PayHereUtils.generatePaymentHash({
                merchant_id: payhereData.merchant_id,
                order_id: payhereData.order_id,
                amount: payhereData.amount,
                currency: payhereData.currency,
                merchant_secret: env.PAYHERE_MERCHANT_SECRET
            });

            // Note: In sandbox environment, PayHere will send actual webhooks when payments are processed
            // No need for auto-completion simulation that could trigger premature emails
            if (env.PAYHERE_ENV === 'sandbox') {
                console.log('Sandbox mode: Payment initiated, waiting for actual PayHere webhook...');
            }

            return {
                payment,
                paymentData: payhereData,
                checkoutUrl: this.getCheckoutUrl()
            };
        } catch (error) {
            throw new Error(`PayHere payment initiation failed: ${(error as Error).message}`);
        }
    }

    /**
     * Handle PayHere webhook notification
     */
    async handleWebhook(webhookData: PayHereWebhookData): Promise<{
        success: boolean;
        message: string;
        payment?: any;
        membership?: any;
    }> {
        try {
            console.log('Processing PayHere webhook...');
            
            // Verify webhook signature (skip in sandbox for testing)
            const isSignatureValid = PayHereUtils.verifyWebhook(webhookData);
            console.log('Webhook signature verification:', {
                isValid: isSignatureValid,
                environment: env.PAYHERE_ENV,
                skipVerification: env.PAYHERE_ENV === 'sandbox'
            });
            
            if (!isSignatureValid && env.PAYHERE_ENV !== 'sandbox') {
                return {
                    success: false,
                    message: 'Invalid webhook signature'
                };
            }

            // Find payment by order ID
            const payment = await Payment.findOne({ 
                transactionId: webhookData.order_id 
            });

            if (!payment) {
                return {
                    success: false,
                    message: 'Payment not found'
                };
            }

            // Parse PayHere status
            const paymentStatus = PayHereUtils.parseStatusCode(webhookData.status_code);

            // Update payment record
            const updatedPayment = await updatePaymentService(payment._id as string, {
                status: paymentStatus,
                gatewayTransactionId: webhookData.order_id,
                gatewayPaymentId: webhookData.payment_id || webhookData.merchant_id,
                gatewayResponse: webhookData as any,
                ...(paymentStatus === 'failed' && {
                    failureReason: webhookData.status_message
                })
            });

            // Auto-create membership for successful membership payments only
            let membership = null;
            console.log('Checking for membership creation:', {
                paymentStatus,
                paymentType: payment.type,
                shouldCreateMembership: paymentStatus === 'completed' && payment.type === 'membership'
            });
            
            if (paymentStatus === 'completed' && payment.type === 'membership' && payment.relatedId) {
                try {
                    console.log('Processing membership creation/extension for payment:', payment.transactionId);
                    
                    membership = await createOrExtendMembership({
                        userId: payment.userId.toString(),
                        membershipPlanId: payment.relatedId.toString(),
                        transactionId: payment.transactionId,
                        autoRenew: false,
                        notes: `Auto-created from payment ${payment.transactionId}`
                    });

                    // Update payment record to reference the created membership instead of the plan
                    if (membership && membership._id) {
                        await Payment.findByIdAndUpdate(
                            payment._id,
                            { relatedId: membership._id },
                            { new: true }
                        );
                        console.log('Payment record updated with membership reference:', membership._id);
                    }

                    // Send success email notification
                    if (membership) {
                        try {
                            const user = await UserModel.findById(payment.userId);
                            const membershipPlan = await getMembershipPlanById(payment.relatedId.toString());
                            
                            if (user && membershipPlan) {
                                const formatDuration = (days: number): string => {
                                    if (days === 30 || days === 31) return '1 Month';
                                    if (days === 90 || days === 92) return '3 Months';
                                    if (days === 180 || days === 183) return '6 Months';
                                    if (days === 365 || days === 366) return '1 Year';
                                    return `${days} Days`;
                                };

                                const emailData = {
                                    userName: user.name || 'Member',
                                    userEmail: user.email,
                                    membershipPlanName: membershipPlan.name,
                                    membershipDuration: formatDuration(membershipPlan.durationInDays),
                                    amount: payment.amount,
                                    currency: payment.currency,
                                    activationDate: membership.startDate.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    }),
                                    expiryDate: membership.endDate.toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    }),
                                    transactionId: payment.transactionId,
                                    paymentMethod: 'Credit/Debit Card',
                                    membershipFeatures: [
                                        'Access to gym equipment and facilities',
                                        'Group fitness classes',
                                        'Personal training consultation',
                                        'Locker and shower facilities',
                                        'Member support and guidance',
                                        'Progress tracking and monitoring'
                                    ]
                                };

                                const template = getMembershipPurchaseSuccessTemplate(emailData);
                                await sendMail({
                                    to: user.email,
                                    subject: template.subject,
                                    text: template.text,
                                    html: template.html
                                });
                                console.log('Membership success email sent to:', user.email);
                            }
                        } catch (emailError) {
                            console.error('Failed to send membership success email:', emailError);
                            // Don't fail the webhook if email sending fails
                        }
                    }
                } catch (membershipError) {
                    console.error('Failed to auto-create membership:', membershipError);
                    console.error('Membership error stack:', (membershipError as Error).stack);
                    // Don't fail the webhook if membership creation fails
                    // The membership can be created manually later
                }
            }

            // Send failure email for failed membership payments
            if (paymentStatus === 'failed' && payment.type === 'membership' && payment.relatedId) {
                try {
                    const user = await UserModel.findById(payment.userId);
                    const membershipPlan = await getMembershipPlanById(payment.relatedId.toString());
                    
                    if (user && membershipPlan) {
                        const retryUrl = `${env.FRONTEND_APP_ORIGIN}/memberDashboard/memberships/browse/${payment.relatedId}`;
                        
                        const emailData = {
                            userName: user.name || 'Member',
                            userEmail: user.email,
                            membershipPlanName: membershipPlan.name,
                            amount: payment.amount,
                            currency: payment.currency,
                            transactionId: payment.transactionId,
                            failureReason: payment.failureReason || webhookData.status_message || 'Payment processing failed',
                            retryUrl: retryUrl
                        };

                        const template = getMembershipPurchaseFailureTemplate(emailData);
                        await sendMail({
                            to: user.email,
                            subject: template.subject,
                            text: template.text,
                            html: template.html
                        });
                        console.log('Membership failure email sent to:', user.email);
                    }
                } catch (emailError) {
                    console.error('Failed to send membership failure email:', emailError);
                    // Don't fail the webhook if email sending fails
                }
            }

            // Handle cart payment success
            if (paymentStatus === 'completed' && (payment.type === 'other' || payment.type === 'inventory')) {
                try {
                    const user = await UserModel.findById(payment.userId);
                    
                    if (user) {
                        console.log('Processing cart payment success for user:', user.email);
                        
                        // Get cart items from user's cart
                        // Note: You might want to store cart items in the payment record for better tracking
                        const CartModel = (await import('../models/cart.model.js')).default;
                        const cart = await CartModel.findOne({ memberId: payment.userId.toString() }).populate('items.itemId');
                        
                        if (cart && cart.items && cart.items.length > 0) {
                            // Create order record for the purchase
                            const orderService = new Orderservice();
                            let order = null;
                            
                            try {
                                console.log('Creating order for cart payment...');
                                order = await orderService.checkout(payment.userId.toString());
                                console.log('Order created successfully:', order?._id);
                                
                                // Update payment record with order reference
                                await Payment.findByIdAndUpdate(
                                    payment._id,
                                    { relatedId: order?._id },
                                    { new: true }
                                );
                                console.log('Payment record updated with order reference');
                            } catch (orderError) {
                                console.error('Failed to create order for cart payment:', orderError);
                        
                            }

                            // Prepare cart items for email
                            const cartItems = cart.items.map((item: any) => ({
                                itemName: item.itemId.name || 'Unknown Item',
                                quantity: item.quantity || 1,
                                price: item.itemId.price || 0,
                                totalPrice: (item.itemId.price || 0) * (item.quantity || 1)
                            }));

                            const emailData = {
                                userName: user.name || 'Customer',
                                userEmail: user.email,
                                orderNumber: payment.transactionId,
                                items: cartItems,
                                totalAmount: payment.amount,
                                currency: payment.currency,
                                orderDate: new Date().toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                }),
                                transactionId: payment.transactionId,
                                paymentMethod: 'Credit/Debit Card'
                            };

                            const template = getCartPurchaseSuccessTemplate(emailData);
                            await sendMail({
                                to: user.email,
                                subject: template.subject,
                                text: template.text,
                                html: template.html
                            });
                            console.log('Cart purchase success email sent to:', user.email);

                            // Note: Cart clearing and stock updates are now handled by OrderService.checkout()
                            console.log('Order created, cart cleared, and stock updated by OrderService');
                        } else {
                            console.log('No cart items found for user, sending basic success email');
                            
                            // Send success email without cart details
                            const emailData = {
                                userName: user.name || 'Customer',
                                userEmail: user.email,
                                orderNumber: payment.transactionId,
                                items: [],
                                totalAmount: payment.amount,
                                currency: payment.currency,
                                orderDate: new Date().toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                }),
                                transactionId: payment.transactionId,
                                paymentMethod: 'Credit/Debit Card'
                            };

                            const template = getCartPurchaseSuccessTemplate(emailData);
                            await sendMail({
                                to: user.email,
                                subject: template.subject,
                                text: template.text,
                                html: template.html
                            });
                            console.log('Basic cart purchase success email sent to:', user.email);
                        }
                    }
                } catch (emailError) {
                    console.error('Failed to send cart purchase success email:', emailError);
                    // Don't fail the webhook if email sending fails
                }
            }

            // Send failure email for failed cart payments
            if (paymentStatus === 'failed' && (payment.type === 'other' || payment.type === 'inventory')) {
                try {
                    const user = await UserModel.findById(payment.userId);
                    
                    if (user) {
                        const retryUrl = `${env.FRONTEND_APP_ORIGIN}/memberDashboard/cart`;
                        
                        const emailData = {
                            userName: user.name || 'Customer',
                            userEmail: user.email,
                            orderNumber: payment.transactionId,
                            totalAmount: payment.amount,
                            currency: payment.currency,
                            transactionId: payment.transactionId,
                            failureReason: payment.failureReason || webhookData.status_message || 'Payment processing failed',
                            retryUrl: retryUrl
                        };

                        const template = getCartPurchaseFailureTemplate(emailData);
                        await sendMail({
                            to: user.email,
                            subject: template.subject,
                            text: template.text,
                            html: template.html
                        });
                        console.log('Cart purchase failure email sent to:', user.email);
                    }
                } catch (emailError) {
                    console.error('Failed to send cart purchase failure email:', emailError);
                    // Don't fail the webhook if email sending fails
                }
            }

            return {
                success: true,
                message: 'Webhook processed successfully',
                payment: updatedPayment,
                membership: membership
            };
        } catch (error) {
            return {
                success: false,
                message: `Webhook processing failed: ${(error as Error).message}`
            };
        }
    }

    /**
     * Get payment status from PayHere (if needed)
     */
    async getPaymentStatus(transactionId: string): Promise<{
        success: boolean;
        status?: string;
        message: string;
        payment?: any;
    }> {
        try {
            // Find payment in database
            const payment = await Payment.findOne({ 
                transactionId: transactionId 
            });

            if (!payment) {
                return {
                    success: false,
                    message: 'Payment not found'
                };
            }

            return {
                success: true,
                status: payment.status,
                message: 'Payment status retrieved successfully',
                payment
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to get payment status: ${(error as Error).message}`
            };
        }
    }

    /**
     * Process refund (if needed in future)
     */
    async processRefund(paymentId: string, amount: number, reason: string): Promise<any> {

        try {
            const payment = await updatePaymentService(paymentId, {
                status: 'refunded',
                refundedAmount: amount,
                refundReason: reason
            });

            return {
                success: true,
                message: 'Refund processed (manual verification required)',
                payment
            };
        } catch (error) {
            throw new Error(`Refund processing failed: ${(error as Error).message}`);
        }
    }
}
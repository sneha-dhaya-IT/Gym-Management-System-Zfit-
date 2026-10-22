import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
    createPaymentService,
    getPaymentsService,
    getPaymentByIdService,
    updatePaymentService,
    deletePaymentService,
    processPaymentService,
    deleteAllPaymentsService,
    cleanupPendingPaymentsService,
    getPendingPaymentStatsService
} from '../services/payment.services.js';

// Zod validation schemas
const createPaymentSchema = z.object({
    amount: z.number().min(0, 'Amount must be non-negative'),
    type: z.enum(['membership', 'inventory', 'booking', 'other']),
    status: z.enum(['pending', 'completed', 'failed', 'refunded']),
    method: z.enum(['card', 'bank-transfer', 'cash']),
    relatedId: z.string().min(1, 'Related ID is required'),
    transactionId: z.string().min(1, 'Transaction ID is required'),
    date: z.string().min(1, 'Date is required'),
    userId: z.string().min(1, 'User ID is required'),
    currency: z.string().optional(),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional()
});

const updatePaymentSchema = z.object({
    amount: z.number().min(0, 'Amount must be non-negative').optional(),
    type: z.enum(['membership', 'inventory', 'booking', 'other']).optional(),
    status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
    method: z.enum(['card', 'bank-transfer', 'cash']).optional(),
    relatedId: z.string().optional(),
    transactionId: z.string().optional(),
    date: z.string().optional(),
    currency: z.string().optional(),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional()
});

const paymentIdSchema = z.object({
    id: z.string().min(1, 'Payment ID is required')
});

const processPaymentSchema = z.object({
    response: z.record(z.string(), z.any())
});
export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = createPaymentSchema.parse(req.body);
        
        const paymentData = { 
            ...validated,
            userId: new mongoose.Types.ObjectId(validated.userId),
            relatedId: new mongoose.Types.ObjectId(validated.relatedId),
            currency: validated.currency || 'LKR',
            date: new Date(validated.date)
        };

        const payment = await createPaymentService(paymentData);
        res.status(201).json({ 
            success: true, 
            message: 'Payment created successfully',
            data: payment 
        });
    } catch (error) {
        next(error); 
    }
};

// Get all payments
export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;
        const payments = await getPaymentsService(userId || '');
        res.json({ success: true, data: payments });
    } catch (error) {
        next(error);
    }
};

// Get payment by ID
export const getPaymentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = paymentIdSchema.parse({ id: req.params.id });

        const payment = await getPaymentByIdService(id);
        if (!payment)
            return res.status(404).json({ success: false, message: 'Payment not found' });

        res.json({ success: true, data: payment });
    } catch (error) {
        next(error);
    }
};

export const updatePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = paymentIdSchema.parse({ id: req.params.id });
        const validated = updatePaymentSchema.parse(req.body);

        // Filter out undefined values to comply with exactOptionalPropertyTypes
        const updateData = Object.fromEntries(
            Object.entries(validated).filter(([, value]) => value !== undefined)
        );

        // Convert ObjectId fields
        if (updateData.relatedId) {
            updateData.relatedId = new mongoose.Types.ObjectId(updateData.relatedId as string);
        }

        const payment = await updatePaymentService(id, updateData);
        if (!payment) 
            return res.status(404).json({ success: false, message: 'Payment not found' });

        res.json({ 
            success: true, 
            message: 'Payment updated successfully',
            data: payment 
        });
    } catch (error) {
        next(error); 
    }
};

export const deletePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = paymentIdSchema.parse({ id: req.params.id });

        const payment = await deletePaymentService(id);
        if (!payment) 
            return res.status(404).json({ success: false, message: 'Payment not found' });

        res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
        next(error); 
    }
};

export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = paymentIdSchema.parse({ id: req.params.id });
        const { response } = processPaymentSchema.parse(req.body);

        const payment = await processPaymentService(id, response);
        if (!payment) 
            return res.status(404).json({ success: false, message: 'Payment not found' });

        res.json({ 
            success: true, 
            message: 'Payment processed successfully',
            data: payment 
        });
    } catch (error) {
        next(error); 
    }
};

export const deleteAllPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await deleteAllPaymentsService();
        
        res.json({ 
            success: true, 
            message: `All ${result.deletedCount} payments deleted successfully`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        next(error); 
    }
};

export const cleanupPendingPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await cleanupPendingPaymentsService();
        
        res.json({ 
            success: true, 
            message: `All ${result.deletedCount} pending payments deleted successfully`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        next(error); 
    }
};

export const getPendingPaymentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await getPendingPaymentStatsService();
        
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error); 
    }
};

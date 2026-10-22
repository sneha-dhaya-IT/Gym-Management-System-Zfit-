import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
    createInvoiceService,
    getInvoicesService,
    getInvoiceByIdService,
    updateInvoiceService,
    deleteInvoiceService
} from '../services/invoice.services.js';
import Payment from '../models/payment.model.js';


// Zod validation schemas
const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    total: z.number().min(0, 'Total must be non-negative'),
    tax: z.number().min(0, 'Tax must be non-negative').optional().default(0)
});

const createInvoiceSchema = z.object({
    paymentId: z.string().min(1, 'Payment ID is required'),
    items: z.array(invoiceItemSchema).optional(),
    subtotal: z.number().min(0, 'Subtotal must be non-negative'),
    tax: z.number().min(0, 'Tax must be non-negative'),
    discount: z.number().min(0, 'Discount must be non-negative').optional().default(0),
    total: z.number().min(0, 'Total must be non-negative'),
    dueDate: z.string().optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue']),
    generatedAt: z.string().min(1, 'Generated date is required'),
    pdfUrl: z.string().optional()
});

const updateInvoiceSchema = z.object({
    paymentId: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1).optional(),
    subtotal: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    total: z.number().min(0).optional(),
    dueDate: z.string().optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
    generatedAt: z.string().optional(),
    pdfUrl: z.string().optional()
});

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = createInvoiceSchema.parse(req.body);

        // Look up payment by transactionId or ObjectId
        let payment;
        if (mongoose.Types.ObjectId.isValid(validated.paymentId)) {
            // If it's a valid ObjectId, find by _id
            payment = await Payment.findById(validated.paymentId);
        } else {
            // Otherwise, find by transactionId
            payment = await Payment.findOne({ transactionId: validated.paymentId });
        }
        if (!payment) {
            return res.status(400).json({
                success: false,
                message: 'Payment not found with the provided Payment ID'
            });
        }

        const invoiceData: any = {
            ...validated,
            paymentId: payment._id, // Use the payment's ObjectId
            userId: payment.userId, // Get userId from the payment
            generatedAt: new Date(validated.generatedAt)
        };

        if (validated.dueDate) {
            invoiceData.dueDate = new Date(validated.dueDate);
        }

        const invoice = await createInvoiceService(invoiceData);
        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId;
        const invoices = await getInvoicesService(userId);
        res.json({ success: true, data: invoices });
    } catch (error) {
        next(error);
    }
     
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ success: false, message: 'Invoice ID is required' });
        }
        const invoice = await getInvoiceByIdService(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
};

export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = updateInvoiceSchema.parse(req.body);

        if (!req.params.id) {
            return res.status(400).json({ success: false, message: 'Invoice ID is required' });
        }

        // Filter out undefined values and convert types
        const updateData: any = {};
        Object.entries(validated).forEach(async ([key, value]) => {
            if (value !== undefined) {
                if (key === 'paymentId') {
                    // Look up payment by transactionId or ObjectId
                    let payment;
                    if (mongoose.Types.ObjectId.isValid(value as string)) {
                        // If it's a valid ObjectId, find by _id
                        payment = await Payment.findById(value as string);
                    } else {
                        // Otherwise, find by transactionId
                        payment = await Payment.findOne({ transactionId: value as string });
                    }
                    if (!payment) {
                        throw new Error('Payment not found with the provided Payment ID');
                    }
                    updateData[key] = payment._id;
                } else if (key === 'generatedAt' || key === 'dueDate') {
                    updateData[key] = new Date(value as string);
                } else {
                    updateData[key] = value;
                }
            }
        });

        const invoice = await updateInvoiceService(req.params.id, updateData);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
};

export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ success: false, message: 'Invoice ID is required' });
        }

        const invoice = await deleteInvoiceService(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, message: 'Invoice deleted' });
    } catch (error) {
        next(error);
    }
};
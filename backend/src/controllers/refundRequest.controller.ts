import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
    createRefundRequestService,
    getRefundRequestsService,
    getRefundRequestByIdService,
    getRefundRequestsByUserService,
    updateRefundRequestService,
    deleteRefundRequestService,
    approveRefundRequestService,
    declineRefundRequestService,
    getPendingRequestsCountService
} from '../services/refundRequest.services.js';

// Zod schemas
const createRefundRequestSchema = z.object({
    paymentId: z.string().min(1, 'Payment ID is required').refine((val) => {
        return /^[0-9a-fA-F]{24}$/.test(val);
    }, 'Payment ID must be a valid ObjectId'),
    requestedAmount: z.number().positive('Requested amount must be positive'),
    notes: z.string().min(1, 'Notes are required')
});

const updateRefundRequestSchema = z.object({
    requestedAmount: z.number().positive('Requested amount must be positive').optional(),
    notes: z.string().min(1, 'Notes are required').optional(),
    adminNotes: z.string().optional()
});

// Create refund request (for users)
export const createRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = createRefundRequestSchema.parse(req.body);

        // Get userId from authenticated user (when auth is enabled)
        // For now, userId comes from request body
        const userId = req.body.userId || (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User authentication required' });
        }

        const refundRequestData = {
            ...validatedData,
            userId
        };

        const refundRequest = await createRefundRequestService(refundRequestData);
        res.status(201).json({ success: true, data: refundRequest });
    } catch (error) {
        next(error);
    }
};

// Get all refund requests (for admin)
export const getRefundRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.query;
        const refundRequests = await getRefundRequestsService(status as string);
        res.json({ success: true, data: refundRequests });
    } catch (error) {
        next(error);
    }
};

// Get refund request by ID
export const getRefundRequestById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'Refund request ID is required' });
        const refundRequest = await getRefundRequestByIdService(req.params.id);
        res.json({ success: true, data: refundRequest });
    } catch (error) {
        next(error);
    }
};

// Get refund requests by user (for user dashboard)
export const getRefundRequestsByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId || (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User authentication required' });
        }

        const refundRequests = await getRefundRequestsByUserService(userId);
        res.json({ success: true, data: refundRequests });
    } catch (error) {
        next(error);
    }
};

// Update refund request
export const updateRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'Refund request ID is required' });
        const validatedData = updateRefundRequestSchema.parse(req.body);
        const refundRequest = await updateRefundRequestService(req.params.id, validatedData);
        res.json({ success: true, data: refundRequest });
    } catch (error) {
        next(error);
    }
};

// Delete refund request
export const deleteRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'Refund request ID is required' });
        const refundRequest = await deleteRefundRequestService(req.params.id);
        res.json({ success: true, message: 'Refund request deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Approve refund request (admin only)
export const approveRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔥 CONTROLLER: approveRefundRequest called for ID:', req.params.id);
        if (!req.params.id) return res.status(400).json({ success: false, message: 'Refund request ID is required' });

        const { adminNotes } = req.body;
        const refundRequest = await approveRefundRequestService(req.params.id, adminNotes);

        res.json({
            success: true,
            message: 'Refund request approved successfully',
            data: refundRequest
        });
    } catch (error) {
        next(error);
    }
};

// Decline refund request (admin only)
export const declineRefundRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) return res.status(400).json({ success: false, message: 'Refund request ID is required' });

        const { adminNotes, declineReason } = req.body;
        const refundRequest = await declineRefundRequestService(req.params.id, adminNotes, declineReason);

        res.json({
            success: true,
            message: 'Refund request declined successfully',
            data: refundRequest
        });
    } catch (error) {
        next(error);
    }
};

// Get pending requests count (for admin badge)
export const getPendingRequestsCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await getPendingRequestsCountService();
        res.json({ success: true, data: { count } });
    } catch (error) {
        next(error);
    }
};
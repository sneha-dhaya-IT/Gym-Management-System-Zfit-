import type { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import BankTransferPayment from '../models/bankTransfer.model.js';
import type { IBankTransferPayment } from '../models/bankTransfer.model.js';
import { uploadReceiptImage } from '../services/fileUpload.service.js';
import { sendMail } from '../util/sendMail.util.js';
import { getBankTransferApprovalTemplate, getBankTransferDeclineTemplate, type BankTransferApprovalData } from '../util/emailTemplates.js';

import {
    createBankTransferPaymentService,
    getBankTransferPaymentsService,
    getBankTransferPaymentByIdService,
    getPendingBankTransferPaymentsService,
    updateBankTransferPaymentService,
    approveBankTransferPaymentService,
    declineBankTransferPaymentService,
    deleteBankTransferPaymentService
} from '../services/bankTransfer.service.js';


// Extend Request interface for multer
declare global {
  namespace Express {
    interface Request {
      file?: any;
    }
  }
}

// Zod validation schemas
const createBankTransferSchema = z.object({
    userId: z.string().optional(), // Optional for backward compatibility when auth middleware provides it
    membershipId: z.string().min(1, 'Membership ID is required'),
    amount: z.number().min(0, 'Amount must be non-negative'),
    currency: z.string().optional(),
    notes: z.string().optional()
});

const bankTransferIdSchema = z.object({
    id: z.string().min(1, 'Bank transfer ID is required')
});

const approveDeclineSchema = z.object({
    adminNotes: z.string().optional()
});

/**
 * Upload receipt image for bank transfer
 * POST /api/v1/payments/bank-transfer/upload
 */
export const uploadReceipt = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // File validation is handled by multer middleware
        const fileUrl = `/uploads/bank-receipts/${file.filename}`;

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                fileUrl,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype
            }
        });
    } catch (error) {
        console.error('Error uploading receipt:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload receipt image'
        });
    }
};

/**
 * Create bank transfer payment
 * POST /api/v1/payments/bank-transfer
 */
export const createBankTransferPayment = async (req: Request, res: Response) => {
    try {
        const validated = createBankTransferSchema.parse(req.body);
        // Get userId from request body if provided, otherwise use authenticated user ID
        const userId = validated.userId || (req as any).userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if user already has a pending bank transfer for this membership
        const existingPayment = await BankTransferPayment.findOne({
            userId,
            membershipId: validated.membershipId,
            status: 'pending'
        });

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending bank transfer payment for this membership'
            });
        }

        // Create bank transfer payment record
        const bankTransferData: Partial<IBankTransferPayment> = {
            userId: new mongoose.Types.ObjectId(userId),
            membershipId: new mongoose.Types.ObjectId(validated.membershipId),
            amount: validated.amount,
            currency: validated.currency || 'LKR',
            receiptImageUrl: req.body.receiptImageUrl, // Should be provided after file upload
            status: 'pending',
            bankDetails: {
                accountNumber: '123456789012', // Should come from config
                bankName: 'Bank of Ceylon',
                accountHolder: 'ZFit Gym Management'
            }
        };

        if (validated.notes) {
            bankTransferData.notes = validated.notes;
        }

        const bankTransferPayment = await createBankTransferPaymentService(bankTransferData);

        res.status(201).json({
            success: true,
            message: 'Bank transfer payment submitted successfully',
            data: {
                id: bankTransferPayment._id,
                status: bankTransferPayment.status,
                createdAt: bankTransferPayment.createdAt
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }

        console.error('Error creating bank transfer payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bank transfer payment'
        });
    }
};

/**
 * Get pending bank transfer payments (Admin only)
 * GET /api/v1/admin/payments/bank-transfer/pending
 */
export const getPendingBankTransfers = async (req: Request, res: Response) => {
    try {
        // Temporarily skip admin check for testing
        // const adminId = (req as any).userId;
        // const adminRole = (req as any).role;

        // if (!adminId || adminRole !== 'admin') {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'Admin access required'
        //     });
        // }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await getPendingBankTransferPaymentsService(page, limit);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching pending bank transfers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending bank transfers'
        });
    }
};

/**
 * Approve bank transfer payment (Admin only)
 * PUT /api/v1/admin/payments/bank-transfer/:id/approve
 */
export const approveBankTransfer = async (req: Request, res: Response) => {
    try {
        const { id } = bankTransferIdSchema.parse(req.params);
        const { adminNotes } = approveDeclineSchema.parse(req.body);
        // Temporarily use dummy adminId for testing since auth is disabled
        const adminId = (req as any).userId || '507f1f77bcf86cd799439011'; // Dummy admin ID


        try {
            const payment = await approveBankTransferPaymentService(id, adminId, adminNotes);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Bank transfer payment not found'
                });
            }

            // Populate user and membership data for email (already populated by service)
            // await payment.populate([
            //     { path: 'userId', select: 'name email contactNo' },
            //     { path: 'membershipId', select: 'name price' }
            // ]);

            // Send approval email notification
            try {
                const userData = payment.userId as any;
                const membershipData = payment.membershipId as any;
                
                if (userData?.email) {
                    const template = getBankTransferApprovalTemplate({
                        userName: userData.name || 'Customer',
                        membershipName: membershipData?.name || 'Membership',
                        amount: payment.amount,
                        currency: payment.currency,
                        transactionId: (payment._id as mongoose.Types.ObjectId).toString(),
                        approvedDate: new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        adminNotes: adminNotes || undefined
                    });
                    
                    await sendMail({
                        to: userData.email,
                        subject: template.subject,
                        text: template.text,
                        html: template.html
                    });
                    
                    console.log(`Approval email sent to ${userData.email} for bank transfer ${payment._id}`);
                }
            } catch (emailError) {
                console.error('Failed to send approval email:', emailError);
                // Don't fail the approval if email fails - log the error instead
            }

            return res.status(200).json({
                success: true,
                message: 'Bank transfer payment approved successfully',
                data: payment
            });
        } catch (serviceError: any) {
            // Handle service layer errors (like status validation)
            if (serviceError.message.includes('not in pending status') || serviceError.message.includes('not found')) {
                return res.status(400).json({
                    success: false,
                    message: serviceError.message
                });
            }
            throw serviceError; // Re-throw if it's not a known service error
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }

        console.error('Error approving bank transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve bank transfer payment'
        });
    }
};

/**
 * Decline bank transfer payment (Admin only)
 * PUT /api/v1/admin/payments/bank-transfer/:id/decline
 */
export const declineBankTransfer = async (req: Request, res: Response) => {
    try {
        const { id } = bankTransferIdSchema.parse(req.params);
        const { adminNotes } = approveDeclineSchema.parse(req.body);
        // Temporarily use dummy adminId for testing since auth is disabled
        const adminId = (req as any).userId || '507f1f77bcf86cd799439011'; // Dummy admin ID


        try {
            const payment = await declineBankTransferPaymentService(id, adminId, adminNotes);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Bank transfer payment not found'
                });
            }

            // Populate user and membership data for email (already populated by service)
            // await payment.populate([
            //     { path: 'userId', select: 'name email contactNo' },
            //     { path: 'membershipId', select: 'name price' }
            // ]);

            // Send decline email notification
            try {
                const userData = payment.userId as any;
                const membershipData = payment.membershipId as any;
                
                if (userData?.email) {
                    const template = getBankTransferDeclineTemplate({
                        userName: userData.name || 'Customer',
                        membershipName: membershipData?.name || 'Membership',
                        amount: payment.amount,
                        currency: payment.currency,
                        transactionId: (payment._id as mongoose.Types.ObjectId).toString(),
                        approvedDate: new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        adminNotes: adminNotes || undefined
                    });
                    
                    await sendMail({
                        to: userData.email,
                        subject: template.subject,
                        text: template.text,
                        html: template.html
                    });
                    
                    console.log(`Decline email sent to ${userData.email} for bank transfer ${payment._id}`);
                }
            } catch (emailError) {
                console.error('Failed to send decline email:', emailError);
                // Don't fail the decline if email fails - log the error instead
            }

            return res.status(200).json({
                success: true,
                message: 'Bank transfer payment declined',
                data: payment
            });
        } catch (serviceError: any) {
            // Handle service layer errors (like status validation)
            if (serviceError.message.includes('not in pending status') || serviceError.message.includes('not found')) {
                return res.status(400).json({
                    success: false,
                    message: serviceError.message
                });
            }
            throw serviceError; // Re-throw if it's not a known service error
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }

        console.error('Error declining bank transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decline bank transfer payment'
        });
    }
};

/**
 * Get user's bank transfer payments
 * GET /api/v1/payments/bank-transfer/my-payments
 */
export const getUserBankTransfers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const payments = await getBankTransferPaymentsService(userId);

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching user bank transfers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bank transfer payments'
        });
    }
};

/**
 * Delete bank transfer payment (Admin only)
 * DELETE /api/v1/admin/payments/bank-transfer/:id
 */
export const deleteBankTransfer = async (req: Request, res: Response) => {
    try {
        const { id } = bankTransferIdSchema.parse(req.params);

        const deletedPayment = await deleteBankTransferPaymentService(id);

        if (!deletedPayment) {
            return res.status(404).json({
                success: false,
                message: 'Bank transfer payment not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bank transfer payment deleted successfully'
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.issues
            });
        }

        console.error('Error deleting bank transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bank transfer payment'
        });
    }
};
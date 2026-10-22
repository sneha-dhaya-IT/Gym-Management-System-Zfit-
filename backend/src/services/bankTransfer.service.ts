import BankTransferPayment from "../models/bankTransfer.model.js";
import type { IBankTransferPayment } from "../models/bankTransfer.model.js";
import Payment from "../models/payment.model.js";
import type { IPayment } from "../models/payment.model.js";
import { createPaymentService } from "./payment.services.js";
import { createMembership } from './membership.service.js';
import mongoose from "mongoose";

// Create a new bank transfer payment
export const createBankTransferPaymentService = async (data: Partial<IBankTransferPayment>) => {
    const bankTransferPayment = new BankTransferPayment(data);
    return await bankTransferPayment.save();
};

// Get all bank transfer payments for a user
export const getBankTransferPaymentsService = async (userId?: string) => {
    if (!userId) {
        return await BankTransferPayment.find({})
            .populate('userId', 'name email contactNo role status')
            .sort({ createdAt: -1 });
    }
    return await BankTransferPayment.find({ userId })
        .populate('userId', 'name email contactNo role status')
        .sort({ createdAt: -1 });
};

// Get single bank transfer payment by ID
export const getBankTransferPaymentByIdService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid bank transfer payment ID format');
    }
    return await BankTransferPayment.findById(id)
        .populate('userId', 'name email contactNo role status');
};

// Get pending bank transfer payments (Admin)
export const getPendingBankTransferPaymentsService = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const payments = await BankTransferPayment.find({ status: 'pending' })
        .populate('userId', 'name email contactNo role status')
        .populate('membershipId', 'name price duration')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await BankTransferPayment.countDocuments({ status: 'pending' });

    return {
        payments,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Update bank transfer payment
export const updateBankTransferPaymentService = async (id: string, data: Partial<IBankTransferPayment>) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid bank transfer payment ID format');
    }
    return await BankTransferPayment.findByIdAndUpdate(id, data, { new: true })
        .populate('userId', 'name email contactNo role status');
};

// Delete bank transfer payment
export const deleteBankTransferPaymentService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid bank transfer payment ID format');
    }
    return await BankTransferPayment.findByIdAndDelete(id);
};

// Approve bank transfer payment
export const approveBankTransferPaymentService = async (id: string, adminId: string, adminNotes?: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid bank transfer payment ID format');
    }

    // Get the bank transfer payment first
    const bankTransfer = await BankTransferPayment.findById(id)
        .populate('userId', 'name email contactNo role status')
        .populate('membershipId', 'name price duration');

    if (!bankTransfer) {
        throw new Error('Bank transfer payment not found');
    }

    if (bankTransfer.status !== 'pending') {
        throw new Error('Bank transfer payment is not in pending status');
    }

    // Update bank transfer status
    const updateData: Partial<IBankTransferPayment> = {
        status: 'approved',
        processedBy: new mongoose.Types.ObjectId(adminId),
        processedAt: new Date()
    };

    if (adminNotes) {
        updateData.adminNotes = adminNotes;
    }

    const updatedBankTransfer = await BankTransferPayment.findByIdAndUpdate(id, updateData, { new: true })
        .populate('userId', 'name email contactNo role status')
        .populate('membershipId', 'name price duration');

    // Create a corresponding Payment record
    const paymentData: Partial<IPayment> = {
        userId: bankTransfer.userId,
        amount: bankTransfer.amount,
        currency: bankTransfer.currency,
        type: 'membership', // Assuming bank transfers are for memberships
        status: 'completed', // Bank transfers are completed when approved
        method: 'bank-transfer',
        relatedId: bankTransfer.membershipId, // Initially set to membership plan ID
        transactionId: bankTransfer.transferId || `BT-${bankTransfer._id}-${Date.now()}`, // Use the bank transfer ID or fallback to old format
        date: new Date()
    };

    const createdPayment = await createPaymentService(paymentData);

    // Create membership from the bank transfer
    let membership = null;
    try {
        console.log('Creating membership for bank transfer with data:', {
            userId: bankTransfer.userId.toString(),
            membershipPlanId: bankTransfer.membershipId.toString(),
            transactionId: createdPayment.transactionId,
            autoRenew: false,
            notes: `Auto-created from bank transfer payment ${createdPayment.transactionId}`
        });
        
        membership = await createMembership({
            userId: bankTransfer.userId.toString(),
            membershipPlanId: bankTransfer.membershipId.toString(),
            transactionId: createdPayment.transactionId,
            autoRenew: false,
            notes: `Auto-created from bank transfer payment ${createdPayment.transactionId}`
        });
        
        console.log('Membership created successfully for bank transfer:', membership);

        // Update payment record to reference the created membership instead of the plan
        if (membership && membership._id) {
            await Payment.findByIdAndUpdate(
                createdPayment._id,
                { relatedId: membership._id },
                { new: true }
            );
            console.log('Bank transfer payment record updated with membership reference:', membership._id);
        }
    } catch (membershipError) {
        console.error('Failed to create membership for bank transfer:', membershipError);
        // Don't fail the approval if membership creation fails - log the error instead
    }

    return updatedBankTransfer;
};

// Decline bank transfer payment
export const declineBankTransferPaymentService = async (id: string, adminId: string, adminNotes?: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid bank transfer payment ID format');
    }

    const updateData: Partial<IBankTransferPayment> = {
        status: 'declined',
        processedBy: new mongoose.Types.ObjectId(adminId),
        processedAt: new Date()
    };

    if (adminNotes) {
        updateData.adminNotes = adminNotes;
    }

    return await BankTransferPayment.findByIdAndUpdate(id, updateData, { new: true })
        .populate('userId', 'name email contactNo role status')
        .populate('membershipId', 'name price duration');
};
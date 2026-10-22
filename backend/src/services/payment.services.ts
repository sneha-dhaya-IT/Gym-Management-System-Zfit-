import Payment from "../models/payment.model.js";
import type { IPayment } from "../models/payment.model.js";
import mongoose from "mongoose";
import { createInvoiceService } from "./invoice.services.js";



// Create a new payment
export const createPaymentService = async (data: Partial<IPayment>) => {
    const payment = new Payment(data);
    const savedPayment = await payment.save();
    
    console.log('Payment created:', savedPayment._id, 'Status:', savedPayment.status);
    
    // Automatically create invoice if payment is completed
    if (savedPayment.status === 'completed') {
        console.log('Creating invoice for completed payment:', savedPayment._id);
        try {
            await createInvoiceForPayment(savedPayment);
            console.log('Invoice creation completed for payment:', savedPayment._id);
        } catch (invoiceError) {
            console.error('Failed to create invoice for payment:', invoiceError);
            // Don't throw error for invoice creation failure - payment is still created
        }
    }
    
    return savedPayment;
};

// Get all payments for a user
export const getPaymentsService = async (userId: string) => {
    if (!userId) {
        return await Payment.find({}).populate('userId', 'name email contactNo role status');
    }
    return await Payment.find({ userId }).populate('userId', 'name email contactNo role status');
};

// Get single payment by ID
export const getPaymentByIdService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid payment ID format');
    }
    return await Payment.findById(id).populate('userId', 'name email contactNo role status');
};

// Update payment
export const updatePaymentService = async (id: string, data: Partial<IPayment>) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid payment ID format');
    }
    
    // Get the payment before updating to check current status
    const existingPayment = await Payment.findById(id);
    if (!existingPayment) {
        throw new Error('Payment not found');
    }
    
    const updatedPayment = await Payment.findByIdAndUpdate(id, data, { new: true }).populate('userId', 'name email contactNo role status');
    
    // Create invoice if payment status changed to completed
    if (existingPayment.status !== 'completed' && data.status === 'completed' && updatedPayment) {
        try {
            await createInvoiceForPayment(updatedPayment);
            console.log('Invoice created for updated payment:', updatedPayment._id);
        } catch (invoiceError) {
            console.error('Failed to create invoice for payment:', invoiceError);
            // Don't throw error for invoice creation failure - payment is still updated
        }
    }
    
    return updatedPayment;
};

// Delete payment
export const deletePaymentService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid payment ID format');
    }
    return await Payment.findByIdAndDelete(id);
};

// Process payment (mark as completed & store gateway response)
export const processPaymentService = async (id: string, response: Record<string, unknown>) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid payment ID format');
    }

    // Get the payment before updating to check if it was already completed
    const existingPayment = await Payment.findById(id);
    if (!existingPayment) {
        throw new Error('Payment not found');
    }

    // Update payment status to completed
    const updatedPayment = await Payment.findByIdAndUpdate(
        id,
        { status: "completed", gatewayResponse: response },
        { new: true }
    ).populate('userId', 'name email contactNo role status');

    // Only create invoice if payment was not already completed
    if (existingPayment.status !== 'completed') {
        try {
            // Create invoice automatically for completed payment
            await createInvoiceForPayment(updatedPayment!);
            console.log('Invoice created for processed payment:', updatedPayment!._id);
        } catch (invoiceError) {
            console.error('Failed to create invoice for payment:', invoiceError);
            // Don't throw error for invoice creation failure - payment is still completed
        }
    }

    return updatedPayment;
};

// Delete all payments
export const deleteAllPaymentsService = async () => {
    const result = await Payment.deleteMany({});
    return result;
};

// Cleanup old pending payments (older than specified seconds)
export const cleanupPendingPaymentsService = async (secondsOld: number = 30): Promise<{ deletedCount: number }> => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setSeconds(cutoffDate.getSeconds() - secondsOld);

        const result = await Payment.deleteMany({
            status: 'pending',
            createdAt: { $lt: cutoffDate }
        });

        return { deletedCount: result.deletedCount };
    } catch (error) {
        console.error('Error cleaning up pending payments:', error);
        throw error;
    }
};

// Get pending payment statistics
export const getPendingPaymentStatsService = async (): Promise<{
    totalPending: number;
    pendingByAge: {
        lessThan7Days: number;
        between7And30Days: number;
        between30And90Days: number;
        moreThan90Days: number;
    };
    oldestPendingPayment?: Date | undefined;
}> => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const [
            totalPending,
            lessThan7Days,
            between7And30Days,
            between30And90Days,
            moreThan90Days,
            oldestPending
        ] = await Promise.all([
            Payment.countDocuments({ status: 'pending' }),
            Payment.countDocuments({ status: 'pending', createdAt: { $gte: sevenDaysAgo } }),
            Payment.countDocuments({ status: 'pending', createdAt: { $gte: thirtyDaysAgo, $lt: sevenDaysAgo } }),
            Payment.countDocuments({ status: 'pending', createdAt: { $gte: ninetyDaysAgo, $lt: thirtyDaysAgo } }),
            Payment.countDocuments({ status: 'pending', createdAt: { $lt: ninetyDaysAgo } }),
            Payment.findOne({ status: 'pending' }).sort({ createdAt: 1 }).select('createdAt')
        ]);

        return {
            totalPending,
            pendingByAge: {
                lessThan7Days,
                between7And30Days,
                between30And90Days,
                moreThan90Days
            },
            oldestPendingPayment: oldestPending?.createdAt || undefined
        };
    } catch (error) {
        console.error('Error getting pending payment stats:', error);
        throw error;
    }
};

// Helper function to create invoice for completed payment
const createInvoiceForPayment = async (payment: IPayment) => {
    console.log('Starting invoice creation for payment:', payment._id);
    try {
        // Create invoice items based on payment type
        const invoiceItems = [{
            description: getPaymentDescription(payment),
            quantity: 1,
            unitPrice: payment.amount,
            total: payment.amount,
            tax: 0 // Default tax, can be calculated based on business rules
        }];

        // Calculate totals
        const subtotal = payment.amount;
        const tax = 0; // Default tax calculation
        const discount = 0;
        const total = subtotal + tax - discount;

        // Set due date (30 days from now for most payments)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice data
        const invoiceData = {
            paymentId: payment._id,
            userId: payment.userId,
            items: invoiceItems,
            subtotal,
            tax,
            discount,
            total,
            dueDate,
            status: 'draft', // Start as draft, will be sent after 21 days
            generatedAt: new Date(),
            currency: payment.currency || 'LKR'
        };

        // Create the invoice
        await createInvoiceService(invoiceData);
        console.log('Invoice created successfully via createInvoiceService');
    } catch (error) {
        console.error('Error creating invoice for payment:', error);
        throw error;
    }
};

// Helper function to get payment description based on type
const getPaymentDescription = (payment: IPayment): string => {
    switch (payment.type) {
        case 'membership':
            return 'Membership Fee Payment';
        case 'inventory':
            return 'Inventory Purchase';
        case 'booking':
            return 'Class/Booking Payment';
        case 'other':
            return 'General Payment';
        default:
            return 'Payment Service';
    }
};

import Invoice from '../models/invoice.model.js';
import { cleanupPendingPaymentsService } from './payment.services.js';

/**
 * Check for overdue invoices and update their status
 * This function should be called periodically (e.g., daily)
 */
export const checkAndUpdateOverdueInvoices = async (): Promise<void> => {
    try {
        const currentDate = new Date();

        // Find all invoices that are 'sent' or 'paid' but past their due date
        const overdueInvoices = await Invoice.find({
            status: { $in: ['sent', 'paid'] },
            dueDate: { $lt: currentDate }
        }).populate('userId', 'name email contactNo');

        for (const invoice of overdueInvoices) {
            try {
                // Update status to overdue
                await Invoice.findByIdAndUpdate(invoice._id, {
                    status: 'overdue',
                    updatedAt: new Date()
                });
            } catch (updateError) {
                console.error(`Failed to update invoice ${invoice._id}:`, updateError);
            }
        }
    } catch (error) {
        console.error('Error checking for overdue invoices:', error);
    }
};

/**
 * Check for draft invoices older than 21 days and mark them as sent
 * This function should be called periodically (e.g., daily)
 */
export const checkAndSendDraftInvoices = async (): Promise<void> => {
    try {
        const twentyOneDaysAgo = new Date();
        twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

        // Find all draft invoices older than 21 days
        const draftInvoicesToSend = await Invoice.find({
            status: 'draft',
            generatedAt: { $lt: twentyOneDaysAgo }
        }).populate('userId', 'name email contactNo');

        for (const invoice of draftInvoicesToSend) {
            try {
                // Update status to sent
                await Invoice.findByIdAndUpdate(invoice._id, {
                    status: 'sent',
                    updatedAt: new Date()
                });
                console.log(`Invoice ${invoice._id} marked as sent after 21 days`);
            } catch (updateError) {
                console.error(`Failed to send draft invoice ${invoice._id}:`, updateError);
            }
        }
    } catch (error) {
        console.error('Error checking for draft invoices to send:', error);
    }
};

/**
 * Get invoice statistics for dashboard
 */
export const getInvoiceStatistics = async () => {
    try {
        const stats = await Invoice.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total' }
                }
            }
        ]);

        const result = {
            total: 0,
            draft: 0,
            sent: 0,
            paid: 0,
            overdue: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
            overdueRevenue: 0
        };

        stats.forEach((stat: any) => {
            (result as any)[stat._id] = stat.count;
            result.total += stat.count;

            if (stat._id === 'paid') {
                result.totalRevenue = stat.totalAmount;
            } else if (stat._id === 'sent') {
                result.pendingRevenue = stat.totalAmount;
            } else if (stat._id === 'overdue') {
                result.overdueRevenue = stat.totalAmount;
            }
        });

        return result;
    } catch (error) {
        console.error('Error getting invoice statistics:', error);
        throw error;
    }
};

/**
 * Cleanup old pending payments (older than 30 seconds by default)
 */
export const cleanupOldPendingPayments = async (secondsOld: number = 30): Promise<void> => {
    try {
        const result = await cleanupPendingPaymentsService(secondsOld);
    } catch (error) {
        console.error('Error during pending payment cleanup:', error);
    }
};
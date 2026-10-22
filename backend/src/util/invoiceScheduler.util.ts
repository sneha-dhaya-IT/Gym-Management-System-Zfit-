import { checkAndUpdateOverdueInvoices, checkAndSendDraftInvoices, cleanupOldPendingPayments } from '../services/invoiceScheduler.services.js';

/**
 * Invoice automation scheduler
 * Runs periodic tasks for invoice management
 */
class InvoiceScheduler {
    private overdueCheckInterval: NodeJS.Timeout | null = null;
    private draftCheckInterval: NodeJS.Timeout | null = null;
    private paymentCleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Start the invoice scheduler
     */
    start(): void {
        

        // Check for draft invoices to send daily (every 24 hours)
        this.draftCheckInterval = setInterval(async () => {
            
            await checkAndSendDraftInvoices();
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Check for overdue invoices daily (every 24 hours)
        this.overdueCheckInterval = setInterval(async () => {
            
            await checkAndUpdateOverdueInvoices();
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Cleanup old pending payments every 30 seconds
        this.paymentCleanupInterval = setInterval(async () => {
            
            await cleanupOldPendingPayments(30); // 30 seconds old
        }, 30 * 1000); // 30 seconds

        // Run initial checks on startup
        setTimeout(async () => {
            
            await checkAndSendDraftInvoices();

            
            await checkAndUpdateOverdueInvoices();

            
            await cleanupOldPendingPayments(30);
        }, 5000); // Wait 5 seconds after startup
    }

    /**
     * Stop the invoice scheduler
     */
    stop(): void {
        

        if (this.draftCheckInterval) {
            clearInterval(this.draftCheckInterval);
            this.draftCheckInterval = null;
        }

        if (this.overdueCheckInterval) {
            clearInterval(this.overdueCheckInterval);
            this.overdueCheckInterval = null;
        }

        if (this.paymentCleanupInterval) {
            clearInterval(this.paymentCleanupInterval);
            this.paymentCleanupInterval = null;
        }
    }

    /**
     * Manually trigger draft invoice check (for testing)
     */
    async triggerDraftCheck(): Promise<void> {
        
        await checkAndSendDraftInvoices();
    }

    /**
     * Manually trigger overdue check (for testing)
     */
    async triggerOverdueCheck(): Promise<void> {
        
        await checkAndUpdateOverdueInvoices();
    }

    /**
     * Manually trigger payment cleanup (for testing)
     */
    async triggerPaymentCleanup(secondsOld: number = 30): Promise<void> {
        await cleanupOldPendingPayments(secondsOld);
    }
}

// Export singleton instance
export const invoiceScheduler = new InvoiceScheduler();
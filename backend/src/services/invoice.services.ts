import Invoice from '../models/invoice.model.js';
import type { IInvoice } from '../models/invoice.model.js';
import mongoose from 'mongoose';
import { generateInvoicePDF } from '../util/invoicePDF.util.js';

export const createInvoiceService = async (
    data: Record<string, any>
): Promise<IInvoice> => {
    // Create the invoice first
    const invoice = new Invoice(data);
    const savedInvoice = await invoice.save();

    try {
        // Populate user data for PDF generation
        const populatedInvoice = await Invoice.findById(savedInvoice._id)
            .populate('userId', 'name email contactNo')
            .populate('paymentId', 'transactionId type');

        if (populatedInvoice) {
            // Prepare data for PDF generation
            const pdfData: any = {
                number: populatedInvoice.number,
                generatedAt: populatedInvoice.generatedAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                dueDate: populatedInvoice.dueDate?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                userName: (populatedInvoice.userId as any)?.name || 'N/A',
                userEmail: (populatedInvoice.userId as any)?.email || 'N/A',
                userContactNo: (populatedInvoice.userId as any)?.contactNo,
                items: populatedInvoice.items || [],
                subtotal: populatedInvoice.subtotal,
                tax: populatedInvoice.tax,
                discount: populatedInvoice.discount,
                total: populatedInvoice.total,
                currency: 'LKR', // Default currency
                status: populatedInvoice.status
            };

            // Generate PDF
            const pdfUrl = await generateInvoicePDF(pdfData);

            // Update invoice with PDF URL
            populatedInvoice.pdfUrl = pdfUrl;
            await populatedInvoice.save();
        }
    } catch (pdfError) {
        console.error('Failed to generate PDF for invoice:', pdfError);
        // Don't throw error - invoice is still created successfully
    }

    return savedInvoice;
};

export const getInvoicesService = async (userId?: string): Promise<IInvoice[]> => {
    if (userId) {
        return await Invoice.find({ userId })
            .populate('userId', 'name email contactNo')
            .populate('paymentId', 'transactionId type method amount status createdAt');
    } else {
        return await Invoice.find({})
            .populate('userId', 'name email contactNo')
            .populate('paymentId', 'transactionId type method amount status createdAt');
    }
};

export const getInvoiceByIdService = async (id: string): Promise<IInvoice | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Invoice.findById(id)
        .populate('userId', 'name email contactNo')
        .populate('paymentId', 'transactionId type method amount status createdAt');
};

export const updateInvoiceService = async (
    id: string,
    data: Record<string, any>
): Promise<IInvoice | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Invoice.findByIdAndUpdate(id, data, { new: true });
};

export const deleteInvoiceService = async (id: string): Promise<IInvoice | null> => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Invoice.findByIdAndDelete(id);
};

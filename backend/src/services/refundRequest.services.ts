import mongoose from 'mongoose';
import RefundRequest from '../models/refundRequest.model.js';
import { sendMail } from '../util/sendMail.util.js';
import { getRefundApprovalTemplate, getRefundDeclineTemplate } from '../util/emailTemplates.js';

// Simple change to trigger reload

export const createRefundRequestService = async (data: any) => {
    const refundRequest = new RefundRequest(data);
    return await refundRequest.save();
};

export const getRefundRequestsService = async (status?: string) => {
    const filter = status ? { status } : {};
    return await RefundRequest.find(filter)
        .populate('userId', 'name email contactNo')
        .populate('paymentId', 'amount transactionId type createdAt')
        .sort({ createdAt: -1 });
};

export const getRefundRequestByIdService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid refund request ID');
    }
    const refundRequest = await RefundRequest.findById(id)
        .populate('userId', 'name email contactNo profile')
        .populate('paymentId', 'amount transactionId type createdAt relatedId');

    if (!refundRequest) {
        throw new Error('Refund request not found');
    }
    return refundRequest;
};

export const getRefundRequestsByUserService = async (userId: string) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
    }
    return await RefundRequest.find({ userId })
        .populate('paymentId', 'amount transactionId type createdAt')
        .sort({ createdAt: -1 });
};

export const updateRefundRequestService = async (id: string, data: any) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid refund request ID');
    }
    const refundRequest = await RefundRequest.findByIdAndUpdate(id, data, { new: true });
    if (!refundRequest) {
        throw new Error('Refund request not found');
    }
    return refundRequest;
};

export const deleteRefundRequestService = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid refund request ID');
    }
    const refundRequest = await RefundRequest.findByIdAndDelete(id);
    if (!refundRequest) {
        throw new Error('Refund request not found');
    }
    return refundRequest;
};

export const approveRefundRequestService = async (id: string, adminNotes?: string) => {
    console.log('🚀 approveRefundRequestService called with ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid refund request ID');
    }

    // First get the refund request with populated data for email
    const refundRequestForEmail = await RefundRequest.findById(id)
        .populate('userId', 'name email')
        .populate('paymentId', 'amount transactionId type');

    if (!refundRequestForEmail) {
        throw new Error('Refund request not found');
    }

    // Update the refund request status
    const refundRequest = await RefundRequest.findByIdAndUpdate(
        id,
        {
            status: 'approved',
            adminNotes,
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!refundRequest) {
        throw new Error('Refund request not found');
    }

    // Send approval email
    try {
        const user = refundRequestForEmail.userId as any;
        const payment = refundRequestForEmail.paymentId as any;
        
        console.log('🔍 Starting email sending process for approval...');
        console.log('📧 User email:', user?.email);
        console.log('📝 Request ID:', refundRequestForEmail.requestId);
        
        if (user && user.email) {
            const emailData: any = {
                userName: user.name,
                requestId: refundRequestForEmail.requestId,
                requestedAmount: refundRequestForEmail.requestedAmount,
                currency: 'LKR', // Default currency
                originalPaymentId: payment?.transactionId || 'N/A',
                paymentType: payment?.type || 'unknown',
                approvedDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };
            
            if (adminNotes) {
                emailData.adminNotes = adminNotes;
            }
            
            console.log('📨 Sending approval email to:', user.email);
            console.log('📋 Email data:', JSON.stringify(emailData, null, 2));
            
            const template = getRefundApprovalTemplate(emailData);
            await sendMail({
                to: user.email,
                subject: template.subject,
                text: template.text,
                html: template.html
            });
            console.log('✅ Approval email sent successfully!');
        } else {
            console.log('❌ No user email found for sending approval notification');
        }
    } catch (emailError) {
        console.error('❌ Failed to send approval email:', emailError);
        console.error('📄 Error details:', emailError instanceof Error ? emailError.message : String(emailError));
        // Don't throw error for email failure, just log it
    }

    return refundRequest;
};

export const declineRefundRequestService = async (id: string, adminNotes?: string, declineReason?: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid refund request ID');
    }

    // First get the refund request with populated data for email
    const refundRequestForEmail = await RefundRequest.findById(id)
        .populate('userId', 'name email')
        .populate('paymentId', 'amount transactionId type');

    if (!refundRequestForEmail) {
        throw new Error('Refund request not found');
    }

    // Update the refund request status
    const refundRequest = await RefundRequest.findByIdAndUpdate(
        id,
        {
            status: 'declined',
            adminNotes,
            updatedAt: new Date()
        },
        { new: true }
    );

    if (!refundRequest) {
        throw new Error('Refund request not found');
    }

    // Send decline email
    try {
        const user = refundRequestForEmail.userId as any;
        
        console.log('🔍 Starting email sending process for decline...');
        console.log('📧 User email:', user?.email);
        console.log('📝 Request ID:', refundRequestForEmail.requestId);
        
        if (user && user.email) {
            const emailData: any = {
                userName: user.name,
                requestId: refundRequestForEmail.requestId,
                requestedAmount: refundRequestForEmail.requestedAmount,
                currency: 'LKR', // Default currency
                declinedDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                declineReason: declineReason || 'No specific reason provided'
            };
            
            if (adminNotes) {
                emailData.adminNotes = adminNotes;
            }
            
            console.log('📨 Sending decline email to:', user.email);
            console.log('📋 Email data:', JSON.stringify(emailData, null, 2));
            
            const template = getRefundDeclineTemplate(emailData);
            await sendMail({
                to: user.email,
                subject: template.subject,
                text: template.text,
                html: template.html
            });
            console.log('✅ Decline email sent successfully!');
        } else {
            console.log('❌ No user email found for sending decline notification');
        }
    } catch (emailError) {
        console.error('❌ Failed to send decline email:', emailError);
        console.error('📄 Error details:', emailError instanceof Error ? emailError.message : String(emailError));
        // Don't throw error for email failure, just log it
    }

    return refundRequest;
};

export const getPendingRequestsCountService = async () => {
    return await RefundRequest.countDocuments({ status: 'pending' });
};
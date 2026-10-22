import mongoose, { Document } from 'mongoose';

export interface IRefundRequest extends Document {
    userId: mongoose.Types.ObjectId;
    paymentId: mongoose.Types.ObjectId;
    requestedAmount: number;
    notes: string;
    status: 'pending' | 'approved' | 'declined';
    adminNotes?: string;
    requestId: string; // Auto-generated
    createdAt?: Date;
    updatedAt?: Date;
}

const refundRequestSchema = new mongoose.Schema<IRefundRequest>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    requestedAmount: {
        type: Number,
        required: true,
        min: 0
    },
    notes: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending'
    },
    adminNotes: {
        type: String
    },
    requestId: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Auto-generate request ID
refundRequestSchema.pre<IRefundRequest>('save', async function(this: IRefundRequest, next: (err?: Error) => void) {
    if (!this.requestId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.requestId = `ZF-RR-${new Date().getFullYear()}-${timestamp}-${random}`;
    }
    next();
});

refundRequestSchema.index({ userId: 1 });
refundRequestSchema.index({ status: 1 });
refundRequestSchema.index({ paymentId: 1 });

export default mongoose.model<IRefundRequest>('RefundRequest', refundRequestSchema);

import mongoose, { Document } from 'mongoose';

export interface IRefund extends Document {
    paymentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    refundId: string; // Auto-generated
    originalAmount: number;
    refundAmount: number;
    status: 'pending' | 'completed' | 'failed';
    notes: string;
    gatewayRefundId?: string; // PayHere refund reference
    gatewayResponse?: mongoose.Schema.Types.Mixed;
    createdAt?: Date;
    updatedAt?: Date;
}

const refundSchema = new mongoose.Schema<IRefund>({
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refundId: {
        type: String,
        unique: true,
        // required: true  // Removed required since it's auto-generated
    },
    originalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    refundAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    notes: {
        type: String,
        required: true
    },
    gatewayRefundId: String,
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Auto-generate refund ID
refundSchema.pre<IRefund>('save', async function(this: IRefund, next: (err?: Error) => void) {
    if (!this.refundId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.refundId = `ZF-REF-${new Date().getFullYear()}-${timestamp}-${random}`;
    }
    next();
});

refundSchema.index({ paymentId: 1 });
refundSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IRefund>('Refund', refundSchema);
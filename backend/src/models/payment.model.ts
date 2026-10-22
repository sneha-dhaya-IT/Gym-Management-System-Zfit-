import mongoose, { Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  type: 'membership' | 'inventory' | 'booking' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'card' | 'bank-transfer' | 'cash';
  relatedId?: mongoose.Types.ObjectId; // Optional for 'other' type payments like cart
  transactionId: string;
  gatewayTransactionId?: string;
  gatewayPaymentId?: string;
  gatewayResponse?: mongoose.Schema.Types.Mixed;
  failureReason?: string;
  refundedAmount: number;
  refundReason?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'LKR' },
    type: { type: String, enum: ['membership', 'inventory', 'booking', 'other'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], required: true },
    method: { type: String, enum: ['card', 'bank-transfer', 'cash'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: false }, // Optional for 'other' type payments like cart
    transactionId: { type: String, required: true, unique: true, index: true },
    gatewayTransactionId: String,
    gatewayPaymentId: String,
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
    failureReason: String,
    refundedAmount: { type: Number, default: 0 },
    refundReason: String,
    date: { type: Date, required: true }
  },
  { timestamps: true }
);
export default mongoose.model<IPayment>('Payment', paymentSchema);

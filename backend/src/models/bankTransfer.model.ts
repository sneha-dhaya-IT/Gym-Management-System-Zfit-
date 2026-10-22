import mongoose, { Document } from 'mongoose';
import { nanoid } from 'nanoid';

export interface IBankTransferPayment extends Document {
  transferId?: string;
  userId: mongoose.Types.ObjectId;
  membershipId: mongoose.Types.ObjectId; // Reference to membership plan
  amount: number;
  currency: string;
  receiptImageUrl: string; // Path to uploaded receipt image
  status: 'pending' | 'approved' | 'declined';
  bankDetails: {
    accountNumber: string;
    bankName: string;
    accountHolder: string;
  };
  notes?: string; // User notes
  adminNotes?: string; // Admin comments on approval/decline
  processedBy?: mongoose.Types.ObjectId; // Admin who processed it
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const bankTransferPaymentSchema = new mongoose.Schema<IBankTransferPayment>(
  {
    transferId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'LKR' },
    receiptImageUrl: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending', index: true },
    bankDetails: {
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      accountHolder: { type: String, required: true }
    },
    notes: { type: String, trim: true },
    adminNotes: { type: String, trim: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date }
  },
  { timestamps: true }
);

// Index for efficient queries
bankTransferPaymentSchema.index({ status: 1, createdAt: -1 });
bankTransferPaymentSchema.index({ userId: 1, status: 1 });

// Pre-save hook to generate transferId
bankTransferPaymentSchema.pre('save', function (next) {
  if (!this.transferId) {
    this.transferId = `ZFIT-BT-${nanoid(16)}`;
  }
  next();
});

export default mongoose.model<IBankTransferPayment>('BankTransferPayment', bankTransferPaymentSchema);
import mongoose, { Document } from 'mongoose';

// Counter interface for auto-incrementing invoice numbers
interface ICounter extends Document {
    _id: string;
    seq: number;
}

// Counter schema for atomic number generation
const counterSchema = new mongoose.Schema<ICounter>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

// Counter model
const Counter = mongoose.model<ICounter>('Counter', counterSchema);

interface IInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    tax: number;
}

export interface IInvoice extends Document {
    paymentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    number: string; // Auto-generated, unique
    items?: IInvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    dueDate?: Date;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    generatedAt: Date;
    pdfUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const invoiceItemSchema = new mongoose.Schema<IInvoiceItem>({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    }
});

const invoiceSchema = new mongoose.Schema<IInvoice>({
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
    number: {
        type: String,
        unique: true,
        // required: true  // Removed required since it's auto-generated
    },
    items: [invoiceItemSchema], // Embedded array (optional)
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: Date,
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue'],
        required: true
    },
    generatedAt: {
        type: Date,
        required: true
    },
    pdfUrl: String
}, {
    timestamps: true
});

// Auto-generate invoice number with atomic counter to prevent race conditions
invoiceSchema.pre<IInvoice>('save', async function(this: IInvoice, next: (err?: Error) => void) {
    if (!this.number) {
        try {
            // Use findOneAndUpdate with upsert to atomically increment counter
            const counter = await Counter.findOneAndUpdate(
                { _id: 'invoice_number' },
                { $inc: { seq: 1 } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            this.number = `ZF-INV-${new Date().getFullYear()}-${String(counter.seq).padStart(6, '0')}`;
        } catch (error) {
            return next(error as Error);
        }
    }
    next();
});

// Indexes (as per docs)
invoiceSchema.index({ paymentId: 1 });
invoiceSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
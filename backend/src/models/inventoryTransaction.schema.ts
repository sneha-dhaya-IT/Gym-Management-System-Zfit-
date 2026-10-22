import { Schema, model, Document } from 'mongoose'

export interface IInventoryTransaction extends Document {
  itemId: Schema.Types.ObjectId
  transactionType: 'IN' | 'OUT'
  quantity: number
  reason: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'EXPIRED'
  referenceId?: Schema.Types.ObjectId
  performedBy: Schema.Types.ObjectId
  notes?: string
  previousStock: number
  newStock: number
  createdAt: Date
}

const inventoryTransactionSchema = new Schema<IInventoryTransaction>({
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true,
    index: true
  },
  transactionType: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    enum: ['SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'EXPIRED'],
    required: true
  },
  referenceId: {
    type: Schema.Types.ObjectId,
    required: false,
    index: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'inventoryTransactions'
})

// Indexes for better query performance
inventoryTransactionSchema.index({ itemId: 1, createdAt: -1 })
inventoryTransactionSchema.index({ performedBy: 1, createdAt: -1 })
inventoryTransactionSchema.index({ reason: 1, createdAt: -1 })

export const InventoryTransaction = model<IInventoryTransaction>('InventoryTransaction', inventoryTransactionSchema)
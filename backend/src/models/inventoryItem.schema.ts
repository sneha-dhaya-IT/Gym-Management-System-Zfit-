import mongoose, { Document } from "mongoose";

export interface IInventoryItem extends Document {
    name: string;
    categoryID: mongoose.Types.ObjectId;
    supplierID: mongoose.Types.ObjectId;
    type: "sellable" | "equipment";
    isActive: boolean;
    
    // Sellable item fields
    price?: number | undefined;
    stock?: number | undefined;
    expiryDate?: Date | undefined;
    lowStockAlert?: number | undefined;
    
    // Equipment fields
    purchaseDate?: Date | undefined;
    maintenanceSchedule?: string | undefined;
    warrantyPeriod?: string | undefined;
    
    createdAt: Date;
    updatedAt: Date;
}

const InventoryItemSchema = new mongoose.Schema<IInventoryItem>({
    name: { 
        type: String, 
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    categoryID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Category", 
        required: [true, 'Category is required']
    },
    supplierID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Supplier", 
        required: function(this: any) {
            // Only require supplier for new items (items without _id are new)
            return this.isNew;
        }
    },
    type: {
        type: String,
        enum: {
            values: ["sellable", "equipment"],
            message: 'Type must be either "sellable" or "equipment"'
        },
        required: [true, 'Item type is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Sellable item fields
    price: { 
        type: Number, 
        min: [0, 'Price cannot be negative']
    },
    stock: { 
        type: Number, 
        min: [0, 'Stock cannot be negative']
    },
    expiryDate: { 
        type: Date 
    },
    lowStockAlert: { 
        type: Number, 
        min: [1, 'Low stock alert must be at least 1']
    },
    
    // Equipment fields
    purchaseDate: { 
        type: Date 
    },
    maintenanceSchedule: { 
        type: String,
        trim: true,
        maxlength: [200, 'Maintenance schedule cannot exceed 200 characters']
    },
    warrantyPeriod: { 
        type: String,
        trim: true,
        maxlength: [100, 'Warranty period cannot exceed 100 characters']
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate names within the same category
InventoryItemSchema.index({ name: 1, categoryID: 1 }, { unique: true });

// Index for performance
InventoryItemSchema.index({ categoryID: 1 });
InventoryItemSchema.index({ supplierID: 1 });
InventoryItemSchema.index({ type: 1 });
InventoryItemSchema.index({ isActive: 1 });

// Custom validation for type-specific fields
InventoryItemSchema.pre('validate', function() {
    if (this.type === 'sellable') {
        // Sellable items require price and stock
        if (this.price === undefined || this.price === null) {
            this.invalidate('price', 'Price is required for sellable items');
        }
        if (this.stock === undefined || this.stock === null) {
            this.invalidate('stock', 'Stock is required for sellable items');
        }
        
        // Remove equipment-only fields
        this.purchaseDate = undefined;
        this.maintenanceSchedule = undefined;
        this.warrantyPeriod = undefined;
        
    } else if (this.type === 'equipment') {
        // Equipment requires purchase date
        if (!this.purchaseDate) {
            this.invalidate('purchaseDate', 'Purchase date is required for equipment');
        }
        
        // Remove sellable-only fields
        this.price = undefined;
        this.stock = undefined;
        this.expiryDate = undefined;
        this.lowStockAlert = undefined;
    }
});

const InventoryItem = mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);

export default InventoryItem;
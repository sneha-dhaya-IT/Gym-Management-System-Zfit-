import mongoose,{ Document } from "mongoose";

export interface IInventorySupplier extends Document {
    supplierName: string;
    supplierEmail: string;
    supplierPhone: string;
    supplierAddress: string;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema = new mongoose.Schema<IInventorySupplier>({
    supplierName: {type: String, required: true},
    supplierEmail: {type: String, required: true},
    supplierPhone: {type: String, required: true},
    supplierAddress: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
})

const Supplier = mongoose.model<IInventorySupplier>("Supplier", SupplierSchema)
export default Supplier;

import Supplier from "../models/supplier.model.js";
import type { IInventorySupplier } from "../models/supplier.model.js";

export default class SupplierService{
    //Cretate supplier
    async createSupplier(data: { supplierName: string, supplierEmail: string, supplierPhone: string, supplierAddress: string}): Promise<IInventorySupplier>{
        const supplier = new Supplier(data);
        return await supplier.save();
    }

    //Get all suppliers
    async getAllSuppliers(): Promise<IInventorySupplier[]>{
        return await Supplier.find().sort({ supplierName: 1})
    }

    //Get supplier by id
    async getSupplierById(id: string): Promise<IInventorySupplier| null>{
        return await Supplier.findById(id);
    }

    //Update supplier
    async updateSupplier(
        id: string,
        data: { supplierName?: string | undefined, supplierEmail?: string | undefined, supplierPhone?: string | undefined, supplierAddress?: string | undefined}
    ): Promise<IInventorySupplier | null>{
        return await Supplier.findByIdAndUpdate(
            id,
            {...data, updatedAt: new Date()},
            {new: true, runValidators: true}
        )
    }

    //Delete supplier
    async deleteSupplier(id: string): Promise<IInventorySupplier | null>{
        return await Supplier.findByIdAndDelete(id);
    }
}
import Item from "../models/inventoryItem.schema.js";
import type { IInventoryItem } from "../models/inventoryItem.schema.js";
import "../models/category.model.js"; // Import to register Category model for population
import "../models/supplier.model.js"; // Import to register Supplier model for population
import type mongoose from "mongoose";

export default class InventoryItemService {
    
    async createItem(data: { itemName: string; itemDescription: string; categoryID: mongoose.Types.ObjectId; quantity: number; price?: number; supplierID: mongoose.Types.ObjectId; lowStockThreshold: number; maintenanceStatus: "good" | "maintenance_required" | "under_repair"; lastMaintenanceDate?: Date; createdAt: Date; updatedAt: Date; }): Promise<IInventoryItem> {
        const newItem = new Item(data);
        return await newItem.save();
    }

    
    async getAllItems(): Promise<IInventoryItem[]> {
        return await Item.find().populate("categoryID").populate("supplierID").sort({ itemName: 1 });
    }

    async getItemById(id: string): Promise<IInventoryItem | null> {
        return await Item.findById(id).populate("categoryID").populate("supplierID");
    }

    async updateItem(id: string, data: { itemName?: string | undefined; itemDescription?: string | undefined; categoryID?: mongoose.Types.ObjectId | undefined; quantity?: number | undefined; price?: number | undefined; supplierID?: mongoose.Types.ObjectId | undefined; lowStockThreshold?: number | undefined; maintenanceStatus?: "good" | "maintenance_required" | "under_repair" | undefined; lastMaintenanceDate?: Date | undefined; updatedAt: Date; }): Promise<IInventoryItem | null> {
        return await Item.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate("categoryID").populate("supplierID");
    }

    async deleteItem(id: string): Promise<IInventoryItem | null> {
        return await Item.findByIdAndDelete(id);
    }
}
import Item from "../models/inventoryItem.schema.js";
import type{ IInventoryItem } from "../models/inventoryItem.schema.js";
import InventoryItem from "../models/inventoryItem.schema.js";
import User from "../models/user.model.js";
import { InventoryTransaction } from "../models/inventoryTransaction.schema.js";
import mongoose from "mongoose";


export default class StockService {

    async updateStock(itemId: string, quantity: number, operation: "increment" | "decrement"): Promise<IInventoryItem | null> {
        const item = await Item.findById(itemId);
        
        if (!item) throw new Error("Item not found");

        if (operation === "increment") {
            item.stock = (item.stock || 0) + quantity;
        } else if (operation === "decrement") {
            const currentStock = item.stock || 0;
            if (currentStock < quantity) {
                throw new Error("Not enough stock");
            }
            item.stock = currentStock - quantity;
        }
        
        item.updatedAt = new Date();
        const updatedItem = await item.save();

        // Log transaction
        await InventoryTransaction.create({
            itemID: itemId,
            transactionType: operation,
            quantityChanged: quantity
        });

        // Return populated item
        return await Item.findById(itemId).populate("supplierID");
    }

    async getLowStockItems(): Promise<IInventoryItem[]> {
        return await Item.find({ $expr: { $lt: ["$quantity", "$lowStockThreshold"] } }).populate("supplierID");
    }

    async getMaintenanceAlerts(): Promise<IInventoryItem[]> {
        return await Item.find({
            maintenanceStatus: { $in: ["maintenance_required", "under_repair"] }
        }).populate("supplierID");
    } 

        // Note: Maintenance features not supported by current schema
    // Will be implemented when maintenance fields are added to InventoryItem schema


}
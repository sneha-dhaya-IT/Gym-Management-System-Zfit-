import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import InventoryItemService from '../services/inventoryItem.service.js';

const inventoryItemService = new InventoryItemService();

export const createItemSchema = z.object({
    itemName: z.string().min(2).max(100),
    itemDescription: z.string().min(2).max(500),
    categoryID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
    quantity: z.number().min(0),
    price: z.number().min(0).optional(),
    supplierID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID format"),
    lowStockThreshold: z.number().min(0).optional(),
    maintenanceStatus: z.enum(["good", "maintenance_required", "under_repair"]).optional(),
    lastMaintenanceDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const updateItemSchema = z.object({
    itemName: z.string().min(2).max(100).optional(),
    itemDescription: z.string().min(2).max(500).optional(),
    categoryID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format").optional(),
    quantity: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    supplierID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID format").optional(),
    lowStockThreshold: z.number().min(0).optional(),
    maintenanceStatus: z.enum(["good", "maintenance_required", "under_repair"]).optional(),
    lastMaintenanceDate: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

export const itemIdSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid item ID format"),
});

//Controller to create a new inventory item
export const createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Received item data:', JSON.stringify(req.body, null, 2));
        const validated = createItemSchema.parse(req.body);
        const itemData: any = {
            itemName: validated.itemName,
            itemDescription: validated.itemDescription,
            categoryID: new mongoose.Types.ObjectId(validated.categoryID), // Now ObjectId reference to Category
            quantity: validated.quantity,
            price: validated.price,
            supplierID: new mongoose.Types.ObjectId(validated.supplierID),
            lowStockThreshold: validated.lowStockThreshold || 5,
            maintenanceStatus: validated.maintenanceStatus || "good" as const,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (validated.lastMaintenanceDate) {
            itemData.lastMaintenanceDate = validated.lastMaintenanceDate;
        }
        
        const item = await inventoryItemService.createItem(itemData);

        res.status(201).json({
            success: true,
            message: "Inventory item created successfully",
            data: item
        });
    } catch (error) {
        console.error('Create item error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.issues
            });
        }
        next(error);
    }
};

//Controller to get all inventory items
export const getAllItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await inventoryItemService.getAllItems();
        res.status(200).json({
            success: true,
            message: "Inventory items retrieved successfully",
            data: items
        });
    } catch (error) {
        next(error);
    }
};  

//Controller to get an inventory item by ID
export const getItemById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = itemIdSchema.parse({ id: req.params.id });
        const item = await inventoryItemService.getItemById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Inventory item retrieved successfully",
            data: item
        });
    } catch (error) {
        next(error);
    }
};  

//Controller to update an inventory item
export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = itemIdSchema.parse({ id: req.params.id });
        const validated = updateItemSchema.parse(req.body);
        
        const updateData: any = {
            ...validated,
            updatedAt: new Date()
        };

        // Convert IDs to ObjectId if they exist
        if (validated.supplierID) {
            updateData.supplierID = new mongoose.Types.ObjectId(validated.supplierID);
        }
        if (validated.categoryID) {
            updateData.categoryID = new mongoose.Types.ObjectId(validated.categoryID);
        }

        const item = await inventoryItemService.updateItem(id, updateData);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Inventory item updated successfully",
            data: item
        });
    } catch (error) {
        next(error);
    }
};

//Controller to delete an inventory item
export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = itemIdSchema.parse({ id: req.params.id });
        const success = await inventoryItemService.deleteItem(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Inventory item deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

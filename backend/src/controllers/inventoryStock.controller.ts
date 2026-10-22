import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import StockService from "../services/inventoryStock.service.js";

const stockService = new StockService();

// Schema to update stock
const updateStockSchema = z.object({
    quantity: z.number().min(1),
    operation: z.enum(["increment", "decrement"])
});

// Schema to update maintenance
const updateMaintenanceSchema = z.object({
    maintenanceStatus: z.enum(["good", "maintenance_required", "under_repair"]),
    lastMaintenanceDate: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

// Update stock (increment or decrement)
export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        
        // Validate that id is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Item ID is required"
            });
        }

        const { quantity, operation } = updateStockSchema.parse(req.body);
        const item = await stockService.updateStock(id, quantity, operation);
        res.status(200).json({
            success: true,
            message: `Stock ${operation} successful`,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// Get low stock items
export const getLowStockItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await stockService.getLowStockItems();
        res.status(200).json({
            success: true,
            message: "Low stock items retrieved",
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// Get maintenance alerts
export const getMaintenanceAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await stockService.getMaintenanceAlerts();
        res.status(200).json({
            success: true,
            message: "Maintenance alerts retrieved",
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// Update maintenance status
export const updateMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        
        // Validate that id is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Item ID is required"
            });
        }

        // Maintenance features not yet implemented in schema
        res.status(501).json({
            success: false,
            message: "Maintenance features not yet implemented"
        });
    } catch (error) {
        next(error);
    }
};

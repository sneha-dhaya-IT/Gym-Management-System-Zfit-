import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import ItemService from "../services/item.service.js";
import { CREATED, OK, NOT_FOUND } from "../constants/http.js";

// Create instance of the service
const itemService = new ItemService();

// Zod validation schema for creating an item
const createItemSchema = z.object({
  name: z.string()
    .min(1, "Item name is required")
    .max(100, "Item name cannot exceed 100 characters")
    .trim(),
  categoryID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
  supplierID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID format"),
  type: z.enum(["sellable", "equipment"]),
  
  // Sellable fields (conditional)
  price: z.number().min(0, "Price cannot be negative").optional(),
  stock: z.number().min(0, "Stock cannot be negative").optional(),
  expiryDate: z.string().optional(),
  lowStockAlert: z.number().min(1, "Low stock alert must be at least 1").optional(),
  
  // Equipment fields (conditional)
  purchaseDate: z.string().optional(),
  maintenanceSchedule: z.string().max(200, "Maintenance schedule cannot exceed 200 characters").optional(),
  warrantyPeriod: z.string().max(100, "Warranty period cannot exceed 100 characters").optional(),
}).refine((data) => {
  // Validate sellable items
  if (data.type === 'sellable') {
    return typeof data.price === 'number' && typeof data.stock === 'number';
  }
  return true;
}, {
  message: "Sellable items must have price and stock",
  path: ["price"]
}).refine((data) => {
  // Validate equipment items
  if (data.type === 'equipment') {
    return !!data.purchaseDate;
  }
  return true;
}, {
  message: "Equipment items must have purchase date",
  path: ["purchaseDate"]
});

// Zod validation schema for updating an item
const updateItemSchema = z.object({
  name: z.string()
    .min(1, "Item name is required")
    .max(100, "Item name cannot exceed 100 characters")
    .trim()
    .optional(),
  categoryID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format").optional(),
  supplierID: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID format").optional(),
  type: z.enum(["sellable", "equipment"]).optional(),
  
  // Sellable fields
  price: z.number().min(0, "Price cannot be negative").optional(),
  stock: z.number().min(0, "Stock cannot be negative").optional(),
  expiryDate: z.string().optional(),
  lowStockAlert: z.number().min(1, "Low stock alert must be at least 1").optional(),
  
  // Equipment fields
  purchaseDate: z.string().optional(),
  maintenanceSchedule: z.string().max(200, "Maintenance schedule cannot exceed 200 characters").optional(),
  warrantyPeriod: z.string().max(100, "Warranty period cannot exceed 100 characters").optional(),
});

// Zod validation schema for item ID
const itemIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid item ID format"),
});

// Controller to create a new item
export const createItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createItemSchema.parse(req.body);
    const item = await itemService.createItem(validated);

    res.status(CREATED).json({
      success: true,
      message: "Item created successfully",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// Controller to get all items (with optional category filter)
export const getAllItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryID } = req.query;
    
    // Validate categoryID if provided
    if (categoryID && typeof categoryID === 'string') {
      if (!mongoose.Types.ObjectId.isValid(categoryID)) {
        return res.status(400).json({
          success: false,
          error: "Invalid category ID format"
        });
      }
    }

    const items = await itemService.getAllItems(categoryID as string);

    res.status(OK).json({
      success: true,
      message: "Items retrieved successfully",
      data: items,
      count: items.length
    });
  } catch (error) {
    next(error);
  }
};

// Controller to get a single item by ID
export const getItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = itemIdSchema.parse({ id: req.params.id });
    
    const item = await itemService.getItemById(id);
    
    if (!item) {
      return res.status(NOT_FOUND).json({
        success: false,
        error: "Item not found"
      });
    }

    res.status(OK).json({
      success: true,
      message: "Item retrieved successfully",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// Controller to update an item
export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = itemIdSchema.parse({ id: req.params.id });
    const validated = updateItemSchema.parse(req.body);
    const userId = (req as any).userId; // Get user ID from auth middleware

    const item = await itemService.updateItem(id, validated, userId);

    if (!item) {
      return res.status(NOT_FOUND).json({
        success: false,
        error: "Item not found"
      });
    }

    res.status(OK).json({
      success: true,
      message: "Item updated successfully",
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// Controller to delete an item (soft delete)
export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = itemIdSchema.parse({ id: req.params.id });

    const item = await itemService.deleteItem(id);

    if (!item) {
      return res.status(NOT_FOUND).json({
        success: false,
        error: "Item not found"
      });
    }

    res.status(OK).json({
      success: true,
      message: "Item deleted successfully",
      data: item
    });
  } catch (error) {
    next(error);
  }
};
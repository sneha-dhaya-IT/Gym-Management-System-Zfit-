import InventoryItem, { type IInventoryItem } from "../models/inventoryItem.schema.js";
import Category from "../models/category.model.js";
import Supplier from "../models/supplier.model.js";
import AppError from "../util/AppError.js";
import { BAD_REQUEST, NOT_FOUND, CONFLICT } from "../constants/http.js";
import mongoose from "mongoose";
import { inventoryTransactionService } from "./inventoryTransaction.service.js";
import { checkItemLowStock } from "./lowStockAlert.service.js";

export interface CreateItemData {
  name: string;
  categoryID: string;
  supplierID: string;
  type: "sellable" | "equipment";
  
  // Sellable fields
  price?: number | undefined;
  stock?: number | undefined;
  expiryDate?: string | undefined;
  lowStockAlert?: number | undefined;
  
  // Equipment fields
  purchaseDate?: string | undefined;
  maintenanceSchedule?: string | undefined;
  warrantyPeriod?: string | undefined;
}

export interface UpdateItemData {
  name?: string | undefined;
  categoryID?: string | undefined;
  supplierID?: string | undefined;
  type?: "sellable" | "equipment" | undefined;
  
  // Sellable fields
  price?: number | undefined;
  stock?: number | undefined;
  expiryDate?: string | undefined;
  lowStockAlert?: number | undefined;
  
  // Equipment fields
  purchaseDate?: string | undefined;
  maintenanceSchedule?: string | undefined;
  warrantyPeriod?: string | undefined;
}

class ItemService {
  // CREATE - Add new item
  async createItem(data: CreateItemData): Promise<IInventoryItem> {
    try {
      // Validate category exists
      const category = await Category.findById(data.categoryID);
      if (!category) {
        throw new AppError(BAD_REQUEST, "Category not found");
      }

      // Validate supplier exists
      const supplier = await Supplier.findById(data.supplierID);
      if (!supplier) {
        throw new AppError(BAD_REQUEST, "Supplier not found");
      }

      // Check for duplicate name within the same category
      const existingItem = await InventoryItem.findOne({
        name: data.name.trim(),
        categoryID: data.categoryID,
        isActive: true
      });

      if (existingItem) {
        throw new AppError(CONFLICT, "An item with this name already exists in the selected category");
      }

      // Prepare item data
      const itemData: any = {
        name: data.name.trim(),
        categoryID: data.categoryID,
        supplierID: data.supplierID,
        type: data.type,
        isActive: true
      };

      // Add type-specific fields
      if (data.type === 'sellable') {
        itemData.price = data.price;
        itemData.stock = data.stock;
        if (data.expiryDate) itemData.expiryDate = new Date(data.expiryDate);
        if (data.lowStockAlert) itemData.lowStockAlert = data.lowStockAlert;
      } else if (data.type === 'equipment') {
        if (data.purchaseDate) itemData.purchaseDate = new Date(data.purchaseDate);
        if (data.maintenanceSchedule) itemData.maintenanceSchedule = data.maintenanceSchedule;
        if (data.warrantyPeriod) itemData.warrantyPeriod = data.warrantyPeriod;
      }

      const item = new InventoryItem(itemData);
      const savedItem = await item.save();

      // Check for low stock and send email alerts if needed for sellable items
      if (savedItem && savedItem.type === 'sellable') {
        try {
          await checkItemLowStock((savedItem._id as any).toString());
        } catch (emailError) {
          console.error('Failed to check low stock for email alerts:', emailError);
          // Don't fail the item creation if email alerts fail
        }
      }

      return savedItem;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(CONFLICT, "An item with this name already exists in the selected category");
      }
      throw error;
    }
  }

  // READ - Get all items with optional category filter
  async getAllItems(categoryID?: string): Promise<IInventoryItem[]> {
    const filter: any = { isActive: true };
    
    if (categoryID) {
      if (!mongoose.Types.ObjectId.isValid(categoryID)) {
        throw new AppError(BAD_REQUEST, "Invalid category ID format");
      }
      filter.categoryID = categoryID;
    }

    return await InventoryItem.find(filter)
      .populate('categoryID', 'name description')
      .populate('supplierID', 'supplierName supplierEmail supplierPhone')
      .sort({ createdAt: -1 });
  }

  // READ - Get single item by ID
  async getItemById(id: string): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(BAD_REQUEST, "Invalid item ID format");
    }

    return await InventoryItem.findOne({ _id: id, isActive: true })
      .populate('categoryID', 'name description')
      .populate('supplierID', 'supplierName supplierEmail supplierPhone');
  }

  // UPDATE - Update existing item
  async updateItem(id: string, data: UpdateItemData, userId?: string): Promise<IInventoryItem | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(BAD_REQUEST, "Invalid item ID format");
      }

      // Check if item exists
      const existingItem = await InventoryItem.findOne({ _id: id, isActive: true });
      if (!existingItem) {
        throw new AppError(NOT_FOUND, "Item not found");
      }

      // If updating category, validate it exists
      if (data.categoryID) {
        const category = await Category.findById(data.categoryID);
        if (!category) {
          throw new AppError(BAD_REQUEST, "Category not found");
        }
      }

      // If updating supplier, validate it exists
      if (data.supplierID) {
        const supplier = await Supplier.findById(data.supplierID);
        if (!supplier) {
          throw new AppError(BAD_REQUEST, "Supplier not found");
        }
      }

      // Check for duplicate name within category (if name or category is being updated)
      if (data.name || data.categoryID) {
        const checkName = data.name?.trim() || existingItem.name;
        const checkCategoryID = data.categoryID || existingItem.categoryID.toString();

        const duplicateItem = await InventoryItem.findOne({
          _id: { $ne: id },
          name: checkName,
          categoryID: checkCategoryID,
          isActive: true
        });

        if (duplicateItem) {
          throw new AppError(CONFLICT, "An item with this name already exists in the selected category");
        }
      }

      // Prepare update data
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name.trim();
      if (data.categoryID) updateData.categoryID = data.categoryID;
      if (data.supplierID) updateData.supplierID = data.supplierID;
      if (data.type) updateData.type = data.type;

      // Handle type-specific fields based on the type being set (new or existing)
      const itemType = data.type || existingItem.type;

      // Track stock changes for transaction logging
      let stockChange: number | null = null;
      let userId: string | null = null;

      if (itemType === 'sellable') {
        // Update sellable fields
        if (data.price !== undefined) updateData.price = data.price;
        if (data.stock !== undefined) {
          const previousStock = existingItem.stock || 0;
          const newStock = data.stock;
          stockChange = newStock - previousStock;
          updateData.stock = data.stock;
        }
        if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
        if (data.lowStockAlert !== undefined) updateData.lowStockAlert = data.lowStockAlert;

        // Remove equipment fields if switching types
        if (data.type === 'sellable') {
          updateData.purchaseDate = undefined;
          updateData.maintenanceSchedule = undefined;
          updateData.warrantyPeriod = undefined;
        }
      } else if (itemType === 'equipment') {
        // Update equipment fields
        if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate);
        if (data.maintenanceSchedule !== undefined) updateData.maintenanceSchedule = data.maintenanceSchedule;
        if (data.warrantyPeriod !== undefined) updateData.warrantyPeriod = data.warrantyPeriod;

        // Remove sellable fields if switching types
        if (data.type === 'equipment') {
          updateData.price = undefined;
          updateData.stock = undefined;
          updateData.expiryDate = undefined;
          updateData.lowStockAlert = undefined;
        }
      }

      // Update the item
      const updatedItem = await InventoryItem.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('categoryID', 'name description')
       .populate('supplierID', 'supplierName supplierEmail supplierPhone');

      // Log stock change transaction if stock was modified and userId is provided
      if (stockChange !== null && stockChange !== 0 && userId && updatedItem) {
        try {
          await inventoryTransactionService.logStockChange(
            id,
            stockChange,
            'ADJUSTMENT', // Stock adjustments through item updates
            userId,
            undefined,
            `Stock adjusted from ${existingItem.stock || 0} to ${updatedItem.stock || 0}`
          );
        } catch (transactionError) {
          console.error('Failed to log stock change transaction:', transactionError);
          // Don't fail the item update if transaction logging fails
        }
      }

      // Check for low stock and send email alerts if needed
      if (updatedItem && updatedItem.type === 'sellable') {
        try {
          await checkItemLowStock(id);
        } catch (emailError) {
          console.error('Failed to check low stock for email alerts:', emailError);
          // Don't fail the item update if email alerts fail
        }
      }

      return updatedItem;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(CONFLICT, "An item with this name already exists in the selected category");
      }
      throw error;
    }
  }

  // DELETE - Soft delete item
  async deleteItem(id: string): Promise<IInventoryItem | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(BAD_REQUEST, "Invalid item ID format");
    }

    const item = await InventoryItem.findOne({ _id: id, isActive: true });
    if (!item) {
      throw new AppError(NOT_FOUND, "Item not found");
    }

    return await InventoryItem.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  // UTILITY - Get items by category (for category deletion validation)
  async getItemsCountByCategory(categoryID: string): Promise<number> {
    return await InventoryItem.countDocuments({
      categoryID: categoryID,
      isActive: true
    });
  }
}

export default ItemService;
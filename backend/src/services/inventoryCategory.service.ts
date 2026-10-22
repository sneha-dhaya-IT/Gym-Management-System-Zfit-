import Category from "../models/category.model.js";
import type { ICategory } from "../models/category.model.js";
import InventoryItem from "../models/inventoryItem.schema.js";
import AppError from "../util/AppError.js";
import { CONFLICT, NOT_FOUND, BAD_REQUEST } from "../constants/http.js";

export default class CategoryService {
  // CREATE category
  async createCategory(data: { name: string; description?: string | undefined }): Promise<ICategory> {
    try {
      // Check for duplicate name
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') } 
      });
      
      if (existingCategory) {
        throw new AppError(CONFLICT, "Category with this name already exists");
      }

      const category = new Category({
        name: data.name.trim(),
        description: data.description?.trim(),
        isActive: true
      });
      
      return await category.save();
    } catch (error: any) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new AppError(CONFLICT, "Category with this name already exists");
      }
      throw error;
    }
  }

  // GET all categories (only active by default)
  async getAllCategories(includeInactive: boolean = false): Promise<ICategory[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return await Category.find(filter).sort({ name: 1 });
  }

  // GET category by ID
  async getCategoryById(id: string): Promise<ICategory | null> {
    return await Category.findById(id);
  }

  // UPDATE category
  async updateCategory(
    id: string,
    data: { name?: string | undefined; description?: string | undefined }
  ): Promise<ICategory | null> {
    try {
      // If updating name, check for duplicates (excluding current category)
      if (data.name) {
        const existingCategory = await Category.findOne({ 
          name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
          _id: { $ne: id }
        });
        
        if (existingCategory) {
          throw new AppError(CONFLICT, "Category with this name already exists");
        }
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim();

      return await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(CONFLICT, "Category with this name already exists");
      }
      throw error;
    }
  }

  // DELETE category (soft delete or hard delete based on usage)
  async deleteCategory(id: string): Promise<ICategory | null> {
    // Check if any ACTIVE items are linked to this category
    const itemsCount = await InventoryItem.countDocuments({ categoryID: id, isActive: true });
    
    if (itemsCount > 0) {
      throw new AppError(BAD_REQUEST, `Cannot delete category. ${itemsCount} item(s) are still linked to this category. Please reassign or remove the items first.`);
    }

    // Hard delete if no active items are linked
    return await Category.findByIdAndDelete(id);
  }

  // SOFT DELETE category (set isActive to false)
  async softDeleteCategory(id: string): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true }
    );
  }

  // RESTORE category (set isActive to true)
  async restoreCategory(id: string): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true, runValidators: true }
    );
  }

  // GET categories used by items (for dropdown population)
  async getCategoriesInUse(): Promise<string[]> {
    const items = await InventoryItem.distinct('categoryID');
    return items.filter(Boolean).map(id => id.toString()); // Convert ObjectId to string
  }

  // CHECK if category name exists
  async categoryNameExists(name: string, excludeId?: string): Promise<boolean> {
    const filter: any = { 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    };
    
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existingCategory = await Category.findOne(filter);
    return !!existingCategory;
  }
}

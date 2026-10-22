import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import CategoryService from "../services/inventoryCategory.service.js";
import { CREATED, OK, NOT_FOUND } from "../constants/http.js";

// create an instance of the service
const categoryService = new CategoryService();

// zod validation schema for creating a category
const createCategorySchema = z.object({
    name: z.string()
        .min(1, "Category name is required")
        .max(50, "Category name cannot exceed 50 characters")
        .trim(),
    description: z.string()
        .max(200, "Description cannot exceed 200 characters")
        .trim()
        .optional(),
});

// zod validation schema for updating a category
const updateCategorySchema = z.object({
    name: z.string()
        .min(1, "Category name is required")
        .max(50, "Category name cannot exceed 50 characters")
        .trim()
        .optional(),
    description: z.string()
        .max(200, "Description cannot exceed 200 characters")
        .trim()
        .optional(),
});

//zod validation schema for category ID
const categoryIdSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"),
});

// Controller to create a new category
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = createCategorySchema.parse(req.body);
        const category = await categoryService.createCategory(validated);

        res.status(CREATED).json({
            success: true,
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// Controller to get all categories
export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await categoryService.getAllCategories(includeInactive);
    
    res.status(OK).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    next(error);
  }
};



// Controller to Get by ID
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = categoryIdSchema.parse({ id: req.params.id });
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid category ID format" 
      });
    }

    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.status(NOT_FOUND).json({ 
        success: false, 
        message: "Category not found" 
      });
    }

    res.status(OK).json({
      success: true,
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Controller to update a category
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = categoryIdSchema.parse({ id: req.params.id });
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid category ID format" 
      });
    }

    const validated = updateCategorySchema.parse(req.body);
    
    // Check if category exists before updating
    const existingCategory = await categoryService.getCategoryById(id);
    if (!existingCategory) {
      return res.status(NOT_FOUND).json({ 
        success: false, 
        message: "Category not found" 
      });
    }

    const category = await categoryService.updateCategory(id, validated);

    res.status(OK).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Controller to delete a category
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = categoryIdSchema.parse({ id: req.params.id });
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid category ID format" 
      });
    }

    // Check if category exists before deleting
    const existingCategory = await categoryService.getCategoryById(id);
    if (!existingCategory) {
      return res.status(NOT_FOUND).json({ 
        success: false, 
        message: "Category not found" 
      });
    }

    const category = await categoryService.deleteCategory(id);

    res.status(OK).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};



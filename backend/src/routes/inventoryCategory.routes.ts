import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/inventoryCategory.controller.js';
// import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Category management routes
// POST   /api/v1/categories - Create a new category
router.post('/categories', createCategory);

// GET    /api/v1/categories - Get all categories (query param: includeInactive=true to include inactive)
router.get('/categories', getAllCategories);

// GET    /api/v1/categories/:id - Get category by ID
router.get('/categories/:id', getCategoryById);

// PUT    /api/v1/categories/:id - Update category (name/description)
router.put('/categories/:id', updateCategory);

// DELETE /api/v1/categories/:id - Delete category (blocked if items exist)
router.delete('/categories/:id', deleteCategory);

export default router;

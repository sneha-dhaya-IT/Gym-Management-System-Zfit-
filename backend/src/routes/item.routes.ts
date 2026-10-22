import express from 'express';
import {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} from '../controllers/item.controller.js';
// import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();

// Item management routes
// POST   /api/v1/items - Create a new item
router.post('/items', createItem);

// GET    /api/v1/items - Get all items (query param: categoryID to filter by category)
router.get('/items', getAllItems);

// GET    /api/v1/items/:id - Get item by ID
router.get('/items/:id', getItemById);

// PUT    /api/v1/items/:id - Update item
router.put('/items/:id', updateItem);

// DELETE /api/v1/items/:id - Soft delete item (set isActive = false)
router.delete('/items/:id', deleteItem);

export default router;
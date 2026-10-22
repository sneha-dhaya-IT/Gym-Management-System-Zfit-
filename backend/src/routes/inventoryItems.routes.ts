import express from 'express';
import {
    createItem,
    getAllItems,
    getItemById,
    updateItem,
    deleteItem
} from '../controllers/inventoryItem.controller.js'
import authenticate from '../middleware/auth.middleware.js';

const router = express.Router();


router.get('/items',  getAllItems);


router.post('/items',  createItem);


router.get('/items/:id',  getItemById);


router.put('/items/:id',  updateItem);


router.delete('/items/:id',  deleteItem);


export default router
import express from 'express';
import {
    createSupplier,
    getAllSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
} from '../controllers/inventorySupplier.controller.js';
import authenticate from '../middleware/auth.middleware.js';


const router = express.Router();

// GET /api/v1/suppliers - Get all suppliers
router.get('/', getAllSuppliers);

// POST /api/v1/suppliers - Create a new supplier
router.post('/',  createSupplier);

// GET /api/v1/suppliers/:id - Get supplier by ID
router.get('/:id', getSupplierById);

// PUT /api/v1/suppliers/:id - Update supplier by ID
router.put('/:id', updateSupplier);

// DELETE /api/v1/suppliers/:id - Delete supplier by ID
router.delete('/:id', deleteSupplier);

export default router;


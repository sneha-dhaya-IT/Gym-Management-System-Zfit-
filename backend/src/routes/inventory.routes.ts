import { Router } from "express";

// Import all inventory-related route modules
import categoryRoutes from "./inventoryCategory.routes.js";
import supplierRoutes from "./inventorySuppliers.routes.js";
import itemsRoutes from "./inventoryItems.routes.js";
import stockRoutes from "./inventoryStock.routes.js";
import reportRoutes from "./inventoryReport.routes.js";
import cartRoutes from "./cart.routes.js";
import orderRoutes from "./order.routes.js";

const router = Router();

// Mount inventory-related routes under their respective sub-paths
// Categories: /api/v1/categories/* (moved to main app routes)

// Suppliers: /api/v1/inventory/suppliers/*
router.use('/suppliers', supplierRoutes);

// Items: /api/v1/inventory/items/*
router.use('/', itemsRoutes);

// Stock management: /api/v1/inventory/stock/*
router.use('/stock', stockRoutes);

// Reports: /api/v1/inventory/reports/*
router.use('/reports', reportRoutes);

// Cart: /api/v1/inventory/cart/*
router.use('/cart', cartRoutes);

// Orders: /api/v1/inventory/orders/*
router.use('/orders', orderRoutes);

export default router;
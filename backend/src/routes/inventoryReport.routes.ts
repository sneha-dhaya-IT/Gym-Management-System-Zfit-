import { Router } from "express";
import {
    getStockLevelsReport,
    getUsageTrendsReport
} from "../controllers/inventoryReport.controller.js";
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

// Report routes
router.get("/stock-levels",  getStockLevelsReport);     // GET /api/v1/inventory/reports/stock-levels
router.get("/usage-trends",  getUsageTrendsReport);     // GET /api/v1/inventory/reports/usage-trends

export default router;
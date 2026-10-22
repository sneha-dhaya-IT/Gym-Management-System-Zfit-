import { Router } from "express";
import {
    checkout,
    getMemberOrders,
    getOrderById
} from "../controllers/order.controller.js";
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

// Order routes
router.post("/checkout/:memberId",  checkout);        // POST /api/v1/orders/checkout/{memberId}
router.get("/member/:memberId",  getMemberOrders);    // GET /api/v1/orders/member/{memberId}
router.get("/:orderId",  getOrderById);               // GET /api/v1/orders/{orderId}

export default router;
import express from "express";
import { webhookHandler } from "../controllers/support.controller.js";

const router = express.Router();

// Vapi webhook endpoint for voice support
router.post("/webhook", webhookHandler);

export default router;
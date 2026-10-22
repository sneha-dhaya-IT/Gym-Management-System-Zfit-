import { Router } from "express";
import * as TrainerController from "../controllers/trainer.controller.js";

const router = Router();

// Create a new trainer (POST /trainers)
router.post("/", TrainerController.createTrainer);

// Get all trainers (GET /trainers)
router.get("/", TrainerController.getAllTrainers);

// Get trainer by ID (GET /trainers/:id)
router.get("/:id", TrainerController.getTrainerById);

// Update trainer (PATCH /trainers/:id)
router.patch("/:id", TrainerController.updateTrainer);

// Delete trainer (DELETE /trainers/:id)
router.delete("/:id", TrainerController.deleteTrainer);

export default router;

import { Router } from "express";
import * as NutritionController from "../controllers/nutrition.controller.js";

const router = Router();

router.post("/", NutritionController.createNutrition);
router.get("/", NutritionController.getAllNutrition);
router.get("/:id", NutritionController.getNutritionById);
router.put("/:id", NutritionController.updateNutrition);
router.delete("/:id", NutritionController.deleteNutrition);

export default router;





